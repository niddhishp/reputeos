/**
 * Deep Search Query Generator
 *
 * Generates 40+ targeted search queries BEFORE the scan runs.
 * KEY PRINCIPLE: If the client profile mentions specific works (films, books, articles),
 * generate direct queries for those works — never rely on AI to "find" them later.
 */

import { callAI, parseAIJson } from '../call';

export interface SearchQuerySet {
  core_identity:     string[];  // "[name]", "[name] [role]", "[name] [company]"
  works_creative:    string[];  // specific titles from profile + inferred works
  thought_leader:    string[];  // articles, talks, podcasts
  platform_specific: string[];  // site:youtube.com, site:linkedin.com etc
  media_mentions:    string[];  // "[name]" interview, "[name]" quotes
  professional:      string[];  // awards, boards, investments, exits
  social_discovery:  string[];  // channel searches
  amazon_books:      string[];  // amazon author search
  legal_regulatory:  string[];  // court, SEBI, MCA
  crisis_signals:    string[];  // controversy, lawsuit
}

export async function generateDeepSearchQueries(client: {
  name: string;
  role?: string;
  company?: string;
  industry?: string;
  keywords?: string[];
  bio?: string;
  linkedin_url?: string;
  social_links?: Record<string, string>;
}): Promise<SearchQuerySet> {

  // ── STEP 1: Extract known works from profile (deterministic, not AI) ───────
  const knownTitles = extractTitlesFromProfile(client.bio ?? '', client.keywords ?? []);

  // ── STEP 2: Extract social handles (deterministic) ─────────────────────────
  const links = client.social_links ?? {};
  const youtubeUrl  = links.youtube  ?? links.YouTube  ?? '';
  const linkedinUrl = client.linkedin_url ?? links.linkedin ?? '';

  const knownLinksText = Object.entries(links)
    .filter(([, v]) => v)
    .map(([k, v]) => `${k}: ${v}`)
    .join(', ');

  // ── STEP 3: Hardcode queries for every known title ─────────────────────────
  const knownWorkQueries: string[] = knownTitles.flatMap(title => [
    `"${title}"`,
    `"${title}" ${client.name}`,
    `"${title}" review`,
    `"${title}" film movie`,
  ]);

  // YouTube-specific if we have a YouTube link
  const youtubeQueries: string[] = youtubeUrl
    ? [
        `site:youtube.com "${client.name}"`,
        `site:youtube.com/channel ${youtubeUrl}`,
        `"${client.name}" youtube interview`,
      ]
    : [
        `site:youtube.com "${client.name}"`,
        `"${client.name}" youtube`,
        `"${client.name}" youtube interview`,
        `"${client.name}" youtube channel`,
      ];

  // ── STEP 4: AI generates broader discovery queries ─────────────────────────
  const result = await callAI({
    systemPrompt: `You are a professional OSINT researcher generating exhaustive search queries to build a complete digital profile.
Think like a journalist doing deep background research.
CRITICAL: Return only REAL search strings — no placeholders, no descriptions, no "generate X more" text.
Every item must be a string you would literally type into Google.
Return ONLY valid JSON.`,
    userPrompt: `Generate deep search queries for:

Name: ${client.name}
Role: ${client.role ?? 'not specified'}
Company: ${client.company ?? 'not specified'}
Industry: ${client.industry ?? 'not specified'}
Keywords: ${(client.keywords ?? []).join(', ') || 'none'}
Bio excerpt: ${(client.bio ?? '').slice(0, 300) || 'none'}
Known social links: ${knownLinksText || 'none provided'}
Known titles/works already covered: ${knownTitles.join(', ') || 'none'}

Generate queries that are ADDITIONAL to the known titles already listed above.
Focus on: media coverage, interviews, articles they've written, award nominations, industry recognition, peer mentions.

Return JSON:
{
  "core_identity": ["${client.name}", "${client.name} ${client.role ?? ''}", "${client.name} ${client.company ?? ''}", "\"${client.name}\" biography", "\"${client.name}\" profile"],
  "works_creative": ["5-8 queries for their creative works NOT already in the known titles list"],
  "thought_leader": ["\"${client.name}\" article", "\"${client.name}\" interview", "\"${client.name}\" op-ed", "\"${client.name}\" LinkedIn article", "\"${client.name}\" podcast guest", "\"${client.name}\" Medium", "\"${client.name}\" speaks"],
  "platform_specific": ["site:linkedin.com \"${client.name}\"", "site:medium.com \"${client.name}\"", "site:substack.com \"${client.name}\"", "site:instagram.com \"${client.name}\"", "site:twitter.com \"${client.name}\"", "2-3 more based on industry"],
  "amazon_books": ["site:amazon.in \"${client.name}\"", "site:amazon.com \"${client.name}\" author", "\"${client.name}\" book", "\"${client.name}\" author"],
  "media_mentions": ["\"${client.name}\" OR \"${client.name?.split(' ')[0]}\" interview India", "\"${client.name}\" quoted", "\"${client.name}\" ET OR Mint OR Bloomberg", "\"${client.name}\" featured", "5 more media queries"],
  "professional": ["\"${client.name}\" award", "\"${client.name}\" festival", "\"${client.name}\" nomination", "\"${client.name}\" jury"],
  "social_discovery": ["\"${client.name}\" Instagram", "\"${client.name}\" Twitter"],
  "legal_regulatory": ["\"${client.name}\" court", "\"${client.name}\" legal"],
  "crisis_signals": ["\"${client.name}\" controversy", "\"${client.name}\" complaint"]
}

Replace ALL placeholder descriptions with ACTUAL query strings. Every item = real Google search string.`,
    json: true,
    maxTokens: 2000,
    temperature: 0.2,
    timeoutMs: 60_000,
    model: 'fast',
  });

  const aiQueries = parseAIJson<SearchQuerySet>(result.content);

  // ── STEP 5: Merge AI queries with our deterministic ones ───────────────────
  return {
    core_identity:     [...(aiQueries.core_identity    ?? [])],
    works_creative:    [...knownWorkQueries, ...(aiQueries.works_creative ?? [])],
    thought_leader:    [...(aiQueries.thought_leader   ?? [])],
    platform_specific: [...youtubeQueries, ...(aiQueries.platform_specific ?? [])],
    amazon_books:      [...(aiQueries.amazon_books     ?? [])],
    media_mentions:    [...(aiQueries.media_mentions   ?? [])],
    professional:      [...(aiQueries.professional     ?? [])],
    social_discovery:  [...(aiQueries.social_discovery ?? [])],
    legal_regulatory:  [...(aiQueries.legal_regulatory ?? [])],
    crisis_signals:    [...(aiQueries.crisis_signals   ?? [])],
  };
}

