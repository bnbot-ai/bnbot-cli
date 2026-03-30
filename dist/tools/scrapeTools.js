"use strict";
/**
 * Scrape Tools - Data collection from Twitter/X
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerScrapeTools = registerScrapeTools;
const zod_1 = require("zod");
function registerScrapeTools(server, wsServer) {
    server.tool('scrape_timeline', 'Scrape tweets from the Twitter/X timeline. Returns tweet text, author, metrics, and URLs. Navigate to the timeline first if not already there.', {
        limit: zod_1.z.number().default(20).describe('Maximum number of tweets to collect'),
        scrollAttempts: zod_1.z.number().default(5).describe('Number of scroll attempts to load more tweets'),
    }, async (params) => {
        const result = await wsServer.sendAction('scrape_timeline', params);
        return {
            content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
            isError: !result.success,
        };
    });
    server.tool('scrape_bookmarks', 'Scrape bookmarked tweets from Twitter/X. Automatically navigates to the bookmarks page.', {
        limit: zod_1.z.number().default(20).describe('Maximum number of bookmarks to collect'),
    }, async (params) => {
        const result = await wsServer.sendAction('scrape_bookmarks', params);
        return {
            content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
            isError: !result.success,
        };
    });
    server.tool('scrape_search_results', 'Search Twitter/X and scrape results. Automatically navigates to search page. Supports tabs (top/latest/people/media/lists) and advanced filters.', {
        query: zod_1.z.string().default('').describe('Search query (base keywords, can be empty if using filters like from/since)'),
        tab: zod_1.z.enum(['top', 'latest', 'people', 'media', 'lists']).default('top').describe('Search tab: top (default), latest, people, media, lists'),
        limit: zod_1.z.number().default(20).describe('Maximum number of results to collect'),
        from: zod_1.z.string().optional().describe('Filter by author username (without @)'),
        since: zod_1.z.string().optional().describe('Start date (YYYY-MM-DD)'),
        until: zod_1.z.string().optional().describe('End date (YYYY-MM-DD)'),
        lang: zod_1.z.string().optional().describe('Language code (en, zh, ja, etc.)'),
        has: zod_1.z.enum(['images', 'videos', 'links', 'media']).optional().describe('Filter by media type'),
        minLikes: zod_1.z.number().optional().describe('Minimum likes (min_faves)'),
        minRetweets: zod_1.z.number().optional().describe('Minimum retweets (min_retweets)'),
        minReplies: zod_1.z.number().optional().describe('Minimum replies (min_replies)'),
        excludeReplies: zod_1.z.boolean().optional().describe('Exclude replies'),
        excludeRetweets: zod_1.z.boolean().optional().describe('Exclude retweets'),
    }, async (params) => {
        // Build Twitter advanced search query
        const parts = [];
        if (params.query)
            parts.push(params.query);
        if (params.from)
            parts.push(`from:${params.from}`);
        let q = parts.join(' ');
        // Append remaining filters
        if (params.since)
            q += ` since:${params.since}`;
        if (params.until)
            q += ` until:${params.until}`;
        if (params.lang)
            q += ` lang:${params.lang}`;
        if (params.has)
            q += ` filter:${params.has}`;
        if (params.minLikes)
            q += ` min_faves:${params.minLikes}`;
        if (params.minRetweets)
            q += ` min_retweets:${params.minRetweets}`;
        if (params.minReplies)
            q += ` min_replies:${params.minReplies}`;
        if (params.excludeReplies)
            q += ` -filter:replies`;
        if (params.excludeRetweets)
            q += ` -filter:retweets`;
        // Map tab to Twitter URL parameter
        const tabMap = {
            top: '',
            latest: 'live',
            people: 'user',
            media: 'image',
            lists: 'list',
        };
        const tabParam = tabMap[params.tab] || '';
        // Send query + tab to extension, it handles navigation + scraping
        const result = await wsServer.sendAction('scrape_search_results', { query: q, tab: tabParam, limit: params.limit }, 120000);
        return {
            content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
            isError: !result.success,
        };
    });
    server.tool('scrape_current_view', 'Scrape tweets currently visible on the page without scrolling.', {}, async () => {
        const result = await wsServer.sendAction('scrape_current_view', {});
        return {
            content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
            isError: !result.success,
        };
    });
    server.tool('scrape_thread', 'Scrape all tweets from a Twitter/X thread. Must be on a tweet detail page (/status/ URL). Collects all tweets by the same author, returns individual tweets and merged text.', {
        maxScrolls: zod_1.z.number().default(10).describe('Maximum scroll attempts to load more tweets'),
    }, async (params) => {
        const result = await wsServer.sendAction('scrape_thread', params);
        return {
            content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
            isError: !result.success,
        };
    });
    server.tool('scrape_user_profile', 'Get a Twitter/X user\'s profile info: name, bio, followers, following, etc.', {
        username: zod_1.z.string().describe('Twitter username (without @)'),
    }, async (params) => {
        const result = await wsServer.sendAction('scrape_user_profile', params);
        return {
            content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
            isError: !result.success,
        };
    });
    server.tool('scrape_user_tweets', 'Scrape tweets from a specific user\'s profile page.', {
        username: zod_1.z.string().describe('Twitter username (without @)'),
        limit: zod_1.z.number().default(20).describe('Maximum number of tweets to collect'),
        scrollAttempts: zod_1.z.number().default(5).describe('Number of scroll attempts'),
    }, async (params) => {
        const result = await wsServer.sendAction('scrape_user_tweets', params);
        return {
            content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
            isError: !result.success,
        };
    });
    server.tool('account_analytics', 'Get Twitter/X account analytics data for a date range.', {
        startDate: zod_1.z.string().optional().describe('Start date in YYYY-MM-DD format'),
        endDate: zod_1.z.string().optional().describe('End date in YYYY-MM-DD format'),
        granularity: zod_1.z.enum(['Daily', 'Weekly', 'Monthly']).optional().describe('Aggregation level for time series data'),
    }, async (params) => {
        const fromTime = params.startDate
            ? `${params.startDate}T00:00:00.000Z`
            : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        const toTime = params.endDate
            ? `${params.endDate}T23:59:59.999Z`
            : new Date().toISOString();
        const result = await wsServer.sendAction('account_analytics', {
            fromTime,
            toTime,
            granularity: params.granularity || 'Daily',
        });
        return {
            content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
            isError: !result.success,
        };
    });
}
//# sourceMappingURL=scrapeTools.js.map