/**
 * LSI Calculation API Route
 * 
 * POST /api/lsi/calculate
 * 
 * Calculates LSI (Legitimacy & Sentiment Index) score for a client.
 * Includes rate limiting, input validation, and authorization checks.
 */

import { z } from 'zod';
import { createClient, verifyClientOwnership } from '@/lib/supabase/server';
import { lsiRateLimiter, getClientIP, createRateLimitResponse } from '@/lib/ratelimit';
import {
  calculateLSI,
  calculateStats,
  calculateGaps,
  LSICalculationInput,
  LSIComponents,
} from '@/lib/lsi/calculator';

// Input validation schema for component inputs
const ComponentInputSchema = z.object({
  // C1: Search Reputation
  c1: z.object({
    positiveResults: z.number().min(0),
    totalResults: z.number().min(0),
    knowledgePanelPresent: z.boolean(),
    wikipediaPresent: z.boolean(),
    negativeContentRatio: z.number().min(0).max(1),
  }),

  // C2: Media Framing
  c2: z.object({
    positiveMentions: z.number().min(0),
    totalMentions: z.number().min(0),
    tier1Mentions: z.number().min(0),
    expertQuotes: z.number().min(0),
    narrativeConsistency: z.number().min(0).max(1),
  }),

  // C3: Social Backlash
  c3: z.object({
    positiveSentiment: z.number().min(0),
    neutralSentiment: z.number().min(0),
    negativeSentiment: z.number().min(0),
    mentionVolume: z.number().min(0),
    engagementRate: z.number().min(0),
    crisisResponseTime: z.number().optional(),
  }),

  // C4: Elite Discourse
  c4: z.object({
    peerMentions: z.number().min(0),
    leaderEndorsements: z.number().min(0),
    speakingInvitations: z.number().min(0),
    citations: z.number().min(0),
  }),

  // C5: Third-Party Validation
  c5: z.object({
    awards: z.number().min(0),
    analystMentions: z.number().min(0),
    rankingLists: z.number().min(0),
    certifications: z.number().min(0),
  }),

  // C6: Crisis Moat
  c6: z.object({
    crisesHandled: z.number().min(0),
    crisesRecovered: z.number().min(0),
    proactiveNarratives: z.number().min(0),
    trustIndex: z.number().min(0).max(1),
    recoverySpeed: z.number().min(0),
  }),
});

const CalculateLSISchema = z.object({
  clientId: z.string().uuid('Invalid client ID format'),
  inputs: ComponentInputSchema,
  targetScores: z.custom<LSIComponents>().optional(),
  notes: z.string().max(1000).optional(),
});

export interface CalculateLSIResponse {
  success: boolean;
  lsiRun: {
    id: string;
    totalScore: number;
    percentage: number;
    classification: {
      label: string;
      description: string;
      color: string;
    };
    components: LSIComponents;
    stats: {
      mean: number;
      stddev: number;
      ucl: number;
      lcl: number;
    };
    gaps: Array<{
      component: string;
      gap: number;
      priority: number;
    }>;
  };
}

/**
 * POST handler for LSI calculation
 */
