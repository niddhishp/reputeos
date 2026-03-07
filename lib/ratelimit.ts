/**
 * Rate Limiting Configuration
 *
 * Redis and all Ratelimit instances are lazily created — NOT at module level —
 * so Next.js build-time page collection doesn't crash when UPSTASH env vars
 * are absent. Each getter throws a clear error if called without env vars.
 *
 * Usage in API routes:
 *   import { getContentRateLimiter, getClientIP, createRateLimitResponse } from '@/lib/ratelimit'
 *   const result = await getContentRateLimiter().limit(identifier)
 */

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// ─── Lazy Redis singleton ─────────────────────────────────────────────────────
let _redis: Redis | null = null;

function getRedis(): Redis {
  if (!_redis) {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (!url || !token) {
      throw new Error(
        'Upstash Redis is not configured. Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in your environment variables. ' +
        'Get free credentials at https://upstash.com'
      );
    }

    _redis = new Redis({ url, token });
  }
  return _redis;
}

// ─── Lazy Ratelimit singletons ────────────────────────────────────────────────
let _standardRateLimiter: Ratelimit | null = null;
let _strictRateLimiter: Ratelimit | null = null;
let _aiRateLimiter: Ratelimit | null = null;
let _discoveryRateLimiter: Ratelimit | null = null;
let _lsiRateLimiter: Ratelimit | null = null;
let _contentRateLimiter: Ratelimit | null = null;

export function getStandardRateLimiter(): Ratelimit {
  if (!_standardRateLimiter) {
    _standardRateLimiter = new Ratelimit({
      redis: getRedis(),
      limiter: Ratelimit.slidingWindow(100, '1 m'),
      analytics: true,
      prefix: 'ratelimit:standard',
    });
  }
  return _standardRateLimiter;
}

export function getStrictRateLimiter(): Ratelimit {
  if (!_strictRateLimiter) {
    _strictRateLimiter = new Ratelimit({
      redis: getRedis(),
      limiter: Ratelimit.slidingWindow(20, '1 m'),
      analytics: true,
      prefix: 'ratelimit:strict',
    });
  }
  return _strictRateLimiter;
}

export function getAiRateLimiter(): Ratelimit {
  if (!_aiRateLimiter) {
    _aiRateLimiter = new Ratelimit({
      redis: getRedis(),
      limiter: Ratelimit.slidingWindow(10, '1 m'),
      analytics: true,
      prefix: 'ratelimit:ai',
    });
  }
  return _aiRateLimiter;
}

export function getDiscoveryRateLimiter(): Ratelimit {
  if (!_discoveryRateLimiter) {
    _discoveryRateLimiter = new Ratelimit({
      redis: getRedis(),
      limiter: Ratelimit.slidingWindow(5, '1 h'),
      analytics: true,
      prefix: 'ratelimit:discovery',
    });
  }
  return _discoveryRateLimiter;
}

export function getLsiRateLimiter(): Ratelimit {
  if (!_lsiRateLimiter) {
    _lsiRateLimiter = new Ratelimit({
      redis: getRedis(),
      limiter: Ratelimit.slidingWindow(20, '1 h'),
      analytics: true,
      prefix: 'ratelimit:lsi',
    });
  }
  return _lsiRateLimiter;
}

export function getContentRateLimiter(): Ratelimit {
  if (!_contentRateLimiter) {
    _contentRateLimiter = new Ratelimit({
      redis: getRedis(),
      limiter: Ratelimit.slidingWindow(30, '1 h'),
      analytics: true,
      prefix: 'ratelimit:content',
    });
  }
  return _contentRateLimiter;
}

// ─── Graceful fallback helper ─────────────────────────────────────────────────
// If Upstash Redis is not configured, return a pass-through limiter so the app
// doesn't crash. Logs a warning on first miss.
let _warnedAboutMissingRedis = false;
function safeLimiter(getter: () => Ratelimit): Ratelimit {
  return new Proxy({} as Ratelimit, {
    get: (_, p) => {
      try {
        return getter()[p as keyof Ratelimit];
      } catch (e) {
        if (!_warnedAboutMissingRedis) {
          console.warn('[ratelimit] Redis not configured — rate limiting disabled. Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN.');
          _warnedAboutMissingRedis = true;
        }
        // Return a pass-through for the `limit` method; undefined for everything else
        if (p === 'limit') return async (_identifier: string) => ({ success: true, limit: 999, remaining: 999, reset: 0 });
        return undefined;
      }
    }
  });
}

// ─── Backwards-compatible named exports (for routes that import the old names) ─
/** @deprecated Use getStandardRateLimiter() */
export const standardRateLimiter = safeLimiter(getStandardRateLimiter);
/** @deprecated Use getStrictRateLimiter() */
export const strictRateLimiter = safeLimiter(getStrictRateLimiter);
/** @deprecated Use getAiRateLimiter() */
export const aiRateLimiter = safeLimiter(getAiRateLimiter);
/** @deprecated Use getDiscoveryRateLimiter() */
export const discoveryRateLimiter = safeLimiter(getDiscoveryRateLimiter);
/** @deprecated Use getLsiRateLimiter() */
export const lsiRateLimiter = safeLimiter(getLsiRateLimiter);
/** @deprecated Use getContentRateLimiter() */
export const contentRateLimiter = safeLimiter(getContentRateLimiter);

// ─── Helpers ──────────────────────────────────────────────────────────────────
export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

export async function checkRateLimit(
  limiter: Ratelimit,
  identifier: string
): Promise<RateLimitResult> {
  const result = await limiter.limit(identifier);
  return {
    success: result.success,
    limit: result.limit,
    remaining: result.remaining,
    reset: result.reset,
  };
}

export function getClientIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  const realIP = request.headers.get('x-real-ip');
  if (realIP) return realIP;
  return '127.0.0.1';
}

export function createRateLimitResponse(result: RateLimitResult): Response {
  return new Response(
    JSON.stringify({
      error: 'Rate limit exceeded',
      message: 'Too many requests. Please try again later.',
      limit: result.limit,
      remaining: result.remaining,
      resetAt: new Date(result.reset * 1000).toISOString(),
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'X-RateLimit-Limit': String(result.limit),
        'X-RateLimit-Remaining': String(result.remaining),
        'X-RateLimit-Reset': String(result.reset),
      },
    }
  );
}
