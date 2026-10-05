/**
 * POST /api/chat — the only serverless route. Streams NDJSON events:
 *   {"type":"text","delta":"…"}
 *   {"type":"component","name":"project","id":"loan-simulator"}
 *   {"type":"source","n":1,"id":"projects.loan-simulator","label":"Projects · Loan simulator"}
 *   {"type":"done"}
 *   {"type":"error","code":"rate_limited"|"too_long"|"empty"|"bad_request"|"upstream"|"stream_cut"}
 *
 * Without ANTHROPIC_API_KEY it runs in DEMO MODE: a canned answer picked by keyword matching over
 * profile.ts (still with a component + source). The response header `X-Assistant-Mode` is
 * `live` or `demo` so the UI can show a note.
 */
export const prerender = false;

import type { APIRoute } from 'astro';
import Anthropic from '@anthropic-ai/sdk';
import { ANTHROPIC_API_KEY, ANTHROPIC_MODEL } from 'astro:env/server';
import type { Lang } from '../../data/profile';
import { isWindowId, type WindowId } from '../../lib/windows';
import {
  demoAnswer,
  demoTip,
  findSource,
  isMode,
  projectIds,
  requestInstructions,
  systemPrompt,
  type DemoAnswer,
  type Mode,
} from '../../lib/assistant';

const MAX_INPUT = 500;
const RATE_MAX = 8;
const RATE_WINDOW_MS = 60_000;
const MAX_TURNS = 3;

/* Best-effort in-memory rate limit (per serverless instance). */
const hits = new Map<string, number[]>();
function tooMany(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) hits.clear(); // keep memory bounded
  return recent.length > RATE_MAX;
}

type Event =
  | { type: 'text'; delta: string }
  | { type: 'component'; name: 'project'; id: string }
  | { type: 'source'; n: number; id: string; label: string }
  | { type: 'done' }
  | { type: 'error'; code: string };

const line = (e: Event) => JSON.stringify(e) + '\n';

function errorResponse(code: string, status: number, mode: 'live' | 'demo') {
  return new Response(line({ type: 'error', code }), {
    status,
    headers: ndjsonHeaders(mode),
  });
}

function ndjsonHeaders(mode: 'live' | 'demo') {
  return {
    'Content-Type': 'application/x-ndjson; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Assistant-Mode': mode,
  };
}

const tools: Anthropic.Tool[] = [
  {
    name: 'cite_sources',
    description:
      'Call once after writing the answer, with the ids of the <source> blocks the answer is based on. Never call it with ids that are not in the profile.',
    input_schema: {
      type: 'object',
      properties: {
        ids: { type: 'array', items: { type: 'string' }, description: 'Source ids, e.g. "projects.loan-simulator".' },
      },
      required: ['ids'],
      additionalProperties: false,
    },
    eager_input_streaming: true,
  },
  {
    name: 'show_project',
    description: 'Shows a project card in the UI. Call it only when the answer is mainly about one project.',
    input_schema: {
      type: 'object',
      properties: { id: { type: 'string', enum: projectIds(), description: 'Project id.' } },
      required: ['id'],
      additionalProperties: false,
    },
    eager_input_streaming: true,
  },
];