/**
 * Extract specific titles from bio text and keywords.
 * Exported so search.ts can build targeted queries before the scan runs.
 * These are ground-truth — the user explicitly entered them.
 */
export function extractKnownTitlesForSearch(bio: string, keywords: string[]): string[] {
  return extractTitlesFromProfile(bio, keywords);
}

/**
 * Extract specific titles from bio text and keywords.
 * These are ground-truth — the user explicitly entered them.
 */
function extractTitlesFromProfile(bio: string, keywords: string[]): string[] {
  const titles: string[] = [];

  // From keywords — quoted titles or title-case items
  for (const kw of keywords) {
    const trimmed = kw.trim();
    const quoted = trimmed.match(/["']([^"']+)["']/);
    if (quoted) { titles.push(quoted[1]); continue; }
    // Title case, 2+ words, or standalone capitalized name
    if (/^[A-Z][a-zA-Z\s]{3,}$/.test(trimmed) && trimmed.includes(' ')) {
      titles.push(trimmed);
    }
  }

  // From bio — extract after trigger words
  const bioPatterns: RegExp[] = [
    /(?:film|movie|directed?|produced?)[:\s]+["']?([A-Z][^"'\n,;.]{3,50})["']?/gi,
    /(?:book|novel|authored?|wrote|published)[:\s]+["']?([A-Z][^"'\n,;.]{3,50})["']?/gi,
    /(?:series|show|documentary)[:\s]+["']?([A-Z][^"'\n,;.]{3,50})["']?/gi,
    /["']([A-Z][^"']{3,50})["']/g,  // anything in quotes
  ];

  for (const pattern of bioPatterns) {
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(bio)) !== null) {
      const title = match[1].trim().replace(/\s+/g, ' ');
      if (title.length > 3 && !titles.includes(title)) {
        titles.push(title);
      }
    }
  }

  return [...new Set(titles)].slice(0, 15);
}

/**
 * Flatten all query sets into a deduplicated array for execution.
 * Priority order: core → works → platform → thought leader → media → rest
 */
export function flattenQuerySet(qs: SearchQuerySet): string[] {
  const ordered = [
    ...(qs.core_identity     ?? []),
    ...(qs.works_creative    ?? []),
    ...(qs.platform_specific ?? []),
    ...(qs.thought_leader    ?? []),
    ...(qs.media_mentions    ?? []),
    ...(qs.amazon_books      ?? []),
    ...(qs.professional      ?? []),
    ...(qs.social_discovery  ?? []),
    ...(qs.legal_regulatory  ?? []),
    ...(qs.crisis_signals    ?? []),
  ];

  // Deduplicate while preserving priority order
  const seen = new Set<string>();
  return ordered
    .map(q => q.trim())
    .filter(q => {
      if (!q || q.length < 3) return false;
      // Remove any items that are clearly descriptions, not queries
      if (q.includes('generate ') || q.includes('more queries') || q.includes('[') ) return false;
      if (seen.has(q.toLowerCase())) return false;
      seen.add(q.toLowerCase());
      return true;
    });
}
