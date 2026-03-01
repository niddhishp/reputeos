// app/api/discover/callback/route.ts
// Webhook receiver for n8n/external scan completion
import { NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { z } from 'zod';

const schema = z.object({
  runId: z.string().uuid(),
  clientId: z.string().uuid(),
  status: z.enum(['completed', 'failed']),
  totalMentions: z.number().optional(),
  sentimentDist: z.object({ positive: z.number(), neutral: z.number(), negative: z.number() }).optional(),
  frameDist: z.record(z.number()).optional(),
  topKeywords: z.array(z.string()).optional(),
  mentions: z.array(z.any()).optional(),
});

export async function POST(request: Request) {
  try {
    // Verify webhook secret
    const authHeader = request.headers.get('x-webhook-secret');
    if (authHeader !== process.env.WEBHOOK_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          get(name: string) { return cookieStore.get(name)?.value; },
          set(name: string, value: string, options: CookieOptions) { cookieStore.set({ name, value, ...options }); },
          remove(name: string, options: CookieOptions) { cookieStore.set({ name, value: '', ...options }); },
        },
      }
    );

    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });

    const { runId, status, totalMentions, sentimentDist, frameDist, topKeywords, mentions } = parsed.data;

    const updateData: Record<string, unknown> = { status };
    if (totalMentions !== undefined) updateData.total_mentions = totalMentions;
    if (sentimentDist) updateData.sentiment_dist = sentimentDist;
    if (frameDist) updateData.frame_dist = frameDist;
    if (topKeywords) updateData.top_keywords = topKeywords;
    if (mentions) updateData.mentions = mentions;

    const { error } = await supabase.from('discover_runs').update(updateData).eq('id', runId);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[discover/callback]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
