/**
 * Discover Scan API Route
 * 
 * POST /api/discover/scan
 * 
 * Initiates a reputation discovery scan for a client.
 * This scans various sources for mentions and analyzes sentiment.
 */

import { z } from 'zod';
import { createClient, verifyClientOwnership, createAdminClient } from '@/lib/supabase/server';
import { discoveryRateLimiter, getClientIP, createRateLimitResponse } from '@/lib/ratelimit';
import { generateWithRetry } from '@/lib/ai/client';
import { buildMentionsAnalysisPrompt } from '@/lib/ai/prompts';

// Input validation schema
const DiscoverScanSchema = z.object({
  clientId: z.string().uuid('Invalid client ID format'),
  sources: z.array(
    z.enum(['google', 'news', 'twitter', 'linkedin', 'reddit', 'youtube'])
  ).default(['google', 'news', 'twitter']),
  dateRange: z.enum(['7d', '30d', '90d', '1y']).default('30d'),
  keywords: z.array(z.string().max(100)).max(10).optional(),
});

export interface DiscoverScanResponse {
  success: boolean;
  runId: string;
  status: string;
  message: string;
}

// Date range to days mapping
const DATE_RANGE_DAYS: Record<string, number> = {
  '7d': 7,
  '30d': 30,
  '90d': 90,
  '1y': 365,
};

/**
 * POST handler to initiate a discover scan
 */
