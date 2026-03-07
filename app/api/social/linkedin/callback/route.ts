/**
 * GET /api/social/linkedin/callback
 * LinkedIn OAuth callback — exchanges code for token, saves to DB.
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://reputeos.com';
  const { searchParams } = new URL(req.url);
  const code  = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  if (error) return NextResponse.redirect(`${appUrl}/dashboard/settings?social=error&msg=${error}`);
  if (!code || !state) return NextResponse.redirect(`${appUrl}/dashboard/settings?social=error&msg=missing_params`);

  // Verify CSRF state
  const storedState = req.cookies.get('li_oauth_state')?.value;
  if (storedState !== state) return NextResponse.redirect(`${appUrl}/dashboard/settings?social=error&msg=state_mismatch`);

  const userId = state.split(':')[0];
  const clientId     = process.env.LINKEDIN_CLIENT_ID!;
  const clientSecret = process.env.LINKEDIN_CLIENT_SECRET!;
  const redirectUri  = `${appUrl}/api/social/linkedin/callback`;

  try {
    // Exchange code for token
    const tokenRes = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ grant_type: 'authorization_code', code, redirect_uri: redirectUri, client_id: clientId, client_secret: clientSecret }),
    });
    const tokenData = await tokenRes.json() as { access_token?: string; expires_in?: number; error?: string };
    if (!tokenData.access_token) throw new Error(tokenData.error ?? 'Token exchange failed');

    // Get LinkedIn profile (name + urn)
    const profileRes = await fetch('https://api.linkedin.com/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const profile = await profileRes.json() as { sub?: string; name?: string; email?: string };

    const expiresAt = new Date(Date.now() + (tokenData.expires_in ?? 3600) * 1000).toISOString();

    // Save to social_connections table
    const admin = createAdminClient();
    await admin.from('social_connections').upsert({
      user_id: userId,
      platform: 'linkedin',
      access_token: tokenData.access_token,
      token_expires_at: expiresAt,
      platform_user_id: profile.sub ?? '',
      platform_username: profile.name ?? '',
      platform_email: profile.email ?? '',
    }, { onConflict: 'user_id,platform' });

    const res = NextResponse.redirect(`${appUrl}/dashboard/settings?social=connected&platform=linkedin`);
    res.cookies.delete('li_oauth_state');
    return res;
  } catch (err) {
    console.error('[LinkedIn callback]', err);
    return NextResponse.redirect(`${appUrl}/dashboard/settings?social=error&msg=token_failed`);
  }
}
