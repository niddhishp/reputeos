/**
 * lib/ai/call.ts — Unified AI caller for ReputeOS
 * =================================================
 * Priority order: OpenRouter → Anthropic direct → OpenAI
 * Includes usage logging to api_usage_log table (fire-and-forget).
 */

// Supabase client import is dynamic to avoid module-level env var issues
async function logUsage(entry: {
  service: string; operation: string; model: string;
  user_id?: string; client_id?: string; scan_type?: string;
  tokens_in?: number; tokens_out?: number; cost_usd?: number;
  latency_ms?: number; status?: string; error_msg?: string;
}) {
  try {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();
    await supabase.from('api_usage_log').insert(entry);
  } catch {
    // never let logging break the actual call
  }
}

// Cost estimates per 1000 tokens (USD)
const TOKEN_COSTS: Record<string, { in: number; out: number }> = {
  'anthropic/claude-sonnet-4-6': { in: 0.003, out: 0.015 },
  'anthropic/claude-haiku-4-5':  { in: 0.00025, out: 0.00125 },
  'claude-sonnet-4-5-20251001':  { in: 0.003,   out: 0.015 },
  'claude-haiku-4-5-20251001':   { in: 0.00025, out: 0.00125 },
  'gpt-4o':                      { in: 0.005,   out: 0.015 },
  'gpt-4o-mini':                 { in: 0.00015, out: 0.0006 },
};

function estimateCost(model: string, tokensIn: number, tokensOut: number): number {
  const rates = TOKEN_COSTS[model] ?? { in: 0.003, out: 0.015 };
  return (tokensIn / 1000) * rates.in + (tokensOut / 1000) * rates.out;
}

export interface AICallOptions {
  systemPrompt: string;
  userPrompt:   string;
  json?:        boolean;
  maxTokens?:   number;
  temperature?: number;
  timeoutMs?:   number;
  model?:       'fast' | 'smart';
  // For usage tracking
  userId?:      string;
  clientId?:    string;
  scanType?:    string;
  operation?:   string;
}

export interface AIResponse {
  content:   string;
  model:     string;
  provider:  string;
  tokensIn?:  number;
  tokensOut?: number;
  costUsd?:   number;
}

