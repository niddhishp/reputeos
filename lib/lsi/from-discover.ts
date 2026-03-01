/**
 * lib/lsi/from-discover.ts
 *
 * Derives LSI component inputs directly from discover_run scan data.
 * This is the bridge: raw scan output → structured LSI inputs → score.
 *
 * No AI needed here — pure signal extraction from classified mentions.
 */

import { LSICalculationInput } from './calculator';

interface SentimentDist {
  positive: number; // %
  neutral: number;
  negative: number;
  average?: number; // -1 to +1
}

interface FrameDist {
  expert: number;   // %
  founder: number;
  leader: number;
  family: number;
  crisis: number;
  other: number;
}

interface MentionRow {
  source: string;
  category: string;
  sentiment: number;  // -1 to +1
  frame: string;
  title?: string;
  relevance_score?: number;
}

interface DiscoverRunData {
  total_mentions: number;
  sentiment_dist: SentimentDist;
  frame_dist: FrameDist;
  top_keywords: string[];
  mentions: MentionRow[];
  archetype_hints?: string[];
  crisis_signals?: string[];
  analysis_summary?: string;
  lsi_preliminary?: number;
}

const TIER1_SOURCES = new Set([
  'Bloomberg', 'Reuters', 'Financial Times', 'Wall Street Journal',
  'The Economist', 'New York Times', 'The Guardian', 'Business Standard',
  'Economic Times', 'Livemint', 'Moneycontrol', 'Forbes India',
  'NDTV Profit', 'Hindustan Times Business',
]);

const AUTHORITY_SOURCES = new Set([
  'Crunchbase', 'PitchBook', 'Tracxn', 'Semantic Scholar', 'Google Scholar',
  'SSRN', 'ResearchGate', 'IIM Bangalore', 'IIM Ahmedabad', 'IIT Bombay',
  'TED/TEDx', 'Podcast Index', 'LinkedIn',
]);

const REGULATORY_SOURCES = new Set([
  'SEBI', 'RBI', 'MCA India', 'NCLT', 'NCLAT', 'CCI',
  'ED/CBI/SFIO (Enforcement)', 'eCourts India',
]);

