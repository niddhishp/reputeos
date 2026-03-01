/**
 * AI ANALYSIS MODULE
 * Routes all AI calls through OpenRouter for cost optimization:
 * - Sentiment + Frame detection → DeepSeek V3 (bulk, cheap)
 * - Archetype hints → GPT-4o-mini (reasoning)
 * - LSI narrative → Claude Haiku (summaries)
 * - Crisis detection → DeepSeek V3 (keyword + reasoning)
 */

import { SourceResult, AnalysisResult, LSIResult, ClientProfile } from './types';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY; // fallback

const OPENROUTER_BASE = 'https://openrouter.ai/api/v1';
const OPENROUTER_HEADERS = {
  'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
  'Content-Type': 'application/json',
  'HTTP-Referer': 'https://reputeos.com',
  'X-Title': 'ReputeOS',
};

async function openRouterChat(
  model: string,
  messages: Array<{ role: string; content: string }>,
  maxTokens = 1000,
  jsonMode = false
): Promise<string | null> {
  const key = OPENROUTER_API_KEY ?? OPENAI_API_KEY;
  if (!key) return null;

  const baseUrl = OPENROUTER_API_KEY ? OPENROUTER_BASE : 'https://api.openai.com/v1';
  const actualModel = OPENROUTER_API_KEY ? model : 'gpt-4o-mini';
  const headers = OPENROUTER_API_KEY
    ? OPENROUTER_HEADERS
    : { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' };

  try {
    const body: Record<string, unknown> = { model: actualModel, messages, max_tokens: maxTokens };
    if (jsonMode) body.response_format = { type: 'json_object' };

    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(30000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.choices?.[0]?.message?.content ?? null;
  } catch {
    return null;
  }
}

/** Batch sentiment + frame analysis using DeepSeek V3 (cheapest for bulk classification) */
export async function analyzeSentimentAndFrames(
  results: SourceResult[],
  client: ClientProfile
): Promise<SourceResult[]> {
  if (!results.length) return results;

  // Process in batches of 20 to stay within token limits
  const BATCH_SIZE = 20;
  const enriched: SourceResult[] = [];

  for (let i = 0; i < results.length; i += BATCH_SIZE) {
    const batch = results.slice(i, i + BATCH_SIZE);

    const itemsText = batch.map((r, idx) =>
      `[${idx}] Source: ${r.source}\nTitle: ${r.title}\nText: ${r.snippet}`
    ).join('\n\n---\n\n');

    const prompt = `Analyze each item below about ${client.name}. For each, return a JSON array entry with:
- "idx": the index number
- "sentiment": float -1.0 (very negative) to 1.0 (very positive), 0 = neutral
- "frame": one of: "expert" (shows expertise/authority), "founder" (entrepreneurial/builder), "leader" (leadership/visionary), "family" (personal/legacy), "crisis" (scandal/legal/controversy), "other"
- "relevance": float 0-1 (how relevant to the person's reputation)

Return ONLY a valid JSON array, no other text.

Items to analyze:
${itemsText}`;

    const response = await openRouterChat(
      'deepseek/deepseek-chat',
      [{ role: 'user', content: prompt }],
      800,
      true
    );

    if (response) {
      try {
        // Handle both array and object with array property
        const parsed = JSON.parse(response);
        const arr: Array<{ idx: number; sentiment: number; frame: string; relevance: number }> =
          Array.isArray(parsed) ? parsed : (parsed.items ?? parsed.results ?? []);

        for (const item of arr) {
          if (batch[item.idx]) {
            batch[item.idx].sentiment = item.sentiment;
            batch[item.idx].frame = item.frame;
            batch[item.idx].relevanceScore = item.relevance;
          }
        }
      } catch {
        // If parsing fails, assign neutral values
        batch.forEach(r => { r.sentiment = 0; r.frame = 'other'; });
      }
    }

    enriched.push(...batch);
  }

  return enriched;
}

/** Extract top keywords from all results */
function extractKeywords(results: SourceResult[], client: ClientProfile): string[] {
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
    'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
    'should', 'may', 'might', 'shall', 'that', 'this', 'these', 'those',
    'said', 'says', 'told', 'new', 'also', 'its', 'his', 'her', 'their',
  ]);

  const nameParts = client.name.toLowerCase().split(' ');
  const wordCount: Record<string, number> = {};

  for (const r of results) {
    const text = `${r.title} ${r.snippet}`.toLowerCase();
    const words = text.match(/\b[a-z]{4,}\b/g) ?? [];
    for (const word of words) {
      if (stopWords.has(word)) continue;
      if (nameParts.includes(word)) continue;
      wordCount[word] = (wordCount[word] ?? 0) + 1;
    }
  }

  return Object.entries(wordCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 15)
    .map(([word]) => word);
}

