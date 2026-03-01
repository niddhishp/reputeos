/**
 * SOURCE MODULE: Social & Community
 * Covers: Twitter/X, Reddit India, LinkedIn (Apify), YouTube deep (Apify),
 *         Instagram (Apify), Medium, Substack, GitHub, Quora (Exa)
 */

import { SourceResult, SourceModuleResult, ClientProfile, isRelevant } from './types';

const X_BEARER_TOKEN = process.env.X_BEARER_TOKEN;
const APIFY_TOKEN = process.env.APIFY_TOKEN;
const EXA_API_KEY = process.env.EXA_API_KEY;

async function fetchTwitterX(client: ClientProfile): Promise<SourceResult[]> {
  if (!X_BEARER_TOKEN) return [];
  try {
    const query = `"${client.name}"${client.company ? ` OR "${client.company}"` : ''} -is:retweet lang:en`;
    const url = new URL('https://api.twitter.com/2/tweets/search/recent');
    url.searchParams.set('query', query);
    url.searchParams.set('max_results', '20');
    url.searchParams.set('tweet.fields', 'created_at,public_metrics,author_id,text');
    url.searchParams.set('expansions', 'author_id');
    url.searchParams.set('user.fields', 'name,username,verified');

    const res = await fetch(url.toString(), {
      headers: { 'Authorization': `Bearer ${X_BEARER_TOKEN}` },
      signal: AbortSignal.timeout(8000), // 8s hard limit
    });
    if (!res.ok) return [];
    const data = await res.json();

    const users: Record<string, { name: string; username: string }> = {};
    for (const u of data.includes?.users ?? []) {
      users[u.id] = { name: u.name, username: u.username };
    }

    return (data.data ?? []).slice(0, 10).map((t: {
      id: string; text: string; created_at?: string; author_id?: string;
      public_metrics?: { like_count: number; retweet_count: number; reply_count: number };
    }) => {
      const author = users[t.author_id ?? ''];
      return {
        source: 'Twitter/X',
        category: 'social',
        url: `https://twitter.com/${author?.username ?? 'i'}/status/${t.id}`,
        title: `Tweet by @${author?.username ?? 'user'}`,
        snippet: t.text,
        date: t.created_at,
        metadata: {
          likes: t.public_metrics?.like_count,
          retweets: t.public_metrics?.retweet_count,
          replies: t.public_metrics?.reply_count,
          authorName: author?.name,
        },
      };
    });
  } catch (e) {
    console.error('Twitter/X error:', e);
    return [];
  }
}

