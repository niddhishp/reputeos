/**
 * AI Client Configuration
 * 
 * This module provides centralized AI client configuration for OpenAI and Anthropic.
 * It includes error handling, retry logic, and proper typing.
 */

import OpenAI from 'openai';
import { env } from '@/lib/env';

// Initialize OpenAI client
export const openai = new OpenAI({
  apiKey: env.OPENAI_API_KEY,
});

// Model configurations
export const MODELS = {
  // Primary model for content generation
  GPT4O: 'gpt-4o',
  // Fallback model for simpler tasks
  GPT4O_MINI: 'gpt-4o-mini',
  // Model for complex reasoning
  O1_MINI: 'o1-mini',
} as const;

export type ModelType = typeof MODELS[keyof typeof MODELS];

// Default generation parameters
export const DEFAULT_PARAMS = {
  temperature: 0.7,
  max_tokens: 2000,
  top_p: 1,
  frequency_penalty: 0,
  presence_penalty: 0,
} as const;

// Content generation options
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

// Generation result
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

/**
 * Generate content using OpenAI
 */
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

  if (systemPrompt) {
    messages.push({
      role: 'system',
      content: systemPrompt,
    });
  }

  messages.push({
    role: 'user',
    content: userPrompt,
  });

  const completion = await openai.chat.completions.create({
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

  if (!choice) {
    throw new Error('No completion choice returned from OpenAI');
  }

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

/**
 * Generate structured JSON content
 */
export async function generateJSON<T>(
  options: Omit<GenerationOptions, 'jsonMode'>
): Promise<T> {
  const result = await generateContent({
    ...options,
    jsonMode: true,
  });

  try {
    return JSON.parse(result.content) as T;
  } catch (error) {
    throw new Error(`Failed to parse JSON response: ${error}`);
  }
}

/**
 * Stream content generation for real-time updates
 */
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

  if (systemPrompt) {
    messages.push({
      role: 'system',
      content: systemPrompt,
    });
  }

  messages.push({
    role: 'user',
    content: userPrompt,
  });

  const stream = await openai.chat.completions.create({
    model,
    messages,
    temperature,
    max_tokens: maxTokens,
    stream: true,
  });

  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content;
    if (content) {
      yield content;
    }
  }
}

/**
 * Retry wrapper for AI generation with exponential backoff
 */
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
      
      // Don't retry on client errors (4xx)
      if (error instanceof OpenAI.APIError && error.status && error.status < 500) {
        throw error;
      }

      // Exponential backoff: 1s, 2s, 4s
      const delay = Math.pow(2, attempt) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError || new Error('Max retries exceeded');
}

/**
 * Estimate token count (rough approximation)
 * 1 token ≈ 4 characters for English text
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Check if content might exceed token limit
 */
export function mightExceedLimit(text: string, limit: number = 4000): boolean {
  return estimateTokens(text) > limit;
}
