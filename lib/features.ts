/**
 * Feature Flags
 *
 * Centralised feature flag system. Flags are evaluated server-side per request.
 * To toggle a flag: change `enabled` here and redeploy, or read from env vars for runtime control.
 */

export interface FeatureFlag {
  enabled: boolean;
  description: string;
  rolloutPercentage?: number; // 0-100
  allowedRoles?: ('consultant' | 'client_view' | 'admin')[];
}

export const FEATURE_FLAGS: Record<string, FeatureFlag> = {
  INFLUENCER_DNA_ANALYZER: {
    enabled: true,
    description: 'Influencer content DNA extraction and template generation',
    allowedRoles: ['consultant'],
  },
  ARCHETYPE_EVOLUTION: {
    enabled: true,
    description: 'A/B test and evolve archetypes over time',
    allowedRoles: ['consultant'],
  },
  BOARD_REPORT_PPTX: {
    enabled: true,
    description: 'Export validate results as PowerPoint board report',
  },
  REALTIME_CRISIS_ALERTS: {
    enabled: true,
    description: 'Real-time Supabase subscription for crisis alerts in Shield',
  },
  AI_CONTENT_GENERATION: {
    enabled: true,
    description: 'GPT-4 powered content generation in Express module',
  },
  NLP_COMPLIANCE_CHECKER: {
    enabled: true,
    description: 'NLP authority marker and frame detection on generated content',
  },
  PERFORMANCE_PREDICTION: {
    enabled: true,
    description: 'Heuristic engagement rate prediction for content',
  },
  COMPETITOR_TRACKING: {
    enabled: true,
    description: 'Track competitors in Shield module',
  },
  DISCOVER_SCAN: {
    enabled: true,
    description: 'Trigger automated discovery scan via n8n webhook',
  },
  BETA_LSI_CALCULATOR: {
    enabled: false,
    description: 'Self-serve LSI calculator on marketing page',
    rolloutPercentage: 0,
  },
  EXIT_INTENT_MODAL: {
    enabled: false,
    description: 'Exit intent modal on marketing pages',
    rolloutPercentage: 0,
  },
};

/**
 * Check if a feature flag is enabled.
 * Optionally restrict by user role.
 */
export function isFeatureEnabled(
  flagName: string,
  userRole?: 'consultant' | 'client_view' | 'admin'
): boolean {
  const flag = FEATURE_FLAGS[flagName];
  if (!flag) return false;
  if (!flag.enabled) return false;

  // Check role restriction
  if (flag.allowedRoles && userRole) {
    if (!flag.allowedRoles.includes(userRole)) return false;
  }

  // Check rollout percentage (deterministic per flag name for now)
  if (flag.rolloutPercentage !== undefined && flag.rolloutPercentage < 100) {
    // Simple hash: use flag name to get consistent pseudo-random value
    const hash = flagName.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    const bucket = hash % 100;
    if (bucket >= flag.rolloutPercentage) return false;
  }

  return true;
}

/**
 * Get all enabled flags for a given role.
 */
export function getEnabledFlags(
  userRole?: 'consultant' | 'client_view' | 'admin'
): string[] {
  return Object.keys(FEATURE_FLAGS).filter((key) =>
    isFeatureEnabled(key, userRole)
  );
}