async function fetchReddit(client: ClientProfile): Promise<SourceResult[]> {
  try {
    const query = encodeURIComponent(`"${client.name}"`);
    const subreddits = 'india+IndiaInvestments+IndianBusiness+startups+IndiaStartups+BusinessIndia';
    const url = `https://www.reddit.com/r/${subreddits}/search.json?q=${query}&restrict_sr=1&sort=relevance&limit=10&t=year`;

    const res = await fetch(url, {
      headers: { 'User-Agent': 'ReputeOS/1.0 (reputation monitoring)' },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return [];
    const data = await res.json();

    return (data.data?.children ?? [])
      .filter((c: { data: { title?: string; selftext?: string } }) =>
        isRelevant(c.data.title ?? '', client.name)
      )
      .slice(0, 6)
      .map((c: {
        data: {
          id: string; title?: string; selftext?: string; url?: string;
          subreddit?: string; score?: number; created_utc?: number;
        }
      }) => ({
        source: `Reddit r/${c.data.subreddit}`,
        category: 'social',
        url: `https://reddit.com${c.data.url ?? ''}`,
        title: c.data.title ?? '',
        snippet: c.data.selftext?.slice(0, 300) ?? '',
        date: c.data.created_utc ? new Date(c.data.created_utc * 1000).toISOString() : undefined,
        metadata: { score: c.data.score, subreddit: c.data.subreddit },
      }));
  } catch {
    return [];
  }
}

async function fetchApifyActor(
  actorId: string,
  input: Record<string, unknown>,
  sourceName: string,
  category: string,
  mapResult: (item: Record<string, unknown>) => SourceResult | null,
  limit = 8
): Promise<SourceResult[]> {
  if (!APIFY_TOKEN) return [];
  try {
    // Hard 30s timeout - Apify can be slow, never block the whole scan
    const startRes = await fetch(
      `https://api.apify.com/v2/acts/${actorId}/run-sync-get-dataset-items?token=${APIFY_TOKEN}&memory=256&timeout=25`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
        signal: AbortSignal.timeout(30000), // 30s max, then skip
      }
    );
    if (!startRes.ok) return [];
    const items: Record<string, unknown>[] = await startRes.json();

    const results: SourceResult[] = [];
    for (const item of (items ?? []).slice(0, limit)) {
      const mapped = mapResult(item);
      if (mapped) results.push(mapped);
    }
    return results;
  } catch (e) {
    console.error(`Apify ${sourceName} error:`, e);
    return [];
  }
}

async function fetchLinkedIn(client: ClientProfile): Promise<SourceResult[]> {
  return fetchApifyActor(
    'apidojo~linkedin-profile-scraper',
    {
      searchUrl: `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(client.name)}`,
      maxResults: 3,
    },
    'LinkedIn',
    'social',
    (item) => {
      if (!isRelevant(String(item.fullName ?? ''), client.name)) return null;
      return {
        source: 'LinkedIn',
        category: 'social',
        url: String(item.profileUrl ?? ''),
        title: `${item.fullName ?? ''} — ${item.headline ?? ''}`,
        snippet: String(item.summary ?? item.about ?? '').slice(0, 400),
        metadata: {
          connections: item.connectionsCount,
          followers: item.followersCount,
          location: item.location,
          currentRole: item.currentPositionTitle,
          company: item.currentCompany,
        },
      };
    },
    3
  );
}

async function fetchYouTubeDeep(client: ClientProfile): Promise<SourceResult[]> {
  return fetchApifyActor(
    'streamers~youtube-scraper',
    {
      searchKeywords: [`${client.name} interview`, `${client.name} talk`, `${client.name} ${client.company ?? ''}`],
      maxResults: 6,
      resultsType: 'SEARCH',
    },
    'YouTube Deep',
    'video',
    (item) => ({
      source: 'YouTube',
      category: 'video',
      url: `https://youtube.com/watch?v=${item.id ?? ''}`,
      title: String(item.title ?? ''),
      snippet: String(item.description ?? '').slice(0, 300),
      date: String(item.date ?? ''),
      metadata: {
        views: item.viewCount,
        likes: item.likes,
        channel: item.channelName,
        duration: item.duration,
      },
    }),
    6
  );
}

async function fetchInstagram(client: ClientProfile): Promise<SourceResult[]> {
  return fetchApifyActor(
    'apidojo~instagram-search-scraper',
    {
      searchType: 'user',
      searchQuery: client.name,
      resultsLimit: 3,
    },
    'Instagram',
    'social',
    (item) => {
      if (!isRelevant(String(item.fullName ?? item.username ?? ''), client.name)) return null;
      return {
        source: 'Instagram',
        category: 'social',
        url: `https://instagram.com/${item.username ?? ''}`,
        title: `${item.fullName ?? item.username ?? ''} on Instagram`,
        snippet: String(item.biography ?? '').slice(0, 300),
        metadata: {
          followers: item.followersCount,
          posts: item.postsCount,
          verified: item.verified,
          username: item.username,
        },
      };
    },
    3
  );
}

async function fetchMediumSubstack(client: ClientProfile): Promise<SourceResult[]> {
  if (!EXA_API_KEY) return [];
  try {
    const res = await fetch('https://api.exa.ai/search', {
      method: 'POST',
      headers: { 'x-api-key': EXA_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `${client.name} articles writings thoughts`,
        numResults: 6,
        useAutoprompt: true,
        type: 'neural',
        includeDomains: ['medium.com', 'substack.com'],
        contents: { text: { maxCharacters: 400 } },
      }),
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.results ?? []).map((r: {
      url: string; title: string; text?: string; publishedDate?: string;
    }) => ({
      source: r.url.includes('substack') ? 'Substack' : 'Medium',
      category: 'social',
      url: r.url,
      title: r.title,
      snippet: r.text?.slice(0, 400) ?? '',
      date: r.publishedDate,
    }));
  } catch {
    return [];
  }
}

async function fetchGitHub(client: ClientProfile): Promise<SourceResult[]> {
  try {
    const url = `https://api.github.com/search/users?q=${encodeURIComponent(client.name)}&per_page=3`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'ReputeOS/1.0', 'Accept': 'application/vnd.github.v3+json' },
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return [];
    const data = await res.json();
    const users = (data.items ?? []).slice(0, 2);

    const results: SourceResult[] = [];
    for (const u of users) {
      const profileRes = await fetch(`https://api.github.com/users/${u.login}`, {
        headers: { 'User-Agent': 'ReputeOS/1.0' },
      }).catch(() => null);
      if (!profileRes?.ok) continue;
      const profile = await profileRes.json();
      if (!isRelevant(profile.name ?? profile.login, client.name)) continue;
      results.push({
        source: 'GitHub',
        category: 'social',
        url: profile.html_url,
        title: `${profile.name ?? profile.login} on GitHub`,
        snippet: profile.bio ?? '',
        metadata: {
          repos: profile.public_repos,
          followers: profile.followers,
          company: profile.company,
          location: profile.location,
        },
      });
    }
    return results;
  } catch {
    return [];
  }
}

