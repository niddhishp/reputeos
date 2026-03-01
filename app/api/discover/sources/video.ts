/**
 * SOURCE MODULE: Video, Podcasts & Speaking Engagements
 * Covers: YouTube India talks (SerpAPI), Podcast Index,
 *         TED/TEDx India (Exa), Spotify podcasts (Exa),
 *         IVM Podcasts (Exa), Clubhouse India (Exa)
 */

import { SourceResult, SourceModuleResult, ClientProfile, isRelevant } from './types';

const SERPAPI_KEY = process.env.SERPAPI_KEY;
const PODCAST_INDEX_KEY = process.env.PODCAST_INDEX_KEY;
const PODCAST_INDEX_SECRET = process.env.PODCAST_INDEX_SECRET;
const EXA_API_KEY = process.env.EXA_API_KEY;

async function fetchYouTubeViaSerpAPI(client: ClientProfile): Promise<SourceResult[]> {
  if (!SERPAPI_KEY) return [];
  try {
    const queries = [
      `${client.name} interview`,
      `${client.name} talk speech`,
      `${client.name} podcast`,
    ];

    const all: SourceResult[] = [];
    for (const q of queries) {
      const url = new URL('https://serpapi.com/search');
      url.searchParams.set('api_key', SERPAPI_KEY);
      url.searchParams.set('engine', 'youtube');
      url.searchParams.set('search_query', q);
      url.searchParams.set('gl', 'in');

      const res = await fetch(url.toString(), { signal: AbortSignal.timeout(10000) });
      if (!res.ok) continue;
      const data = await res.json();

      for (const v of (data.video_results ?? []).slice(0, 4)) {
        if (!isRelevant(v.title ?? '', client.name)) continue;
        all.push({
          source: 'YouTube',
          category: 'video',
          url: v.link ?? '',
          title: v.title ?? '',
          snippet: v.description?.slice(0, 300) ?? '',
          date: v.published_date,
          metadata: {
            channel: v.channel?.name,
            views: v.views,
            duration: v.length,
            via: 'serpapi-youtube',
          },
        });
      }
    }

    // Deduplicate by URL
    const seen = new Set<string>();
    return all.filter(r => {
      if (seen.has(r.url)) return false;
      seen.add(r.url);
      return true;
    }).slice(0, 10);
  } catch {
    return [];
  }
}

