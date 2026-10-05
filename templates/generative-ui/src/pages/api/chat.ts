/**
 * POST /api/chat — the only serverless route.
 *
 * Request:  { message, lang: 'en'|'es', history?: {role, content}[], mode?: 'recruiter', context?: string }
 * Response: NDJSON stream, one JSON event per line:
 *   {"type":"text","delta":"…"}
 *   {"type":"component","name":"project","id":"loan-simulator"}   (also timeline | skills | contact)
 *   {"type":"source","n":1,"id":"projects.loan-simulator","label":"Projects · Loan simulator"}
 *   {"type":"done"}
 *   {"type":"error","code":"rate_limited"|"too_long"|"empty"|"upstream"|"stream_cut"|"invalid"}
 *
 * Without ANTHROPIC_API_KEY it runs in DEMO MODE (header `X-Assistant-Mode: demo`).
 */
export const prerender = false;

import type { APIRoute } from 'astro';
import Anthropic from '@anthropic-ai/sdk';
import { ANTHROPIC_API_KEY, ANTHROPIC_MODEL } from 'astro:env/server';
import { isLang } from '../../lib/i18n';
import {
  CONTEXTS,
  Citer,
  MODES,
  encodeEvent,
  resolveTool,
  systemPrompt,
  tools,
  type ChatEvent,
  type ErrorCode,
} from '../../lib/assistant';
import { chunkText, demoAnswer } from '../../lib/demo';
import type { Lang } from '../../data/profile';

const MAX_INPUT = 500;
const MAX_HISTORY = 6;
const MAX_TOOL_ROUNDS = 3;
const RATE_MAX = 8;
const RATE_WINDOW_MS = 60_000;
const DEFAULT_MODEL = 'claude-haiku-4-5';

/* Best-effort in-memory rate limit (per serverless instance). */
const hits = new Map<string, number[]>();
function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) for (const [k, v] of hits) if (now - v[v.length - 1] > RATE_WINDOW_MS) hits.delete(k);
  return recent.length > RATE_MAX;
}

const NDJSON_HEADERS = {
  'Content-Type': 'application/x-ndjson; charset=utf-8',
  'Cache-Control': 'no-cache, no-transform',
  'X-Accel-Buffering': 'no',
};

const errorResponse = (code: ErrorCode, status: number, extra: Record<string, string> = {}) =>
  new Response(encodeEvent({ type: 'error', code }), { status, headers: { ...NDJSON_HEADERS, ...extra } });

type HistoryItem = { role: 'user' | 'assistant'; content: string };

function sanitizeHistory(raw: unknown): HistoryItem[] {
  if (!Array.isArray(raw)) return [];
  const items = raw
    .filter(
      (m): m is HistoryItem =>
        !!m &&
        typeof m === 'object' &&
        ((m as HistoryItem).role === 'user' || (m as HistoryItem).role === 'assistant') &&
        typeof (m as HistoryItem).content === 'string' &&
        (m as HistoryItem).content.trim().length > 0,
    )
    .slice(-MAX_HISTORY)
    .map((m) => ({ role: m.role, content: m.content.slice(0, 2000) }));
  // The Messages API needs the conversation to start with a user turn.
  while (items.length && items[0].role !== 'user') items.shift();
  return items;
}

const sleep = (ms: number, signal: AbortSignal) =>
  new Promise<void>((resolve) => {
    const t = setTimeout(resolve, ms);
    signal.addEventListener('abort', () => (clearTimeout(t), resolve()), { once: true });
  });

