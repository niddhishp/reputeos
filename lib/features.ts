/**
 * Feature Flag System
 * 
 * Centralized feature flag management for gradual rollouts,
 * A/B testing, and plan-based feature access.
 * 
 * @example
 * ```tsx
 * // Check if feature is enabled
 * if (isFeatureEnabled(FEATURES.AI_CONTENT_GENERATION, user)) {
 *   return <AIContentGenerator />;
 * }
 * 
 * // In a component
 * export function Dashboard() {
 *   const user = useCurrentUser();
 *   const showAdvancedAnalytics = isFeatureEnabled(
 *     FEATURES.BETA_ADVANCED_ANALYTICS,
 *     user
 *   );
 *   
 *   return (
 *     <div>
 *       {showAdvancedAnalytics && <AdvancedAnalytics />}
 *     </div>
 *   );
 * }
 * ```
 */

// ============================================================================
// Feature Definitions
// ============================================================================

export const FEATURES = {
  // Core Features (always enabled)
  AI_CONTENT_GENERATION: 'ai-content-generation',
  LSI_SCORING: 'lsi-scoring',
  CRISIS_MONITORING: 'crisis-monitoring',
  COMPETITOR_ANALYSIS: 'competitor-analysis',
  DISCOVER_SCAN: 'discover-scan',
  DIAGNOSE_REPORT: 'diagnose-report',
  POSITION_ARCHETYPE: 'position-archetype',
  EXPRESS_EDITOR: 'express-editor',
  VALIDATE_EXPORT: 'validate-export',
  SHIELD_ALERTS: 'shield-alerts',
  
  // Beta Features (gradual rollout)
  BETA_TEAM_COLLABORATION: 'beta-team-collaboration',
  BETA_ADVANCED_ANALYTICS: 'beta-advanced-analytics',
  BETA_AI_ENHANCEMENTS: 'beta-ai-enhancements',
  BETA_MOBILE_APP: 'beta-mobile-app',
  
  // Premium Features (plan-based)
  PREMIUM_WHITE_LABEL: 'premium-white-label',
  PREMIUM_API_ACCESS: 'premium-api-access',
  PREMIUM_CUSTOM_INTEGRATIONS: 'premium-custom-integrations',
  PREMIUM_DEDICATED_SUPPORT: 'premium-dedicated-support',
  
  // Enterprise Features
  ENTERPRISE_SSO: 'enterprise-sso',
  ENTERPRISE_AUDIT_LOGS: 'enterprise-audit-logs',
  ENTERPRISE_SLA: 'enterprise-sla',
  ENTERPRISE_CUSTOM_CONTRACT: 'enterprise-custom-contract',
} as const;

export type FeatureFlag = typeof FEATURES[keyof typeof FEATURES];

// ============================================================================
// Feature Configuration
// ============================================================================

export interface FeatureConfig {
  /** Whether the feature is globally enabled */
  enabled: boolean;
  
  /** Percentage of users to roll out to (0-100) */
  rolloutPercentage?: number;
  
  /** Allowed user roles */
  allowedRoles?: string[];
  
  /** Allowed subscription plans */
  allowedPlans?: string[];
  
  /** Start date for the feature */
  startDate?: Date;
  
  /** End date for the feature (for time-limited features) */
  endDate?: Date;
  
  /** Description of the feature */
  description?: string;
}

// ============================================================================
// Feature Flag Configuration
// ============================================================================

