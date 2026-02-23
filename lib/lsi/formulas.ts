// lib/lsi/formulas.ts
import { standardDeviation } from '@/lib/utils/statistics';

interface DiscoverData {
  mentions: Array<{
    source: string;
    sentiment: number;
    frame: string;
    isExpertQuote?: boolean;
    tier?: number;
    snippet: string;
  }>;
  authoredArticles?: Array<{ count: number }>;
}

interface ComponentScores {
  c1: number;
  c2: number;
  c3: number;
  c4: number;
  c5: number;
  c6: number;
}

/**
 * Component 1: Search Reputation (0-20)
 * Measures Google results sentiment, frame distribution, and AI consistency
 */
export function calculateComponent1(data: DiscoverData): number {
  const { mentions } = data;
  
  // Filter to Google results (first 30)
  const googleResults = mentions
    .filter(m => m.source === 'google')
    .slice(0, 30);
  
  if (googleResults.length === 0) return 0;

  // Positive sentiment score (0-8)
  const positiveResults = googleResults.filter(m => m.sentiment > 0.2).length;
  const positiveScore = (positiveResults / 30) * 8;

  // Professional frame clarity (0-6)
  const professionalFrames = ['expert', 'founder', 'leader', 'innovator'];
  const professionalFrameResults = googleResults.filter(m => 
    professionalFrames.includes(m.frame.toLowerCase())
  ).length;
  const clarityScore = (professionalFrameResults / 30) * 6;

  // AI consistency score (0-4)
  // Measures consistency across AI-generated summaries
  const aiScore = calculateAIConsistency(googleResults) * 4;

  // Query diversity bonus (0-2)
  const uniqueQueries = new Set(googleResults.map(m => m.snippet.split(' ').slice(0, 3).join(' '))).size;
  const queryScore = Math.min((uniqueQueries / 10) * 2, 2);

  // Six Sigma bonus/penalty based on sentiment consistency
  const sentiments = googleResults.map(m => m.sentiment);
  const stdDev = standardDeviation(sentiments);
  const sigmaBonus = stdDev < 0.15 ? 2 : stdDev > 0.30 ? -2 : 0;

  const total = positiveScore + clarityScore + aiScore + queryScore + sigmaBonus;
  return Math.min(Math.max(total, 0), 20);
}

/**
 * Component 2: Media Framing (0-20)
 * Measures journalist quotes, expert positioning, and tier-1 media presence
 */
export function calculateComponent2(data: DiscoverData): number {
  const mediaSources = ['factiva', 'lexisnexis', 'economic_times', 'bloomberg', 'reuters'];
  const mediaMentions = data.mentions.filter(m => 
    mediaSources.includes(m.source.toLowerCase())
  );

  if (mediaMentions.length === 0) return 0;

  // Expert quotes score (0-8)
  const expertQuotes = mediaMentions.filter(m => m.isExpertQuote).length;
  const quotesScore = Math.min((expertQuotes / 10) * 8, 8);

  // Expert frame percentage (0-6)
  const expertFrameCount = mediaMentions.filter(m => 
    m.frame === 'expert'
  ).length;
  const expertFramePct = (expertFrameCount / mediaMentions.length) * 100;
  const frameScore = (expertFramePct / 100) * 6;

  // Tier-1 media mentions (0-4)
  const tier1Mentions = mediaMentions.filter(m => m.tier === 1).length;
  const tier1Score = Math.min((tier1Mentions / 5) * 4, 4);

  // Authored articles/bylines (0-2)
  const bylines = data.authoredArticles?.length || 0;
  const bylinesScore = Math.min((bylines / 6) * 2, 2);

  const total = quotesScore + frameScore + tier1Score + bylinesScore;
  return Math.min(total, 20);
}

/**
 * Component 3: Social Backlash (0-20)
 * Measures social media sentiment, volume, and controversy indicators
 */
export function calculateComponent3(data: DiscoverData): number {
  const socialMentions = data.mentions.filter(m => 
    ['twitter', 'linkedin', 'facebook', 'instagram'].includes(m.source.toLowerCase())
  );

  if (socialMentions.length === 0) return 10; // Neutral if no data

  // Sentiment analysis (0-10)
  const avgSentiment = socialMentions.reduce((sum, m) => sum + m.sentiment, 0) / socialMentions.length;
  const sentimentScore = ((avgSentiment + 1) / 2) * 10; // Normalize -1,1 to 0,10

  // Volume normalization (0-5)
  const volumeScore = Math.min(socialMentions.length / 100, 1) * 5;

  // Controversy detection (0-5)
  // Lower score if high variance in sentiment (indicates controversy)
  const sentiments = socialMentions.map(m => m.sentiment);
  const sentimentVariance = standardDeviation(sentiments);
  const controversyPenalty = sentimentVariance > 0.5 ? 2 : 0;
  const consistencyScore = 5 - controversyPenalty;

  return Math.min(sentimentScore + volumeScore + consistencyScore, 20);
}

/**
 * Component 4: Elite Discourse (0-15)
 * Measures citations by industry leaders and academic references
 */
export function calculateComponent4(data: DiscoverData): number {
  const eliteMentions = data.mentions.filter(m => 
    m.source.includes('linkedin') && m.frame === 'expert'
  );

  // Citation count (0-8)
  const uniqueCitations = new Set(eliteMentions.map(m => m.snippet)).size;
  const citationScore = Math.min((uniqueCitations / 20) * 8, 8);

  // Academic/professional references (0-4)
  const academicRefs = data.mentions.filter(m => 
    m.source.includes('research') || m.source.includes('academia')
  ).length;
  const academicScore = Math.min((academicRefs / 5) * 4, 4);

  // Thought leadership indicators (0-3)
  const thoughtLeadership = data.mentions.filter(m => 
    m.snippet.toLowerCase().includes('according to') ||
    m.snippet.toLowerCase().includes('says')
  ).length;
  const leadershipScore = Math.min((thoughtLeadership / 10) * 3, 3);

  return Math.min(citationScore + academicScore + leadershipScore, 15);
}