export async function POST(request: Request): Promise<Response> {
  try {
    // ==========================================================================
    // 1. Rate Limiting Check
    // ==========================================================================
    const clientIP = getClientIP(request);
    const rateLimitResult = await discoveryRateLimiter.limit(clientIP);

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
        { error: 'Unauthorized', message: 'You must be logged in to run a discovery scan' },
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

    const parsed = DiscoverScanSchema.safeParse(body);

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

    const { clientId, sources, dateRange, keywords } = parsed.data;

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
    // 5. Fetch Client Details
    // ==========================================================================
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('name, company, industry')
      .eq('id', clientId)
      .single();

    if (clientError || !client) {
      return Response.json(
        { error: 'Not found', message: 'Client not found' },
        { status: 404 }
      );
    }

    // ==========================================================================
    // 6. Create Discover Run Record
    // ==========================================================================
    const { data: discoverRun, error: runError } = await supabase
      .from('discover_runs')
      .insert({
        client_id: clientId,
        status: 'running',
        progress: 0,
        sources_searched: sources,
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (runError) {
      console.error('Failed to create discover run:', runError);
      return Response.json(
        { error: 'Database error', message: 'Failed to initiate scan' },
        { status: 500 }
      );
    }

    // ==========================================================================
    // 7. Trigger Background Scan (Async)
    // ==========================================================================
    // In production, this should be handled by a background job queue (e.g., Inngest, Bull)
    // For now, we'll trigger it asynchronously and return immediately
    runBackgroundScan(discoverRun.id, clientId, client.name, sources, dateRange, keywords);

    // ==========================================================================
    // 8. Return Success Response
    // ==========================================================================
    const response: DiscoverScanResponse = {
      success: true,
      runId: discoverRun.id,
      status: 'running',
      message: 'Discovery scan initiated successfully',
    };

    return Response.json(response, {
      status: 202, // Accepted
      headers: {
        'X-RateLimit-Limit': String(rateLimitResult.limit),
        'X-RateLimit-Remaining': String(rateLimitResult.remaining),
        'X-RateLimit-Reset': String(rateLimitResult.reset),
      },
    });

  } catch (error) {
    console.error('Discover scan error:', error);

    return Response.json(
      { error: 'Internal server error', message: 'Failed to initiate scan. Please try again later.' },
      { status: 500 }
    );
  }
}

/**
 * GET handler - Get scan status and results
 */
export async function GET(request: Request): Promise<Response> {
  try {
    const { searchParams } = new URL(request.url);
    const runId = searchParams.get('runId');
    const clientId = searchParams.get('clientId');

    if (!runId && !clientId) {
      return Response.json(
        { error: 'Bad request', message: 'Either runId or clientId query parameter is required' },
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

    // Fetch scan data
    let query = supabase.from('discover_runs').select('*');

    if (runId) {
      query = query.eq('id', runId);
    } else if (clientId) {
      // Check authorization
      const isOwner = await verifyClientOwnership(clientId);
      if (!isOwner) {
        return Response.json(
          { error: 'Forbidden', message: 'You do not have access to this client' },
          { status: 403 }
        );
      }
      query = query.eq('client_id', clientId).order('created_at', { ascending: false }).limit(1);
    }

    const { data: discoverRun, error } = await query.single();

    if (error || !discoverRun) {
      return Response.json(
        { error: 'Not found', message: 'Scan not found' },
        { status: 404 }
      );
    }

    // Fetch mentions if scan is complete
    let mentions = null;
    if (discoverRun.status === 'completed') {
      const { data: mentionsData } = await supabase
        .from('mentions')
        .select('*')
        .eq('discover_run_id', discoverRun.id)
        .order('mention_date', { ascending: false })
        .limit(100);

      mentions = mentionsData;
    }

    return Response.json({
      success: true,
      scan: discoverRun,
      mentions,
    });

  } catch (error) {
    console.error('Get scan status error:', error);
    return Response.json(
      { error: 'Internal server error', message: 'Failed to fetch scan status' },
      { status: 500 }
    );
  }
}

/**
 * Background scan function
 * This simulates a scan process. In production, use a proper job queue.
 */
async function runBackgroundScan(
  runId: string,
  clientId: string,
  clientName: string,
  sources: string[],
  dateRange: string,
  keywords?: string[]
): Promise<void> {
  const adminSupabase = createAdminClient();

  try {
    // Simulate scanning different sources
    const totalSources = sources.length;
    const mentions: Array<{
      source: string;
      snippet: string;
      sentiment: number;
      frame: string;
    }> = [];

    for (let i = 0; i < sources.length; i++) {
      const source = sources[i];
      const progress = Math.round(((i + 1) / totalSources) * 100);

      // Update progress
      await adminSupabase
        .from('discover_runs')
        .update({ progress })
        .eq('id', runId);

      // Simulate fetching mentions from this source
      // In production, this would call actual APIs (SerpAPI, NewsAPI, etc.)
      const sourceMentions = await simulateSourceScan(source, clientName, keywords);
      mentions.push(...sourceMentions);

      // Small delay to simulate processing time
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    // Analyze mentions with AI
    const analysis = await analyzeMentions(clientName, mentions);

    // Save mentions to database
    const mentionsToInsert = mentions.map((m) => ({
      discover_run_id: runId,
      client_id: clientId,
      source: m.source,
      source_type: classifySourceType(m.source),
      snippet: m.snippet,
      sentiment: m.sentiment,
      sentiment_label: sentimentToLabel(m.sentiment),
      frame: m.frame,
      mention_date: new Date().toISOString(),
    }));

    await adminSupabase.from('mentions').insert(mentionsToInsert);

    // Update discover run with results
    await adminSupabase
      .from('discover_runs')
      .update({
        status: 'completed',
        progress: 100,
        total_mentions: mentions.length,
        sentiment_summary: analysis.sentimentSummary,
        frame_distribution: analysis.frameDistribution,
        completed_at: new Date().toISOString(),
      })
      .eq('id', runId);

    // Create alerts for negative mentions
    const negativeMentions = mentions.filter((m) => m.sentiment < -0.3);
    if (negativeMentions.length > 0) {
      await adminSupabase.from('alerts').insert({
        client_id: clientId,
        type: 'negative_mention',
        severity: negativeMentions.length > 5 ? 'high' : 'medium',
        title: `${negativeMentions.length} negative mentions detected`,
        description: `Found ${negativeMentions.length} negative mentions during discovery scan`,
      });
    }

  } catch (error) {
    console.error('Background scan error:', error);

    // Update run with error status
    await adminSupabase
      .from('discover_runs')
      .update({
        status: 'failed',
        error_message: error instanceof Error ? error.message : 'Unknown error',
        completed_at: new Date().toISOString(),
      })
      .eq('id', runId);
  }
}

/**
 * Simulate scanning a source (placeholder for actual API calls)
 */
async function simulateSourceScan(
  source: string,
  clientName: string,
  keywords?: string[]
): Promise<Array<{ source: string; snippet: string; sentiment: number; frame: string }>> {
  // In production, this would call actual APIs:
  // - SerpAPI for Google search results
  // - NewsAPI for news articles
  // - Twitter API for social mentions
  // - etc.

  // For now, return simulated data
  const simulatedMentions = [
    {
      source,
      snippet: `${clientName} was mentioned in a recent article about industry trends.`,
      sentiment: 0.3,
      frame: 'expert',
    },
    {
      source,
      snippet: `Interview with ${clientName} on leadership strategies.`,
      sentiment: 0.5,
      frame: 'founder',
    },
  ];

  return simulatedMentions;
}

/**
 * Analyze mentions using AI
 */
async function analyzeMentions(
  clientName: string,
  mentions: Array<{ source: string; snippet: string }>
): Promise<{
  sentimentSummary: { positive: number; neutral: number; negative: number; average: number };
  frameDistribution: Record<string, number>;
}> {
  try {
    const prompt = buildMentionsAnalysisPrompt({
      mentions: mentions.map((m) => ({
        source: m.source,
        snippet: m.snippet,
      })),
      clientName,
    });

    // Use AI to analyze mentions
    // In production, this would call the actual AI client
    // For now, return simulated analysis

    const sentimentCounts = { positive: 0, neutral: 0, negative: 0 };
    const frameCounts: Record<string, number> = {};

    mentions.forEach((m) => {
      const sentiment = m.sentiment;
      if (sentiment > 0.2) sentimentCounts.positive++;
      else if (sentiment < -0.2) sentimentCounts.negative++;
      else sentimentCounts.neutral++;

      const frame = (m as { frame: string }).frame;
      frameCounts[frame] = (frameCounts[frame] || 0) + 1;
    });

    const averageSentiment =
      mentions.reduce((sum, m) => sum + m.sentiment, 0) / mentions.length;

    return {
      sentimentSummary: {
        ...sentimentCounts,
        average: Math.round(averageSentiment * 100) / 100,
      },
      frameDistribution: frameCounts,
    };
  } catch (error) {
    console.error('Mention analysis error:', error);
    return {
      sentimentSummary: { positive: 0, neutral: 0, negative: 0, average: 0 },
      frameDistribution: {},
    };
  }
}

/**
 * Classify source type
 */
function classifySourceType(source: string): string {
  const sourceTypeMap: Record<string, string> = {
    google: 'news',
    news: 'news',
    twitter: 'social',
    linkedin: 'social',
    reddit: 'forum',
    youtube: 'other',
  };

  return sourceTypeMap[source] || 'other';
}

/**
 * Convert sentiment score to label
 */
function sentimentToLabel(sentiment: number): string {
  if (sentiment > 0.2) return 'positive';
  if (sentiment < -0.2) return 'negative';
  return 'neutral';
}
