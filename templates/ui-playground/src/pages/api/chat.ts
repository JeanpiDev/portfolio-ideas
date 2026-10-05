/**
 * POST /api/chat — the inspector / assistant endpoint (serverless).
 *
 * Request:  { message, lang: 'en'|'es', history?: {role, content}[], mode?: 'chat'|'inspect', context?: <pieceId> }
 * Response: NDJSON stream, one JSON event per line:
 *   {"type":"text","delta":"…"}
 *   {"type":"component","name":"project","id":"loan-simulator"}
 *   {"type":"source","n":1,"id":"projects.loan-simulator","label":"Projects · Loan simulator"}
 *   {"type":"done"}
 *   {"type":"error","code":"rate_limited"|"too_long"|"empty"|"bad_request"|"upstream"|"stream_cut"}
 *
 * Without ANTHROPIC_API_KEY it runs in DEMO MODE (header `x-assistant-mode: demo`):
 * a canned answer grounded in src/data, picked by keyword matching.
 */
export const prerender = false;

import type { APIRoute } from 'astro';
import Anthropic from '@anthropic-ai/sdk';
import { ANTHROPIC_API_KEY, ANTHROPIC_MODEL } from 'astro:env/server';
import { buildSystemPrompt, componentIds, demoAnswer, sources, type ComponentName, type Source } from '../../lib/knowledge';
import { pieceIds } from '../../data/pieces';
import type { Lang } from '../../data/profile';

const MAX_INPUT = 500;
const RATE_MAX = 8;
const RATE_WINDOW_MS = 60_000;
const MODES = new Set(['chat', 'inspect']);
const CONTEXTS = new Set(pieceIds);

