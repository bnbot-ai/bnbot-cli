#!/usr/bin/env node
"use strict";
/**
 * BNBot CLI — Control Twitter/X and scrape public data sources.
 *
 * Usage:
 *   bnbot setup                     # One-command install
 *   bnbot login                     # Login to BNBot
 *   bnbot serve                     # Start WebSocket server
 *   bnbot status                    # Check extension connection
 *   bnbot x post "Hello"            # Post a tweet
 *   bnbot x scrape timeline         # Scrape timeline
 *   bnbot hackernews search "AI"    # Public data scraper
 *   bnbot post-tweet --text "Hi"    # Legacy kebab-case (backward compat)
 */
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const wsServer_js_1 = require("./wsServer.js");
const cli_js_1 = require("./cli.js");
const publicScrapers_js_1 = require("./publicScrapers.js");
const actions_js_1 = require("./commands/actions.js");
const scraperActions_js_1 = require("./commands/scraperActions.js");
const DEFAULT_PORT = 18900;
// ── Serve command ────────────────────────────────────────────
async function runServe(port) {
    const wsServer = new wsServer_js_1.BnbotWsServer(port);
    try {
        await wsServer.start();
    }
    catch (err) {
        console.error('[BNBOT] Failed to start WebSocket server:', err);
        process.exit(1);
    }
    console.error(`[BNBOT] WebSocket server running on ws://localhost:${port}`);
    console.error('[BNBOT] Waiting for extension connection...');
    const shutdown = () => {
        console.error('[BNBOT] Shutting down...');
        wsServer.stop();
        process.exit(0);
    };
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
}
// ── Build commander program ──────────────────────────────────
function buildProgram() {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pkg = require('../package.json');
    const program = new commander_1.Command();
    program
        .name('bnbot')
        .description('BNBot — AI-powered personal branding toolkit for X')
        .version(pkg.version);
    // ── Top-level: setup, login, serve, status ─────────────
    program
        .command('setup')
        .description('One-command install (CLI + Claude skill)')
        .action(async () => {
        const { runSetup } = await import('./setup.js');
        await runSetup();
    });
    program
        .command('login')
        .description('Login to BNBot')
        .option('--email <email>', 'Email for login')
        .option('--port <port>', 'WebSocket port', String(DEFAULT_PORT))
        .action(async (options) => {
        const { runLogin } = await import('./auth.js');
        // Reconstruct argv for runLogin
        const args = [];
        if (options.email) {
            args.push('--email', options.email);
        }
        if (options.port) {
            args.push('--port', options.port);
        }
        await runLogin(args);
    });
    program
        .command('serve')
        .description('Start WebSocket server')
        .option('-p, --port <port>', 'WebSocket port', String(DEFAULT_PORT))
        .action(async (options) => {
        const port = parseInt(options.port, 10) || DEFAULT_PORT;
        await runServe(port);
    });
    program
        .command('status')
        .description('Check extension connection status')
        .action(actions_js_1.statusCommand);
    program
        .command('close-compose-window')
        .description('Close tweet composer')
        .option('-s, --save', 'Save as draft instead of discarding')
        .action(actions_js_1.closeCommand);
    // ── X platform commands ────────────────────────────────
    const x = program
        .command('x')
        .description('X (Twitter) platform commands');
    // x post
    x.command('post <text>')
        .description('Post a tweet')
        .option('-m, --media <url...>', 'Media file(s) or URL(s) to attach')
        .option('-d, --draft', 'Draft mode: fill composer without posting')
        .action(actions_js_1.postCommand);
    // x close
    x.command('close')
        .description('Close tweet composer')
        .option('-s, --save', 'Save as draft instead of discarding')
        .action(actions_js_1.closeCommand);
    // x thread
    x.command('thread <tweets-json>')
        .description('Post a tweet thread (JSON array)')
        .action(actions_js_1.threadCommand);
    // x reply
    x.command('reply <url> <text>')
        .description('Reply to a tweet')
        .option('-m, --media <url...>', 'Media file(s) or URL(s) to attach')
        .action(actions_js_1.replyCommand);
    // x quote
    x.command('quote <url> <text>')
        .description('Quote a tweet')
        .action(actions_js_1.quoteCommand);
    // x like / unlike
    x.command('like <url>')
        .description('Like a tweet')
        .action(actions_js_1.likeCommand);
    x.command('unlike <url>')
        .description('Unlike a tweet')
        .action(actions_js_1.unlikeCommand);
    // x retweet / unretweet
    x.command('retweet <url>')
        .description('Retweet a tweet')
        .action(actions_js_1.retweetCommand);
    x.command('unretweet <url>')
        .description('Unretweet a tweet')
        .action(actions_js_1.unretweetCommand);
    // x follow / unfollow
    x.command('follow <username>')
        .description('Follow a user')
        .action(actions_js_1.followCommand);
    x.command('unfollow <username>')
        .description('Unfollow a user')
        .action(actions_js_1.unfollowCommand);
    // x delete
    x.command('delete <url>')
        .description('Delete a tweet')
        .action(actions_js_1.deleteCommand);
    // x bookmark / unbookmark
    x.command('bookmark <url>')
        .description('Bookmark a tweet')
        .action(actions_js_1.bookmarkCommand);
    x.command('unbookmark <url>')
        .description('Unbookmark a tweet')
        .action(actions_js_1.unbookmarkCommand);
    // x analytics
    x.command('analytics')
        .description('Get account analytics')
        .action(actions_js_1.analyticsCommand);
    // ── x scrape subgroup ──────────────────────────────────
    const xScrape = x
        .command('scrape')
        .description('Scrape X data');
    xScrape
        .command('timeline')
        .description('Scrape home timeline')
        .option('-l, --limit <n>', 'Max tweets', '20')
        .option('--scrollAttempts <n>', 'Scroll attempts', '5')
        .action(actions_js_1.scrapeTimelineCommand);
    xScrape
        .command('bookmarks')
        .description('Scrape bookmarked tweets')
        .option('-l, --limit <n>', 'Max tweets', '20')
        .action(actions_js_1.scrapeBookmarksCommand);
    xScrape
        .command('search <query>')
        .description('Search and scrape tweets')
        .option('-t, --tab <tab>', 'Search tab: top, latest, people, media', 'top')
        .option('-l, --limit <n>', 'Max results', '20')
        .option('--from <username>', 'Filter by author')
        .option('--since <date>', 'Start date (YYYY-MM-DD)')
        .option('--until <date>', 'End date (YYYY-MM-DD)')
        .option('--lang <code>', 'Language filter (en, zh, etc.)')
        .option('--minLikes <n>', 'Minimum likes')
        .option('--minRetweets <n>', 'Minimum retweets')
        .option('--has <type>', 'Media filter: images, videos, links')
        .action(actions_js_1.scrapeSearchCommand);
    xScrape
        .command('user-tweets <username>')
        .description('Scrape tweets from a user')
        .option('-l, --limit <n>', 'Max tweets', '20')
        .option('--scrollAttempts <n>', 'Scroll attempts', '5')
        .action(actions_js_1.scrapeUserTweetsCommand);
    xScrape
        .command('user-profile <username>')
        .description('Get user profile info')
        .action(actions_js_1.scrapeUserProfileCommand);
    xScrape
        .command('thread <url>')
        .description('Scrape a tweet thread')
        .action(actions_js_1.scrapeThreadCommand);
    // ── x navigate subgroup ────────────────────────────────
    const xNav = x
        .command('navigate')
        .description('Navigate within X');
    xNav
        .command('url <url>')
        .description('Navigate to a URL')
        .action(actions_js_1.navigateUrlCommand);
    // Also allow: bnbot x navigate <url> (without "url" subcommand)
    // handled via .argument() on navigate itself
    xNav
        .argument('[target]', 'URL to navigate to')
        .action((target) => {
        if (target && (target.startsWith('http') || target.startsWith('x.com') || target.startsWith('twitter.com'))) {
            return (0, actions_js_1.navigateUrlCommand)(target);
        }
        // If no valid target, show help
        if (target) {
            console.error(`Unknown navigate target: ${target}`);
            console.error('Use: bnbot x navigate <url>, or bnbot x navigate search <query>');
            process.exit(1);
        }
    });
    xNav
        .command('search <query>')
        .description('Navigate to search results')
        .action(actions_js_1.navigateSearchCommand);
    xNav
        .command('bookmarks')
        .description('Navigate to bookmarks')
        .action(actions_js_1.navigateBookmarksCommand);
    xNav
        .command('notifications')
        .description('Navigate to notifications')
        .action(actions_js_1.navigateNotificationsCommand);
    // ── Public data scrapers ───────────────────────────────
    // hackernews
    const hackernews = program
        .command('hackernews')
        .description('Hacker News data');
    hackernews
        .command('search <query>')
        .description('Search Hacker News')
        .option('-l, --limit <n>', 'Max results', '20')
        .option('--sort <sort>', 'Sort: relevance or date', 'relevance')
        .action(async (query, options) => {
        await (0, publicScrapers_js_1.runPublicScraper)('search-hackernews', { query, limit: Number(options.limit) || 20, sort: options.sort });
    });
    hackernews
        .command('top')
        .description('HN top stories')
        .option('-l, --limit <n>', 'Max results', '20')
        .action(async (options) => {
        await (0, publicScrapers_js_1.runPublicScraper)('fetch-hackernews-top', { limit: Number(options.limit) || 20 });
    });
    hackernews
        .command('new')
        .description('HN new stories')
        .option('-l, --limit <n>', 'Max results', '20')
        .action(async (options) => {
        await (0, publicScrapers_js_1.runPublicScraper)('fetch-hackernews-new', { limit: Number(options.limit) || 20 });
    });
    hackernews
        .command('best')
        .description('HN best stories')
        .option('-l, --limit <n>', 'Max results', '20')
        .action(async (options) => {
        await (0, publicScrapers_js_1.runPublicScraper)('fetch-hackernews-best', { limit: Number(options.limit) || 20 });
    });
    hackernews
        .command('show')
        .description('HN Show HN')
        .option('-l, --limit <n>', 'Max results', '20')
        .action(async (options) => {
        await (0, publicScrapers_js_1.runPublicScraper)('fetch-hackernews-show', { limit: Number(options.limit) || 20 });
    });
    hackernews
        .command('jobs')
        .description('HN jobs')
        .option('-l, --limit <n>', 'Max results', '20')
        .action(async (options) => {
        await (0, publicScrapers_js_1.runPublicScraper)('fetch-hackernews-jobs', { limit: Number(options.limit) || 20 });
    });
    // stackoverflow
    const stackoverflow = program
        .command('stackoverflow')
        .description('Stack Overflow data');
    stackoverflow
        .command('search <query>')
        .description('Search Stack Overflow')
        .option('-l, --limit <n>', 'Max results', '10')
        .action(async (query, options) => {
        await (0, publicScrapers_js_1.runPublicScraper)('search-stackoverflow', { query, limit: Number(options.limit) || 10 });
    });
    stackoverflow
        .command('hot')
        .description('SO hot questions')
        .option('-l, --limit <n>', 'Max results', '10')
        .action(async (options) => {
        await (0, publicScrapers_js_1.runPublicScraper)('fetch-stackoverflow-hot', { limit: Number(options.limit) || 10 });
    });
    // wikipedia
    const wikipedia = program
        .command('wikipedia')
        .description('Wikipedia data');
    wikipedia
        .command('search <query>')
        .description('Search Wikipedia')
        .option('--lang <code>', 'Language code', 'en')
        .option('-l, --limit <n>', 'Max results', '10')
        .action(async (query, options) => {
        await (0, publicScrapers_js_1.runPublicScraper)('search-wikipedia', { query, lang: options.lang, limit: Number(options.limit) || 10 });
    });
    wikipedia
        .command('summary <title>')
        .description('Wikipedia article summary')
        .option('--lang <code>', 'Language code', 'en')
        .action(async (title, options) => {
        await (0, publicScrapers_js_1.runPublicScraper)('fetch-wikipedia-summary', { title, lang: options.lang });
    });
    // apple-podcasts
    const applePodcasts = program
        .command('apple-podcasts')
        .description('Apple Podcasts data');
    applePodcasts
        .command('search <query>')
        .description('Search Apple Podcasts')
        .option('-l, --limit <n>', 'Max results', '10')
        .action(async (query, options) => {
        await (0, publicScrapers_js_1.runPublicScraper)('search-apple-podcasts', { query, limit: Number(options.limit) || 10 });
    });
    // substack
    const substack = program
        .command('substack')
        .description('Substack data');
    substack
        .command('search <query>')
        .description('Search Substack posts')
        .option('-l, --limit <n>', 'Max results', '20')
        .action(async (query, options) => {
        await (0, publicScrapers_js_1.runPublicScraper)('search-substack', { query, limit: Number(options.limit) || 20 });
    });
    // v2ex
    const v2ex = program
        .command('v2ex')
        .description('V2EX data');
    v2ex
        .command('hot')
        .description('V2EX hot topics')
        .action(async () => {
        await (0, publicScrapers_js_1.runPublicScraper)('fetch-v2ex-hot', {});
    });
    v2ex
        .command('latest')
        .description('V2EX latest topics')
        .action(async () => {
        await (0, publicScrapers_js_1.runPublicScraper)('fetch-v2ex-latest', {});
    });
    // bloomberg
    const bloomberg = program
        .command('bloomberg')
        .description('Bloomberg data');
    bloomberg
        .command('news')
        .description('Bloomberg news headlines')
        .option('-l, --limit <n>', 'Max results', '20')
        .action(async (options) => {
        await (0, publicScrapers_js_1.runPublicScraper)('fetch-bloomberg-news', { limit: Number(options.limit) || 20 });
    });
    // bbc
    const bbc = program
        .command('bbc')
        .description('BBC data');
    bbc
        .command('news')
        .description('BBC news headlines')
        .option('-l, --limit <n>', 'Max results', '20')
        .action(async (options) => {
        await (0, publicScrapers_js_1.runPublicScraper)('fetch-bbc-news', { limit: Number(options.limit) || 20 });
    });
    // sinafinance
    const sinafinance = program
        .command('sinafinance')
        .description('Sina Finance data');
    sinafinance
        .command('news')
        .description('Sina Finance 7x24 news')
        .option('-l, --limit <n>', 'Max results', '20')
        .option('--type <type>', 'News type (0-9)', '0')
        .action(async (options) => {
        await (0, publicScrapers_js_1.runPublicScraper)('fetch-sinafinance-news', { limit: Number(options.limit) || 20, type: Number(options.type) || 0 });
    });
    // sinablog
    const sinablog = program
        .command('sinablog')
        .description('Sina Blog data');
    sinablog
        .command('search <query>')
        .description('Search Sina Blog')
        .option('-l, --limit <n>', 'Max results', '20')
        .action(async (query, options) => {
        await (0, publicScrapers_js_1.runPublicScraper)('search-sinablog', { query, limit: Number(options.limit) || 20 });
    });
    // xiaoyuzhou
    const xiaoyuzhou = program
        .command('xiaoyuzhou')
        .description('Xiaoyuzhou FM data');
    xiaoyuzhou
        .command('podcast <id>')
        .description('Get podcast info')
        .action(async (id) => {
        await (0, publicScrapers_js_1.runPublicScraper)('fetch-xiaoyuzhou-podcast', { podcastId: id });
    });
    xiaoyuzhou
        .command('episodes <podcastId>')
        .description('List podcast episodes')
        .option('-l, --limit <n>', 'Max results', '20')
        .action(async (podcastId, options) => {
        await (0, publicScrapers_js_1.runPublicScraper)('fetch-xiaoyuzhou-episodes', { podcastId, limit: Number(options.limit) || 20 });
    });
    // ── Browser-based platform scrapers (via extension) ────
    const tiktok = program.command('tiktok').description('TikTok');
    tiktok.command('search <query>').description('Search TikTok videos').option('-l, --limit <n>', 'Max results', '10').action(scraperActions_js_1.tiktokSearchCommand);
    tiktok.command('explore').description('Trending TikTok videos').option('-l, --limit <n>', 'Max results', '20').action(scraperActions_js_1.tiktokExploreCommand);
    tiktok.command('fetch <url>').description('Fetch TikTok video info').action(actions_js_1.fetchTiktokCommand);
    const youtube = program.command('youtube').description('YouTube');
    youtube.command('search <query>').description('Search YouTube videos')
        .option('-l, --limit <n>', 'Max results', '20')
        .option('--type <type>', 'Filter: shorts, video, channel, playlist')
        .option('--upload <period>', 'Upload date: hour, today, week, month, year')
        .option('--sort <sort>', 'Sort: relevance, date, views, rating')
        .action(scraperActions_js_1.youtubeSearchCommand);
    youtube.command('video <url>').description('Fetch YouTube video info').action(scraperActions_js_1.youtubeVideoCommand);
    youtube.command('transcript <url>').description('Fetch YouTube video transcript').action(scraperActions_js_1.youtubeTranscriptCommand);
    const reddit = program.command('reddit').description('Reddit');
    reddit.command('search <query>').description('Search Reddit posts').option('-l, --limit <n>', 'Max results', '10').action(scraperActions_js_1.redditSearchCommand);
    reddit.command('hot').description('Reddit frontpage hot posts').option('-l, --limit <n>', 'Max results', '20').action(scraperActions_js_1.redditHotCommand);
    const bilibili = program.command('bilibili').description('Bilibili');
    bilibili.command('search <query>').description('Search Bilibili videos').option('-l, --limit <n>', 'Max results', '10').action(scraperActions_js_1.bilibiliSearchCommand);
    bilibili.command('hot').description('Bilibili popular videos').option('-l, --limit <n>', 'Max results', '20').action(scraperActions_js_1.bilibiliHotCommand);
    bilibili.command('ranking').description('Bilibili ranking').option('-l, --limit <n>', 'Max results', '20').action(scraperActions_js_1.bilibiliRankingCommand);
    const zhihu = program.command('zhihu').description('Zhihu');
    zhihu.command('search <query>').description('Search Zhihu').option('-l, --limit <n>', 'Max results', '10').action(scraperActions_js_1.zhihuSearchCommand);
    zhihu.command('hot').description('Zhihu hot topics').option('-l, --limit <n>', 'Max results', '50').action(scraperActions_js_1.zhihuHotCommand);
    const xueqiu = program.command('xueqiu').description('Xueqiu (stocks)');
    xueqiu.command('search <query>').description('Search stocks').option('-l, --limit <n>', 'Max results', '10').action(scraperActions_js_1.xueqiuSearchCommand);
    xueqiu.command('hot').description('Xueqiu hot stocks').option('-l, --limit <n>', 'Max results', '20').action(scraperActions_js_1.xueqiuHotCommand);
    const instagram = program.command('instagram').description('Instagram');
    instagram.command('search <query>').description('Search Instagram users').option('-l, --limit <n>', 'Max results', '10').action(scraperActions_js_1.instagramSearchCommand);
    instagram.command('explore').description('Instagram explore posts').option('-l, --limit <n>', 'Max results', '20').action(scraperActions_js_1.instagramExploreCommand);
    const linuxdo = program.command('linux-do').description('Linux.do');
    linuxdo.command('search <query>').description('Search Linux.do topics').option('-l, --limit <n>', 'Max results', '10').action(scraperActions_js_1.linuxdoSearchCommand);
    const jike = program.command('jike').description('Jike');
    jike.command('search <query>').description('Search Jike posts').option('-l, --limit <n>', 'Max results', '10').action(scraperActions_js_1.jikeSearchCommand);
    const xiaohongshu = program.command('xiaohongshu').description('Xiaohongshu');
    xiaohongshu.command('search <query>').description('Search Xiaohongshu notes').option('-l, --limit <n>', 'Max results', '10').action(scraperActions_js_1.xiaohongshuSearchCommand);
    xiaohongshu.command('fetch <url>').description('Fetch Xiaohongshu note').action(actions_js_1.fetchXiaohongshuCommand);
    const weibo = program.command('weibo').description('Weibo');
    weibo.command('search <query>').description('Search Weibo posts').option('-l, --limit <n>', 'Max results', '10').action(scraperActions_js_1.weiboSearchCommand);
    weibo.command('hot').description('Weibo hot topics').option('-l, --limit <n>', 'Max results', '50').action(scraperActions_js_1.weiboHotCommand);
    const douban = program.command('douban').description('Douban');
    douban.command('search <query>').description('Search Douban').option('-l, --limit <n>', 'Max results', '10').action(scraperActions_js_1.doubanSearchCommand);
    douban.command('movie-hot').description('Douban hot movies').option('-l, --limit <n>', 'Max results', '20').action(scraperActions_js_1.doubanMovieHotCommand);
    douban.command('book-hot').description('Douban hot books').option('-l, --limit <n>', 'Max results', '20').action(scraperActions_js_1.doubanBookHotCommand);
    douban.command('top250').description('Douban top 250 movies').option('-l, --limit <n>', 'Max results', '20').action(scraperActions_js_1.doubanTop250Command);
    const medium = program.command('medium').description('Medium');
    medium.command('search <query>').description('Search Medium articles').option('-l, --limit <n>', 'Max results', '10').action(scraperActions_js_1.mediumSearchCommand);
    const google = program.command('google').description('Google');
    google.command('search <query>').description('Search Google').option('-l, --limit <n>', 'Max results', '10').action(scraperActions_js_1.googleSearchCommand);
    google.command('news <query>').description('Search Google News').option('-l, --limit <n>', 'Max results', '10').action(scraperActions_js_1.googleNewsCommand);
    const facebook = program.command('facebook').description('Facebook');
    facebook.command('search <query>').description('Search Facebook posts').option('-l, --limit <n>', 'Max results', '10').action(scraperActions_js_1.facebookSearchCommand);
    const linkedin = program.command('linkedin').description('LinkedIn');
    linkedin.command('search <query>').description('Search LinkedIn jobs').option('-l, --limit <n>', 'Max results', '10').action(scraperActions_js_1.linkedinSearchCommand);
    const kr36 = program.command('36kr').description('36Kr');
    kr36.command('search <query>').description('Search 36Kr articles').option('-l, --limit <n>', 'Max results', '10').action(scraperActions_js_1.kr36SearchCommand);
    kr36.command('hot').description('36Kr hot articles').option('-l, --limit <n>', 'Max results', '20').action(scraperActions_js_1.kr36HotCommand);
    kr36.command('news').description('36Kr latest news').option('-l, --limit <n>', 'Max results', '20').action(scraperActions_js_1.kr36NewsCommand);
    const producthunt = program.command('producthunt').description('Product Hunt');
    producthunt.command('hot').description('Top Product Hunt launches').option('-l, --limit <n>', 'Max results', '20').action(scraperActions_js_1.producthuntHotCommand);
    const yahooFinance = program.command('yahoo-finance').description('Yahoo Finance');
    yahooFinance.command('quote <symbol>').description('Get stock quote').action(scraperActions_js_1.yahooFinanceQuoteCommand);
    const weixin = program.command('weixin').description('WeChat');
    weixin.command('article <url>').description('Fetch WeChat article').action(actions_js_1.fetchWeixinArticleCommand);
    return program;
}
// ── Main ─────────────────────────────────────────────────────
async function main() {
    const userArgs = process.argv.slice(2);
    const firstArg = userArgs[0];
    // Default to serve when no arguments
    if (process.argv.length <= 2) {
        await runServe(DEFAULT_PORT);
        return;
    }
    // ── Legacy backward compatibility ──────────────────────
    // Route old kebab-case commands through the original runCliTool / runPublicScraper
    // which use --key value format. This avoids incompatibility with commander's
    // positional arg expectations.
    if (firstArg && !firstArg.startsWith('-')) {
        // Legacy public scraper: bnbot search-hackernews --query "AI"
        if (publicScrapers_js_1.PUBLIC_SCRAPER_NAMES.includes(firstArg)) {
            const toolArgs = userArgs.slice(1);
            const params = {};
            for (let i = 0; i < toolArgs.length; i++) {
                if (toolArgs[i].startsWith('--') && toolArgs[i + 1] && !toolArgs[i + 1].startsWith('--')) {
                    params[toolArgs[i].slice(2)] = isNaN(Number(toolArgs[i + 1]))
                        ? toolArgs[i + 1]
                        : Number(toolArgs[i + 1]);
                    i++;
                }
            }
            await (0, publicScrapers_js_1.runPublicScraper)(firstArg, params);
            return;
        }
        // Legacy CLI tool: bnbot post-tweet --text "Hello"
        if (cli_js_1.CLI_TOOL_NAMES.includes(firstArg)) {
            const toolArgs = userArgs.slice(1);
            await (0, cli_js_1.runCliTool)(firstArg, toolArgs);
            return;
        }
    }
    // ── Commander parsing ──────────────────────────────────
    const program = buildProgram();
    await program.parseAsync(process.argv);
}
main().catch((err) => {
    console.error('[BNBOT] Fatal error:', err);
    process.exit(1);
});
//# sourceMappingURL=index.js.map