/**
 * Entitlements — read a user's active plan and feature access from Supabase.
 * Call this server-side to gate module access.
 */
import { createClient } from '@/lib/supabase/server';
import type { PlanId } from './config';
import { hasModuleAccess } from './config';

export interface UserEntitlements {
  planId: PlanId | null;
  addOns: string[];
  scanCredits: number;
  isTrial: boolean;
  trialEndsAt: string | null;
  subscriptionStatus: string | null;
}

export async function getUserEntitlements(userId?: string): Promise<UserEntitlements> {
  const supabase = await createClient();

  // Get current user if not passed
  let uid = userId;
  if (!uid) {
    const { data: { user } } = await supabase.auth.getUser();
    uid = user?.id;
  }
  if (!uid) return emptyEntitlements();

  const { data } = await supabase
    .from('user_subscriptions')
    .select('*')
    .eq('user_id', uid)
    .maybeSingle();

  if (!data) return emptyEntitlements();

  return {
    planId: (data.plan_id as PlanId) || null,
    addOns: (data.add_ons as string[]) || [],
    scanCredits: data.scan_credits ?? 0,
    isTrial: data.is_trial ?? false,
    trialEndsAt: data.trial_ends_at ?? null,
    subscriptionStatus: data.subscription_status ?? null,
  };
}

export async function canAccessModule(module: string): Promise<boolean> {
  const ents = await getUserEntitlements();
  // During trial — allow all
  if (ents.isTrial && ents.trialEndsAt && new Date(ents.trialEndsAt) > new Date()) return true;
  return hasModuleAccess(ents.planId, ents.addOns, module);
}

export async function getRemainingScans(): Promise<number> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 0;
  const { data } = await supabase
    .from('user_subscriptions')
    .select('scan_credits, plan_id, scans_used_this_month, scans_reset_at')
    .eq('user_id', user.id)
    .maybeSingle();
  if (!data) return 0;
  // Enterprise = unlimited
  if (data.plan_id === 'enterprise') return 9999;
  // Check monthly reset
  const resetDate = data.scans_reset_at ? new Date(data.scans_reset_at) : null;
  const now = new Date();
  if (resetDate && now > resetDate) return (data.scan_credits ?? 0); // fresh month
  return Math.max(0, (data.scan_credits ?? 0) - (data.scans_used_this_month ?? 0));
}

function emptyEntitlements(): UserEntitlements {
  return { planId: null, addOns: [], scanCredits: 0, isTrial: false, trialEndsAt: null, subscriptionStatus: null };
}
