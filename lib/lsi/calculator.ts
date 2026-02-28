/**
 * LSI (Legitimacy & Sentiment Index) Calculator
 * 
 * This module provides the core calculation logic for the LSI score,
 * which measures executive reputation across six components.
 */

import { z } from 'zod';

// =============================================================================
// Types & Constants
// =============================================================================

export const LSIComponentSchema = z.object({
  c1: z.number().min(0).max(20), // Search Reputation (0-20)
  c2: z.number().min(0).max(20), // Media Framing (0-20)
  c3: z.number().min(0).max(20), // Social Backlash (0-20)
  c4: z.number().min(0).max(15), // Elite Discourse (0-15)
  c5: z.number().min(0).max(15), // Third-Party Validation (0-15)
  c6: z.number().min(0).max(10), // Crisis Moat (0-10)
});

export type LSIComponents = z.infer<typeof LSIComponentSchema>;

export interface LSIRun {
  id: string;
  client_id: string;
  run_date: string;
  total_score: number;
  components: LSIComponents;
  stats: {
    mean: number;
    stddev: number;
    ucl: number; // Upper Control Limit
    lcl: number; // Lower Control Limit
  };
  gaps: Array<{
    component: string;
    gap: number;
    priority: number;
  }>;
}

// Component configuration with weights and descriptions
export const COMPONENT_CONFIG = {
  c1: {
    name: 'Search Reputation',
    maxScore: 20,
    weight: 1.0,
    description: 'Google results sentiment & frame distribution',
    factors: [
      'First page Google results sentiment',
      'Knowledge panel presence & accuracy',
      'Wikipedia presence',
      'Negative content ratio',
    ],
  },
  c2: {
    name: 'Media Framing',
    maxScore: 20,
    weight: 1.0,
    description: 'Journalist quotes & expert positioning',
    factors: [
      'Positive journalist mentions',
      'Expert quote frequency',
      'Media outlet quality',
      'Narrative consistency',
    ],
  },
  c3: {
    name: 'Social Backlash',
    maxScore: 20,
    weight: 1.0,
    description: 'Social media sentiment & volume',
    factors: [
      'Social sentiment ratio',
      'Mention volume trends',
      'Crisis response effectiveness',
      'Community engagement',
    ],
  },
  c4: {
    name: 'Elite Discourse',
    maxScore: 15,
    weight: 1.0,
    description: 'Industry leader mentions & citations',
    factors: [
      'Peer executive mentions',
      'Industry leader endorsements',
      'Conference speaking invitations',
      'Thought leadership citations',
    ],
  },
  c5: {
    name: 'Third-Party Validation',
    maxScore: 15,
    weight: 1.0,
    description: 'Awards, rankings & analyst coverage',
    factors: [
      'Industry awards & recognition',
      'Analyst firm mentions',
      'Ranking list inclusions',
      'Certification credibility',
    ],
  },
  c6: {
    name: 'Crisis Moat',
    maxScore: 10,
    weight: 1.0,
    description: 'Resilience & narrative defense',
    factors: [
      'Crisis response history',
      'Proactive narrative control',
      'Stakeholder trust index',
      'Reputation recovery speed',
    ],
  },
} as const;

// Maximum possible LSI score
export const MAX_LSI_SCORE = 100;

// LSI Classification thresholds
export const LSI_CLASSIFICATIONS = {
  elite: { min: 86, label: 'Elite Authority', description: 'Top 5% reputation standing' },
  strong: { min: 71, label: 'Strong Authority', description: 'Above-average credibility' },
  functional: { min: 56, label: 'Functional Legitimacy', description: 'Adequate but not distinctive' },
  vulnerable: { min: 36, label: 'Reputation Vulnerability', description: 'At risk during crises' },
  impaired: { min: 0, label: 'Severe Impairment', description: 'Immediate intervention required' },
} as const;

// =============================================================================
// Calculation Functions
// =============================================================================

/**
 * Calculate total LSI score from components
 */
export function calculateTotalScore(components: LSIComponents): number {
  const validated = LSIComponentSchema.parse(components);
  
  return (
    validated.c1 +
    validated.c2 +
    validated.c3 +
    validated.c4 +
    validated.c5 +
    validated.c6
  );
}