export async function callAI(opts: AICallOptions): Promise<AIResponse> {
  const {
    systemPrompt,
    userPrompt,
    json        = true,
    maxTokens   = 4000,
    temperature = 0.4,
    timeoutMs   = 55_000,
    model       = 'smart',
    userId, clientId, scanType,
    operation   = 'chat_completion',
  } = opts;

  const openrouterKey = process.env.OPENROUTER_API_KEY;
  const anthropicKey  = process.env.ANTHROPIC_API_KEY;
  const openaiKey     = process.env.OPENAI_API_KEY;
  const t0 = Date.now();

  // ── 1. OpenRouter ────────────────────────────────────────────────────────────
  if (openrouterKey) {
    const modelId = model === 'fast'
      ? 'anthropic/claude-haiku-4-5'
      : 'anthropic/claude-sonnet-4-6';

    const body: Record<string, unknown> = {
      model: modelId,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user',   content: userPrompt },
      ],
      max_tokens:  maxTokens,
      temperature,
    };
    if (json) body.response_format = { type: 'json_object' };

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
    } else {
      const data = await res.json() as {
        choices?: Array<{ message: { content: string } }>;
        model?: string;
        usage?: { prompt_tokens: number; completion_tokens: number };
        error?: { message: string };
      };

      if (data.error) throw new Error(`OpenRouter API error: ${data.error.message}`);

      const content = data.choices?.[0]?.message?.content ?? '';
      if (!content) throw new Error(`OpenRouter returned empty response for model ${modelId}.`);

      const tokensIn  = data.usage?.prompt_tokens     ?? 0;
      const tokensOut = data.usage?.completion_tokens ?? 0;
      const costUsd   = estimateCost(modelId, tokensIn, tokensOut);
      const latency   = Date.now() - t0;

      logUsage({ service: 'openrouter', operation, model: data.model ?? modelId,
        user_id: userId, client_id: clientId, scan_type: scanType,
        tokens_in: tokensIn, tokens_out: tokensOut, cost_usd: costUsd, latency_ms: latency });

      return { content, model: data.model ?? modelId, provider: 'openrouter', tokensIn, tokensOut, costUsd };
    }
  }

  // ── 2. Anthropic direct ─────────────────────────────────────────────────────
  if (anthropicKey) {
    const modelId = model === 'fast' ? 'claude-haiku-4-5-20251001' : 'claude-sonnet-4-5-20251001';

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method:  'POST',
      headers: {
        'x-api-key': anthropicKey, 'anthropic-version': '2023-06-01', 'content-type': 'application/json',
      },
      body: JSON.stringify({ model: modelId, max_tokens: maxTokens, temperature,
        system: systemPrompt, messages: [{ role: 'user', content: userPrompt }] }),
      signal: AbortSignal.timeout(timeoutMs),
    });

    if (!res.ok) { const err = await res.text(); throw new Error(`Anthropic API error ${res.status}: ${err.slice(0, 300)}`); }

    const data = await res.json() as {
      content: Array<{ type: string; text: string }>;
      model: string;
      usage?: { input_tokens: number; output_tokens: number };
    };
    const text = data.content.find(b => b.type === 'text')?.text ?? '';
    const tokensIn  = data.usage?.input_tokens  ?? 0;
    const tokensOut = data.usage?.output_tokens ?? 0;
    const costUsd   = estimateCost(modelId, tokensIn, tokensOut);

    logUsage({ service: 'anthropic', operation, model: modelId,
      user_id: userId, client_id: clientId, scan_type: scanType,
      tokens_in: tokensIn, tokens_out: tokensOut, cost_usd: costUsd, latency_ms: Date.now() - t0 });

    return { content: text, model: data.model ?? modelId, provider: 'anthropic', tokensIn, tokensOut, costUsd };
  }

  // ── 3. OpenAI ────────────────────────────────────────────────────────────────
  if (openaiKey) {
    const modelId = model === 'fast' ? 'gpt-4o-mini' : 'gpt-4o';

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${openaiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: modelId,
        messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
        max_tokens: maxTokens, temperature,
        ...(json ? { response_format: { type: 'json_object' } } : {}),
      }),
      signal: AbortSignal.timeout(timeoutMs),
    });

    if (!res.ok) { const err = await res.text(); throw new Error(`OpenAI error ${res.status}: ${err.slice(0, 300)}`); }

    const data = await res.json() as {
      choices: Array<{ message: { content: string } }>;
      usage?: { prompt_tokens: number; completion_tokens: number };
    };
    const content  = data.choices?.[0]?.message?.content ?? '';
    const tokensIn  = data.usage?.prompt_tokens     ?? 0;
    const tokensOut = data.usage?.completion_tokens ?? 0;
    const costUsd   = estimateCost(modelId, tokensIn, tokensOut);

    logUsage({ service: 'openai', operation, model: modelId,
      user_id: userId, client_id: clientId, scan_type: scanType,
      tokens_in: tokensIn, tokens_out: tokensOut, cost_usd: costUsd, latency_ms: Date.now() - t0 });

    return { content, model: modelId, provider: 'openai', tokensIn, tokensOut, costUsd };
  }

  throw new Error(
    'No AI API key configured or all keys failed. ' +
    'Set OPENROUTER_API_KEY, ANTHROPIC_API_KEY, or OPENAI_API_KEY.'
  );
}

export function parseAIJson<T = unknown>(content: string): T {
  const cleaned = content
    .replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();
  return JSON.parse(cleaned) as T;
}

/** Log an external API call (SerpAPI, Exa, Firecrawl, etc.) */
export async function logApiCall(entry: {
  service: 'serpapi' | 'exa' | 'firecrawl' | 'apify' | string;
  operation: string;
  userId?: string;
  clientId?: string;
  scanType?: string;
  costUsd?: number;
  latencyMs?: number;
  status?: 'success' | 'error' | 'timeout';
  errorMsg?: string;
  results?: number;
}) {
  logUsage({
    service:    entry.service,
    operation:  entry.operation,
    model:      '',
    user_id:    entry.userId,
    client_id:  entry.clientId,
    scan_type:  entry.scanType,
    cost_usd:   entry.costUsd,
    latency_ms: entry.latencyMs,
    status:     entry.status ?? 'success',
    error_msg:  entry.errorMsg,
  });
}
