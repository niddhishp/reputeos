/**
 * Content Generation API Route
 * 
 * POST /api/content/generate
 * 
 * Generates thought leadership content using OpenAI based on client positioning.
 * Includes rate limiting, input validation, and authorization checks.
 */

import { z } from 'zod';
import { createClient, verifyClientOwnership } from '@/lib/supabase/server';
import { contentRateLimiter, getClientIP, createRateLimitResponse } from '@/lib/ratelimit';
import { generateContent, generateWithRetry } from '@/lib/ai/client';
import { buildContentSystemPrompt, buildContentUserPrompt } from '@/lib/ai/prompts';
import { ContentPlatform } from '@/types/content';

// Input validation schema
const GenerateContentSchema = z.object({
  clientId: z.string().uuid('Invalid client ID format'),
  topic: z.string()
    .min(10, 'Topic must be at least 10 characters')
    .max(500, 'Topic must be less than 500 characters')
    .regex(/^[\w\s.,!?'\-:]+$/, 'Topic contains invalid characters'),
  platform: z.enum(['linkedin', 'twitter', 'medium', 'op_ed', 'keynote'] as const),
  templateId: z.string().uuid().optional(),
  keyPoints: z.array(z.string().max(200)).max(5).optional(),
  callToAction: z.string().max(200).optional(),
});

export type GenerateContentInput = z.infer<typeof GenerateContentSchema>;

export interface GenerateContentResponse {
  success: boolean;
  content: string;
  metadata: {
    model: string;
    tokensUsed: number;
    platform: ContentPlatform;
    topic: string;
  };
}

export interface GenerateContentError {
  error: string;
  message: string;
  details?: z.ZodError['errors'];
}

/**
 * POST handler for content generation
 */
export async function POST(request: Request): Promise<Response> {
  try {
    // ==========================================================================
    // 1. Rate Limiting Check
    // ==========================================================================
    const clientIP = getClientIP(request);
    const rateLimitResult = await contentRateLimiter.limit(clientIP);

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
        { error: 'Unauthorized', message: 'You must be logged in to generate content' },
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

    const parsed = GenerateContentSchema.safeParse(body);

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

    const { clientId, topic, platform, keyPoints, callToAction } = parsed.data;

    // ==========================================================================
    // 4. Authorization Check - Verify user owns the client
    // ==========================================================================
    const isOwner = await verifyClientOwnership(clientId);

    if (!isOwner) {
      return Response.json(
        { error: 'Forbidden', message: 'You do not have access to this client' },
        { status: 403 }
      );
    }

    // ==========================================================================
    // 5. Fetch Client Positioning Data
    // ==========================================================================
    const [{ data: client }, { data: positioning }] = await Promise.all([
      supabase.from('clients').select('*').eq('id', clientId).single(),
      supabase.from('positioning').select('*').eq('client_id', clientId).single(),
    ]);

    if (!client) {
      return Response.json(
        { error: 'Not found', message: 'Client not found' },
        { status: 404 }
      );
    }

    // Use default positioning if none exists
    const archetype = positioning?.personal_archetype || 'Thought Leader';
    const contentPillars = positioning?.content_pillars?.map((p: { name: string }) => p.name) || [
      'Industry Insights',
      'Leadership',
      'Innovation',
    ];
    const voiceCharacteristics = positioning?.voice_characteristics || {
      tone: 'professional',
      formality: 'business casual',
      sentenceStyle: 'clear and concise',
      vocabularyLevel: 'sophisticated',
    };

    // ==========================================================================
    // 6. Generate Content with AI
    // ==========================================================================
    const systemPrompt = buildContentSystemPrompt({
      archetype: archetype as any,
      contentPillars,
      voiceCharacteristics,
      topic,
      platform,
      keyPoints,
      callToAction,
    });

    const userPrompt = buildContentUserPrompt({
      archetype: archetype as any,
      contentPillars,
      voiceCharacteristics,
      topic,
      platform,
      keyPoints,
      callToAction,
    });

    const result = await generateWithRetry(() =>
      generateContent({
        systemPrompt,
        userPrompt,
        temperature: 0.7,
        maxTokens: 2500,
      })
    );

    // ==========================================================================
    // 7. Save Generated Content to Database
    // ==========================================================================
    const { error: saveError } = await supabase.from('content_items').insert({
      client_id: clientId,
      platform,
      topic,
      content: result.content,
      status: 'draft',
      ai_metadata: {
        model: result.model,
        tokens_used: result.usage.totalTokens,
        finish_reason: result.finishReason,
      },
    });

    if (saveError) {
      console.error('Failed to save content:', saveError);
      // Don't fail the request, just log the error
    }

    // ==========================================================================
    // 8. Return Success Response
    // ==========================================================================
    const response: GenerateContentResponse = {
      success: true,
      content: result.content,
      metadata: {
        model: result.model,
        tokensUsed: result.usage.totalTokens,
        platform,
        topic,
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
    console.error('Content generation error:', error);

    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('rate limit')) {
        return Response.json(
          { error: 'Rate limited', message: 'AI service rate limit exceeded. Please try again later.' },
          { status: 429 }
        );
      }

      if (error.message.includes('context length')) {
        return Response.json(
          { error: 'Content too long', message: 'The input content is too long. Please shorten your topic or key points.' },
          { status: 400 }
        );
      }
    }

    return Response.json(
      { error: 'Internal server error', message: 'Failed to generate content. Please try again later.' },
      { status: 500 }
    );
  }
}

/**
 * GET handler - Get generation status or history
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

    // Fetch recent content items
    const { data: contentItems, error } = await supabase
      .from('content_items')
      .select('id, platform, topic, status, created_at, nlp_compliance')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Failed to fetch content items:', error);
      return Response.json(
        { error: 'Database error', message: 'Failed to fetch content history' },
        { status: 500 }
      );
    }

    return Response.json({
      success: true,
      items: contentItems,
    });

  } catch (error) {
    console.error('Get content history error:', error);
    return Response.json(
      { error: 'Internal server error', message: 'Failed to fetch content history' },
      { status: 500 }
    );
  }
}
