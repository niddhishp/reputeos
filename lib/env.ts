/**
 * Environment Variable Validation
 * 
 * This module validates all required environment variables at runtime.
 * If any required variable is missing or invalid, the application will
 * fail fast with a clear error message.
 */

import { z } from 'zod';

// Schema for server-side environment variables
const serverEnvSchema = z.object({
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),

  // AI Providers
  OPENAI_API_KEY: z.string().min(1).startsWith('sk-'),
  ANTHROPIC_API_KEY: z.string().min(1).startsWith('sk-ant-').optional(),

  // Rate Limiting
  UPSTASH_REDIS_REST_URL: z.string().url(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1),

  // App Configuration
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Monitoring (optional)
  SENTRY_DSN: z.string().url().optional(),
  SENTRY_AUTH_TOKEN: z.string().optional(),

  // External APIs (optional)
  SERPAPI_KEY: z.string().optional(),
  NEWSAPI_KEY: z.string().optional(),
});

// Schema for client-side environment variables
const clientEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
  NEXT_PUBLIC_AI_ENABLED: z.string().default('true'),
  NEXT_PUBLIC_DEBUG_MODE: z.string().default('false'),
});

// Validate server-side environment variables
function validateServerEnv() {
  const parsed = serverEnvSchema.safeParse(process.env);

  if (!parsed.success) {
    const errors = parsed.error.errors.map(
      (err) => `  - ${err.path.join('.')}: ${err.message}`
    );

    console.error('❌ Invalid server environment variables:');
    console.error(errors.join('\n'));
    console.error('\nPlease check your .env.local file and ensure all required variables are set.');

    throw new Error('Invalid server environment variables');
  }

  return parsed.data;
}

// Validate client-side environment variables
function validateClientEnv() {
  // Only validate on client side
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
    const errors = parsed.error.errors.map(
      (err) => `  - ${err.path.join('.')}: ${err.message}`
    );

    console.error('❌ Invalid client environment variables:');
    console.error(errors.join('\n'));

    throw new Error('Invalid client environment variables');
  }

  return parsed.data;
}

// Export validated environment variables
export const env = typeof window === 'undefined' 
  ? validateServerEnv() 
  : validateClientEnv();

// Type-safe access to environment variables
export const getEnv = (key: keyof typeof env): string | undefined => {
  return env[key];
};

// Check if we're in development mode
export const isDevelopment = env.NODE_ENV === 'development';

// Check if we're in production mode
export const isProduction = env.NODE_ENV === 'production';

// Check if AI features are enabled
export const isAIEnabled = () => {
  if (typeof window === 'undefined') {
    return true; // Server-side always enabled
  }
  return process.env.NEXT_PUBLIC_AI_ENABLED === 'true';
};

// Check if debug mode is enabled
export const isDebugMode = () => {
  if (typeof window === 'undefined') {
    return env.NODE_ENV === 'development';
  }
  return process.env.NEXT_PUBLIC_DEBUG_MODE === 'true';
};
