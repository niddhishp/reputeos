/**
 * Environment Variable Validation
 * Validates all API keys used by ReputeOS at startup.
 */

import { z } from 'zod';

const serverEnvSchema = z.object({
  // Supabase (required)
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),

  // AI Providers (at least one required — validated at runtime via call.ts)
  OPENROUTER_API_KEY: z.string().min(1).optional(),
  ANTHROPIC_API_KEY: z.string().min(1).optional(),
  OPENAI_API_KEY: z.string().min(1).optional(),

  // Search / Scraping
  SERPAPI_KEY: z.string().min(1).optional(),
  SERPAPI_API_KEY: z.string().min(1).optional(), // alias — routes use both spellings
  EXA_API_KEY: z.string().min(1).optional(),
  FIRECRAWL_API_KEY: z.string().min(1).optional(),
  APIFY_API_TOKEN: z.string().min(1).optional(),
  APIFY_TOKEN: z.string().min(1).optional(),

  // News APIs
  NEWSAPI_KEY: z.string().min(1).optional(),
  GUARDIAN_API_KEY: z.string().min(1).optional(),
  NYT_API_KEY: z.string().min(1).optional(),
  X_BEARER_TOKEN: z.string().min(1).optional(),

  // App Config
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Security
  CRON_SECRET: z.string().min(32).optional(), // required in prod — enforced at runtime
  ADMIN_EMAIL: z.string().email().optional(),

  // Observability
  SENTRY_DSN: z.string().optional(),
  SENTRY_AUTH_TOKEN: z.string().optional(),
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
    const issues = parsed.error.issues ?? (parsed.error as { errors?: unknown[] }).errors ?? [];
    const errors = (issues as { path: (string | number)[]; message: string }[]).map(
      (err) => `  - ${err.path.join('.')}: ${err.message}`
    );
    console.error('❌ Invalid server environment variables:\n' + errors.join('\n'));
    // Don't hard-throw — optional keys missing shouldn't crash the app
  }

  // Warn in production about CRON_SECRET being missing
  if (process.env.NODE_ENV === 'production' && !process.env.CRON_SECRET) {
    console.warn('⚠️  CRON_SECRET is not set. Cron endpoints will reject all requests.');
  }

  return parsed.data ?? (process.env as ReturnType<typeof serverEnvSchema.parse>);
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
    const issues = parsed.error.issues ?? (parsed.error as { errors?: unknown[] }).errors ?? [];
    const errors = (issues as { path: (string | number)[]; message: string }[]).map(
      (err) => `  - ${err.path.join('.')}: ${err.message}`
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
