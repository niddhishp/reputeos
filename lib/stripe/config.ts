export type PlanId = 'solo' | 'agency' | 'enterprise';
export type AddOnId = 'discover_only' | 'shield_pro' | 'onboarding' | 'scan_credits_20' | 'scan_credits_100';

export interface StripePlan {
  id: PlanId;
  name: string;
  price: number;
  priceId: string;
  description: string;
  clientLimit: number;
  scanCreditsPerMonth: number;
  modules: string[];
  features: string[];
  badge?: string;
}

export interface StripeAddOn {
  id: AddOnId;
  name: string;
  price: number;
  priceId: string;
  type: 'recurring' | 'one_time';
  description: string;
}

export const PLANS: Record<PlanId, StripePlan> = {
  solo: {
    id: 'solo', name: 'Solo', price: 4999,
    priceId: process.env.STRIPE_PRICE_SOLO ?? '',
    description: 'For independent consultants managing 1–3 clients',
    clientLimit: 3, scanCreditsPerMonth: 30,
    modules: ['discover', 'diagnose', 'position', 'express', 'validate'],
    features: ['3 client profiles', '30 discovery scans/month', 'LSI scoring & tracking', 'AI content generation', 'PDF/PPTX reports'],
  },
  agency: {
    id: 'agency', name: 'Agency', price: 14999, badge: 'Most Popular',
    priceId: process.env.STRIPE_PRICE_AGENCY ?? '',
    description: 'For PR agencies managing multiple clients',
    clientLimit: 20, scanCreditsPerMonth: 200,
    modules: ['discover', 'diagnose', 'position', 'express', 'validate', 'shield'],
    features: ['20 client profiles', '200 discovery scans/month', 'All 6 modules + Shield', 'Shield Pro — Legal Intelligence', 'Priority AI processing', 'White-label reports'],
  },
  enterprise: {
    id: 'enterprise', name: 'Enterprise', price: 39999,
    priceId: process.env.STRIPE_PRICE_ENTERPRISE ?? '',
    description: 'For large agencies & in-house PR teams',
    clientLimit: -1, scanCreditsPerMonth: -1,
    modules: ['discover', 'diagnose', 'position', 'express', 'validate', 'shield'],
    features: ['Unlimited client profiles', 'Unlimited scans', 'All modules + Shield Pro', 'Dedicated account manager', 'Custom API integrations', 'SLA guarantee'],
  },
};

export const ADD_ONS: Record<AddOnId, StripeAddOn> = {
  discover_only: {
    id: 'discover_only', name: 'Discover Module', price: 1999,
    priceId: process.env.STRIPE_PRICE_DISCOVER_ONLY ?? '',
    type: 'recurring', description: 'Run digital footprint scans for 1 client. No full platform needed.',
  },
  shield_pro: {
    id: 'shield_pro', name: 'Shield Pro', price: 2999,
    priceId: process.env.STRIPE_PRICE_SHIELD_PRO ?? '',
    type: 'recurring', description: 'Legal risk intelligence — eCourts, SEBI, MCA, enforcement.',
  },
  onboarding: {
    id: 'onboarding', name: 'Expert Onboarding', price: 9999,
    priceId: process.env.STRIPE_PRICE_ONBOARDING ?? '',
    type: 'one_time', description: '2-hour onboarding call + first client setup by ReputeOS team.',
  },
  scan_credits_20: {
    id: 'scan_credits_20', name: '20 Scan Credits', price: 999,
    priceId: process.env.STRIPE_PRICE_CREDITS_20 ?? '',
    type: 'one_time', description: 'Top up 20 discovery scans. Never expire.',
  },
  scan_credits_100: {
    id: 'scan_credits_100', name: '100 Scan Credits', price: 3999,
    priceId: process.env.STRIPE_PRICE_CREDITS_100 ?? '',
    type: 'one_time', description: 'Top up 100 scans. Best value. Never expire.',
  },
};

export function getPlanByPriceId(priceId: string): PlanId | null {
  for (const [id, plan] of Object.entries(PLANS)) {
    if (plan.priceId === priceId) return id as PlanId;
  }
  return null;
}

export function hasModuleAccess(planId: PlanId | null, addOns: string[], module: string): boolean {
  if (planId && PLANS[planId]?.modules.includes(module)) return true;
  if (module === 'discover' && addOns.includes('discover_only')) return true;
  if (module === 'shield' && addOns.includes('shield_pro')) return true;
  return false;
}