/**
 * Calculate component percentage (0-100%)
 */
export function calculateComponentPercentage(
  component: keyof LSIComponents,
  value: number
): number {
  const config = COMPONENT_CONFIG[component];
  return Math.round((value / config.maxScore) * 100);
}

/**
 * Calculate overall LSI percentage
 */
export function calculateLSIPercentage(score: number): number {
  return Math.round((score / MAX_LSI_SCORE) * 100);
}

/**
 * Get LSI classification based on score
 */
export function getLSIClassification(score: number): {
  label: string;
  description: string;
  color: string;
} {
  if (score >= LSI_CLASSIFICATIONS.elite.min) {
    return {
      label: LSI_CLASSIFICATIONS.elite.label,
      description: LSI_CLASSIFICATIONS.elite.description,
      color: '#10B981', // green-500
    };
  }
  if (score >= LSI_CLASSIFICATIONS.strong.min) {
    return {
      label: LSI_CLASSIFICATIONS.strong.label,
      description: LSI_CLASSIFICATIONS.strong.description,
      color: '#0066CC', // primary blue
    };
  }
  if (score >= LSI_CLASSIFICATIONS.functional.min) {
    return {
      label: LSI_CLASSIFICATIONS.functional.label,
      description: LSI_CLASSIFICATIONS.functional.description,
      color: '#F59E0B', // amber-500
    };
  }
  if (score >= LSI_CLASSIFICATIONS.vulnerable.min) {
    return {
      label: LSI_CLASSIFICATIONS.vulnerable.label,
      description: LSI_CLASSIFICATIONS.vulnerable.description,
      color: '#F97316', // orange-500
    };
  }
  return {
    label: LSI_CLASSIFICATIONS.impaired.label,
    description: LSI_CLASSIFICATIONS.impaired.description,
    color: '#EF4444', // red-500
  };
}

/**
 * Calculate statistical metrics from historical runs
 */
export function calculateStats(historicalScores: number[]): {
  mean: number;
  stddev: number;
  ucl: number;
  lcl: number;
} {
  if (historicalScores.length === 0) {
    return { mean: 0, stddev: 0, ucl: 0, lcl: 0 };
  }

  const mean = historicalScores.reduce((a, b) => a + b, 0) / historicalScores.length;
  
  const variance = historicalScores.reduce((sum, score) => {
    return sum + Math.pow(score - mean, 2);
  }, 0) / historicalScores.length;
  
  const stddev = Math.sqrt(variance);

  // Control limits: mean ± 3 standard deviations (99.7% confidence)
  const ucl = Math.min(mean + 3 * stddev, MAX_LSI_SCORE);
  const lcl = Math.max(mean - 3 * stddev, 0);

  return {
    mean: Math.round(mean * 10) / 10,
    stddev: Math.round(stddev * 10) / 10,
    ucl: Math.round(ucl * 10) / 10,
    lcl: Math.round(lcl * 10) / 10,
  };
}

/**
 * Calculate gaps between current and target scores
 */
export function calculateGaps(
  current: LSIComponents,
  target: LSIComponents
): Array<{
  component: string;
  gap: number;
  priority: number;
}> {
  const gaps: Array<{ component: string; gap: number; priority: number }> = [];

  for (const [key, config] of Object.entries(COMPONENT_CONFIG)) {
    const componentKey = key as keyof LSIComponents;
    const gap = target[componentKey] - current[componentKey];

    if (gap > 0) {
      // Priority based on gap size and component weight
      const gapPercentage = gap / config.maxScore;
      const priority = Math.round(gapPercentage * 10);

      gaps.push({
        component: config.name,
        gap: Math.round(gap * 10) / 10,
        priority,
      });
    }
  }

  // Sort by priority (highest first)
  return gaps.sort((a, b) => b.priority - a.priority);
}

/**
 * Calculate trend direction and magnitude
 */
