/**
 * Subscription gate — call at the top of any API route that should
 * require an active plan or trial. Returns an error Response if blocked,
 * or null if the user is allowed to proceed.
 *
 * Usage:
 *   const block = await requireSubscription(user.id);
 *   if (block) return block;
 */
import { createClient } from '@/lib/supabase/server';

export async function requireSubscription(userId: string): Promise<Response | null> {
  const supabase = await createClient();

  const { data: sub } = await supabase
    .from('user_subscriptions')
    .select('plan_id, subscription_status, is_trial, trial_ends_at')
    .eq('user_id', userId)
    .maybeSingle();

  // Active trial
  if (sub?.is_trial && sub?.trial_ends_at && new Date(sub.trial_ends_at) > new Date()) return null;

  // Active or trialing subscription
  if (sub?.subscription_status === 'active' || sub?.subscription_status === 'trialing') return null;

  // Past-due — still grant access but warn
  if (sub?.subscription_status === 'past_due') return null;

  return Response.json({
    error: 'subscription_required',
    message: 'An active subscription is required to use this feature.',
    upgradeUrl: '/pricing',
  }, { status: 402 });
}