/** Calculate LSI scores from enriched results */
export function calculateLSI(results: SourceResult[], client: ClientProfile): LSIResult {
  const byCategory = (cat: string) => results.filter(r => r.category === cat);
  const bySource = (source: string) => results.filter(r => r.source.toLowerCase().includes(source.toLowerCase()));

  // C1: Search Reputation (0-20)
  // Based on Google results sentiment and framing
  const searchResults = byCategory('search');
  const googleResults = bySource('google');
  const positiveSearch = googleResults.filter(r => (r.sentiment ?? 0) > 0.2).length;
  const professionalFrame = searchResults.filter(r =>
    ['expert', 'founder', 'leader'].includes(r.frame ?? '')
  ).length;
  const c1 = Math.min(
    (positiveSearch / Math.max(googleResults.length, 1)) * 10 +
    (professionalFrame / Math.max(searchResults.length, 1)) * 10,
    20
  );

  // C2: Media Framing (0-20)
  // Based on news source quality and expert framing
  const newsResults = byCategory('news');
  const expertMediaFrame = newsResults.filter(r => r.frame === 'expert').length;
  const positiveNews = newsResults.filter(r => (r.sentiment ?? 0) > 0.1).length;
  const tier1Sources = newsResults.filter(r =>
    ['Economic Times', 'Business Standard', 'Livemint', 'Bloomberg',
     'Reuters', 'The Guardian', 'New York Times', 'Financial Times'].includes(r.source)
  ).length;
  const c2 = Math.min(
    (expertMediaFrame / Math.max(newsResults.length, 1)) * 8 +
    (positiveNews / Math.max(newsResults.length, 1)) * 6 +
    Math.min(tier1Sources * 1.5, 6),
    20
  );

  // C3: Social Backlash Score (0-20)
  // Higher score = LESS backlash. Check for negative social signals
  const socialResults = byCategory('social');
  const negativeSocial = socialResults.filter(r => (r.sentiment ?? 0) < -0.3).length;
  const crisisSocial = socialResults.filter(r => r.frame === 'crisis').length;
  const socialRisk = (negativeSocial + crisisSocial * 2) / Math.max(socialResults.length, 1);
  const c3 = Math.max(20 - socialRisk * 20, 0);

  // C4: Elite Discourse (0-15)
  // Academic citations, professional networks, thought leadership
  const academicResults = byCategory('academic');
  const videoResults = byCategory('video');
  const linkedinResults = bySource('linkedin');
  const podcastResults = videoResults.filter(r =>
    r.source.toLowerCase().includes('podcast') || r.source === 'Podcast Index'
  );
  const c4 = Math.min(
    Math.min(academicResults.length * 2, 6) +
    Math.min(podcastResults.length * 1.5, 5) +
    Math.min(linkedinResults.length * 1.5, 4),
    15
  );

  // C5: Third-Party Validation (0-15)
  // Quotes, endorsements, mentions in authoritative sources
  const financialResults = byCategory('financial');
  const authorityMentions = [
    ...newsResults.filter(r => ['Bloomberg', 'Reuters', 'FT', 'WSJ'].includes(r.source)),
    ...academicResults,
    ...financialResults.filter(r => ['Crunchbase', 'PitchBook', 'Tracxn'].includes(r.source)),
  ];
  const c5 = Math.min(authorityMentions.length * 2.5, 15);

  // C6: Crisis Moat (0-10)
  // Absence of regulatory/legal issues
  const regulatoryResults = byCategory('regulatory');
  const crisisResults = results.filter(r => r.frame === 'crisis');
  const crisisSignals = results.filter(r =>
    r.metadata?.crisisSignal === true ||
    r.source.toLowerCase().includes('ed/cbi') ||
    r.source === 'SEBI' || r.source === 'RBI'
  );
  const crisisRisk = (crisisResults.length * 2 + crisisSignals.length * 3) / 10;
  const c6 = Math.max(10 - crisisRisk, 0);

  const components = {
    c1: Math.round(c1 * 10) / 10,
    c2: Math.round(c2 * 10) / 10,
    c3: Math.round(c3 * 10) / 10,
    c4: Math.round(c4 * 10) / 10,
    c5: Math.round(c5 * 10) / 10,
    c6: Math.round(c6 * 10) / 10,
  };

  const total = Math.round(
    (components.c1 + components.c2 + components.c3 +
     components.c4 + components.c5 + components.c6) * 10
  ) / 10;

  // Gap analysis
  const maxScores = { c1: 20, c2: 20, c3: 20, c4: 15, c5: 15, c6: 10 };
  const componentNames = {
    c1: 'Search Reputation', c2: 'Media Framing',
    c3: 'Social Backlash', c4: 'Elite Discourse',
    c5: 'Third-Party Validation', c6: 'Crisis Moat',
  };

  const gaps = (Object.keys(components) as Array<keyof typeof components>)
    .map(key => ({
      component: componentNames[key],
      current: components[key],
      max: maxScores[key],
      gap: maxScores[key] - components[key],
    }))
    .sort((a, b) => b.gap - a.gap);

  // Statistical baseline
  const sentiments = results.map(r => r.sentiment ?? 0);
  const mean = sentiments.reduce((a, b) => a + b, 0) / Math.max(sentiments.length, 1);
  const variance = sentiments.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / Math.max(sentiments.length, 1);
  const stddev = Math.sqrt(variance);

  return {
    total,
    components,
    gaps,
    stats: {
      mean: Math.round(mean * 100) / 100,
      stddev: Math.round(stddev * 100) / 100,
      ucl: Math.round((mean + 3 * stddev) * 100) / 100,
      lcl: Math.round((mean - 3 * stddev) * 100) / 100,
    },
  };
}