/**
 * Component 5: Third-Party Validation (0-15)
 * Measures awards, rankings, and analyst coverage
 */
export function calculateComponent5(data: DiscoverData): number {
  // Awards and recognition (0-6)
  const awardMentions = data.mentions.filter(m => 
    m.frame === 'award' || m.snippet.toLowerCase().includes('award')
  ).length;
  const awardScore = Math.min((awardMentions / 3) * 6, 6);

  // Rankings and lists (0-5)
  const rankingMentions = data.mentions.filter(m => 
    m.snippet.toLowerCase().includes('top') ||
    m.snippet.toLowerCase().includes('ranking') ||
    m.snippet.toLowerCase().includes('list')
  ).length;
  const rankingScore = Math.min((rankingMentions / 5) * 5, 5);

  // Analyst coverage (0-4)
  const analystMentions = data.mentions.filter(m => 
    m.source.includes('gartner') || 
    m.source.includes('forrester') ||
    m.source.includes('idc')
  ).length;
  const analystScore = Math.min((analystMentions / 2) * 4, 4);

  return Math.min(awardScore + rankingScore + analystScore, 15);
}

/**
 * Component 6: Crisis Moat (0-10)
 * Measures resilience and narrative defense capabilities
 */
export function calculateComponent6(data: DiscoverData): number {
  // Crisis response mentions (0-4)
  const crisisMentions = data.mentions.filter(m => 
    m.frame === 'crisis' || m.sentiment < -0.3
  ).length;
  
  // If no crisis mentions, maximum score (no vulnerability)
  if (crisisMentions === 0) return 10;

  // Recovery sentiment (0-3)
  const crisisSentiments = data.mentions
    .filter(m => m.frame === 'crisis')
    .map(m => m.sentiment);
  
  const avgCrisisSentiment = crisisSentiments.length > 0
    ? crisisSentiments.reduce((a, b) => a + b, 0) / crisisSentiments.length
    : 0;
  
  const recoveryScore = ((avgCrisisSentiment + 1) / 2) * 3;

  // Proactive narrative control (0-3)
  const proactiveMentions = data.mentions.filter(m => 
    m.snippet.toLowerCase().includes('announced') ||
    m.snippet.toLowerCase().includes('launched') ||
    m.snippet.toLowerCase().includes('introduced')
  ).length;
  const proactiveScore = Math.min((proactiveMentions / 10) * 3, 3);

  return Math.min(4 + recoveryScore + proactiveScore, 10);
}

/**
 * Helper: Calculate AI consistency across search results
 */
function calculateAIConsistency(results: DiscoverData['mentions']): number {
  if (results.length < 5) return 0.5;
  
  const sentiments = results.map(r => r.sentiment);
  const mean = sentiments.reduce((a, b) => a + b, 0) / sentiments.length;
  
  // Calculate coefficient of variation
  const stdDev = standardDeviation(sentiments);
  const cv = stdDev / Math.abs(mean);
  
  // Higher consistency = lower CV, max score at CV < 0.2
  return Math.max(0, Math.min(1, 1 - (cv / 0.5)));
}

/**
 * Calculate Six Sigma statistics
 */
export function calculateSixSigmaBaseline(scores: number[]): {
  mean: number;
  stddev: number;
  ucl: number;
  lcl: number;
} {
  if (scores.length === 0) {
    return { mean: 50, stddev: 10, ucl: 80, lcl: 20 };
  }

  const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
  const stddev = standardDeviation(scores);
  
  // Upper and Lower Control Limits (3 sigma)
  const ucl = mean + (3 * stddev);
  const lcl = Math.max(0, mean - (3 * stddev));

  return {
    mean: Math.round(mean * 10) / 10,
    stddev: Math.round(stddev * 10) / 10,
    ucl: Math.round(ucl * 10) / 10,
    lcl: Math.round(lcl * 10) / 10,
  };
}

/**
 * Identify priority gaps using Pareto analysis
 */
export function identifyGaps(
  current: ComponentScores,
  targets: ComponentScores
): Array<{ component: string; gap: number; priority: number }> {
  const componentNames: Record<keyof ComponentScores, string> = {
    c1: 'Search Reputation',
    c2: 'Media Framing',
    c3: 'Social Backlash',
    c4: 'Elite Discourse',
    c5: 'Third-Party Validation',
    c6: 'Crisis Moat'
  };

  const gaps = (Object.keys(current) as Array<keyof ComponentScores>)
    .map(key => ({
      component: componentNames[key],
      gap: Math.round((targets[key] - current[key]) * 10) / 10,
      rawGap: targets[key] - current[key]
    }))
    .filter(g => g.gap > 0)
    .sort((a, b) => b.rawGap - a.rawGap);

  // Assign priority based on Pareto (80/20 rule)
  const totalGap = gaps.reduce((sum, g) => sum + g.rawGap, 0);
  let cumulativeGap = 0;
  
  return gaps.map((gap, index) => {
    cumulativeGap += gap.rawGap;
    const percentile = cumulativeGap / totalGap;
    const priority = percentile <= 0.8 ? index + 1 : index + 1;
    
    return {
      component: gap.component,
      gap: gap.gap,
      priority
    };
  });
}