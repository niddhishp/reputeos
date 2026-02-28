/**
 * Rate Limiting Configuration
 * 
 * This module provides rate limiting for API routes using Upstash Redis.
 * It includes different limiters for different types of operations.
 */

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { env } from '@/lib/env';

// Initialize Redis client
const redis = Redis.fromEnv();

/**
 * Standard API rate limiter: 100 requests per minute per IP
 * Use for general API endpoints
 */
export const standardRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, '1 m'),
  analytics: true,
  prefix: 'ratelimit:standard',
});

/**
 * Strict API rate limiter: 20 requests per minute per IP
 * Use for sensitive operations
 */
export const strictRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(20, '1 m'),
  analytics: true,
  prefix: 'ratelimit:strict',
});

/**
 * AI rate limiter: 10 requests per minute per user
 * Use for AI-powered endpoints (OpenAI, Anthropic calls)
 */
export const aiRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '1 m'),
  analytics: true,
  prefix: 'ratelimit:ai',
});

/**
 * Discovery scan rate limiter: 5 scans per hour per client
 * Use for the DISCOVER module scan endpoint
 */
export const discoveryRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '1 h'),
  analytics: true,
  prefix: 'ratelimit:discovery',
});

/**
 * LSI calculation rate limiter: 20 calculations per hour per client
 * Use for the DIAGNOSE module LSI calculation endpoint
 */
export const lsiRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(20, '1 h'),
  analytics: true,
  prefix: 'ratelimit:lsi',
});

/**
 * Content generation rate limiter: 30 generations per hour per client
 * Use for the EXPRESS module content generation endpoint
 */
export const contentRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(30, '1 h'),
  analytics: true,
  prefix: 'ratelimit:content',
});

// Rate limit result type
export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

/**
 * Check rate limit for a given identifier
 */
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

/**
 * Get the client IP from a request
 */
export function getClientIP(request: Request): string {
  // Try to get the forwarded IP first (for proxies/load balancers)
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  // Fall back to the direct connection IP
  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }

  // Default to localhost if no IP is found
  return '127.0.0.1';
}

/**
 * Create a rate limit response
 */
export function createRateLimitResponse(
  result: RateLimitResult
): Response {
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

/**
 * Higher-order function to wrap API routes with rate limiting
 */
export function withRateLimit(
  handler: (request: Request) => Promise<Response>,
  limiter: Ratelimit,
  getIdentifier?: (request: Request) => string
) {
  return async (request: Request): Promise<Response> => {
    const identifier = getIdentifier 
      ? getIdentifier(request) 
      : getClientIP(request);

    const result = await checkRateLimit(limiter, identifier);

    if (!result.success) {
      return createRateLimitResponse(result);
    }

    // Add rate limit headers to the response
    const response = await handler(request);
    const newHeaders = new Headers(response.headers);
    newHeaders.set('X-RateLimit-Limit', String(result.limit));
    newHeaders.set('X-RateLimit-Remaining', String(result.remaining));
    newHeaders.set('X-RateLimit-Reset', String(result.reset));

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders,
    });
  };
}