export function deriveInputsFromDiscover(run: DiscoverRunData): LSICalculationInput {
  const mentions: MentionRow[] = run.mentions ?? [];
  const total = run.total_mentions ?? mentions.length;
  const sentiment = run.sentiment_dist ?? { positive: 50, neutral: 30, negative: 20 };
  const frames = run.frame_dist ?? { expert: 20, founder: 10, leader: 10, family: 30, crisis: 5, other: 25 };
  const crisis = run.crisis_signals ?? [];

  // ── By category ────────────────────────────────────────────────────────────
  const searchMentions  = mentions.filter(m => m.category === 'search');
  const newsMentions    = mentions.filter(m => m.category === 'news');
  const socialMentions  = mentions.filter(m => m.category === 'social');
  const academicMentions= mentions.filter(m => m.category === 'academic');
  const videoMentions   = mentions.filter(m => m.category === 'video');
  const financialMentions= mentions.filter(m => m.category === 'financial');
  const regMentions     = mentions.filter(m => m.category === 'regulatory');

  // ── C1: Search Reputation (0-20) ───────────────────────────────────────────
  const googleMentions = searchMentions.filter(m =>
    m.source.toLowerCase().includes('google')
  );
  const positiveSearch = googleMentions.filter(m => m.sentiment > 0.2).length;
  const knowledgePanelPresent = searchMentions.some(m =>
    m.source === 'Google Knowledge Graph'
  );
  const wikipediaPresent = searchMentions.some(m => m.source === 'Wikipedia');
  const negativeSentimentRatio = (sentiment.negative ?? 0) / 100;

  const c1 = {
    positiveResults: positiveSearch,
    totalResults: Math.max(googleMentions.length, 1),
    knowledgePanelPresent,
    wikipediaPresent,
    negativeContentRatio: Math.min(negativeSentimentRatio, 1),
  };

  // ── C2: Media Framing (0-20) ────────────────────────────────────────────────
  const posNews = newsMentions.filter(m => m.sentiment > 0.1).length;
  const tier1Count = newsMentions.filter(m => TIER1_SOURCES.has(m.source)).length;
  const expertQuotesEst = newsMentions.filter(m =>
    m.frame === 'expert' || m.frame === 'leader'
  ).length;
  // Narrative consistency: if expert+leader frames dominate news, high consistency
  const expertFrameRatio = ((frames.expert ?? 0) + (frames.leader ?? 0)) / 100;

  const c2 = {
    positiveMentions: posNews,
    totalMentions: Math.max(newsMentions.length, 1),
    tier1Mentions: tier1Count,
    expertQuotes: expertQuotesEst,
    narrativeConsistency: Math.min(expertFrameRatio * 1.5, 1), // boost slightly
  };

  // ── C3: Social Backlash (0-20) ──────────────────────────────────────────────
  // Higher score = LESS backlash (inverse metric)
  const posSocial   = Math.round(socialMentions.length * (sentiment.positive / 100));
  const neutSocial  = Math.round(socialMentions.length * (sentiment.neutral / 100));
  const negSocial   = Math.round(socialMentions.length * (sentiment.negative / 100));
  const crisisFrameSocial = socialMentions.filter(m => m.frame === 'crisis').length;
  // Engagement rate estimate: more mentions = more engagement (logarithmic)
  const engagementEst = Math.min(Math.log10(total + 1) / 4, 0.1);

  const c3 = {
    positiveSentiment: Math.max(posSocial - crisisFrameSocial, 0), // crisis frames reduce positive
    neutralSentiment: neutSocial,
    negativeSentiment: negSocial + crisisFrameSocial,
    mentionVolume: Math.max(socialMentions.length, 1),
    engagementRate: engagementEst,
    crisisResponseTime: crisis.length > 0 ? 48 : undefined, // assume slow if crisis signals
  };

  // ── C4: Elite Discourse (0-15) ──────────────────────────────────────────────
  const academicCount  = academicMentions.length;
  const podcastCount   = videoMentions.filter(m =>
    m.source.toLowerCase().includes('podcast') || m.source === 'Podcast Index'
  ).length;
  const tedCount       = videoMentions.filter(m =>
    m.source.toLowerCase().includes('ted')
  ).length;
  const linkedinDepth  = mentions.filter(m => m.source === 'LinkedIn Profile').length;
  // Citations from Semantic Scholar
  const citationMentions = academicMentions.filter(m =>
    m.source === 'Semantic Scholar' || m.source === 'Google Scholar'
  ).length;

  const c4 = {
    peerMentions: linkedinDepth * 3 + tedCount * 4,  // weighted
    leaderEndorsements: tedCount * 2 + podcastCount,
    speakingInvitations: tedCount + podcastCount,
    citations: citationMentions * 2,
  };

  // ── C5: Third-Party Validation (0-15) ───────────────────────────────────────
  const authorityMentions = mentions.filter(m => AUTHORITY_SOURCES.has(m.source));
  const crunchbaseMentions= financialMentions.filter(m =>
    ['Crunchbase', 'PitchBook', 'Tracxn', 'Wellfound/AngelList'].includes(m.source)
  );
  const rankingLists = financialMentions.filter(m => {
    const t = (m.title ?? '').toLowerCase();
    return t.includes('top') || t.includes('list') || t.includes('rank');
  }).length;

  const c5 = {
    awards: crunchbaseMentions.length > 0 ? 1 : 0, // funding = validation
    analystMentions: authorityMentions.length,
    rankingLists,
    certifications: academicMentions.length > 2 ? 1 : 0, // academic presence = credential
  };

  // ── C6: Crisis Moat (0-10) ──────────────────────────────────────────────────
  const hasCrisisFrame   = (frames.crisis ?? 0) > 10; // >10% crisis framing = concern
  const hasRegIssues     = regMentions.filter(m =>
    m.frame === 'crisis' || m.sentiment < -0.3
  ).length > 0;
  const crisisCount      = crisis.length;
  const negativeMentions = mentions.filter(m => m.sentiment < -0.3).length;
  const proactiveContent = mentions.filter(m =>
    m.frame === 'expert' && m.sentiment > 0.3
  ).length;
  // Trust proxy: if very few negative mentions in regulatory, trust is high
  const trustProxy = hasRegIssues ? 0.2 : hasCrisisFrame ? 0.5 : 0.8;

  const c6 = {
    crisesHandled: crisisCount,
    crisesRecovered: Math.max(crisisCount - negativeMentions, 0),
    proactiveNarratives: Math.min(proactiveContent, 10),
    trustIndex: trustProxy,
    recoverySpeed: hasRegIssues ? 120 : 24,
  };

  return { c1, c2, c3, c4, c5, c6 };
}

/** Quick signal summary for archetype assignment context */
export function buildSignalSummary(run: DiscoverRunData) {
  const frames = run.frame_dist ?? {};
  const sorted = Object.entries(frames)
    .sort(([, a], [, b]) => (b as number) - (a as number));
  const dominantFrame = sorted[0]?.[0] ?? 'other';
  const secondaryFrame = sorted[1]?.[0] ?? 'other';

  return {
    totalMentions: run.total_mentions ?? 0,
    dominantFrame,
    secondaryFrame,
    sentimentProfile: run.sentiment_dist,
    topKeywords: (run.top_keywords ?? []).slice(0, 10),
    archetypeHints: run.archetype_hints ?? [],
    crisisSignals: run.crisis_signals ?? [],
    hasCrisisRisk: (run.crisis_signals?.length ?? 0) > 0,
    hasRegRisk: false, // set by caller if regulatory mentions exist
    summary: run.analysis_summary ?? '',
  };
}