// Best-effort in-memory rate limit (per serverless instance).
const hits = new Map<string, number[]>();
function tooMany(ip: string): boolean {
  const now = Date.now();
  const arr = (hits.get(ip) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  arr.push(now);
  hits.set(ip, arr);
  if (hits.size > 5000) hits.clear(); // keep memory bounded
  return arr.length > RATE_MAX;
}

type Event =
  | { type: 'text'; delta: string }
  | { type: 'component'; name: ComponentName; id: string }
  | { type: 'source'; n: number; id: string; label: string }
  | { type: 'done' }
  | { type: 'error'; code: string };

const line = (e: Event) => JSON.stringify(e) + '\n';

function ndjson(status: number, events: Event[], demo = false) {
  return new Response(events.map(line).join(''), { status, headers: headers(demo) });
}
function headers(demo: boolean): HeadersInit {
  return {
    'Content-Type': 'application/x-ndjson; charset=utf-8',
    'Cache-Control': 'no-store',
    'x-assistant-mode': demo ? 'demo' : 'live',
  };
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Tools: the model never returns HTML; it asks the UI to render a known component
// or cite a known source. Every id is validated against the whitelists.
const tools: Anthropic.Tool[] = [
  {
    name: 'show_component',
    description: 'Ask the UI to render a card for one project, experience entry or piece that the answer is mainly about.',
    input_schema: {
      type: 'object',
      properties: {
        name: { type: 'string', enum: ['project', 'experience', 'piece'] },
        id: { type: 'string', description: 'The id from the source block, e.g. "loan-simulator" for source projects.loan-simulator.' },
      },
      required: ['name', 'id'],
      additionalProperties: false,
    },
  },
  {
    name: 'cite_source',
    description: 'Cite one <source> block you used in the answer. Call once per source, most relevant first.',
    input_schema: {
      type: 'object',
      properties: { id: { type: 'string', description: 'The source id, e.g. "projects.loan-simulator".' } },
      required: ['id'],
      additionalProperties: false,
    },
  },
];

export const POST: APIRoute = async ({ request, clientAddress }) => {
  const demo = !ANTHROPIC_API_KEY;
  let ip = 'unknown';
  try { ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || clientAddress || 'unknown'; } catch { /* clientAddress may throw in some adapters */ }
  if (tooMany(ip)) return ndjson(429, [{ type: 'error', code: 'rate_limited' }], demo);

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body || typeof body !== 'object') return ndjson(400, [{ type: 'error', code: 'bad_request' }], demo);

  const message = typeof body.message === 'string' ? body.message.trim() : '';
  const lang: Lang = body.lang === 'es' ? 'es' : 'en';
  if (!message) return ndjson(400, [{ type: 'error', code: 'empty' }], demo);
  if (message.length > MAX_INPUT) return ndjson(400, [{ type: 'error', code: 'too_long' }], demo);

  const mode = body.mode === undefined ? 'chat' : body.mode;
  const context = body.context;
  if (typeof mode !== 'string' || !MODES.has(mode)) return ndjson(400, [{ type: 'error', code: 'bad_request' }], demo);
  if (context !== undefined && (typeof context !== 'string' || !CONTEXTS.has(context)))
    return ndjson(400, [{ type: 'error', code: 'bad_request' }], demo);
  if (mode === 'inspect' && !context) return ndjson(400, [{ type: 'error', code: 'bad_request' }], demo);

  // Conversation memory comes from the client: keep valid roles, bounded content, last 6.
  const history: Anthropic.MessageParam[] = (Array.isArray(body.history) ? body.history : [])
    .filter((m): m is { role: 'user' | 'assistant'; content: string } =>
      !!m && typeof m === 'object' && typeof (m as any).content === 'string' && ((m as any).role === 'user' || (m as any).role === 'assistant'))
    .slice(-6)
    .map((m) => ({ role: m.role, content: m.content.slice(0, 2000) }));
  while (history.length && history[0].role !== 'user') history.shift(); // first message must be user

  const encoder = new TextEncoder();
  const allSources = sources(lang);
  const sourceById = new Map(allSources.map((s) => [s.id, s]));

  // ---------------------------------------------------------------- demo mode
  if (demo) {
    const answer = demoAnswer({ message, lang, mode, context: context as string | undefined });
    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        const send = (e: Event) => controller.enqueue(encoder.encode(line(e)));
        const words = answer.text.split(/(\s+)/);
        for (let i = 0; i < words.length; i += 4) {
          send({ type: 'text', delta: words.slice(i, i + 4).join('') });
          await sleep(25);
        }
        if (answer.component) send({ type: 'component', ...answer.component });
        answer.sources.forEach((s: Source, i: number) => send({ type: 'source', n: i + 1, id: s.id, label: s.label }));
        send({ type: 'done' });
        controller.close();
      },
    });
    return new Response(stream, { headers: headers(true) });
  }

  // ---------------------------------------------------------------- live mode
  const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY });
  const userText = mode === 'inspect' ? `[mode: inspect · piece id: ${context}]\n${message}` : message;
  const messages: Anthropic.MessageParam[] = [...history, { role: 'user', content: userText }];
  const abort = new AbortController();
  request.signal?.addEventListener('abort', () => abort.abort());

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (e: Event) => { try { controller.enqueue(encoder.encode(line(e))); } catch { /* client gone */ } };
      const cited = new Set<string>();
      let shownComponent = false;
      let sentText = false;
      try {
        // Small manual tool loop: the tools are "display" tools, so at most a
        // couple of rounds are needed to let the model finish its sentence.
        for (let round = 0; round < 3; round++) {
          const mstream = client.messages.stream(
            {
              model: ANTHROPIC_MODEL,
              max_tokens: 1024, // short answers by design
              // Prompt caching on the stable system prompt (silently skipped if
              // the prefix is under the model's minimum cacheable length).
              system: [{ type: 'text', text: buildSystemPrompt(lang), cache_control: { type: 'ephemeral' } }],
              tools,
              tool_choice: { type: 'auto' },
              messages,
            },
            { signal: abort.signal },
          );
          mstream.on('text', (delta) => { sentText = true; send({ type: 'text', delta }); });
          const final = await mstream.finalMessage();

          const toolUses = final.content.filter((b): b is Anthropic.ToolUseBlock => b.type === 'tool_use');
          const results: Anthropic.ToolResultBlockParam[] = [];
          for (const tu of toolUses) {
            const input = (tu.input ?? {}) as Record<string, unknown>;
            let ok = false;
            if (tu.name === 'cite_source' && typeof input.id === 'string' && sourceById.has(input.id)) {
              ok = true;
              if (!cited.has(input.id)) {
                cited.add(input.id);
                const s = sourceById.get(input.id)!;
                send({ type: 'source', n: cited.size, id: s.id, label: s.label });
              }
            } else if (
              tu.name === 'show_component' && typeof input.name === 'string' && typeof input.id === 'string' &&
              input.name in componentIds && componentIds[input.name as ComponentName].has(input.id)
            ) {
              ok = true;
              if (!shownComponent) {
                shownComponent = true;
                send({ type: 'component', name: input.name as ComponentName, id: input.id });
              }
            }
            results.push({
              type: 'tool_result',
              tool_use_id: tu.id,
              content: ok ? 'ok' : 'Unknown id. Use only ids from the <source> blocks.',
              is_error: !ok,
            });
          }

          if (final.stop_reason !== 'tool_use' || toolUses.length === 0) break;
          messages.push({ role: 'assistant', content: final.content });
          messages.push({ role: 'user', content: results });
        }
        send({ type: 'done' });
      } catch (err) {
        if (abort.signal.aborted) { /* client stopped */ }
        else if (err instanceof Anthropic.RateLimitError) send({ type: 'error', code: 'rate_limited' });
        else if (err instanceof Anthropic.APIError && !sentText) send({ type: 'error', code: 'upstream' });
        else send({ type: 'error', code: sentText ? 'stream_cut' : 'upstream' });
        console.error('[api/chat]', err instanceof Error ? err.message : err);
      } finally {
        try { controller.close(); } catch { /* already closed */ }
      }
    },
    cancel() { abort.abort(); },
  });

  return new Response(stream, { headers: headers(false) });
};
