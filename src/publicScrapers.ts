/**
 * Public API Scrapers — direct fetch, no browser/extension needed.
 * Called as CLI commands: bnbot search-hackernews --query "AI" --limit 5
 */

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

// ─── Scrapers ───────────────────────────────────────────────────────

export const PUBLIC_SCRAPERS: Record<string, (params: Record<string, unknown>) => Promise<unknown>> = {

  'search-hackernews': async (p) => {
    const sort = p.sort === 'date' ? 'search_by_date' : 'search';
    const data = await fetchJSON(`https://hn.algolia.com/api/v1/${sort}?query=${encodeURIComponent(String(p.query))}&tags=story&hitsPerPage=${p.limit || 20}`);
    return (data.hits || []).map((h: any, i: number) => ({
      rank: i + 1, title: h.title, score: h.points, author: h.author, comments: h.num_comments,
      url: h.url || `https://news.ycombinator.com/item?id=${h.objectID}`,
    }));
  },

  'search-stackoverflow': async (p) => {
    const data = await fetchJSON(`https://api.stackexchange.com/2.3/search/advanced?order=desc&sort=relevance&q=${encodeURIComponent(String(p.query))}&site=stackoverflow`);
    return (data.items || []).slice(0, Number(p.limit) || 10).map((i: any, idx: number) => ({
      rank: idx + 1, title: i.title, score: i.score, answers: i.answer_count, url: i.link,
    }));
  },

  'search-wikipedia': async (p) => {
    const lang = String(p.lang || 'en');
    const data = await fetchJSON(`https://${lang}.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(String(p.query))}&srlimit=${p.limit || 10}&format=json&utf8=1`);
    return (data.query?.search || []).map((r: any, i: number) => ({
      rank: i + 1, title: r.title, snippet: r.snippet.replace(/<[^>]+>/g, '').slice(0, 120),
      url: `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(r.title.replace(/ /g, '_'))}`,
    }));
  },

  'search-apple-podcasts': async (p) => {
    const data = await fetchJSON(`https://itunes.apple.com/search?term=${encodeURIComponent(String(p.query))}&media=podcast&limit=${Math.min(Number(p.limit) || 10, 25)}`);
    return (data.results || []).map((r: any, i: number) => ({
      rank: i + 1, title: r.collectionName, author: r.artistName, episodes: r.trackCount, genre: r.primaryGenreName, url: r.collectionViewUrl,
    }));
  },

  'search-substack': async (p) => {
    const data = await fetchJSON(`https://substack.com/api/v1/post/search?query=${encodeURIComponent(String(p.query))}&page=0&includePlatformResults=true`, { Accept: 'application/json' });
    return (data.results || []).slice(0, Number(p.limit) || 20).map((i: any, idx: number) => ({
      rank: idx + 1, title: (i.title || '').trim(), author: (i.publishedBylines?.[0]?.name || '').trim(),
      date: (i.post_date || '').split('T')[0], url: i.canonical_url || '',
    }));
  },

  'search-sinablog': async (p) => {
    const data = await fetchJSON(`https://search.sina.com.cn/api/search?q=${encodeURIComponent(String(p.query))}&tp=mix&sort=0&page=1&size=${Math.max(Number(p.limit) || 20, 10)}&from=search_result`, { Accept: 'application/json' });
    return (data.data?.list || []).filter((i: any) => (i.url || '').includes('blog.sina.com.cn')).slice(0, Number(p.limit) || 20).map((i: any, idx: number) => ({
      rank: idx + 1, title: (i.title || '').replace(/<[^>]+>/g, ''), author: i.media_show || i.author, date: i.time, url: i.url,
    }));
  },

  'fetch-sinafinance-news': async (p) => {
    const tags = [0, 10, 1, 3, 4, 5, 102, 6, 6, 8];
    const data = await fetchJSON(`https://app.cj.sina.com.cn/api/news/pc?page=1&size=${p.limit || 20}&tag=${tags[Number(p.type) || 0] ?? 0}`);
    return (data.result?.data?.feed?.list || []).map((i: any) => ({
      id: i.id, time: i.create_time, content: (i.rich_text || '').replace(/<[^>]+>/g, '').trim(), views: i.view_num,
    }));
  },

  'fetch-v2ex-hot': async () => {
    const data = await fetchJSON('https://www.v2ex.com/api/topics/hot.json');
    return (data || []).map((t: any, i: number) => ({
      rank: i + 1, title: t.title, replies: t.replies, node: t.node?.title, url: t.url,
    }));
  },

  'fetch-bloomberg-news': async (p) => {
    const xml = await fetchText('https://feeds.bloomberg.com/markets/news.rss');
    return parseRSS(xml, Number(p.limit) || 20);
  },

  'fetch-bbc-news': async (p) => {
    const xml = await fetchText('https://feeds.bbci.co.uk/news/rss.xml');
    return parseRSS(xml, Number(p.limit) || 20);
  },

  'fetch-xiaoyuzhou-podcast': async (p) => {
    const html = await fetchText(`https://www.xiaoyuzhoufm.com/podcast/${p.podcastId}`);
    const match = html.match(/<script id="__NEXT_DATA__"[^>]*>(.*?)<\/script>/);
    if (!match) throw new Error('Failed to extract page data');
    const pod = JSON.parse(match[1]).props?.pageProps?.podcast;
    if (!pod) throw new Error('Podcast not found');
    return { title: pod.title, author: pod.author, description: (pod.brief || '').slice(0, 200), subscribers: pod.subscriptionCount, episodes: pod.episodeCount };
  },
};

/** Names of all public scraper commands */
export const PUBLIC_SCRAPER_NAMES = Object.keys(PUBLIC_SCRAPERS);

/** Run a public scraper directly (no WebSocket needed) */
export async function runPublicScraper(name: string, params: Record<string, unknown>): Promise<void> {
  const scraper = PUBLIC_SCRAPERS[name];
  if (!scraper) throw new Error(`Unknown public scraper: ${name}`);
  const result = await scraper(params);
  console.log(JSON.stringify(result, null, 2));
}