async function fetchQuora(client: ClientProfile): Promise<SourceResult[]> {
  if (!EXA_API_KEY) return [];
  try {
    const res = await fetch('https://api.exa.ai/search', {
      method: 'POST',
      headers: { 'x-api-key': EXA_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `${client.name} ${client.company ?? ''} answers questions`,
        numResults: 4,
        includeDomains: ['quora.com'],
        contents: { text: { maxCharacters: 400 } },
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.results ?? []).map((r: { url: string; title: string; text?: string }) => ({
      source: 'Quora',
      category: 'social',
      url: r.url,
      title: r.title,
      snippet: r.text?.slice(0, 400) ?? '',
    }));
  } catch {
    return [];
  }
}

export async function fetchSocialSources(client: ClientProfile): Promise<SourceModuleResult> {
  const start = Date.now();
  const errors: string[] = [];

  const [twitter, reddit, linkedin, youtube, instagram, mediumSubstack, github, quora] =
    await Promise.allSettled([
      fetchTwitterX(client),
      fetchReddit(client),
      fetchLinkedIn(client),
      fetchYouTubeDeep(client),
      fetchInstagram(client),
      fetchMediumSubstack(client),
      fetchGitHub(client),
      fetchQuora(client),
    ]);

  const allResults: SourceResult[] = [];
  const tasks = [
    { name: 'Twitter/X', r: twitter },
    { name: 'Reddit', r: reddit },
    { name: 'LinkedIn', r: linkedin },
    { name: 'YouTube Deep', r: youtube },
    { name: 'Instagram', r: instagram },
    { name: 'Medium/Substack', r: mediumSubstack },
    { name: 'GitHub', r: github },
    { name: 'Quora', r: quora },
  ];

  for (const { name, r } of tasks) {
    if (r.status === 'fulfilled') allResults.push(...r.value);
    else errors.push(`${name}: ${r.reason?.message ?? 'failed'}`);
  }

  return {
    module: 'Social & Community',
    results: allResults,
    sourcesScanned: 8,
    errors,
    durationMs: Date.now() - start,
  };
}