export function calculateTrend(
  current: number,
  previous: number
): {
  direction: 'up' | 'down' | 'stable';
  magnitude: 'significant' | 'moderate' | 'minimal';
  change: number;
} {
  const change = current - previous;
  const changePercent = Math.abs(change / previous) * 100;

  let direction: 'up' | 'down' | 'stable';
  if (change > 2) direction = 'up';
  else if (change < -2) direction = 'down';
  else direction = 'stable';

  let magnitude: 'significant' | 'moderate' | 'minimal';
  if (changePercent > 10) magnitude = 'significant';
  else if (changePercent > 5) magnitude = 'moderate';
  else magnitude = 'minimal';

  return {
    direction,
    magnitude,
    change: Math.round(change * 10) / 10,
  };
}

// =============================================================================
// Component-Specific Calculators
// =============================================================================

/**
 * Calculate Search Reputation (C1) score
 */
export function calculateSearchReputation(input: {
  positiveResults: number;
  totalResults: number;
  knowledgePanelPresent: boolean;
  wikipediaPresent: boolean;
  negativeContentRatio: number;
}): number {
  const {
    positiveResults,
    totalResults,
    knowledgePanelPresent,
    wikipediaPresent,
    negativeContentRatio,
  } = input;

  let score = 0;

  // Positive results ratio (0-8 points)
  const positiveRatio = totalResults > 0 ? positiveResults / totalResults : 0;
  score += positiveRatio * 8;

  // Knowledge panel (0-4 points)
  if (knowledgePanelPresent) score += 4;

  // Wikipedia presence (0-3 points)
  if (wikipediaPresent) score += 3;

  // Negative content penalty (0-5 points, inverted)
  score += (1 - Math.min(negativeContentRatio, 1)) * 5;

  return Math.min(Math.round(score * 10) / 10, COMPONENT_CONFIG.c1.maxScore);
}

/**
 * Calculate Media Framing (C2) score
 */
export function calculateMediaFraming(input: {
  positiveMentions: number;
  totalMentions: number;
  tier1Mentions: number;
  expertQuotes: number;
  narrativeConsistency: number; // 0-1
}): number {
  const {
    positiveMentions,
    totalMentions,
    tier1Mentions,
    expertQuotes,
    narrativeConsistency,
  } = input;

  let score = 0;

  // Positive mentions ratio (0-8 points)
  const positiveRatio = totalMentions > 0 ? positiveMentions / totalMentions : 0;
  score += positiveRatio * 8;

  // Tier 1 media mentions (0-5 points, max at 10 mentions)
  score += Math.min(tier1Mentions / 2, 5);

  // Expert quotes (0-4 points, max at 8 quotes)
  score += Math.min(expertQuotes / 2, 4);

  // Narrative consistency (0-3 points)
  score += narrativeConsistency * 3;

  return Math.min(Math.round(score * 10) / 10, COMPONENT_CONFIG.c2.maxScore);
}

/**
 * Calculate Social Backlash (C3) score
 */
export function calculateSocialBacklash(input: {
  positiveSentiment: number;
  neutralSentiment: number;
  negativeSentiment: number;
  mentionVolume: number;
  engagementRate: number;
  crisisResponseTime?: number; // in hours
}): number {
  const {
    positiveSentiment,
    neutralSentiment,
    negativeSentiment,
    mentionVolume,
    engagementRate,
    crisisResponseTime,
  } = input;

  let score = 0;

  // Sentiment score (0-10 points)
  const totalSentiment = positiveSentiment + neutralSentiment + negativeSentiment;
  if (totalSentiment > 0) {
    const sentimentScore = (positiveSentiment - negativeSentiment) / totalSentiment;
    score += (sentimentScore + 1) * 5; // Normalize to 0-10
  }

  // Mention volume (0-4 points, logarithmic scale)
  score += Math.min(Math.log10(mentionVolume + 1) * 2, 4);

  // Engagement rate (0-4 points)
  score += Math.min(engagementRate * 100, 4);

  // Crisis response bonus (0-2 points)
  if (crisisResponseTime !== undefined) {
    if (crisisResponseTime < 1) score += 2;
    else if (crisisResponseTime < 4) score += 1;
  }

  return Math.min(Math.round(score * 10) / 10, COMPONENT_CONFIG.c3.maxScore);
}

/**
 * Calculate Elite Discourse (C4) score
 */
