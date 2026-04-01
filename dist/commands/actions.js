"use strict";
/**
 * Commander action handlers for X platform commands.
 *
 * Each handler maps commander arguments/options to the WebSocket action format
 * and uses `runCliAction` from cli.ts to send them to the running server.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.postCommand = postCommand;
exports.closeCommand = closeCommand;
exports.threadCommand = threadCommand;
exports.replyCommand = replyCommand;
exports.quoteCommand = quoteCommand;
exports.likeCommand = likeCommand;
exports.unlikeCommand = unlikeCommand;
exports.retweetCommand = retweetCommand;
exports.unretweetCommand = unretweetCommand;
exports.followCommand = followCommand;
exports.unfollowCommand = unfollowCommand;
exports.deleteCommand = deleteCommand;
exports.bookmarkCommand = bookmarkCommand;
exports.unbookmarkCommand = unbookmarkCommand;
exports.scrapeTimelineCommand = scrapeTimelineCommand;
exports.scrapeBookmarksCommand = scrapeBookmarksCommand;
exports.scrapeSearchCommand = scrapeSearchCommand;
exports.scrapeUserTweetsCommand = scrapeUserTweetsCommand;
exports.scrapeUserProfileCommand = scrapeUserProfileCommand;
exports.scrapeThreadCommand = scrapeThreadCommand;
exports.analyticsCommand = analyticsCommand;
exports.navigateUrlCommand = navigateUrlCommand;
exports.navigateSearchCommand = navigateSearchCommand;
exports.navigateBookmarksCommand = navigateBookmarksCommand;
exports.navigateNotificationsCommand = navigateNotificationsCommand;
exports.statusCommand = statusCommand;
exports.fetchWeixinArticleCommand = fetchWeixinArticleCommand;
exports.fetchTiktokCommand = fetchTiktokCommand;
exports.fetchXiaohongshuCommand = fetchXiaohongshuCommand;
const cli_js_1 = require("../cli.js");
const mediaUtils_js_1 = require("../tools/mediaUtils.js");
const DEFAULT_PORT = 18900;
// ── Helpers ──────────────────────────────────────────────────
function getPort() {
    return DEFAULT_PORT;
}
function fail(msg) {
    console.error(msg);
    process.exit(1);
}
/**
 * Resolve --media / -m options into the data URL array the extension expects.
 * Supports: local file paths, http(s) URLs, data: URIs, comma-separated lists.
 */