/** Full AI analysis: sentiment + frames + keywords + archetype hints + crisis signals */
export async function runFullAnalysis(
  rawResults: SourceResult[],
  client: ClientProfile
): Promise<{ enrichedResults: SourceResult[]; analysis: AnalysisResult; lsi: LSIResult }> {

  // Step 1: Enrich with sentiment + frames (DeepSeek V3 batch)
  const enrichedResults = await analyzeSentimentAndFrames(rawResults, client);

  // Step 2: Calculate distributions
  const sentiments = enrichedResults.map(r => r.sentiment ?? 0);
  const avgSentiment = sentiments.reduce((a, b) => a + b, 0) / Math.max(sentiments.length, 1);
  const positive = sentiments.filter(s => s > 0.2).length;
  const negative = sentiments.filter(s => s < -0.2).length;
  const neutral = sentiments.length - positive - negative;

  const frames = enrichedResults.map(r => r.frame ?? 'other');
  const frameCounts = {
    expert: frames.filter(f => f === 'expert').length,
    founder: frames.filter(f => f === 'founder').length,
    leader: frames.filter(f => f === 'leader').length,
    family: frames.filter(f => f === 'family').length,
    crisis: frames.filter(f => f === 'crisis').length,
    other: frames.filter(f => f === 'other').length,
  };

  const totalFrames = Math.max(Object.values(frameCounts).reduce((a, b) => a + b, 0), 1);
  const framePct = {
    expert: Math.round((frameCounts.expert / totalFrames) * 100),
    founder: Math.round((frameCounts.founder / totalFrames) * 100),
    leader: Math.round((frameCounts.leader / totalFrames) * 100),
    family: Math.round((frameCounts.family / totalFrames) * 100),
    crisis: Math.round((frameCounts.crisis / totalFrames) * 100),
    other: Math.round((frameCounts.other / totalFrames) * 100),
  };

  // Step 3: Extract keywords
  const topKeywords = extractKeywords(enrichedResults, client);

  // Step 4: Crisis signals
  const crisisResults = enrichedResults.filter(r =>
    r.frame === 'crisis' || r.metadata?.crisisSignal === true
  );
  const crisisSignals = crisisResults.slice(0, 5).map(r =>
    `${r.source}: ${r.title.slice(0, 80)}`
  );

  // Step 5: Archetype hints via GPT-4o-mini
  const archetypeHints: string[] = [];
  if (enrichedResults.length > 0) {
    const topResults = enrichedResults
      .sort((a, b) => (b.relevanceScore ?? 0) - (a.relevanceScore ?? 0))
      .slice(0, 10)
      .map(r => `${r.source}: ${r.title} — ${r.snippet.slice(0, 150)}`)
      .join('\n');

    const archetypeResponse = await openRouterChat(
      'openai/gpt-4o-mini',
      [{
        role: 'user',
        content: `Based on these search results about ${client.name}${client.role ? `, ${client.role}` : ''}${client.industry ? ` in ${client.industry}` : ''}, suggest 2-3 Jungian archetypes that best match their public persona. Choose from: Sage, Hero, Ruler, Creator, Caregiver, Explorer, Rebel, Lover, Jester, Everyman, Magician, Innocent. Also suggest 1-2 professional archetypes like: Maverick CEO, Ecosystem Builder, Technical Visionary, Industry Transformer, Academic Practitioner.

Results:
${topResults}

Return ONLY a JSON object: {"archetypes": ["archetype1", "archetype2"], "rationale": "brief reason"}`,
      }],
      300,
      true
    );

    if (archetypeResponse) {
      try {
        const parsed = JSON.parse(archetypeResponse);
        archetypeHints.push(...(parsed.archetypes ?? []));
      } catch { /* ignore */ }
    }
  }

  // Step 6: AI narrative summary via Claude Haiku
  let summary = `Discovery scan complete for ${client.name}. Found ${enrichedResults.length} mentions across ${new Set(enrichedResults.map(r => r.source)).size} sources.`;

  const narrativeResponse = await openRouterChat(
    'anthropic/claude-haiku-20240307',
    [{
      role: 'user',
      content: `Write a 3-sentence executive summary of the reputation profile for ${client.name}${client.company ? ` at ${client.company}` : ''}. 

Data: ${enrichedResults.length} total mentions | Sentiment: ${Math.round(positive / enrichedResults.length * 100)}% positive, ${Math.round(negative / enrichedResults.length * 100)}% negative | Primary frame: ${Object.entries(frameCounts).sort(([,a],[,b]) => b-a)[0][0]} | LSI score context: ${avgSentiment > 0.2 ? 'positive reputation' : avgSentiment < -0.1 ? 'reputational risk present' : 'neutral/mixed reputation'}${crisisSignals.length ? ' | WARNING: Crisis signals detected' : ''}.

Top sources: ${[...new Set(enrichedResults.slice(0, 10).map(r => r.source))].join(', ')}.

Be specific, professional, and data-driven. No fluff.`,
    }],
    200
  );

  if (narrativeResponse) summary = narrativeResponse;

  // Step 7: Calculate LSI
  const lsi = calculateLSI(enrichedResults, client);

  const analysis: AnalysisResult = {
    sentiment: {
      positive: Math.round((positive / Math.max(enrichedResults.length, 1)) * 100),
      neutral: Math.round((neutral / Math.max(enrichedResults.length, 1)) * 100),
      negative: Math.round((negative / Math.max(enrichedResults.length, 1)) * 100),
      average: Math.round(avgSentiment * 100) / 100,
    },
    frames: framePct,
    topKeywords,
    archetypeHints,
    crisisSignals,
    summary,
  };

  return { enrichedResults, analysis, lsi };
}
