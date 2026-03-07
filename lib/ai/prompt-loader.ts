/**
 * Prompt Loader — fetches system prompts from DB with fallback to hardcoded defaults.
 * 
 * Admin panel edits flow: Admin edits system_prompts table → agents pick up changes on next call.
 * Cached per request (Map) — no DB round-trips for same key within one scan.
 */

import { createClient } from '@/lib/supabase/server';

// In-memory request cache (cleared per serverless invocation)
const promptCache = new Map<string, string>();

export interface PromptConfig {
  system_prompt: string;
  temperature?: number;
  max_tokens?: number;
  model?: string;
}

/**
 * Load a system prompt by key.
 * Returns DB value if found and active, otherwise returns fallback.
 */
export async function loadPrompt(key: string, fallback: string): Promise<string> {
  if (promptCache.has(key)) return promptCache.get(key)!;

  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from('system_prompts')
      .select('system_prompt, is_active')
      .eq('key', key)
      .single();

    if (data?.is_active && data.system_prompt) {
      promptCache.set(key, data.system_prompt);
      return data.system_prompt;
    }
  } catch {
    // Silently fall back — DB error should not break scans
  }

  promptCache.set(key, fallback);
  return fallback;
}

/**
 * Load full prompt config (prompt + model settings) by key.
 */
export async function loadPromptConfig(key: string, fallback: PromptConfig): Promise<PromptConfig> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from('system_prompts')
      .select('system_prompt, temperature, max_tokens, model, is_active')
      .eq('key', key)
      .single();

    if (data?.is_active && data.system_prompt) {
      return {
        system_prompt: data.system_prompt,
        temperature: data.temperature ?? fallback.temperature,
        max_tokens: data.max_tokens ?? fallback.max_tokens,
        model: data.model ?? fallback.model,
      };
    }
  } catch {
    // Fall back silently
  }

  return fallback;
}

/**
 * Preload multiple prompts in one DB query (efficient for agents running multiple sub-calls).
 */
export async function preloadPrompts(keys: string[]): Promise<Map<string, string>> {
  const result = new Map<string, string>();

  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from('system_prompts')
      .select('key, system_prompt, is_active')
      .in('key', keys);

    if (data) {
      for (const row of data) {
        if (row.is_active && row.system_prompt) {
          result.set(row.key, row.system_prompt);
          promptCache.set(row.key, row.system_prompt);
        }
      }
    }
  } catch {
    // Fall back — callers use hardcoded defaults
  }

  return result;
}
