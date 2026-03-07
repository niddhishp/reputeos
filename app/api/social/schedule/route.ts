/**
 * POST /api/social/schedule  — schedule a post for later
 * GET  /api/social/schedule  — list scheduled posts for a client
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const scheduleSchema = z.object({
  contentItemId: z.string().uuid(),
  platform: z.enum(['linkedin']),
  text: z.string().min(1).max(3000),
  scheduledAt: z.string().datetime(), // ISO string
  clientId: z.string().uuid(),
});

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = scheduleSchema.parse(await req.json());
    const scheduledDate = new Date(body.scheduledAt);

    if (scheduledDate <= new Date()) {
      return NextResponse.json({ error: 'Scheduled time must be in the future' }, { status: 400 });
    }

    const { data, error } = await supabase.from('scheduled_posts').insert({
      user_id: user.id,
      client_id: body.clientId,
      content_item_id: body.contentItemId,
      platform: body.platform,
      text: body.text,
      scheduled_at: body.scheduledAt,
      status: 'pending',
    }).select().single();

    if (error) throw error;
    return NextResponse.json({ success: true, scheduledPost: data });
  } catch (err) {
    console.error('[Schedule]', err);
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Schedule failed' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get('clientId');

    let query = supabase
      .from('scheduled_posts')
      .select('*, content_items(title, platform)')
      .eq('user_id', user.id)
      .order('scheduled_at', { ascending: true });

    if (clientId) query = query.eq('client_id', clientId);

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ posts: data ?? [] });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch scheduled posts' }, { status: 500 });
  }
}
