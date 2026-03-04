/**
 * Unified AI caller — ReputeOS
 * ================================
 * Tries providers in priority order, automatically falling through on:
 *   - 401 Unauthorized (bad key)
 *   - 402 Payment Required (no credits)
 *   - 403 Forbidden
 *   - 429 Rate limit (with fallback, not retry)
 *   - 503 Service unavailable
 *
 * Priority:
 *   1. Anthropic direct (ANTHROPIC_API_KEY)
 *   2. OpenRouter      (OPENROUTER_API_KEY)
 *   3. OpenAI          (OPENAI_API_KEY)
 */

export interface AICallOptions {
  systemPrompt: string;
  userPrompt:   string;
  json?:        boolean;   // default true
  maxTokens?:   number;    // default 4000
  temperature?: number;    // default 0.4
  timeoutMs?:   number;    // default 55000
  model?:       'fast' | 'smart';  // fast=haiku/mini, smart=sonnet/gpt4o
}

export interface AIResponse {
  content:  string;
  model:    string;
  provider: string;
}

/** Status codes that mean "this provider won't work — try the next one" */
const SKIP_CODES = new Set([401, 402, 403, 429, 500, 503]);

// ── Provider implementations ──────────────────────────────────────────────

async function callAnthropic(opts: AICallOptions): Promise<AIResponse> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error('SKIP:no_key');

  const { systemPrompt, userPrompt, maxTokens = 4000, temperature = 0.4, timeoutMs = 55_000, model = 'smart' } = opts;
  const modelId = model === 'fast' ? 'claude-haiku-4-5-20251001' : 'claude-sonnet-4-6';

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key':         key,
      'anthropic-version': '2023-06-01',
      'content-type':      'application/json',
    },
    body: JSON.stringify({
      model:       modelId,
      max_tokens:  maxTokens,
      temperature,
      system:      systemPrompt,
      messages:    [{ role: 'user', content: userPrompt }],
    }),
    signal: AbortSignal.timeout(timeoutMs),
  });

  if (!res.ok) {
    const errText = await res.text();
    // Credit exhausted or auth error → skip to next provider
    if (SKIP_CODES.has(res.status)) {
      console.warn(`[AI] Anthropic ${res.status} — falling through to next provider. ${errText.slice(0, 120)}`);
      throw new Error(`SKIP:anthropic_${res.status}`);
    }
    throw new Error(`Anthropic error ${res.status}: ${errText.slice(0, 300)}`);
  }

  const data = await res.json() as { content: Array<{ type: string; text: string }>; model: string };
  const text = data.content.find(b => b.type === 'text')?.text ?? '';
  if (!text) throw new Error('SKIP:anthropic_empty');
  return { content: text, model: data.model ?? modelId, provider: 'anthropic' };
}

async function callOpenRouter(opts: AICallOptions): Promise<AIResponse> {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) throw new Error('SKIP:no_key');

  const { systemPrompt, userPrompt, json = true, maxTokens = 4000, temperature = 0.4, timeoutMs = 55_000, model = 'smart' } = opts;
  // Use Bedrock-routed models which work with this account
  const modelId = model === 'fast'
    ? 'anthropic/claude-haiku-4-5'
    : 'anthropic/claude-sonnet-4-5';

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${key}`,
      'Content-Type':  'application/json',
      'HTTP-Referer':  process.env.NEXT_PUBLIC_APP_URL ?? 'https://reputeos.com',
      'X-Title':       'ReputeOS',
    },
    body: JSON.stringify({
      model:    modelId,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user',   content: userPrompt },
      ],
      max_tokens:  maxTokens,
      temperature,
      ...(json ? { response_format: { type: 'json_object' } } : {}),
    }),
    signal: AbortSignal.timeout(timeoutMs),
  });

  if (!res.ok) {
    const errText = await res.text();
    if (SKIP_CODES.has(res.status)) {
      console.warn(`[AI] OpenRouter ${res.status} — falling through. ${errText.slice(0, 120)}`);
      throw new Error(`SKIP:openrouter_${res.status}`);
    }
    throw new Error(`OpenRouter error ${res.status}: ${errText.slice(0, 300)}`);
  }

  const data = await res.json() as { choices: Array<{ message: { content: string } }>; model?: string };
  const text = data.choices?.[0]?.message?.content ?? '';
  if (!text) throw new Error('SKIP:openrouter_empty');
  return { content: text, model: data.model ?? modelId, provider: 'openrouter' };
}

async function callOpenAI(opts: AICallOptions): Promise<AIResponse> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error('SKIP:no_key');

  const { systemPrompt, userPrompt, json = true, maxTokens = 4000, temperature = 0.4, timeoutMs = 55_000, model = 'smart' } = opts;
  const modelId = model === 'fast' ? 'gpt-4o-mini' : 'gpt-4o';

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${key}`,
      'Content-Type':  'application/json',
    },
    body: JSON.stringify({
      model:    modelId,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user',   content: userPrompt },
      ],
      max_tokens:  maxTokens,
      temperature,
      ...(json ? { response_format: { type: 'json_object' } } : {}),
    }),
    signal: AbortSignal.timeout(timeoutMs),
  });

  if (!res.ok) {
    const errText = await res.text();
    if (SKIP_CODES.has(res.status)) {
      console.warn(`[AI] OpenAI ${res.status} — no more providers. ${errText.slice(0, 120)}`);
      throw new Error(`SKIP:openai_${res.status}`);
    }
    throw new Error(`OpenAI error ${res.status}: ${errText.slice(0, 300)}`);
  }

  const data = await res.json() as { choices: Array<{ message: { content: string } }>; model: string };
  const text = data.choices?.[0]?.message?.content ?? '';
  if (!text) throw new Error('SKIP:openai_empty');
  return { content: text, model: data.model ?? modelId, provider: 'openai' };
}

// ── Main exported function ────────────────────────────────────────────────

/**
 * Call AI with automatic provider fallthrough.
 * Throws only if ALL configured providers fail.
 */
export async function callAI(opts: AICallOptions): Promise<AIResponse> {
  const providers = [
    { name: 'anthropic', fn: callAnthropic },
    { name: 'openrouter', fn: callOpenRouter },
    { name: 'openai', fn: callOpenAI },
  ];

  const errors: string[] = [];

  for (const { name, fn } of providers) {
    try {
      const result = await fn(opts);
      if (errors.length > 0) {
        console.log(`[AI] Succeeded via ${name} after ${errors.length} provider(s) failed`);
      }
      return result;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.startsWith('SKIP:')) {
        errors.push(`${name}: ${msg}`);
        continue; // try next provider
      }
      // Non-skip error (timeout, network, etc.) — still try next provider
      console.error(`[AI] ${name} failed with non-skip error:`, msg);
      errors.push(`${name}: ${msg}`);
      continue;
    }
  }

  throw new Error(
    `All AI providers failed. Errors: ${errors.join(' | ')}. ` +
    `Check that at least one of ANTHROPIC_API_KEY, OPENROUTER_API_KEY, or OPENAI_API_KEY is set and has credits.`
  );
}

/**
 * Parse JSON from AI response — strips markdown fences if present.
 */
export function parseAIJson<T = unknown>(content: string): T {
  const cleaned = content
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i,     '')
    .replace(/\s*```$/i,     '')
    .trim();
  return JSON.parse(cleaned) as T;
}
