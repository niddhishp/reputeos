/**
 * Deep Search Query Generator
 *
 * Before any discovery scan, this agent analyses the client profile
 * and generates 40+ highly targeted search queries across domains:
 * - Their name + specific verticals (film, books, speaking, etc.)
 * - Platform-specific queries (site:youtube.com, site:amazon.com, etc.)
 * - Relationship queries (interviews, mentions by peers)
 * - Topic queries (their known works, companies, controversies)
 *
 * These queries are then fed to the search source modules for execution.
 */

import { callAI, parseAIJson } from '../call';

export interface SearchQuerySet {
  core_identity:    string[];   // "[name]", "[name] [role]", "[name] [company]"
  works_creative:   string[];   // books, films, shows, art
  thought_leader:   string[];   // articles, talks, op-eds
  platform_specific:string[];   // site:youtube.com, site:linkedin.com etc
  media_mentions:   string[];   // "[name]" interview, "[name]" quotes
  professional:     string[];   // awards, boards, investments, exits
  social_discovery: string[];   // instagram, twitter, youtube channel search
  amazon_books:     string[];   // amazon author search
  legal_regulatory: string[];   // court, SEBI, MCA
  crisis_signals:   string[];   // controversy, lawsuit, news negative
}

export async function generateDeepSearchQueries(client: {
  name: string;
  role?: string;
  company?: string;
  industry?: string;
  keywords?: string[];
  linkedin_url?: string;
  social_links?: Record<string, string>;
}): Promise<SearchQuerySet> {

  const knownLinks = Object.entries(client.social_links ?? {})
    .filter(([, v]) => v)
    .map(([k, v]) => `${k}: ${v}`)
    .join(', ');

  const result = await callAI({
    systemPrompt: `You are a professional OSINT researcher and investigative journalist.
Your job is to generate exhaustive, targeted search queries to build a complete digital profile of a person.
Think like a journalist doing a deep background check — go beyond obvious queries.
Cover: their creative works, books, films, media appearances, YouTube/podcast presence, public articles, awards, board positions, controversies, and any online footprint.
Platform-specific site: operators are essential. Always generate Amazon author queries if they might have books.
Return ONLY valid JSON matching the requested schema.`,
    userPrompt: `Generate deep search queries for this person:

Name: ${client.name}
Role: ${client.role ?? 'not specified'}
Company: ${client.company ?? 'not specified'}
Industry: ${client.industry ?? 'not specified'}
Keywords (self-described): ${(client.keywords ?? []).join(', ') || 'none provided'}
Known social links: ${knownLinks || 'none provided'}

IMPORTANT: Even if social links are not provided, generate platform-specific discovery queries anyway.
For example if they might have books, generate site:amazon.com queries.
If they might have YouTube content, generate site:youtube.com queries.
If they are in film/media/entertainment, generate film-specific queries.
Generate queries covering ALL possible dimensions of this person's public life.

Return JSON:
{
  "core_identity": [
    "${client.name}",
    "${client.name} ${client.role ?? ''}",
    "${client.name} ${client.company ?? ''}",
    "\"${client.name}\" biography",
    "\"${client.name}\" profile interview"
  ],
  "works_creative": [
    "generate 8-10 queries for books, films, creative works, productions — use their keywords and role to infer likely works"
  ],
  "thought_leader": [
    "generate 8 queries for articles, op-eds, talks, speeches, podcasts they may have given"
  ],
  "platform_specific": [
    "site:youtube.com \"${client.name}\"",
    "site:linkedin.com/in \"${client.name}\"",
    "site:instagram.com \"${client.name}\"",
    "site:twitter.com \"${client.name}\"",
    "site:medium.com \"${client.name}\"",
    "site:substack.com \"${client.name}\"",
    "generate 4 more platform-specific queries based on their industry"
  ],
  "amazon_books": [
    "site:amazon.com/books \"${client.name}\"",
    "site:amazon.in \"${client.name}\" author",
    "\"${client.name}\" book",
    "\"${client.name}\" author"
  ],
  "media_mentions": [
    "\"${client.name}\" interview",
    "\"${client.name}\" quote",
    "\"${client.name}\" ET OR Mint OR Bloomberg OR Forbes",
    "generate 5 more media-specific queries"
  ],
  "professional": [
    "\"${client.name}\" board director",
    "\"${client.name}\" award",
    "\"${client.name}\" investment",
    "generate 4 more professional achievement queries"
  ],
  "social_discovery": [
    "\"${client.name}\" YouTube channel",
    "\"${client.name}\" podcast",
    "\"${client.name}\" Instagram",
    "generate 3 more social discovery queries"
  ],
  "legal_regulatory": [
    "\"${client.name}\" court case",
    "\"${client.name}\" SEBI OR MCA",
    "\"${client.name}\" legal dispute"
  ],
  "crisis_signals": [
    "\"${client.name}\" controversy",
    "\"${client.name}\" complaint",
    "\"${client.name}\" scandal OR fraud OR lawsuit"
  ]
}

Replace the placeholder descriptions with ACTUAL specific queries using real information from their profile.
Every query must be a real search string — no explanatory text.`,
    json: true,
    maxTokens: 2000,
    temperature: 0.3,
    timeoutMs: 60_000,
    model: 'fast',
  });

  return parseAIJson<SearchQuerySet>(result.content);
}

/**
 * Flatten all query sets into a deduplicated array for execution
 */
export function flattenQuerySet(qs: SearchQuerySet): string[] {
  const all = [
    ...qs.core_identity,
    ...qs.works_creative,
    ...qs.thought_leader,
    ...qs.platform_specific,
    ...qs.amazon_books,
    ...qs.media_mentions,
    ...qs.professional,
    ...qs.social_discovery,
    ...qs.legal_regulatory,
    ...qs.crisis_signals,
  ];
  // Deduplicate
  return [...new Set(all.map(q => q.trim()).filter(Boolean))];
}