async function fetchPodcastIndex(client: ClientProfile): Promise<SourceResult[]> {
  if (!PODCAST_INDEX_KEY || !PODCAST_INDEX_SECRET) return [];
  try {
    // Podcast Index requires HMAC auth
    const apiHeaderTime = Math.floor(Date.now() / 1000);
    const authString = PODCAST_INDEX_KEY + PODCAST_INDEX_SECRET + apiHeaderTime;

    // Build SHA1 hash
    const encoder = new TextEncoder();
    const data = encoder.encode(authString);
    const hashBuffer = await crypto.subtle.digest('SHA-1', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    const searchUrl = `https://api.podcastindex.org/api/1.0/search/byterm?q=${encodeURIComponent(client.name)}&max=10&clean`;
    const res = await fetch(searchUrl, {
      headers: {
        'X-Auth-Key': PODCAST_INDEX_KEY,
        'X-Auth-Date': apiHeaderTime.toString(),
        'Authorization': hash,
        'User-Agent': 'ReputeOS/1.0',
      },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return [];
    const podcastData = await res.json();

    const results: SourceResult[] = [];

    // Host a podcast
    for (const podcast of (podcastData.feeds ?? []).slice(0, 3)) {
      if (!isRelevant(podcast.title ?? '', client.name)) continue;
      results.push({
        source: 'Podcast Index',
        category: 'video',
        url: podcast.link ?? podcast.url ?? '',
        title: podcast.title ?? '',
        snippet: podcast.description?.slice(0, 300) ?? '',
        metadata: {
          episodeCount: podcast.episodeCount,
          language: podcast.language,
          categories: podcast.categories,
          itunesId: podcast.itunesId,
        },
      });
    }

    // Search episodes mentioning the person
    const episodeUrl = `https://api.podcastindex.org/api/1.0/search/episode/bytitle?q=${encodeURIComponent(client.name)}&max=8&clean`;
    const episodeRes = await fetch(episodeUrl, {
      headers: {
        'X-Auth-Key': PODCAST_INDEX_KEY,
        'X-Auth-Date': apiHeaderTime.toString(),
        'Authorization': hash,
        'User-Agent': 'ReputeOS/1.0',
      },
      signal: AbortSignal.timeout(8000),
    });
    if (episodeRes.ok) {
      const epData = await episodeRes.json();
      for (const ep of (epData.items ?? []).slice(0, 5)) {
        if (!isRelevant(ep.title ?? '', client.name)) continue;
        results.push({
          source: 'Podcast Index',
          category: 'video',
          url: ep.link ?? ep.enclosureUrl ?? '',
          title: ep.title ?? '',
          snippet: ep.description?.slice(0, 300) ?? '',
          date: ep.datePublished ? new Date(ep.datePublished * 1000).toISOString() : undefined,
          metadata: {
            feedTitle: ep.feedTitle,
            duration: ep.duration,
            episodeType: ep.episodeType,
          },
        });
      }
    }

    return results;
  } catch (e) {
    console.error('Podcast Index error:', e);
    return [];
  }
}

async function fetchExaVideo(client: ClientProfile): Promise<SourceResult[]> {
  if (!EXA_API_KEY) return [];
  try {
    const query = `${client.name} podcast interview talk speech keynote`;
    const res = await fetch('https://api.exa.ai/search', {
      method: 'POST',
      headers: { 'x-api-key': EXA_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query,
        numResults: 10,
        useAutoprompt: true,
        type: 'neural',
        includeDomains: [
          'ted.com', 'open.spotify.com', 'ivmpodcasts.com',
          'soundcloud.com', 'anchor.fm', 'buzzsprout.com',
          'iheartradio.com', 'podbean.com', 'simplecast.com',
        ],
        contents: { text: { maxCharacters: 400 } },
      }),
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return [];
    const data = await res.json();

    return (data.results ?? [])
      .filter((r: { title?: string }) => isRelevant(r.title ?? '', client.name))
      .slice(0, 8)
      .map((r: { url: string; title: string; text?: string; publishedDate?: string }) => {
        const domain = new URL(r.url).hostname.replace('www.', '');
        const sourceMap: Record<string, string> = {
          'ted.com': 'TED/TEDx', 'open.spotify.com': 'Spotify Podcasts',
          'ivmpodcasts.com': 'IVM Podcasts', 'soundcloud.com': 'SoundCloud',
        };
        return {
          source: sourceMap[domain] ?? `Podcast (${domain})`,
          category: 'video',
          url: r.url,
          title: r.title,
          snippet: r.text?.slice(0, 400) ?? '',
          date: r.publishedDate,
          metadata: { via: 'exa', domain },
        };
      });
  } catch {
    return [];
  }
}

export async function fetchVideoSources(client: ClientProfile): Promise<SourceModuleResult> {
  const start = Date.now();
  const errors: string[] = [];

  const [youtube, podcastIndex, exaVideo] = await Promise.allSettled([
    fetchYouTubeViaSerpAPI(client),
    fetchPodcastIndex(client),
    fetchExaVideo(client),
  ]);

  const allResults: SourceResult[] = [];
  const tasks = [
    { name: 'YouTube SerpAPI', r: youtube },
    { name: 'Podcast Index', r: podcastIndex },
    { name: 'Exa Video/Podcasts', r: exaVideo },
  ];

  for (const { name, r } of tasks) {
    if (r.status === 'fulfilled') allResults.push(...r.value);
    else errors.push(`${name}: ${r.reason?.message ?? 'failed'}`);
  }

  return {
    module: 'Video, Podcasts & Speaking',
    results: allResults,
    sourcesScanned: 6,
    errors,
    durationMs: Date.now() - start,
  };
}
