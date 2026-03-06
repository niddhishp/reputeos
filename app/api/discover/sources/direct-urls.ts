/**
 * SOURCE MODULE: Direct URL Fetcher
 *
 * Fetches user-provided URLs (press coverage, YouTube, Amazon, podcasts) directly.
 * No search needed — bypasses query generation entirely.
 * Content is fetched via Firecrawl (full article text) or web fetch fallback.
 *
 * These are the highest-quality results in the scan because they come from
 * URLs the subject KNOWS are about them.
 */

import { SourceResult, SourceModuleResult, ClientProfile } from './types';

const FETCH_TIMEOUT = 12000;

interface PageContent {
  url: string;
  title: string;
  text: string;
  date?: string;
}

async function fetchWithFirecrawl(url: string): Promise<PageContent | null> {
  const key = process.env.FIRECRAWL_API_KEY;
  if (!key) return null;

  try {
    const res = await fetch('https://api.firecrawl.dev/v0/scrape', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, pageOptions: { onlyMainContent: true } }),
      signal: AbortSignal.timeout(FETCH_TIMEOUT),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const content = data.data ?? data;
    return {
      url,
      title: content.metadata?.title ?? content.title ?? url,
      text: (content.markdown ?? content.content ?? '').slice(0, 2000),
      date: content.metadata?.publishedTime,
    };
  } catch {
    return null;
  }
}

async function fetchWithWebFetch(url: string): Promise<PageContent | null> {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ReputeOS/1.0; +https://reputeos.com)',
        'Accept': 'text/html,application/xhtml+xml',
      },
      signal: AbortSignal.timeout(FETCH_TIMEOUT),
    });
    if (!res.ok) return null;
    const html = await res.text();

    // Extract title
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim().replace(/&amp;/g, '&') : url;

    // Extract meaningful text from meta description + og:description + h1
    const metaDesc = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i)?.[1] ?? '';
    const ogDesc   = html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i)?.[1] ?? '';
    const h1       = html.match(/<h1[^>]*>([^<]+)<\/h1>/i)?.[1]?.trim() ?? '';
    // Also grab article body text (strip tags)
    const bodyMatch = html.match(/<article[^>]*>([\s\S]{100,3000})<\/article>/i);
    const bodyText  = bodyMatch ? bodyMatch[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 1000) : '';

    const snippet = [h1, metaDesc || ogDesc, bodyText].filter(Boolean).join(' — ').slice(0, 1500);

    return { url, title, text: snippet || title };
  } catch {
    return null;
  }
}

function classifyUrl(url: string): { source: string; category: string } {
  try {
    const host = new URL(url).hostname.replace('www.', '');
    const path = new URL(url).pathname.toLowerCase();

    if (host.includes('youtube.com') || host.includes('youtu.be'))
      return { source: 'YouTube', category: 'video' };
    if (host.includes('spotify.com'))
      return { source: 'Spotify Podcasts', category: 'video' };
    if (host.includes('podcasts.apple.com'))
      return { source: 'Apple Podcasts', category: 'video' };
    if (host.includes('amazon.in') || host.includes('amazon.com'))
      return { source: 'Amazon Books', category: 'publication' };
    if (host.includes('linkedin.com'))
      return { source: 'LinkedIn', category: 'social' };
    if (host.includes('mid-day.com'))
      return { source: 'Mid-Day', category: 'news' };
    if (host.includes('timesofindia.com'))
      return { source: 'Times of India', category: 'news' };
    if (host.includes('news18.com'))
      return { source: 'News18', category: 'news' };
    if (host.includes('dnaindia.com') || host.includes('dna'))
      return { source: 'DNA India', category: 'news' };
    if (host.includes('outlookindia.com'))
      return { source: 'Outlook India', category: 'news' };
    if (host.includes('republicworld.com'))
      return { source: 'Republic World', category: 'news' };
    if (host.includes('gulfnews.com'))
      return { source: 'Gulf News', category: 'news' };
    if (host.includes('ianslive.in') || host.includes('ians'))
      return { source: 'IANS', category: 'news' };
    if (host.includes('indiantelevision.com'))
      return { source: 'Indian Television', category: 'news' };
    if (host.includes('indulgexpress.com'))
      return { source: 'Indulge Express', category: 'news' };
    if (path.includes('/podcast') || host.includes('podcast'))
      return { source: `Podcast (${host})`, category: 'video' };
    if (path.includes('/interview') || path.includes('/news'))
      return { source: host, category: 'news' };
    return { source: host, category: 'search' };
  } catch {
    return { source: 'Direct Coverage', category: 'search' };
  }
}

export async function fetchDirectUrls(
  knownUrls: string[],
  client: ClientProfile
): Promise<SourceModuleResult> {
  const start = Date.now();
  const errors: string[] = [];
  const results: SourceResult[] = [];

  if (!knownUrls || knownUrls.length === 0) {
    return { module: 'Direct Coverage (User-Provided)', results: [], sourcesScanned: 0, errors: [], durationMs: 0 };
  }

  // Fetch all URLs in parallel (capped at 30 concurrent)
  const validUrls = knownUrls.filter(u => u.startsWith('http')).slice(0, 30);

  console.log(`[DirectURLs] Fetching ${validUrls.length} user-provided URLs for ${client.name}`);

  const fetched = await Promise.allSettled(
    validUrls.map(async url => {
      // Try Firecrawl first (gets full article text), then web fetch fallback
      const content = await fetchWithFirecrawl(url) ?? await fetchWithWebFetch(url);
      return { url, content };
    })
  );

  for (const result of fetched) {
    if (result.status === 'rejected') {
      errors.push(`Fetch failed: ${result.reason?.message}`);
      continue;
    }
    const { url, content } = result.value;
    if (!content) {
      errors.push(`No content retrieved: ${url}`);
      continue;
    }

    const { source, category } = classifyUrl(url);

    results.push({
      source,
      category,
      url,
      title: content.title,
      snippet: content.text,
      date: content.date,
      sentiment: 0.3,  // user-provided coverage assumed positive by default
      frame: 'expert',  // direct coverage assumed expert framing
      relevanceScore: 1.0,  // highest relevance — user explicitly provided this
      metadata: {
        directCoverage: true,  // flag so report knows this is verified
        fetchedAt: new Date().toISOString(),
      },
    });
  }

  console.log(`[DirectURLs] Fetched ${results.length}/${validUrls.length} URLs successfully`);

  return {
    module: 'Direct Coverage (User-Provided)',
    results,
    sourcesScanned: validUrls.length,
    errors,
    durationMs: Date.now() - start,
  };
}