async function resolveMedia(raw) {
    if (!raw)
        return undefined;
    const sources = (Array.isArray(raw) ? raw : [raw])
        .flatMap((s) => String(s).split(','))
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
    if (sources.length === 0)
        return undefined;
    return (0, mediaUtils_js_1.resolveMediaListAsync)(sources);
}
// ── Tweet / Post ─────────────────────────────────────────────
async function postCommand(text, options) {
    const isDraft = options.draft || false;
    const preview = text.slice(0, 80) + (text.length > 80 ? '...' : '');
    console.error(isDraft ? `Drafting: "${preview}"` : `Posting: "${preview}"`);
    const params = { text, draftOnly: isDraft };
    const media = await resolveMedia(options.media);
    if (media)
        params.media = media;
    // Auto-split into thread when >4 media
    const MAX_MEDIA = 4;
    if (media && media.length > MAX_MEDIA) {
        const tweets = [];
        for (let i = 0; i < media.length; i += MAX_MEDIA) {
            const chunk = media.slice(i, i + MAX_MEDIA);
            tweets.push({
                text: i === 0 ? text : `(${Math.floor(i / MAX_MEDIA) + 1}/${Math.ceil(media.length / MAX_MEDIA)})`,
                media: chunk,
            });
        }
        console.error(`[BNBOT] ${media.length} media files — auto-splitting into ${tweets.length}-tweet thread`);
        return (0, cli_js_1.runCliAction)('post_thread', { tweets, draftOnly: isDraft }, getPort());
    }
    return (0, cli_js_1.runCliAction)('post_tweet', params, getPort());
}
async function closeCommand(options) {
    const isSave = options.save || false;
    console.error(isSave ? 'Saving draft and closing...' : 'Discarding and closing...');
    return (0, cli_js_1.runCliAction)('close_composer', { save: isSave }, getPort());
}
async function threadCommand(tweetsJson) {
    let tweets;
    try {
        tweets = JSON.parse(tweetsJson);
    }
    catch {
        fail('Invalid JSON for thread tweets. Expected: \'[{"text":"..."},{"text":"..."}]\'');
    }
    console.error('Posting thread...');
    return (0, cli_js_1.runCliAction)('post_thread', { tweets }, getPort());
}
async function replyCommand(url, text, options) {
    console.error(`Replying to: ${url}`);
    const params = { tweetUrl: url, text };
    const media = await resolveMedia(options.media);
    if (media)
        params.media = media;
    return (0, cli_js_1.runCliAction)('submit_reply', params, getPort());
}
async function quoteCommand(url, text) {
    console.error(`Quoting: ${url}`);
    return (0, cli_js_1.runCliAction)('quote_tweet', { tweetUrl: url, text }, getPort());
}
// ── Engagement ───────────────────────────────────────────────
async function likeCommand(url) {
    console.error(`Liking: ${url}`);
    return (0, cli_js_1.runCliAction)('like_tweet', { tweetUrl: url }, getPort());
}
async function unlikeCommand(url) {
    console.error(`Unliking: ${url}`);
    return (0, cli_js_1.runCliAction)('unlike_tweet', { tweetUrl: url }, getPort());
}
async function retweetCommand(url) {
    console.error(`Retweeting: ${url}`);
    return (0, cli_js_1.runCliAction)('retweet', { tweetUrl: url }, getPort());
}
async function unretweetCommand(url) {
    console.error(`Unretweeting: ${url}`);
    return (0, cli_js_1.runCliAction)('unretweet', { tweetUrl: url }, getPort());
}
async function followCommand(username) {
    console.error(`Following: @${username}`);
    return (0, cli_js_1.runCliAction)('follow_user', { username }, getPort());
}
async function unfollowCommand(username) {
    console.error(`Unfollowing: @${username}`);
    return (0, cli_js_1.runCliAction)('unfollow_user', { username }, getPort());
}
async function deleteCommand(url) {
    console.error(`Deleting: ${url}`);
    return (0, cli_js_1.runCliAction)('delete_tweet', { tweetUrl: url }, getPort());
}
async function bookmarkCommand(url) {
    console.error(`Bookmarking: ${url}`);
    return (0, cli_js_1.runCliAction)('bookmark_tweet', { tweetUrl: url }, getPort());
}
async function unbookmarkCommand(url) {
    console.error(`Unbookmarking: ${url}`);
    return (0, cli_js_1.runCliAction)('unbookmark_tweet', { tweetUrl: url }, getPort());
}
// ── Scrape ───────────────────────────────────────────────────
async function scrapeTimelineCommand(options) {
    const limit = parseInt(options.limit || '20', 10);
    const scrollAttempts = parseInt(options.scrollAttempts || '5', 10);
    console.error(`Scraping timeline (limit: ${limit})...`);
    return (0, cli_js_1.runCliAction)('scrape_timeline', { limit, scrollAttempts }, getPort());
}
async function scrapeBookmarksCommand(options) {
    const limit = parseInt(options.limit || '20', 10);
    console.error(`Scraping bookmarks (limit: ${limit})...`);
    return (0, cli_js_1.runCliAction)('scrape_bookmarks', { limit }, getPort());
}
async function scrapeSearchCommand(query, options) {
    const limit = parseInt(options.limit || '20', 10);
    const tab = options.tab || 'top';
    console.error(`Searching: "${query}" (tab: ${tab}, limit: ${limit})...`);
    const params = { query, tab, limit };
    if (options.from)
        params.from = options.from;
    if (options.since)
        params.since = options.since;
    if (options.until)
        params.until = options.until;
    if (options.lang)
        params.lang = options.lang;
    if (options.minLikes)
        params.minLikes = parseInt(options.minLikes, 10);
    if (options.minRetweets)
        params.minRetweets = parseInt(options.minRetweets, 10);
    if (options.has)
        params.has = options.has;
    return (0, cli_js_1.runCliAction)('scrape_search_results', params, getPort());
}
async function scrapeUserTweetsCommand(username, options) {
    const limit = parseInt(options.limit || '20', 10);
    const scrollAttempts = parseInt(options.scrollAttempts || '5', 10);
    console.error(`Scraping @${username} tweets (limit: ${limit})...`);
    return (0, cli_js_1.runCliAction)('scrape_user_tweets', { username, limit, scrollAttempts }, getPort());
}
async function scrapeUserProfileCommand(username) {
    console.error(`Scraping @${username} profile...`);
    return (0, cli_js_1.runCliAction)('scrape_user_profile', { username }, getPort());
}
async function scrapeThreadCommand(url) {
    console.error(`Scraping thread: ${url}`);
    return (0, cli_js_1.runCliAction)('scrape_thread', { tweetUrl: url }, getPort());
}
// ── Analytics ────────────────────────────────────────────────
async function analyticsCommand() {
    console.error('Fetching analytics...');
    return (0, cli_js_1.runCliAction)('account_analytics', {}, getPort());
}
// ── Navigation ───────────────────────────────────────────────
async function navigateUrlCommand(url) {
    console.error(`Navigating to: ${url}`);
    return (0, cli_js_1.runCliAction)('navigate_to_tweet', { tweetUrl: url }, getPort());
}
async function navigateSearchCommand(query) {
    console.error(`Navigating to search: ${query}`);
    return (0, cli_js_1.runCliAction)('navigate_to_search', { query }, getPort());
}
async function navigateBookmarksCommand() {
    console.error('Navigating to bookmarks...');
    return (0, cli_js_1.runCliAction)('navigate_to_bookmarks', {}, getPort());
}
async function navigateNotificationsCommand() {
    console.error('Navigating to notifications...');
    return (0, cli_js_1.runCliAction)('navigate_to_notifications', {}, getPort());
}
// ── Status & Serve ───────────────────────────────────────────
async function statusCommand() {
    const WebSocket = (await import('ws')).default;
    const { randomUUID } = await import('crypto');
    const port = getPort();
    const requestId = randomUUID();
    return new Promise((resolve) => {
        const ws = new WebSocket(`ws://127.0.0.1:${port}`);
        const timer = setTimeout(() => {
            console.log('');
            console.log('  🦞 BNBot Status');
            console.log('  ─────────────────');
            console.log('  Server    ✗ not running');
            console.log('  Extension ✗ not connected');
            console.log('');
            ws.close();
            resolve();
        }, 5000);
        ws.on('open', () => {
            ws.send(JSON.stringify({ type: 'cli_action', requestId, actionType: 'get_extension_status', actionPayload: {} }));
        });
        ws.on('message', (data) => {
            try {
                const msg = JSON.parse(data.toString());
                if (msg.requestId === requestId) {
                    clearTimeout(timer);
                    const d = msg.data || {};
                    console.log('');
                    console.log('  🦞 BNBot Status');
                    console.log('  ─────────────────');
                    console.log(`  Server    ${msg.success ? '✓' : '✗'} ws://localhost:${d.wsPort || port}`);
                    console.log(`  Extension ${d.connected ? '✓ connected' : '✗ not connected'}${d.extensionVersion ? ` (v${d.extensionVersion})` : ''}`);
                    console.log('');
                    ws.close();
                    resolve();
                }
            }
            catch { }
        });
        ws.on('error', () => {
            clearTimeout(timer);
            console.log('');
            console.log('  🦞 BNBot Status');
            console.log('  ─────────────────');
            console.log('  Server    ✗ not running');
            console.log('  Extension ✗ not connected');
            console.log('');
            console.log('  Run "bnbot serve" to start the server.');
            console.log('');
            resolve();
        });
    });
}
// ── Content fetching (via extension) ─────────────────────────
async function fetchWeixinArticleCommand(url) {
    console.error(`Fetching WeChat article: ${url}`);
    return (0, cli_js_1.runCliAction)('fetch_wechat_article', { url }, getPort());
}
async function fetchTiktokCommand(url) {
    console.error(`Fetching TikTok: ${url}`);
    return (0, cli_js_1.runCliAction)('fetch_tiktok_video', { url }, getPort());
}
async function fetchXiaohongshuCommand(url) {
    console.error(`Fetching Xiaohongshu: ${url}`);
    return (0, cli_js_1.runCliAction)('fetch_xiaohongshu_note', { url }, getPort());
}
//# sourceMappingURL=actions.js.map