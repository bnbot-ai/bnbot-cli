/**
 * Public Scraper Tools — fetch data from public APIs directly (no browser needed).
 * These don't go through the extension; they run in the CLI process.
 */

import { z } from 'zod';

// ─── Helpers ────────────────────────────────────────────────────────

async function fetchJSON(url: string, headers?: Record<string, string>) {
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0', ...headers } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function fetchText(url: string) {
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

function parseRSS(xml: string, limit: number) {
  const items: any[] = [];
  const re = /<item>([\s\S]*?)<\/item>/g;
  let match;
  while ((match = re.exec(xml)) && items.length < limit) {
    const block = match[1];
    const title = block.match(/<title><!\[CDATA\[(.*?)\]\]>|<title>(.*?)<\/title>/)?.[1]
      || block.match(/<title>(.*?)<\/title>/)?.[1] || '';
    const desc = block.match(/<description><!\[CDATA\[(.*?)\]\]>|<description>(.*?)<\/description>/)?.[1]
      || block.match(/<description>(.*?)<\/description>/)?.[1] || '';
    const link = block.match(/<link>(.*?)<\/link>/)?.[1]
      || block.match(/<guid[^>]*>(.*?)<\/guid>/)?.[1] || '';
    if (title) items.push({ rank: items.length + 1, title: title.trim(), description: desc.trim().slice(0, 200), url: link.trim() });
  }
  return items;
}

function toolResult(data: unknown) {
  return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
}

// ─── Registration ───────────────────────────────────────────────────

export function registerPublicScraperTools(server: any) {

  // HackerNews
  server.tool(
    'search_hackernews',
    'Search Hacker News stories via Algolia API',
    {
      query: z.string().describe('Search query'),
      limit: z.number().default(20).describe('Max results'),
      sort: z.enum(['relevance', 'date']).default('relevance'),
    },
    async (params: { query: string; limit: number; sort: string }) => {
      const endpoint = params.sort === 'date' ? 'search_by_date' : 'search';
      const data = await fetchJSON(`https://hn.algolia.com/api/v1/${endpoint}?query=${encodeURIComponent(params.query)}&tags=story&hitsPerPage=${params.limit}`);
      return toolResult((data.hits || []).slice(0, params.limit).map((h: any, i: number) => ({
        rank: i + 1, title: h.title, score: h.points, author: h.author, comments: h.num_comments,
        url: h.url || `https://news.ycombinator.com/item?id=${h.objectID}`,
      })));
    }
  );

  // StackOverflow
  server.tool(
    'search_stackoverflow',
    'Search Stack Overflow questions',
    {
      query: z.string().describe('Search query'),
      limit: z.number().default(10),
    },
    async (params: { query: string; limit: number }) => {
      const data = await fetchJSON(`https://api.stackexchange.com/2.3/search/advanced?order=desc&sort=relevance&q=${encodeURIComponent(params.query)}&site=stackoverflow`);
      return toolResult((data.items || []).slice(0, params.limit).map((i: any, idx: number) => ({
        rank: idx + 1, title: i.title, score: i.score, answers: i.answer_count, url: i.link,
      })));
    }
  );

  // Wikipedia
  server.tool(
    'search_wikipedia',
    'Search Wikipedia articles',
    {
      query: z.string().describe('Search query'),
      limit: z.number().default(10),
      lang: z.string().default('en').describe('Language code'),
    },
    async (params: { query: string; limit: number; lang: string }) => {
      const data = await fetchJSON(`https://${params.lang}.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(params.query)}&srlimit=${params.limit}&format=json&utf8=1`);
      return toolResult((data.query?.search || []).map((r: any, i: number) => ({
        rank: i + 1, title: r.title, snippet: r.snippet.replace(/<[^>]+>/g, '').slice(0, 120),
        url: `https://${params.lang}.wikipedia.org/wiki/${encodeURIComponent(r.title.replace(/ /g, '_'))}`,
      })));
    }
  );

  // Apple Podcasts
  server.tool(
    'search_apple_podcasts',
    'Search Apple Podcasts via iTunes API',
    {
      query: z.string().describe('Search query'),
      limit: z.number().default(10),
    },
    async (params: { query: string; limit: number }) => {
      const data = await fetchJSON(`https://itunes.apple.com/search?term=${encodeURIComponent(params.query)}&media=podcast&limit=${Math.min(params.limit, 25)}`);
      return toolResult((data.results || []).map((p: any, i: number) => ({
        rank: i + 1, title: p.collectionName, author: p.artistName, episodes: p.trackCount, genre: p.primaryGenreName, url: p.collectionViewUrl,
      })));
    }
  );

  // Substack
  server.tool(
    'search_substack',
    'Search Substack posts and newsletters',
    {
      query: z.string().describe('Search query'),
      limit: z.number().default(20),
    },
    async (params: { query: string; limit: number }) => {
      const data = await fetchJSON(`https://substack.com/api/v1/post/search?query=${encodeURIComponent(params.query)}&page=0&includePlatformResults=true`, { Accept: 'application/json' });
      return toolResult((data.results || []).slice(0, params.limit).map((i: any, idx: number) => ({
        rank: idx + 1, title: (i.title || '').trim(), author: (i.publishedBylines?.[0]?.name || '').trim(),
        date: (i.post_date || '').split('T')[0], url: i.canonical_url || '',
      })));
    }
  );

  // V2EX Hot
  server.tool(
    'fetch_v2ex_hot',
    'Fetch V2EX hot/trending topics',
    {},
    async () => {
      const data = await fetchJSON('https://www.v2ex.com/api/topics/hot.json');
      return toolResult((data || []).map((t: any, i: number) => ({
        rank: i + 1, title: t.title, replies: t.replies, node: t.node?.title, url: t.url,
      })));
    }
  );

  // Bloomberg News (RSS)
  server.tool(
    'fetch_bloomberg_news',
    'Fetch Bloomberg markets news headlines (RSS)',
    { limit: z.number().default(20) },
    async (params: { limit: number }) => {
      const xml = await fetchText('https://feeds.bloomberg.com/markets/news.rss');
      return toolResult(parseRSS(xml, params.limit));
    }
  );

  // BBC News (RSS)
  server.tool(
    'fetch_bbc_news',
    'Fetch BBC News headlines (RSS)',
    { limit: z.number().default(20) },
    async (params: { limit: number }) => {
      const xml = await fetchText('https://feeds.bbci.co.uk/news/rss.xml');
      return toolResult(parseRSS(xml, params.limit));
    }
  );

  // Sina Finance 7x24
  server.tool(
    'fetch_sina_finance_news',
    'Fetch Sina Finance 7x24 live news',
    {
      limit: z.number().default(20),
      type: z.number().default(0).describe('0=全部 1=A股 2=宏观 3=公司 4=数据 5=市场 6=国际'),
    },
    async (params: { limit: number; type: number }) => {
      const tags = [0, 10, 1, 3, 4, 5, 102, 6, 6, 8];
      const data = await fetchJSON(`https://app.cj.sina.com.cn/api/news/pc?page=1&size=${params.limit}&tag=${tags[params.type] ?? 0}`);
      return toolResult((data.result?.data?.feed?.list || []).map((i: any) => ({
        id: i.id, time: i.create_time, content: (i.rich_text || '').replace(/<[^>]+>/g, '').trim(), views: i.view_num,
      })));
    }
  );

  // Sina Blog Search
  server.tool(
    'search_sina_blog',
    'Search Sina Blog articles',
    {
      query: z.string().describe('Search query'),
      limit: z.number().default(20),
    },
    async (params: { query: string; limit: number }) => {
      const data = await fetchJSON(`https://search.sina.com.cn/api/search?q=${encodeURIComponent(params.query)}&tp=mix&sort=0&page=1&size=${Math.max(params.limit, 10)}&from=search_result`, { Accept: 'application/json' });
      return toolResult((data.data?.list || []).filter((i: any) => (i.url || '').includes('blog.sina.com.cn')).slice(0, params.limit).map((i: any, idx: number) => ({
        rank: idx + 1, title: (i.title || '').replace(/<[^>]+>/g, ''), author: i.media_show || i.author, date: i.time, url: i.url,
      })));
    }
  );

  // Xiaoyuzhou Podcast
  server.tool(
    'fetch_xiaoyuzhou_podcast',
    'Fetch Xiaoyuzhou FM podcast info',
    { podcastId: z.string().describe('Podcast ID from xiaoyuzhoufm.com URL') },
    async (params: { podcastId: string }) => {
      const html = await fetchText(`https://www.xiaoyuzhoufm.com/podcast/${params.podcastId}`);
      const match = html.match(/<script id="__NEXT_DATA__"[^>]*>(.*?)<\/script>/);
      if (!match) throw new Error('Failed to extract page data');
      const p = JSON.parse(match[1]).props?.pageProps?.podcast;
      if (!p) throw new Error('Podcast not found');
      return toolResult({ title: p.title, author: p.author, description: (p.brief || '').slice(0, 200), subscribers: p.subscriptionCount, episodes: p.episodeCount });
    }
  );
}