export function calculateEliteDiscourse(input: {
  peerMentions: number;
  leaderEndorsements: number;
  speakingInvitations: number;
  citations: number;
}): number {
  const {
    peerMentions,
    leaderEndorsements,
    speakingInvitations,
    citations,
  } = input;

  let score = 0;

  // Peer mentions (0-5 points, max at 20 mentions)
  score += Math.min(peerMentions / 4, 5);

  // Leader endorsements (0-4 points, max at 8 endorsements)
  score += Math.min(leaderEndorsements / 2, 4);

  // Speaking invitations (0-4 points, max at 8 invitations)
  score += Math.min(speakingInvitations / 2, 4);

  // Citations (0-2 points, max at 10 citations)
  score += Math.min(citations / 5, 2);

  return Math.min(Math.round(score * 10) / 10, COMPONENT_CONFIG.c4.maxScore);
}

/**
 * Calculate Third-Party Validation (C5) score
 */
export function calculateThirdPartyValidation(input: {
  awards: number;
  analystMentions: number;
  rankingLists: number;
  certifications: number;
}): number {
  const {
    awards,
    analystMentions,
    rankingLists,
    certifications,
  } = input;

  let score = 0;

  // Awards (0-6 points, diminishing returns)
  score += Math.min(awards * 2, 6);

  // Analyst mentions (0-4 points, max at 8 mentions)
  score += Math.min(analystMentions / 2, 4);

  // Ranking lists (0-3 points, max at 6 lists)
  score += Math.min(rankingLists / 2, 3);

  // Certifications (0-2 points, max at 4 certifications)
  score += Math.min(certifications / 2, 2);

  return Math.min(Math.round(score * 10) / 10, COMPONENT_CONFIG.c5.maxScore);
}

/**
 * Calculate Crisis Moat (C6) score
 */
export function calculateCrisisMoat(input: {
  crisesHandled: number;
  crisesRecovered: number;
  proactiveNarratives: number;
  trustIndex: number; // 0-1
  recoverySpeed: number; // average hours to recover
}): number {
  const {
    crisesHandled,
    crisesRecovered,
    proactiveNarratives,
    trustIndex,
    recoverySpeed,
  } = input;

  let score = 0;

  // Crisis recovery rate (0-4 points)
  if (crisesHandled > 0) {
    score += (crisesRecovered / crisesHandled) * 4;
  } else {
    score += 4; // No crises is good
  }

  // Proactive narratives (0-3 points, max at 6 narratives)
  score += Math.min(proactiveNarratives / 2, 3);

  // Trust index (0-2 points)
  score += trustIndex * 2;

  // Recovery speed (0-1 points)
  if (recoverySpeed < 24) score += 1;
  else if (recoverySpeed < 72) score += 0.5;

  return Math.min(Math.round(score * 10) / 10, COMPONENT_CONFIG.c6.maxScore);
}

// =============================================================================
// Full LSI Calculation
// =============================================================================

export interface LSICalculationInput {
  c1: Parameters<typeof calculateSearchReputation>[0];
  c2: Parameters<typeof calculateMediaFraming>[0];
  c3: Parameters<typeof calculateSocialBacklash>[0];
  c4: Parameters<typeof calculateEliteDiscourse>[0];
  c5: Parameters<typeof calculateThirdPartyValidation>[0];
  c6: Parameters<typeof calculateCrisisMoat>[0];
}

/**
 * Calculate complete LSI score from all inputs
 */
export function calculateLSI(input: LSICalculationInput): {
  components: LSIComponents;
  totalScore: number;
  percentage: number;
  classification: ReturnType<typeof getLSIClassification>;
} {
  const components: LSIComponents = {
    c1: calculateSearchReputation(input.c1),
    c2: calculateMediaFraming(input.c2),
    c3: calculateSocialBacklash(input.c3),
    c4: calculateEliteDiscourse(input.c4),
    c5: calculateThirdPartyValidation(input.c5),
    c6: calculateCrisisMoat(input.c6),
  };

  const totalScore = calculateTotalScore(components);
  const percentage = calculateLSIPercentage(totalScore);
  const classification = getLSIClassification(totalScore);

  return {
    components,
    totalScore,
    percentage,
    classification,
  };
}
