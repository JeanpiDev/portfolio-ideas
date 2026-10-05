/**
 * POST /api/chat — the only server route of the site (serverless).
 *
 * Request:  { message, lang: 'en'|'es', history?: {role, content}[], mode?: 'chat'|'inspect'|'recruiter', context?: pieceId }
 * Response: NDJSON stream, one JSON event per line:
 *   {"type":"text","delta":"…"}
 *   {"type":"component","name":"project","id":"loan-simulator"}
 *   {"type":"source","n":1,"id":"projects.loan-simulator","label":"Projects · Loan simulator"}
 *   {"type":"done"}
 *   {"type":"error","code":"rate_limited"|"too_long"|"empty"|"upstream"|"stream_cut"}
 *
 * Components and sources come from Claude TOOL USE; their ids are validated
 * against profile.ts, so the model can never inject HTML or unknown ids.
 * Without ANTHROPIC_API_KEY the route runs in demo mode (header X-Assistant-Mode: demo).
 */
export const prerender = false;

import type { APIRoute } from 'astro';
import Anthropic from '@anthropic-ai/sdk';
import { ANTHROPIC_API_KEY, ANTHROPIC_MODEL } from 'astro:env/server';
import { sourceIndex, type Lang } from '../../data/profile';
import { buildSystemPrompt, COMPONENT_IDS, CONTEXT_IDS, MODES, userTurn, type Mode } from '../../lib/context';
import { demoAnswer } from '../../lib/demo';

const MAX_INPUT = 500;
const RATE_MAX = 8;
const RATE_WINDOW_MS = 60_000;
const MAX_TOOL_ROUNDS = 2;

type Event =
  | { type: 'text'; delta: string }
  | { type: 'component'; name: 'project' | 'piece'; id: string }
  | { type: 'source'; n: number; id: string; label: string }
  | { type: 'done' }
  | { type: 'error'; code: 'rate_limited' | 'too_long' | 'empty' | 'upstream' | 'stream_cut' | 'invalid_request' };

/* ---------- Best-effort in-memory rate limit (per serverless instance) ---------- */
const hits = new Map<string, number[]>();
function tooMany(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) hits.clear(); // keep memory bounded
  return recent.length > RATE_MAX;
}

const encoder = new TextEncoder();
const line = (e: Event) => encoder.encode(JSON.stringify(e) + '\n');
const headers = (demo: boolean) => ({
  'Content-Type': 'application/x-ndjson; charset=utf-8',
  'Cache-Control': 'no-store',
  'X-Assistant-Mode': demo ? 'demo' : 'live',
});
const fail = (code: Extract<Event, { type: 'error' }>['code'], status: number) =>
  new Response(line({ type: 'error', code }), { status, headers: headers(!ANTHROPIC_API_KEY) });

/* ---------- Tools: the only way the model can show components or cite ---------- */
const tools: Anthropic.Tool[] = [
  {
    name: 'show_component',
    description:
      'Show one real UI component next to the answer: a project card (name "project") or a playground piece (name "piece"). Use only ids listed in the system prompt.',
    input_schema: {
      type: 'object',
      properties: {
        name: { type: 'string', enum: ['project', 'piece'] },
        id: { type: 'string', description: 'A project id or piece id from the profile.' },
      },
      required: ['name', 'id'],
      additionalProperties: false,
    },
  },
  {
    name: 'cite_sources',
    description: 'Cite the <source> ids from the profile that support the answer. Call once, after writing the answer.',
    input_schema: {
      type: 'object',
      properties: { ids: { type: 'array', items: { type: 'string' }, maxItems: 5 } },
      required: ['ids'],
      additionalProperties: false,
    },
  },
];

let client: Anthropic | null = null;
const getClient = () => (client ??= new Anthropic({ apiKey: ANTHROPIC_API_KEY, maxRetries: 1 }));