export const POST: APIRoute = async ({ request, clientAddress }) => {
  const live = Boolean(ANTHROPIC_API_KEY);
  const modeHeader = live ? 'live' : 'demo';

  let ip = 'unknown';
  try {
    ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || clientAddress || 'unknown';
  } catch {
    /* clientAddress can throw on some adapters */
  }
  if (tooMany(ip)) return errorResponse('rate_limited', 429, modeHeader);

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body || typeof body !== 'object') return errorResponse('bad_request', 400, modeHeader);

  const lang: Lang = body.lang === 'es' ? 'es' : 'en';
  const mode: Mode = body.mode === undefined ? 'chat' : isMode(body.mode) ? body.mode : ('' as Mode);
  if (!mode) return errorResponse('bad_request', 400, modeHeader);

  let context: WindowId | undefined;
  if (body.context !== undefined) {
    if (!isWindowId(body.context)) return errorResponse('bad_request', 400, modeHeader);
    context = body.context;
  }
  if (mode === 'tip' && !context) return errorResponse('bad_request', 400, modeHeader);

  const message = typeof body.message === 'string' ? body.message.trim() : '';
  if (mode !== 'tip') {
    if (!message) return errorResponse('empty', 400, modeHeader);
    if (message.length > MAX_INPUT) return errorResponse('too_long', 400, modeHeader);
  }

  // Conversation memory: only valid roles, bounded content, last 6 entries.
  const history: Anthropic.MessageParam[] = (Array.isArray(body.history) ? body.history : [])
    .filter(
      (m): m is { role: 'user' | 'assistant'; content: string } =>
        !!m &&
        typeof m === 'object' &&
        typeof (m as { content?: unknown }).content === 'string' &&
        ((m as { role?: unknown }).role === 'user' || (m as { role?: unknown }).role === 'assistant'),
    )
    .slice(-6)
    .map((m) => ({ role: m.role, content: m.content.slice(0, 2000) }));
  // The API expects the conversation to start with a user turn.
  while (history.length && history[0].role !== 'user') history.shift();

  const encoder = new TextEncoder();

  /* ----------------------------- Demo mode ----------------------------- */
  if (!live) {
    const answer: DemoAnswer = mode === 'tip' && context ? demoTip(context, lang) : demoAnswer(message, lang);
    const stream = new ReadableStream({
      async start(controller) {
        const send = (e: Event) => controller.enqueue(encoder.encode(line(e)));
        // Simulate streaming: a few words at a time.
        const words = answer.text.split(/(\s+)/);
        for (let i = 0; i < words.length; i += 6) {
          send({ type: 'text', delta: words.slice(i, i + 6).join('') });
          await new Promise((r) => setTimeout(r, 35));
        }
        if (answer.project) send({ type: 'component', name: 'project', id: answer.project });
        answer.sources.forEach((s, i) => send({ type: 'source', n: i + 1, id: s.id, label: s.label[lang] }));
        send({ type: 'done' });
        controller.close();
      },
    });
    return new Response(stream, { headers: ndjsonHeaders('demo') });
  }

  /* ----------------------------- Live mode ----------------------------- */
  const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY });
  const userText =
    mode === 'tip' ? `Give me a tip for the ${context} window.` : message;

  const stream = new ReadableStream({
    async start(controller) {
      let closed = false;
      const send = (e: Event) => {
        if (!closed) controller.enqueue(encoder.encode(line(e)));
      };
      const cited = new Set<string>();
      let componentSent = false;
      let wroteText = false;

      const messages: Anthropic.MessageParam[] = [...history, { role: 'user', content: userText }];

      try {
        for (let turn = 0; turn < MAX_TURNS; turn++) {
          const ms = client.messages.stream({
            model: ANTHROPIC_MODEL,
            max_tokens: 1024,
            // Tools + the first system block are stable, so they are cached together.
            system: [
              { type: 'text', text: systemPrompt(), cache_control: { type: 'ephemeral' } },
              { type: 'text', text: requestInstructions(lang, mode, context) },
            ],
            tools,
            tool_choice: { type: 'auto' },
            messages,
          });

          for await (const event of ms) {
            if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
              wroteText = true;
              send({ type: 'text', delta: event.delta.text });
            }
          }
          const final = await ms.finalMessage();

          const toolResults: Anthropic.ToolResultBlockParam[] = [];
          for (const block of final.content) {
            if (block.type !== 'tool_use') continue;
            // Validate tool input against profile.ts; never trust ids blindly.
            const input = (block.input ?? {}) as { ids?: unknown; id?: unknown };
            if (block.name === 'cite_sources' && Array.isArray(input.ids)) {
              for (const id of input.ids) {
                const src = typeof id === 'string' ? findSource(id) : undefined;
                if (src && !cited.has(src.id)) {
                  cited.add(src.id);
                  send({ type: 'source', n: cited.size, id: src.id, label: src.label[lang] });
                }
              }
              toolResults.push({ type: 'tool_result', tool_use_id: block.id, content: 'ok' });
            } else if (block.name === 'show_project' && typeof input.id === 'string' && projectIds().includes(input.id)) {
              if (!componentSent) send({ type: 'component', name: 'project', id: input.id });
              componentSent = true;
              toolResults.push({ type: 'tool_result', tool_use_id: block.id, content: 'shown' });
            } else {
              toolResults.push({ type: 'tool_result', tool_use_id: block.id, content: 'invalid input', is_error: true });
            }
          }

          // Continue only if the model used tools BEFORE writing any answer text.
          if (final.stop_reason !== 'tool_use' || wroteText || toolResults.length === 0) break;
          messages.push({ role: 'assistant', content: final.content });
          messages.push({ role: 'user', content: toolResults });
        }
        send({ type: 'done' });
      } catch (err) {
        if (err instanceof Anthropic.RateLimitError) send({ type: 'error', code: 'rate_limited' });
        else if (err instanceof Anthropic.APIUserAbortError) {
          /* client went away */
        } else {
          console.error('[api/chat] upstream error', err instanceof Anthropic.APIError ? err.status : err);
          send({ type: 'error', code: 'upstream' });
        }
      } finally {
        closed = true;
        controller.close();
      }
    },
  });

  return new Response(stream, { headers: ndjsonHeaders('live') });
};

export const GET: APIRoute = () =>
  new Response(line({ type: 'error', code: 'bad_request' }), { status: 405, headers: ndjsonHeaders('demo') });
