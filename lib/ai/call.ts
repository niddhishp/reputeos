/**
 * Unified AI caller — used by all ReputeOS API routes.
 *
 * Priority:
 *   1. Anthropic SDK (direct) — if ANTHROPIC_API_KEY set
 *   2. OpenRouter              — if OPENROUTER_API_KEY set
 *   3. OpenAI                  — if OPENAI_API_KEY set
 *
 * The `provider` field is OpenRouter-only and must NEVER be sent to
 * OpenAI or Anthropic endpoints. All old ad-hoc fetch calls had this bug.
 */

export interface AICallOptions {
  systemPrompt: string;
  userPrompt: string;
  json?: boolean;          // default true — request JSON response
  maxTokens?: number;      // default 4000
  temperature?: number;    // default 0.4
  timeoutMs?: number;      // default 55000 (Vercel hobby = 60s, pro = 300s)
  model?: 'fast' | 'smart'; // fast = haiku/mini, smart = sonnet/gpt4o (default)
}

interface AIResponse {
  content: string;
  model: string;
  provider: string;
}

function getKeys() {
  return {
    anthropic: process.env.ANTHROPIC_API_KEY,
    openrouter: process.env.OPENROUTER_API_KEY,
    openai: process.env.OPENAI_API_KEY,
  };
}

/**
 * Call an AI model. Returns the text content of the response.
 * Throws on failure (caller should catch).
 */
export async function callAI(opts: AICallOptions): Promise<AIResponse> {
  const {
    systemPrompt,
    userPrompt,
    json = true,
    maxTokens = 4000,
    temperature = 0.4,
    timeoutMs = 55_000,
    model = 'smart',
  } = opts;

  const keys = getKeys();

  // ── 1. Direct Anthropic SDK (most reliable, no routing issues) ─────────────
  if (keys.anthropic) {
    const modelId = model === 'fast'
      ? 'claude-haiku-4-5-20251001'
      : 'claude-sonnet-4-5-20251001';

    const body = {
      model: modelId,
      max_tokens: maxTokens,
      temperature,
      system: systemPrompt,
      messages: [{ role: 'user' as const, content: userPrompt }],
    };

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': keys.anthropic,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Anthropic API error ${res.status}: ${err.slice(0, 300)}`);
    }

    const data = await res.json() as {
      content: Array<{ type: string; text: string }>;
      model: string;
    };
    const text = data.content.find(b => b.type === 'text')?.text ?? '';
    return { content: text, model: modelId, provider: 'anthropic' };
  }

  // ── 2. OpenRouter (no `provider` routing — let OR decide) ──────────────────
  if (keys.openrouter) {
    const modelId = model === 'fast'
      ? 'anthropic/claude-haiku-4-5'
      : 'anthropic/claude-3.5-sonnet';

    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${keys.openrouter}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL ?? 'https://reputeos.com',
        'X-Title': 'ReputeOS',
      },
      body: JSON.stringify({
        model: modelId,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user',   content: userPrompt },
        ],
        max_tokens: maxTokens,
        temperature,
        ...(json ? { response_format: { type: 'json_object' } } : {}),
      }),
      signal: AbortSignal.timeout(timeoutMs),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`OpenRouter error ${res.status}: ${err.slice(0, 300)}`);
    }

    const data = await res.json() as { choices: Array<{ message: { content: string } }> };
    return {
      content: data.choices[0]?.message?.content ?? '',
      model: modelId,
      provider: 'openrouter',
    };
  }

  // ── 3. OpenAI (fallback) ────────────────────────────────────────────────────
  if (keys.openai) {
    const modelId = model === 'fast' ? 'gpt-4o-mini' : 'gpt-4o';

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${keys.openai}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: modelId,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user',   content: userPrompt },
        ],
        max_tokens: maxTokens,
        temperature,
        ...(json ? { response_format: { type: 'json_object' } } : {}),
      }),
      signal: AbortSignal.timeout(timeoutMs),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`OpenAI error ${res.status}: ${err.slice(0, 300)}`);
    }

    const data = await res.json() as { choices: Array<{ message: { content: string } }> };
    return {
      content: data.choices[0]?.message?.content ?? '',
      model: modelId,
      provider: 'openai',
    };
  }

  throw new Error('No AI API key configured. Set ANTHROPIC_API_KEY, OPENROUTER_API_KEY, or OPENAI_API_KEY.');
}

/**
 * Parse JSON from AI response — strips markdown fences if present.
 */
export function parseAIJson<T = unknown>(content: string): T {
  const cleaned = content
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
  return JSON.parse(cleaned) as T;
}