export const POST: APIRoute = async ({ request, clientAddress }) => {
  let ip = 'unknown';
  try {
    ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || clientAddress || 'unknown';
  } catch {
    /* clientAddress throws on adapters that do not expose it */
  }
  if (rateLimited(ip)) return errorResponse('rate_limited', 429, { 'Retry-After': '60' });

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body || typeof body !== 'object') return errorResponse('invalid', 400);

  const message = typeof body.message === 'string' ? body.message.trim() : '';
  if (!message) return errorResponse('empty', 400);
  if (message.length > MAX_INPUT) return errorResponse('too_long', 400);

  if (body.lang !== undefined && !isLang(body.lang)) return errorResponse('invalid', 400);
  const lang: Lang = isLang(body.lang) ? body.lang : 'en';

  const mode = body.mode;
  if (mode !== undefined && !(MODES as readonly unknown[]).includes(mode)) return errorResponse('invalid', 400);
  const context = body.context;
  if (context !== undefined && !(CONTEXTS as readonly unknown[]).includes(context)) return errorResponse('invalid', 400);

  const history = sanitizeHistory(body.history);
  const abort = new AbortController();
  request.signal?.addEventListener('abort', () => abort.abort(), { once: true });
  const encoder = new TextEncoder();

  /* ---------------- Demo mode ---------------- */
  if (!ANTHROPIC_API_KEY) {
    const answer = demoAnswer(message, lang, mode as string | undefined);
    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        const send = (e: ChatEvent) => {
          if (!abort.signal.aborted) controller.enqueue(encoder.encode(encodeEvent(e)));
        };
        const citer = new Citer(lang, send);
        await sleep(350, abort.signal); // feel like a real round trip
        for (const chunk of chunkText(answer.text)) {
          if (abort.signal.aborted) break;
          citer.push(chunk);
          await sleep(35, abort.signal);
        }
        citer.flush();
        for (const c of answer.components) send(c);
        send({ type: 'done' });
        controller.close();
      },
      cancel() {
        abort.abort();
      },
    });
    return new Response(stream, { headers: { ...NDJSON_HEADERS, 'X-Assistant-Mode': 'demo' } });
  }

  /* ---------------- Live mode (Claude + tool use) ---------------- */
  const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY });
  const model = ANTHROPIC_MODEL || DEFAULT_MODEL;

  const tags = [
    mode ? `<visitor_mode>${mode}</visitor_mode>` : '',
    context ? `<visitor_context>${context}</visitor_context>` : '',
  ].join('');
  const messages: Anthropic.MessageParam[] = [
    ...history,
    { role: 'user', content: `${tags}${tags ? '\n' : ''}${message}` },
  ];

  const system: Anthropic.TextBlockParam[] = [
    // Stable prefix (tools + this block) is cached; the language line below is not.
    { type: 'text', text: systemPrompt(), cache_control: { type: 'ephemeral' } },
    { type: 'text', text: `Answer in ${lang === 'es' ? 'Spanish' : 'English'}.` },
  ];

  const startRound = () =>
    client.messages.stream({ model, max_tokens: 1024, system, tools, messages }, { signal: abort.signal });

  // Open the first round before answering so upstream failures (bad key,
  // overloaded, network) become a real 503 instead of a broken stream.
  let first = startRound();
  let firstIter = first[Symbol.asyncIterator]();
  let firstEvent: IteratorResult<Anthropic.MessageStreamEvent>;
  try {
    firstEvent = await firstIter.next();
  } catch (err) {
    console.error('[chat] upstream error', err instanceof Anthropic.APIError ? err.status : err);
    return errorResponse('upstream', 503);
  }

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (e: ChatEvent) => {
        if (!abort.signal.aborted) controller.enqueue(encoder.encode(encodeEvent(e)));
      };
      const citer = new Citer(lang, send);
      const shown = new Set<string>();
      const componentSources: string[] = [];
      let wroteText = false;

      try {
        for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
          const ms = round === 0 ? first : startRound();
          const it = round === 0 ? firstIter : ms[Symbol.asyncIterator]();
          let pending: IteratorResult<Anthropic.MessageStreamEvent> | null = round === 0 ? firstEvent : null;
          let separated = round === 0;

          for (;;) {
            const r = pending ?? (await it.next());
            pending = null;
            if (r.done) break;
            const ev = r.value;
            if (ev.type === 'content_block_delta' && ev.delta.type === 'text_delta') {
              if (!separated && wroteText) citer.push('\n\n');
              separated = true;
              wroteText = true;
              citer.push(ev.delta.text);
            }
          }
          const final = await ms.finalMessage();
          citer.flush();

          if (final.stop_reason === 'max_tokens') {
            send({ type: 'error', code: 'stream_cut' });
            break;
          }
          if (final.stop_reason !== 'tool_use') break;

          const toolUses = final.content.filter((b): b is Anthropic.ToolUseBlock => b.type === 'tool_use');
          const results: Anthropic.ToolResultBlockParam[] = toolUses.map((tu) => {
            const resolved = resolveTool(tu.name, tu.input);
            if ('error' in resolved) return { type: 'tool_result', tool_use_id: tu.id, is_error: true, content: resolved.error };
            const fresh = resolved.events.filter((e) => {
              const key = `${e.name}:${'id' in e ? (e.id ?? '') : ''}`;
              if (shown.has(key)) return false;
              shown.add(key);
              return true;
            });
            fresh.forEach(send);
            componentSources.push(...resolved.sources);
            return {
              type: 'tool_result',
              tool_use_id: tu.id,
              content: fresh.length
                ? 'Rendered on the page. Do not repeat its contents; add at most one short closing sentence, or nothing.'
                : 'Already shown above. Do not call it again.',
            };
          });
          messages.push({ role: 'assistant', content: final.content }, { role: 'user', content: results });
        }

        // Every answer that shows components carries sources, even if the model forgot to cite.
        if (citer.count === 0) for (const id of componentSources.slice(0, 4)) citer.cite(id);
        send({ type: 'done' });
      } catch (err) {
        if (!(err instanceof Anthropic.APIUserAbortError) && !abort.signal.aborted) {
          console.error('[chat] stream error', err instanceof Anthropic.APIError ? err.status : err);
          send({ type: 'error', code: wroteText ? 'stream_cut' : 'upstream' });
        }
      } finally {
        try {
          controller.close();
        } catch {
          /* already closed by a cancel */
        }
      }
    },
    cancel() {
      abort.abort();
    },
  });

  return new Response(stream, { headers: { ...NDJSON_HEADERS, 'X-Assistant-Mode': 'live' } });
};
