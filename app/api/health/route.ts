import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Health Check API Endpoint
 * 
 * Returns the current health status of the application and its dependencies.
 * Used for monitoring, load balancers, and uptime checks.
 * 
 * @example
 * ```
 * GET /api/health
 * 
 * Response:
 * {
 *   "status": "healthy",
 *   "timestamp": "2026-03-01T12:00:00.000Z",
 *   "version": "0.1.0",
 *   "environment": "production",
 *   "checks": {
 *     "database": true,
 *     "supabase": true
 *   },
 *   "uptime": 86400
 * }
 * ```
 */

// Track application start time for uptime calculation
const startTime = Date.now();

interface HealthCheck {
  name: string;
  status: 'healthy' | 'unhealthy' | 'unknown';
  responseTime?: number;
  error?: string;
}

async function checkDatabase(): Promise<HealthCheck> {
  const start = Date.now();
  
  try {
    const supabase = await createClient();
    const { error } = await supabase.from('health_check').select('*').limit(1);
    
    if (error) {
      return {
        name: 'database',
        status: 'unhealthy',
        responseTime: Date.now() - start,
        error: error.message,
      };
    }
    
    return {
      name: 'database',
      status: 'healthy',
      responseTime: Date.now() - start,
    };
  } catch (error) {
    return {
      name: 'database',
      status: 'unhealthy',
      responseTime: Date.now() - start,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function checkSupabase(): Promise<HealthCheck> {
  const start = Date.now();
  
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.getSession();
    
    if (error) {
      return {
        name: 'supabase',
        status: 'unhealthy',
        responseTime: Date.now() - start,
        error: error.message,
      };
    }
    
    return {
      name: 'supabase',
      status: 'healthy',
      responseTime: Date.now() - start,
    };
  } catch (error) {
    return {
      name: 'supabase',
      status: 'unhealthy',
      responseTime: Date.now() - start,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function GET() {
  const checks = await Promise.all([
    checkDatabase(),
    checkSupabase(),
  ]);
  
  const checkResults = checks.reduce((acc, check) => {
    acc[check.name] = check.status === 'healthy';
    return acc;
  }, {} as Record<string, boolean>);
  
  const isHealthy = checks.every((check) => check.status === 'healthy');
  const uptime = Math.floor((Date.now() - startTime) / 1000);
  
  const response = {
    status: isHealthy ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || 'unknown',
    environment: process.env.NODE_ENV || 'unknown',
    uptime,
    checks: checkResults,
    details: checks,
  };
  
  return NextResponse.json(response, {
    status: isHealthy ? 200 : 503,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    },
  });
}

/**
 * HEAD request for simple health checks
 * 
 * Returns only the status code without body.
 * Useful for load balancers that just need a quick check.
 */
export async function HEAD() {
  const checks = await Promise.all([
    checkDatabase(),
    checkSupabase(),
  ]);
  
  const isHealthy = checks.every((check) => check.status === 'healthy');
  
  return new Response(null, {
    status: isHealthy ? 200 : 503,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
}