export const FEATURE_FLAGS: Record<FeatureFlag, FeatureConfig> = {
  // Core Features
  [FEATURES.AI_CONTENT_GENERATION]: {
    enabled: true,
    description: 'AI-powered content generation for thought leadership',
  },
  [FEATURES.LSI_SCORING]: {
    enabled: true,
    description: 'Leadership Sentiment Index scoring system',
  },
  [FEATURES.CRISIS_MONITORING]: {
    enabled: true,
    description: '24/7 crisis monitoring and alerts',
  },
  [FEATURES.COMPETITOR_ANALYSIS]: {
    enabled: true,
    description: 'Competitor reputation analysis',
  },
  [FEATURES.DISCOVER_SCAN]: {
    enabled: true,
    description: 'Digital footprint discovery scan',
  },
  [FEATURES.DIAGNOSE_REPORT]: {
    enabled: true,
    description: 'LSI diagnosis and reporting',
  },
  [FEATURES.POSITION_ARCHETYPE]: {
    enabled: true,
    description: 'Archetype positioning strategy',
  },
  [FEATURES.EXPRESS_EDITOR]: {
    enabled: true,
    description: 'AI content editor with NLP validation',
  },
  [FEATURES.VALIDATE_EXPORT]: {
    enabled: true,
    description: 'Export validation reports (PDF/PPTX)',
  },
  [FEATURES.SHIELD_ALERTS]: {
    enabled: true,
    description: 'Shield module real-time alerts',
  },
  
  // Beta Features
  [FEATURES.BETA_TEAM_COLLABORATION]: {
    enabled: true,
    rolloutPercentage: 10,
    allowedRoles: ['consultant', 'admin'],
    description: 'Team collaboration features for consultants',
  },
  [FEATURES.BETA_ADVANCED_ANALYTICS]: {
    enabled: true,
    rolloutPercentage: 25,
    description: 'Advanced analytics dashboard',
  },
  [FEATURES.BETA_AI_ENHANCEMENTS]: {
    enabled: true,
    rolloutPercentage: 15,
    description: 'Enhanced AI content generation',
  },
  [FEATURES.BETA_MOBILE_APP]: {
    enabled: false,
    description: 'Mobile app access (coming soon)',
  },
  
  // Premium Features
  [FEATURES.PREMIUM_WHITE_LABEL]: {
    enabled: true,
    allowedPlans: ['enterprise'],
    description: 'White-label reports and branding',
  },
  [FEATURES.PREMIUM_API_ACCESS]: {
    enabled: true,
    allowedPlans: ['pro', 'enterprise'],
    description: 'API access for integrations',
  },
  [FEATURES.PREMIUM_CUSTOM_INTEGRATIONS]: {
    enabled: true,
    allowedPlans: ['enterprise'],
    description: 'Custom third-party integrations',
  },
  [FEATURES.PREMIUM_DEDICATED_SUPPORT]: {
    enabled: true,
    allowedPlans: ['pro', 'enterprise'],
    description: 'Dedicated customer support',
  },
  
  // Enterprise Features
  [FEATURES.ENTERPRISE_SSO]: {
    enabled: true,
    allowedPlans: ['enterprise'],
    description: 'Single Sign-On (SSO) integration',
  },
  [FEATURES.ENTERPRISE_AUDIT_LOGS]: {
    enabled: true,
    allowedPlans: ['enterprise'],
    description: 'Comprehensive audit logs',
  },
  [FEATURES.ENTERPRISE_SLA]: {
    enabled: true,
    allowedPlans: ['enterprise'],
    description: 'Service Level Agreement guarantees',
  },
  [FEATURES.ENTERPRISE_CUSTOM_CONTRACT]: {
    enabled: true,
    allowedPlans: ['enterprise'],
    description: 'Custom contract terms',
  },
};

// ============================================================================
// User Context Interface
// ============================================================================

export interface FeatureUser {
  id: string;
  role?: string;
  plan?: string;
  email?: string;
  createdAt?: Date;
}

// ============================================================================
// Feature Check Function
// ============================================================================

/**
 * Check if a feature is enabled for a user
 * 
 * @param feature - The feature flag to check
 * @param user - The user context (optional for global checks)
 * @returns boolean indicating if the feature is enabled
 */
