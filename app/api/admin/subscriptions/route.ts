/**
 * GET  /api/admin/subscriptions              - list all user plans
 * PATCH /api/admin/subscriptions             - override plan, trial, status
 */
import { NextRequest } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin/auth';

export async function GET() {
  try {
    await requireAdmin();
    const supabase      = await createClient();
    const adminSupabase = createAdminClient();

    // Get all users from auth
    const { data: authData } = await adminSupabase.auth.admin.listUsers({ perPage: 500 });
    const authUsers = authData?.users ?? [];

    // Get profiles for plan data
    const { data: profiles } = await supabase
      .from('user_profiles')
      .select('id, plan, name, company, role, created_at');

    // Get scan counts per user
    const { data: scanCounts } = await supabase
      .from('scan_events')
      .select('user_id')
      .eq('status', 'completed');

    const scanMap: Record<string, number> = {};
    for (const s of (scanCounts ?? [])) {
      if (s.user_id) scanMap[s.user_id] = (scanMap[s.user_id] ?? 0) + 1;
    }

    // Get client counts per user
    const { data: clientCounts } = await supabase
      .from('clients')
      .select('user_id');

    const clientMap: Record<string, number> = {};
    for (const c of (clientCounts ?? [])) {
      if (c.user_id) clientMap[c.user_id] = (clientMap[c.user_id] ?? 0) + 1;
    }

    const profileMap = Object.fromEntries((profiles ?? []).map(p => [p.id, p]));

    const users = authUsers.map((u: { id: string; email?: string; user_metadata?: Record<string, unknown>; created_at: string; last_sign_in_at?: string; banned_until?: string; banned_at?: string; email_confirmed_at?: string }) => ({
      id:             u.id,
      email:          u.email ?? '',
      name:           profileMap[u.id]?.name ?? (u.user_metadata?.name as string ?? ''),
      plan:           profileMap[u.id]?.plan ?? (u.user_metadata?.plan as string ?? 'free'),
      authRole:       u.user_metadata?.role as string ?? 'user',
      company:        profileMap[u.id]?.company ?? '',
      isActive:       !u.banned_at,
      emailConfirmed: !!u.email_confirmed_at,
      createdAt:      u.created_at,
      lastSignIn:     u.last_sign_in_at ?? null,
      scansCompleted: scanMap[u.id] ?? 0,
      clientCount:    clientMap[u.id] ?? 0,
      trialEndsAt:    u.user_metadata?.trial_ends_at as string ?? null,
      planOverride:   u.user_metadata?.plan_override as boolean ?? false,
    }));

    return Response.json({ users });

  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return Response.json({ error: msg }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await requireAdmin();
    const adminSupabase = createAdminClient();
    const supabase = await createClient();

    const body = await req.json() as {
      userId:       string;
      plan?:        string;
      authRole?:    string;
      trialDays?:   number;  // extend trial by N days from now
      banned?:      boolean;
      note?:        string;
    };

    if (!body.userId) return Response.json({ error: 'userId required' }, { status: 400 });

    // Fetch current metadata
    const { data: currentUser } = await adminSupabase.auth.admin.getUserById(body.userId);
    const currentMeta = (currentUser?.user?.user_metadata ?? {}) as Record<string, unknown>;

    const newMeta: Record<string, unknown> = { ...currentMeta };
    if (body.plan) {
      newMeta.plan          = body.plan;
      newMeta.plan_override = true;
      newMeta.plan_overridden_at = new Date().toISOString();
    }
    if (body.authRole)  newMeta.role = body.authRole;
    if (body.trialDays !== undefined) {
      const trialEnd = new Date(Date.now() + body.trialDays * 86400_000);
      newMeta.trial_ends_at = trialEnd.toISOString();
    }
    if (body.note) newMeta.admin_note = body.note;

    const { error: metaError } = await adminSupabase.auth.admin.updateUserById(body.userId, {
      user_metadata: newMeta,
    });
    if (metaError) throw metaError;

    // Also update user_profiles table
    if (body.plan) {
      await supabase
        .from('user_profiles')
        .update({ plan: body.plan, updated_at: new Date().toISOString() })
        .eq('id', body.userId);
    }

    // Handle ban/unban
    if (body.banned !== undefined) {
      const { error: banError } = await adminSupabase.auth.admin.updateUserById(body.userId, {
        ban_duration: body.banned ? '876000h' : 'none',
      });
      if (banError) throw banError;
    }

    return Response.json({ success: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return Response.json({ error: msg }, { status: 500 });
  }
}
