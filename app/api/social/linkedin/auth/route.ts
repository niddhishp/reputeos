/**
 * GET /api/social/linkedin/auth
 * Redirects user to LinkedIn OAuth consent screen.
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const clientId = process.env.LINKEDIN_CLIENT_ID;
  if (!clientId) return NextResponse.json({ error: 'LinkedIn not configured' }, { status: 500 });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://reputeos.com';
  const redirectUri = `${appUrl}/api/social/linkedin/callback`;
  const state = `${user.id}:${Date.now()}`;
  const scope = 'openid profile email w_member_social';

  const url = new URL('https://www.linkedin.com/oauth/v2/authorization');
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('state', state);
  url.searchParams.set('scope', scope);

  // Store state for CSRF check
  const res = NextResponse.redirect(url.toString());
  res.cookies.set('li_oauth_state', state, { httpOnly: true, sameSite: 'lax', maxAge: 600 });
  return res;
}
