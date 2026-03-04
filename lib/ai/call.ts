/**
 * lib/ai/call.ts — Unified AI caller for ReputeOS
 * =================================================
 * Priority order: OpenRouter → Anthropic direct → OpenAI
 *
 * OpenRouter is first because the user's Anthropic direct key may have
 * zero credits, while OpenRouter credits are available.
 *
 * IMPORTANT: The `provider` field is OpenRouter-specific and must NEVER
 * be sent to Anthropic or OpenAI endpoints.
 */

export interface AICallOptions {
  systemPrompt: string;
  userPrompt:   string;
  json?:        boolean;   // request JSON response_format (default: true)
  maxTokens?:   number;    // default 4000
  temperature?: number;    // default 0.4
  timeoutMs?:   number;    // default 55000
  model?:       'fast' | 'smart'; // fast = haiku, smart = sonnet (default: smart)
}

export interface AIResponse {
  content:  string;
  model:    string;
  provider: string;
}

// ────────────────────────────────────────────────────────────────────────────

export async function callAI(opts: AICallOptions): Promise<AIResponse> {
  const {
    systemPrompt,
    userPrompt,
    json        = true,
    maxTokens   = 4000,
    temperature = 0.4,
    timeoutMs   = 55_000,
    model       = 'smart',
  } = opts;

  const openrouterKey = process.env.OPENROUTER_API_KEY;
  const anthropicKey  = process.env.ANTHROPIC_API_KEY;
  const openaiKey     = process.env.OPENAI_API_KEY;

  // ── 1. OpenRouter (preferred — routes to Bedrock, has credits) ──────────────
  if (openrouterKey) {
    // Amazon Bedrock via OpenRouter — confirmed working model
    // Bedrock lags ~3-6 months behind direct Anthropic releases
    // claude-3.5-sonnet is the latest confirmed available on Bedrock
    const modelId = 'anthropic/claude-3.5-sonnet';

    const body: Record<string, unknown> = {
      model: modelId,
      // Force Amazon Bedrock — the only enabled provider on this account
      provider: { order: ['amazon-bedrock'], allow_fallbacks: false },
      messages: [
        { role: 'system', content: systemPrompt + (json ? '\n\nIMPORTANT: Respond with ONLY a valid JSON object. No markdown, no explanation, no code fences. Pure JSON only.' : '') },
        { role: 'user',   content: userPrompt },
      ],
      max_tokens:  maxTokens,
      temperature,
    };
    // Bedrock via OpenRouter does NOT support response_format: json_object
    // We instruct via the user prompt and parse manually instead
    // if (json) body.response_format = { type: 'json_object' }; // disabled for Bedrock

    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method:  'POST',
      headers: {
        'Authorization': `Bearer ${openrouterKey}`,
        'Content-Type':  'application/json',
        'HTTP-Referer':  process.env.NEXT_PUBLIC_APP_URL ?? 'https://reputeos.com',
        'X-Title':       'ReputeOS',
      },
      body:   JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error(`[callAI] OpenRouter ${res.status}:`, err.slice(0, 300));
      // Fall through to next provider only on auth/credit errors
      if (res.status === 401 || res.status === 402 || res.status === 403) {
        // fall through below
      } else {
        throw new Error(`OpenRouter error ${res.status}: ${err.slice(0, 300)}`);
      }
    } else {
      const data = await res.json() as {
        choices?: Array<{ message: { content: string } }>;
        model?: string;
        error?: { message: string };
      };

      if (data.error) {
        throw new Error(`OpenRouter API error: ${data.error.message}`);
      }

      const content = data.choices?.[0]?.message?.content ?? '';
      if (!content) {
        throw new Error(`OpenRouter returned empty response for model ${modelId}. ` +
          `Check your OpenRouter account at openrouter.ai — model may need a different provider.`);
      }

      return { content, model: data.model ?? modelId, provider: 'openrouter' };
    }
  }

  // ── 2. Anthropic direct ─────────────────────────────────────────────────────
  if (anthropicKey) {
    const modelId = model === 'fast'
      ? 'claude-haiku-4-5-20251001'
      : 'claude-sonnet-4-5-20251001';

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method:  'POST',
      headers: {
        'x-api-key':         anthropicKey,
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
      const err = await res.text();
      throw new Error(`Anthropic API error ${res.status}: ${err.slice(0, 300)}`);
    }

    const data = await res.json() as {
      content: Array<{ type: string; text: string }>;
      model: string;
    };
    const text = data.content.find(b => b.type === 'text')?.text ?? '';
    return { content: text, model: data.model ?? modelId, provider: 'anthropic' };
  }

  // ── 3. OpenAI ────────────────────────────────────────────────────────────────
  if (openaiKey) {
    const modelId = model === 'fast' ? 'gpt-4o-mini' : 'gpt-4o';

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method:  'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify({
        model: modelId,
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
      const err = await res.text();
      throw new Error(`OpenAI error ${res.status}: ${err.slice(0, 300)}`);
    }

    const data = await res.json() as { choices: Array<{ message: { content: string } }> };
    const content = data.choices?.[0]?.message?.content ?? '';
    return { content, model: modelId, provider: 'openai' };
  }

  throw new Error(
    'No AI API key configured or all keys failed. ' +
    'Set OPENROUTER_API_KEY, ANTHROPIC_API_KEY, or OPENAI_API_KEY in Vercel environment variables.'
  );
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
