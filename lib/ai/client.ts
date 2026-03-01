/**
 * AI Client Configuration
 *
 * OpenAI is lazily initialized — NOT at module level — so that Next.js
 * build-time page collection doesn't crash when OPENAI_API_KEY is absent.
 * Always call getOpenAI() inside async functions, never at import time.
 */

import OpenAI from 'openai';

// ─── Lazy singleton ──────────────────────────────────────────────────────────
let _openai: OpenAI | null = null;

export function getOpenAI(): OpenAI {
  if (!_openai) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error(
        'OPENAI_API_KEY is not set. Add it to your environment variables.'
      );
    }
    _openai = new OpenAI({ apiKey });
  }
  return _openai;
}

// ─── Keep named export for backwards compat (but it's now a getter) ─────────
/** @deprecated Use getOpenAI() — this will throw at build time if key missing */
export const openai = new Proxy({} as OpenAI, {
  get(_target, prop) {
    return getOpenAI()[prop as keyof OpenAI];
  },
});

// ─── Model configurations ─────────────────────────────────────────────────────
export const MODELS = {
  GPT4O: 'gpt-4o',
  GPT4O_MINI: 'gpt-4o-mini',
  O1_MINI: 'o1-mini',
} as const;

export type ModelType = (typeof MODELS)[keyof typeof MODELS];

export const DEFAULT_PARAMS = {
  temperature: 0.7,
  max_tokens: 2000,
  top_p: 1,
  frequency_penalty: 0,
  presence_penalty: 0,
} as const;

// ─── Types ────────────────────────────────────────────────────────────────────
export interface GenerationOptions {
  model?: ModelType;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  systemPrompt?: string;
  userPrompt: string;
  jsonMode?: boolean;
}

export interface GenerationResult {
  content: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model: string;
  finishReason: string | null;
}

// ─── Core generation function ─────────────────────────────────────────────────
export async function generateContent(
  options: GenerationOptions
): Promise<GenerationResult> {
  const {
    model = MODELS.GPT4O,
    temperature = DEFAULT_PARAMS.temperature,
    maxTokens = DEFAULT_PARAMS.max_tokens,
    topP = DEFAULT_PARAMS.top_p,
    frequencyPenalty = DEFAULT_PARAMS.frequency_penalty,
    presencePenalty = DEFAULT_PARAMS.presence_penalty,
    systemPrompt,
    userPrompt,
    jsonMode = false,
  } = options;

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];
  if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
  messages.push({ role: 'user', content: userPrompt });

  const completion = await getOpenAI().chat.completions.create({
    model,
    messages,
    temperature,
    max_tokens: maxTokens,
    top_p: topP,
    frequency_penalty: frequencyPenalty,
    presence_penalty: presencePenalty,
    response_format: jsonMode ? { type: 'json_object' } : undefined,
  });

  const choice = completion.choices[0];
  if (!choice) throw new Error('No completion choice returned from OpenAI');

  return {
    content: choice.message.content || '',
    usage: {
      promptTokens: completion.usage?.prompt_tokens || 0,
      completionTokens: completion.usage?.completion_tokens || 0,
      totalTokens: completion.usage?.total_tokens || 0,
    },
    model: completion.model,
    finishReason: choice.finish_reason,
  };
}

export async function generateJSON<T>(
  options: Omit<GenerationOptions, 'jsonMode'>
): Promise<T> {
  const result = await generateContent({ ...options, jsonMode: true });
  try {
    return JSON.parse(result.content) as T;
  } catch (error) {
    throw new Error(`Failed to parse JSON response: ${error}`);
  }
}

export async function* streamContent(
  options: GenerationOptions
): AsyncGenerator<string, void, unknown> {
  const {
    model = MODELS.GPT4O,
    temperature = DEFAULT_PARAMS.temperature,
    maxTokens = DEFAULT_PARAMS.max_tokens,
    systemPrompt,
    userPrompt,
  } = options;

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];
  if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
  messages.push({ role: 'user', content: userPrompt });

  const stream = await getOpenAI().chat.completions.create({
    model,
    messages,
    temperature,
    max_tokens: maxTokens,
    stream: true,
  });

  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content;
    if (content) yield content;
  }
}

export async function generateWithRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (error instanceof OpenAI.APIError && error.status && error.status < 500) throw error;
      await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempt) * 1000));
    }
  }

  throw lastError || new Error('Max retries exceeded');
}

export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

export function mightExceedLimit(text: string, limit = 4000): boolean {
  return estimateTokens(text) > limit;
}
