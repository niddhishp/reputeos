/**
 * Shared types for ReputeOS discovery source modules
 */

export interface SourceResult {
  source: string;          // e.g. "Economic Times", "Twitter/X"
  category: string;        // e.g. "news", "social", "regulatory"
  url: string;
  title: string;
  snippet: string;
  date?: string;
  sentiment?: number;      // -1 to +1, filled by AI analysis
  frame?: string;          // expert | founder | leader | family | crisis | other
  relevanceScore?: number; // 0-1
  metadata?: Record<string, unknown>;
}

export interface ClientProfile {
  name: string;
  company: string | null;
  role: string | null;
  industry: string | null;
  linkedin_url: string | null;
  keywords: string[] | null;
  social_links?: Record<string, string> | null;
  bio?: string | null;        // self-described bio — used for known works extraction
  known_urls?: string[] | null;  // user-provided press coverage URLs — fetched directly
}

export interface SourceModuleResult {
  module: string;
  results: SourceResult[];
  sourcesScanned: number;
  errors: string[];
  durationMs: number;
}

export interface AnalysisResult {
  sentiment: {
    positive: number;
    neutral: number;
    negative: number;
    average: number;
  };
  frames: {
    expert: number;
    founder: number;
    leader: number;
    family: number;
    crisis: number;
    other: number;
  };
  topKeywords: string[];
  archetypeHints: string[];
  crisisSignals: string[];
  summary: string;
}

export interface LSIResult {
  total: number;
  components: {
    c1: number; // Search Reputation (0-20)
    c2: number; // Media Framing (0-20)
    c3: number; // Social Backlash (0-20)
    c4: number; // Elite Discourse (0-15)
    c5: number; // Third-Party Validation (0-15)
    c6: number; // Crisis Moat (0-10)
  };
  gaps: Array<{ component: string; current: number; max: number; gap: number }>;
  stats: { mean: number; stddev: number; ucl: number; lcl: number };
}

/** Helper: fetch RSS and return items as SourceResult[] */
export async function fetchRSS(
  url: string,
  sourceName: string,
  searchName: string,
  limit = 5
): Promise<SourceResult[]> {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(8000),
      headers: { 'User-Agent': 'ReputeOS/1.0 (+https://reputeos.com)' },
    });
    if (!res.ok) return [];
    const xml = await res.text();

    const items: SourceResult[] = [];
    const itemMatches = xml.match(/<item[\s\S]*?<\/item>/gi) ?? [];

    for (const item of itemMatches.slice(0, limit * 3)) {
      const title = decodeXML(extractTag(item, 'title'));
      const link  = extractTag(item, 'link') || extractTag(item, 'guid');
      const desc  = decodeXML(extractTag(item, 'description') || extractTag(item, 'summary'));
      const pubDate = extractTag(item, 'pubDate') || extractTag(item, 'published');

      if (!title || !isRelevant(title + ' ' + desc, searchName)) continue;

      items.push({
        source: sourceName,
        category: 'news',
        url: link || url,
        title,
        snippet: desc.slice(0, 300),
        date: pubDate,
        metadata: { rss: true },
      });

      if (items.length >= limit) break;
    }
    return items;
  } catch {
    return [];
  }
}

function extractTag(xml: string, tag: string): string {
  const match = xml.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`, 'i'))
    || xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'));
  return match?.[1]?.trim() ?? '';
}

function decodeXML(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function isRelevant(text: string, name: string): boolean {
  const nameParts = name.toLowerCase().split(/\s+/).filter(p => p.length > 2);
  const textLower = text.toLowerCase();

  // Match if full name appears (any spelling — check first name at minimum)
  if (nameParts.length === 0) return false;

  // First name match alone is sufficient (e.g. "Niddhish" in title = relevant)
  const firstName = nameParts[0];
  if (textLower.includes(firstName)) return true;

  // Or any part of the name longer than 4 chars
  return nameParts.some(part => part.length > 4 && textLower.includes(part));
}

export function buildSearchName(client: ClientProfile): string {
  return client.name;
}

export function buildSearchQuery(client: ClientProfile, suffix = ''): string {
  // Use first name + last name without quotes as primary — catches spelling variations
  const parts = [client.name];
  if (client.company) parts.push(`"${client.company}"`);
  if (suffix) parts.push(suffix);
  return parts.join(' ');
}

/** Generate name spelling variations — handles double-vowel names like Puuzhakkal/Puuzhakal */
export function buildNameVariants(name: string): string[] {
  const variants = new Set<string>([name]);

  // Replace double vowels with single (Puuzhakkal → Puzhakkal, Puuzhakkal → Puuzhakal)
  const doubleVowelReduced = name.replace(/([aeiou])\1/gi, '$1');
  if (doubleVowelReduced !== name) variants.add(doubleVowelReduced);

  // Also try first name only (useful for YouTube/social)
  const firstName = name.split(' ')[0];
  if (firstName && firstName.length > 3) variants.add(firstName);

  return [...variants];
}
