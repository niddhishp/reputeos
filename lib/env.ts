/**
 * Environment Variable Validation
 * Compatible with Zod v4
 */

import { z } from 'zod';

const serverEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),

  OPENAI_API_KEY: z.string().min(1),
  ANTHROPIC_API_KEY: z.string().min(1).optional(),

  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1).optional(),

  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  SENTRY_DSN: z.string().optional(),
  SENTRY_AUTH_TOKEN: z.string().optional(),

  SERPAPI_KEY: z.string().optional(),
  NEWSAPI_KEY: z.string().optional(),
});

const clientEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
  NEXT_PUBLIC_AI_ENABLED: z.string().default('true'),
  NEXT_PUBLIC_DEBUG_MODE: z.string().default('false'),
});

function validateServerEnv() {
  const parsed = serverEnvSchema.safeParse(process.env);

  if (!parsed.success) {
    // Zod v4 uses .issues, v3 uses .errors — support both
    const issues = parsed.error.issues ?? (parsed.error as any).errors ?? [];
    const errors = issues.map(
      (err: { path: (string | number)[]; message: string }) =>
        `  - ${err.path.join('.')}: ${err.message}`
    );
    console.error('❌ Invalid server environment variables:\n' + errors.join('\n'));
    throw new Error('Invalid server environment variables');
  }

  return parsed.data;
}

function validateClientEnv() {
  if (typeof window === 'undefined') {
    return clientEnvSchema.parse({});
  }

  const parsed = clientEnvSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_AI_ENABLED: process.env.NEXT_PUBLIC_AI_ENABLED,
    NEXT_PUBLIC_DEBUG_MODE: process.env.NEXT_PUBLIC_DEBUG_MODE,
  });

  if (!parsed.success) {
    const issues = parsed.error.issues ?? (parsed.error as any).errors ?? [];
    const errors = issues.map(
      (err: { path: (string | number)[]; message: string }) =>
        `  - ${err.path.join('.')}: ${err.message}`
    );
    console.error('❌ Invalid client environment variables:\n' + errors.join('\n'));
    throw new Error('Invalid client environment variables');
  }

  return parsed.data;
}

export const env =
  typeof window === 'undefined' ? validateServerEnv() : validateClientEnv();

export const isDevelopment = process.env.NODE_ENV === 'development';
export const isProduction = process.env.NODE_ENV === 'production';

export const isAIEnabled = () => {
  if (typeof window === 'undefined') return true;
  return process.env.NEXT_PUBLIC_AI_ENABLED !== 'false';
};

export const isDebugMode = () => {
  if (typeof window === 'undefined') return isDevelopment;
  return process.env.NEXT_PUBLIC_DEBUG_MODE === 'true';
};
