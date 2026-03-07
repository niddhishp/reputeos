/**
 * GET /api/cron/publish-scheduled
 * Runs every 5 minutes via Vercel Cron. Publishes any posts whose scheduled_at has passed.
 */
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

function isAuthorized(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    console.error('[CRON] FATAL: CRON_SECRET not set');
    return false;
  }
  return authHeader === `Bearer ${cronSecret}`;
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = createAdminClient();
  const now = new Date().toISOString();

  // Fetch due posts
  const { data: duePosts, error } = await admin
    .from('scheduled_posts')
    .select('*, social_connections!inner(access_token, platform_user_id, token_expires_at)')
    .eq('status', 'pending')
    .lte('scheduled_at', now)
    .limit(20);

  if (error) {
    console.error('[Cron publish-scheduled] fetch error', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const results = [];
  for (const post of (duePosts ?? [])) {
    try {
      const conn = post.social_connections;
      if (!conn?.access_token) throw new Error('No access token');
      if (conn.token_expires_at && new Date(conn.token_expires_at) < new Date()) throw new Error('Token expired');

      const ugcPayload = {
        author: `urn:li:person:${conn.platform_user_id}`,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: { text: post.text },
            shareMediaCategory: 'NONE',
          },
        },
        visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' },
      };

      const liRes = await fetch('https://api.linkedin.com/v2/ugcPosts', {
        method: 'POST',
        headers: { Authorization: `Bearer ${conn.access_token}`, 'Content-Type': 'application/json', 'X-Restli-Protocol-Version': '2.0.0' },
        body: JSON.stringify(ugcPayload),
      });

      if (!liRes.ok) {
        const err = await liRes.json().catch(() => ({})) as { message?: string };
        throw new Error(err.message ?? `LinkedIn API ${liRes.status}`);
      }

      const liData = await liRes.json() as { id?: string };
      const postUrl = `https://www.linkedin.com/feed/update/${liData.id ?? ''}`;

      await admin.from('scheduled_posts').update({ status: 'published', published_url: postUrl, published_at: now }).eq('id', post.id);
      if (post.content_item_id) {
        await admin.from('content_items').update({ status: 'published', published_url: postUrl, published_at: now }).eq('id', post.content_item_id);
      }
      results.push({ id: post.id, status: 'published', postUrl });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[Cron publish-scheduled] post ${post.id} failed:`, msg);
      await admin.from('scheduled_posts').update({ status: 'failed', error_message: msg }).eq('id', post.id);
      results.push({ id: post.id, status: 'failed', error: msg });
    }
  }

  return NextResponse.json({ processed: results.length, results });
}
