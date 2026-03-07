/**
 * POST /api/social/publish
 * Publishes content to LinkedIn or copies to clipboard (client-side copy handled in UI).
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const schema = z.object({
  contentItemId: z.string().uuid(),
  platform: z.enum(['linkedin']),
  text: z.string().min(1).max(3000),
});

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = schema.parse(await req.json());

    // Get stored access token
    const { data: conn } = await supabase
      .from('social_connections')
      .select('access_token, platform_user_id, token_expires_at')
      .eq('user_id', user.id)
      .eq('platform', body.platform)
      .maybeSingle();

    if (!conn?.access_token) {
      return NextResponse.json({ error: 'LinkedIn not connected. Go to Settings → Integrations.' }, { status: 400 });
    }

    // Check token expiry
    if (conn.token_expires_at && new Date(conn.token_expires_at) < new Date()) {
      return NextResponse.json({ error: 'LinkedIn session expired. Please reconnect in Settings.' }, { status: 400 });
    }

    // Publish to LinkedIn UGC Posts API
    const ugcPayload = {
      author: `urn:li:person:${conn.platform_user_id}`,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: { text: body.text },
          shareMediaCategory: 'NONE',
        },
      },
      visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' },
    };

    const liRes = await fetch('https://api.linkedin.com/v2/ugcPosts', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${conn.access_token}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
      },
      body: JSON.stringify(ugcPayload),
    });

    if (!liRes.ok) {
      const err = await liRes.json().catch(() => ({})) as { message?: string };
      console.error('[LinkedIn publish]', err);
      return NextResponse.json({ error: err.message ?? 'LinkedIn publish failed' }, { status: 400 });
    }

    const liData = await liRes.json() as { id?: string };
    const postUrl = `https://www.linkedin.com/feed/update/${liData.id ?? ''}`;

    // Update content_items with published status
    await supabase.from('content_items').update({
      status: 'published',
      published_url: postUrl,
      published_at: new Date().toISOString(),
    }).eq('id', body.contentItemId);

    return NextResponse.json({ success: true, postUrl, postId: liData.id });
  } catch (err) {
    console.error('[Publish]', err);
    const msg = err instanceof Error ? err.message : 'Publish failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
