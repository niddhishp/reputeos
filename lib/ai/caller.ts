/**
 * Centralised AI API caller — handles OpenRouter AND OpenAI correctly.
 *
 * Key rule: the `provider` field is an OpenRouter-specific extension.
 * NEVER send it when calling api.openai.com — it causes a 400 error.
 */

export interface AICallOptions {
  systemPrompt: string;
  userPrompt: string;
  maxTokens?: number;
  temperature?: number;
  jsonMode?: boolean;
  timeoutMs?: number;
}

export interface AICallResult {
  content: string;
  model: string;
  provider: 'openrouter' | 'openai' | 'anthropic-direct';
}

/**
 * Smart AI caller — prefers OpenRouter, falls back to OpenAI.
 * Provider routing is only sent to OpenRouter.
 */
export async function callAI(opts: AICallOptions): Promise<AICallResult> {
  const {
    systemPrompt,
    userPrompt,
    maxTokens = 2000,
    temperature = 0.4,
    jsonMode = false,
    timeoutMs = 45_000,
  } = opts;

  const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY;
  const OPENAI_KEY     = process.env.OPENAI_API_KEY;

  if (!OPENROUTER_KEY && !OPENAI_KEY) {
    throw new Error('No AI API key configured. Set OPENROUTER_API_KEY or OPENAI_API_KEY.');
  }

  // ── Prefer OpenRouter (supports Claude 3.5 Sonnet) ──────────────────────
  if (OPENROUTER_KEY) {
    const body: Record<string, unknown> = {
      model: 'anthropic/claude-3.5-sonnet',
      // Provider routing ONLY for OpenRouter — never for OpenAI
      provider: {
        order: ['amazon-bedrock', 'anthropic', 'openai'],
        allow_fallbacks: true,
      },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user',   content: userPrompt },
      ],
      max_tokens: maxTokens,
      temperature,
    };
    if (jsonMode) body.response_format = { type: 'json_object' };

    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL ?? 'https://reputeos.com',
        'X-Title': 'ReputeOS',
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs),
    });

    if (res.ok) {
      const data = await res.json() as { choices: Array<{ message: { content: string } }> };
      const content = data.choices?.[0]?.message?.content ?? '';
      if (content) return { content, model: 'anthropic/claude-3.5-sonnet', provider: 'openrouter' };
    } else {
      const errText = await res.text();
      console.warn('[AI] OpenRouter failed:', res.status, errText.slice(0, 300));
      // Fall through to OpenAI if key available
      if (!OPENAI_KEY) throw new Error(`OpenRouter error ${res.status}: ${errText.slice(0, 200)}`);
    }
  }

  // ── Fallback: OpenAI ─────────────────────────────────────────────────────
  if (OPENAI_KEY) {
    // NOTE: NO provider field — OpenAI doesn't support it
    const body: Record<string, unknown> = {
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user',   content: userPrompt },
      ],
      max_tokens: maxTokens,
      temperature,
    };
    if (jsonMode) body.response_format = { type: 'json_object' };

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`OpenAI error ${res.status}: ${errText.slice(0, 200)}`);
    }

    const data = await res.json() as { choices: Array<{ message: { content: string } }> };
    const content = data.choices?.[0]?.message?.content ?? '';
    return { content, model: 'gpt-4o', provider: 'openai' };
  }

  throw new Error('All AI providers failed');
}

/** Parse JSON from AI response, stripping markdown fences */
export function parseAIJson<T>(raw: string): T {
  const cleaned = raw
    .replace(/^```json\s*/im, '')
    .replace(/^```\s*/im, '')
    .replace(/\s*```$/im, '')
    .trim();
  return JSON.parse(cleaned) as T;
}