export const POST: APIRoute = async ({ request, clientAddress }) => {
  let ip = 'unknown';
  try {
    ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || clientAddress || 'unknown';
  } catch {
    /* clientAddress is unavailable in some runtimes */
  }
  if (tooMany(ip)) return fail('rate_limited', 429);

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const message = typeof body?.message === 'string' ? body.message.trim() : '';
  const lang: Lang = body?.lang === 'es' ? 'es' : 'en';
  if (!message) return fail('empty', 400);
  if (message.length > MAX_INPUT) return fail('too_long', 400);

  // Whitelists: unknown modes or context ids are rejected, never passed to the model.
  const mode = (body?.mode ?? 'chat') as Mode;
  if (!MODES.includes(mode)) return fail('invalid_request', 400);
  const context = body?.context === undefined || body?.context === null ? undefined : String(body.context);
  if (context !== undefined && (mode !== 'inspect' || !CONTEXT_IDS.has(context))) return fail('invalid_request', 400);

  // History: valid roles only, bounded content, last 6 turns, must start with a user turn.
  const rawHistory = Array.isArray(body?.history) ? (body.history as unknown[]) : [];
  const history: Anthropic.MessageParam[] = rawHistory
    .filter(
      (m): m is { role: 'user' | 'assistant'; content: string } =>
        !!m &&
        typeof (m as { content?: unknown }).content === 'string' &&
        ['user', 'assistant'].includes((m as { role?: string }).role ?? '') &&
        !!(m as { content: string }).content.trim(),
    )
    .slice(-6)
    .map((m) => ({ role: m.role, content: m.content.slice(0, 2000) }));
  while (history[0]?.role === 'assistant') history.shift();

  const sources = sourceIndex(lang);
  const demo = !ANTHROPIC_API_KEY;

  const upstream = new AbortController();
  request.signal?.addEventListener('abort', () => upstream.abort());

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (e: Event) => {
        try {
          controller.enqueue(line(e));
        } catch {
          /* client went away */
        }
      };
      let n = 0;
      const cited = new Set<string>();
      const cite = (id: string) => {
        if (!sources[id] || cited.has(id)) return;
        cited.add(id);
        send({ type: 'source', n: ++n, id, label: sources[id].label });
      };
      let shownComponent = false;
      const show = (name: unknown, id: unknown) => {
        if (shownComponent || (name !== 'project' && name !== 'piece') || typeof id !== 'string') return false;
        if (!COMPONENT_IDS[name].has(id)) return false;
        shownComponent = true;
        send({ type: 'component', name, id });
        return true;
      };

      /* ----- Demo mode: canned grounded answer, streamed in small chunks ----- */
      if (demo) {
        const answer = demoAnswer(message, lang, mode, context);
        const words = answer.text.split(/(?<=\s)/);
        for (let i = 0; i < words.length; i += 3) {
          if (upstream.signal.aborted) return controller.close();
          send({ type: 'text', delta: words.slice(i, i + 3).join('') });
          await new Promise((r) => setTimeout(r, 45));
        }
        if (answer.component) show(answer.component.name, answer.component.id);
        answer.sources.forEach(cite);
        send({ type: 'done' });
        return controller.close();
      }

      /* ----- Live mode: Claude with streaming + tool use ----- */
      const messages: Anthropic.MessageParam[] = [
        ...history,
        { role: 'user', content: userTurn(message, lang, mode, context) },
      ];
      let wroteText = false;
      try {
        for (let round = 0; round <= MAX_TOOL_ROUNDS; round++) {
          const s = getClient().messages.stream(
            {
              model: ANTHROPIC_MODEL || 'claude-haiku-4-5',
              max_tokens: 2048,
              // Cached: tools + this frozen system prompt are an identical prefix on every request.
              system: [{ type: 'text', text: buildSystemPrompt(), cache_control: { type: 'ephemeral' } }],
              tools,
              // Last round: no more tools, just let the model finish.
              tool_choice: round === MAX_TOOL_ROUNDS ? { type: 'none' } : { type: 'auto' },
              messages,
            },
            { signal: upstream.signal },
          );
          let sep = wroteText; // add a space between rounds of text
          for await (const ev of s) {
            if (ev.type === 'content_block_delta' && ev.delta.type === 'text_delta' && ev.delta.text) {
              send({ type: 'text', delta: (sep ? ' ' : '') + ev.delta.text });
              sep = false;
              wroteText = true;
            }
          }
          const final = await s.finalMessage();
          const toolUses = final.content.filter((b): b is Anthropic.ToolUseBlock => b.type === 'tool_use');
          if (final.stop_reason !== 'tool_use' || toolUses.length === 0) break;

          const results: Anthropic.ToolResultBlockParam[] = toolUses.map((tu) => {
            const input = (tu.input ?? {}) as Record<string, unknown>;
            if (tu.name === 'show_component') {
              const ok = show(input.name, input.id);
              return { type: 'tool_result', tool_use_id: tu.id, content: ok ? 'Shown.' : 'Ignored: unknown id or already shown.', is_error: !ok };
            }
            if (tu.name === 'cite_sources') {
              const ids = Array.isArray(input.ids) ? input.ids.filter((x): x is string => typeof x === 'string') : [];
              ids.slice(0, 5).forEach(cite);
              return { type: 'tool_result', tool_use_id: tu.id, content: 'Cited.' };
            }
            return { type: 'tool_result', tool_use_id: tu.id, content: 'Unknown tool.', is_error: true };
          });
          messages.push({ role: 'assistant', content: final.content }, { role: 'user', content: results });
        }
        send({ type: 'done' });
      } catch (err) {
        if (!upstream.signal.aborted) {
          console.error('[api/chat]', err instanceof Anthropic.APIError ? `${err.status} ${err.message}` : err);
          send({ type: 'error', code: wroteText ? 'stream_cut' : 'upstream' });
        }
      }
      try {
        controller.close();
      } catch {
        /* already closed */
      }
    },
    cancel() {
      upstream.abort();
    },
  });

  return new Response(stream, { headers: headers(demo) });
};