export function isFeatureEnabled(
  feature: FeatureFlag,
  user?: FeatureUser
): boolean {
  const config = FEATURE_FLAGS[feature];
  
  // Feature not found or globally disabled
  if (!config || !config.enabled) {
    return false;
  }
  
  // Check date constraints
  const now = new Date();
  if (config.startDate && now < config.startDate) {
    return false;
  }
  if (config.endDate && now > config.endDate) {
    return false;
  }
  
  // Check role restrictions
  if (config.allowedRoles && config.allowedRoles.length > 0) {
    if (!user?.role || !config.allowedRoles.includes(user.role)) {
      return false;
    }
  }
  
  // Check plan restrictions
  if (config.allowedPlans && config.allowedPlans.length > 0) {
    if (!user?.plan || !config.allowedPlans.includes(user.plan)) {
      return false;
    }
  }
  
  // Check rollout percentage
  if (config.rolloutPercentage !== undefined && config.rolloutPercentage < 100) {
    if (!user?.id) {
      // No user ID, can't determine rollout - be conservative
      return false;
    }
    
    // Deterministic rollout based on user ID hash
    const hash = hashString(user.id);
    const userPercentage = Math.abs(hash) % 100;
    
    if (userPercentage >= config.rolloutPercentage) {
      return false;
    }
  }
  
  return true;
}

/**
 * Check if a feature is globally enabled (ignoring user context)
 */
export function isFeatureGloballyEnabled(feature: FeatureFlag): boolean {
  const config = FEATURE_FLAGS[feature];
  return config?.enabled ?? false;
}

/**
 * Get feature configuration
 */
export function getFeatureConfig(feature: FeatureFlag): FeatureConfig | undefined {
  return FEATURE_FLAGS[feature];
}

/**
 * Get all enabled features for a user
 */
export function getEnabledFeatures(user?: FeatureUser): FeatureFlag[] {
  return (Object.keys(FEATURE_FLAGS) as FeatureFlag[]).filter(
    (feature) => isFeatureEnabled(feature, user)
  );
}

/**
 * Get all features by category
 */
export function getFeaturesByCategory(
  category: 'core' | 'beta' | 'premium' | 'enterprise'
): FeatureFlag[] {
  const prefixes = {
    core: [],
    beta: ['BETA_'],
    premium: ['PREMIUM_'],
    enterprise: ['ENTERPRISE_'],
  };
  
  const prefix = prefixes[category];
  
  return (Object.keys(FEATURE_FLAGS) as FeatureFlag[]).filter((feature) => {
    if (category === 'core') {
      return !feature.includes('BETA_') && 
             !feature.includes('PREMIUM_') && 
             !feature.includes('ENTERPRISE_');
    }
    return prefix.some((p) => feature.includes(p));
  });
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Simple hash function for deterministic user-based rollouts
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash;
}

/**
 * Enable a feature (for admin use)
 */
export function enableFeature(feature: FeatureFlag): void {
  if (FEATURE_FLAGS[feature]) {
    FEATURE_FLAGS[feature].enabled = true;
  }
}

/**
 * Disable a feature (for admin use)
 */
export function disableFeature(feature: FeatureFlag): void {
  if (FEATURE_FLAGS[feature]) {
    FEATURE_FLAGS[feature].enabled = false;
  }
}

/**
 * Update rollout percentage (for admin use)
 */
export function setRolloutPercentage(feature: FeatureFlag, percentage: number): void {
  if (FEATURE_FLAGS[feature]) {
    FEATURE_FLAGS[feature].rolloutPercentage = Math.max(0, Math.min(100, percentage));
  }
}

// ============================================================================
// React Hook (for client-side usage)
// ============================================================================

/**
 * React hook for feature flags
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { isEnabled, config } = useFeature(FEATURES.BETA_TEAM_COLLABORATION);
 *   
 *   if (!isEnabled) return null;
 *   
 *   return <TeamCollaborationFeature />;
 * }
 * ```
 */
export function useFeature(feature: FeatureFlag, user?: FeatureUser) {
  return {
    isEnabled: isFeatureEnabled(feature, user),
    config: getFeatureConfig(feature),
    isGloballyEnabled: isFeatureGloballyEnabled(feature),
  };
}
