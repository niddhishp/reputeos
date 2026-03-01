/**
 * Analytics Tracking
 *
 * Lightweight event tracking wrapper.
 * Currently logs to console in dev; plug in Mixpanel / PostHog / Amplitude in production
 * by setting NEXT_PUBLIC_ANALYTICS_PROVIDER and the corresponding API key env var.
 *
 * Usage:
 *   import { track } from '@/lib/analytics';
 *   track('content_generated', { platform: 'linkedin', wordCount: 320 });
 */

type Properties = Record<string, string | number | boolean | null | undefined>;

function isDev(): boolean {
  return process.env.NODE_ENV === 'development';
}

/**
 * Track a user event.
 */
export function track(eventName: string, properties?: Properties): void {
  if (typeof window === 'undefined') return; // server-side guard

  if (isDev()) {
    console.log(`[Analytics] ${eventName}`, properties ?? {});
  }

  // PostHog
  try {
    const ph = (window as any).posthog;
    if (ph?.capture) {
      ph.capture(eventName, properties);
      return;
    }
  } catch {}

  // Mixpanel
  try {
    const mp = (window as any).mixpanel;
    if (mp?.track) {
      mp.track(eventName, properties);
      return;
    }
  } catch {}
}

/**
 * Identify a user for analytics.
 */
export function identify(userId: string, traits?: Properties): void {
  if (typeof window === 'undefined') return;

  if (isDev()) {
    console.log(`[Analytics] identify: ${userId}`, traits ?? {});
  }

  try {
    const ph = (window as any).posthog;
    if (ph?.identify) {
      ph.identify(userId, traits);
      return;
    }
  } catch {}

  try {
    const mp = (window as any).mixpanel;
    if (mp?.identify) {
      mp.identify(userId);
      if (traits) mp.people?.set(traits);
      return;
    }
  } catch {}
}

/**
 * Track a page view.
 */
export function pageView(path: string, properties?: Properties): void {
  track('$pageview', { path, ...properties });
}

/**
 * Canonical event names — use these constants throughout the app to avoid typos.
 */
export const Events = {
  // Auth
  SIGNED_UP: 'signed_up',
  LOGGED_IN: 'logged_in',
  LOGGED_OUT: 'logged_out',

  // Clients
  CLIENT_CREATED: 'client_created',
  CLIENT_VIEWED: 'client_viewed',

  // Discover
  DISCOVER_SCAN_STARTED: 'discover_scan_started',
  DISCOVER_SCAN_COMPLETED: 'discover_scan_completed',

  // Diagnose
  LSI_CALCULATED: 'lsi_calculated',

  // Position
  ARCHETYPE_SELECTED: 'archetype_selected',
  FOLLOWABILITY_PREDICTED: 'followability_predicted',
  INFLUENCER_DNA_ANALYZED: 'influencer_dna_analyzed',

  // Express
  CONTENT_GENERATED: 'content_generated',
  CONTENT_SAVED: 'content_saved',
  NLP_CHECKED: 'nlp_checked',

  // Validate
  REPORT_GENERATED: 'report_generated',

  // Shield
  ALERT_ACKNOWLEDGED: 'alert_acknowledged',
  COMPETITOR_ADDED: 'competitor_added',

  // Marketing
  CTA_CLICKED: 'cta_clicked',
  PRICING_VIEWED: 'pricing_viewed',
  DEMO_BOOKED: 'demo_booked',
} as const;