export async function POST(request: Request): Promise<Response> {
  try {
    // ==========================================================================
    // 1. Rate Limiting Check
    // ==========================================================================
    const clientIP = getClientIP(request);
    const rateLimitResult = await lsiRateLimiter.limit(clientIP);

    if (!rateLimitResult.success) {
      return createRateLimitResponse({
        success: false,
        limit: rateLimitResult.limit,
        remaining: rateLimitResult.remaining,
        reset: rateLimitResult.reset,
      });
    }

    // ==========================================================================
    // 2. Authentication Check
    // ==========================================================================
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return Response.json(
        { error: 'Unauthorized', message: 'You must be logged in to calculate LSI' },
        { status: 401 }
      );
    }

    // ==========================================================================
    // 3. Input Validation
    // ==========================================================================
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return Response.json(
        { error: 'Invalid JSON', message: 'Request body must be valid JSON' },
        { status: 400 }
      );
    }

    const parsed = CalculateLSISchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        {
          error: 'Invalid input',
          message: 'Request body failed validation',
          details: parsed.error.errors,
        },
        { status: 400 }
      );
    }

    const { clientId, inputs, targetScores, notes } = parsed.data;

    // ==========================================================================
    // 4. Authorization Check
    // ==========================================================================
    const isOwner = await verifyClientOwnership(clientId);

    if (!isOwner) {
      return Response.json(
        { error: 'Forbidden', message: 'You do not have access to this client' },
        { status: 403 }
      );
    }

    // ==========================================================================
    // 5. Calculate LSI Score
    // ==========================================================================
    const lsiResult = calculateLSI(inputs as LSICalculationInput);

    // ==========================================================================
    // 6. Fetch Historical Data for Statistics
    // ==========================================================================
    const { data: historicalRuns } = await supabase
      .from('lsi_runs')
      .select('total_score')
      .eq('client_id', clientId)
      .order('run_date', { ascending: false })
      .limit(12);

    const historicalScores = historicalRuns?.map((run) => run.total_score) || [];
    historicalScores.unshift(lsiResult.totalScore); // Include current score

    const stats = calculateStats(historicalScores);

    // ==========================================================================
    // 7. Calculate Gaps
    // ==========================================================================
    const defaultTargets: LSIComponents = {
      c1: 16, // 80% of max
      c2: 16,
      c3: 16,
      c4: 12,
      c5: 12,
      c6: 8,
    };

    const gaps = calculateGaps(lsiResult.components, targetScores || defaultTargets);

    // ==========================================================================
    // 8. Save LSI Run to Database
    // ==========================================================================
    const { data: lsiRun, error: saveError } = await supabase
      .from('lsi_runs')
      .insert({
        client_id: clientId,
        total_score: lsiResult.totalScore,
        components: lsiResult.components,
        stats,
        gaps,
        notes: notes || null,
      })
      .select()
      .single();

    if (saveError) {
      console.error('Failed to save LSI run:', saveError);
      return Response.json(
        { error: 'Database error', message: 'Failed to save LSI calculation' },
        { status: 500 }
      );
    }

    // ==========================================================================
    // 9. Return Success Response
    // ==========================================================================
    const response: CalculateLSIResponse = {
      success: true,
      lsiRun: {
        id: lsiRun.id,
        totalScore: lsiResult.totalScore,
        percentage: lsiResult.percentage,
        classification: lsiResult.classification,
        components: lsiResult.components,
        stats,
        gaps,
      },
    };

    return Response.json(response, {
      status: 200,
      headers: {
        'X-RateLimit-Limit': String(rateLimitResult.limit),
        'X-RateLimit-Remaining': String(rateLimitResult.remaining),
        'X-RateLimit-Reset': String(rateLimitResult.reset),
      },
    });

  } catch (error) {
    console.error('LSI calculation error:', error);

    return Response.json(
      { error: 'Internal server error', message: 'Failed to calculate LSI. Please try again later.' },
      { status: 500 }
    );
  }
}

/**
 * GET handler - Get LSI history for a client
 */
export async function GET(request: Request): Promise<Response> {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');

    if (!clientId) {
      return Response.json(
        { error: 'Bad request', message: 'clientId query parameter is required' },
        { status: 400 }
      );
    }

    // Validate UUID format
    const uuidSchema = z.string().uuid();
    const parsed = uuidSchema.safeParse(clientId);

    if (!parsed.success) {
      return Response.json(
        { error: 'Invalid input', message: 'Invalid clientId format' },
        { status: 400 }
      );
    }

    // Check authentication
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return Response.json(
        { error: 'Unauthorized', message: 'You must be logged in' },
        { status: 401 }
      );
    }

    // Check authorization
    const isOwner = await verifyClientOwnership(clientId);

    if (!isOwner) {
      return Response.json(
        { error: 'Forbidden', message: 'You do not have access to this client' },
        { status: 403 }
      );
    }

    // Fetch LSI history
    const { data: lsiRuns, error } = await supabase
      .from('lsi_runs')
      .select('*')
      .eq('client_id', clientId)
      .order('run_date', { ascending: false })
      .limit(24);

    if (error) {
      console.error('Failed to fetch LSI runs:', error);
      return Response.json(
        { error: 'Database error', message: 'Failed to fetch LSI history' },
        { status: 500 }
      );
    }

    return Response.json({
      success: true,
      runs: lsiRuns,
    });

  } catch (error) {
    console.error('Get LSI history error:', error);
    return Response.json(
      { error: 'Internal server error', message: 'Failed to fetch LSI history' },
      { status: 500 }
    );
  }
}
