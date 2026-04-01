#!/usr/bin/env node

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

import { Command } from 'commander';
import { BnbotWsServer } from './wsServer.js';
import { CLI_TOOL_NAMES, runCliTool } from './cli.js';
import { PUBLIC_SCRAPER_NAMES, runPublicScraper } from './publicScrapers.js';
import {
  postCommand,
  closeCommand,
  threadCommand,
  replyCommand,
  quoteCommand,
  likeCommand,
  unlikeCommand,
  retweetCommand,
  unretweetCommand,
  followCommand,
  unfollowCommand,
  deleteCommand,
  bookmarkCommand,
  unbookmarkCommand,
  scrapeTimelineCommand,
  scrapeBookmarksCommand,
  scrapeSearchCommand,
  scrapeUserTweetsCommand,
  scrapeUserProfileCommand,
  scrapeThreadCommand,
  analyticsCommand,
  navigateUrlCommand,
  navigateSearchCommand,
  navigateBookmarksCommand,
  navigateNotificationsCommand,
  statusCommand,
  fetchWeixinArticleCommand,
  fetchTiktokCommand,
  fetchXiaohongshuCommand,
} from './commands/actions.js';

const DEFAULT_PORT = 18900;

// ── Serve command ────────────────────────────────────────────

async function runServe(port: number): Promise<void> {
  const wsServer = new BnbotWsServer(port);
  try {
    await wsServer.start();
  } catch (err) {
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

function buildProgram(): Command {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pkg = require('../package.json');

  const program = new Command();
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
      const args: string[] = [];
      if (options.email) { args.push('--email', options.email); }
      if (options.port) { args.push('--port', options.port); }
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
    .action(statusCommand);

  // ── X platform commands ────────────────────────────────

  const x = program
    .command('x')
    .description('X (Twitter) platform commands');

  // x post
  x.command('post <text>')
    .description('Post a tweet')
    .option('-m, --media <url...>', 'Media file(s) or URL(s) to attach')
    .option('-d, --draft', 'Draft mode: fill composer without posting')
    .action(postCommand);

  // x close
  x.command('close')
    .description('Close tweet composer')
    .option('-s, --save', 'Save as draft instead of discarding')
    .action(closeCommand);

  // x thread
  x.command('thread <tweets-json>')
    .description('Post a tweet thread (JSON array)')
    .action(threadCommand);

  // x reply
  x.command('reply <url> <text>')
    .description('Reply to a tweet')
    .option('-m, --media <url...>', 'Media file(s) or URL(s) to attach')
    .action(replyCommand);

  // x quote
  x.command('quote <url> <text>')
    .description('Quote a tweet')
    .action(quoteCommand);

  // x like / unlike
  x.command('like <url>')
    .description('Like a tweet')
    .action(likeCommand);

  x.command('unlike <url>')
    .description('Unlike a tweet')
    .action(unlikeCommand);

  // x retweet / unretweet
  x.command('retweet <url>')
    .description('Retweet a tweet')
    .action(retweetCommand);

  x.command('unretweet <url>')
    .description('Unretweet a tweet')
    .action(unretweetCommand);

  // x follow / unfollow
  x.command('follow <username>')
    .description('Follow a user')
    .action(followCommand);

  x.command('unfollow <username>')
    .description('Unfollow a user')
    .action(unfollowCommand);

  // x delete
  x.command('delete <url>')
    .description('Delete a tweet')
    .action(deleteCommand);

  // x bookmark / unbookmark
  x.command('bookmark <url>')
    .description('Bookmark a tweet')
    .action(bookmarkCommand);

  x.command('unbookmark <url>')
    .description('Unbookmark a tweet')
    .action(unbookmarkCommand);

  // x analytics
  x.command('analytics')
    .description('Get account analytics')
    .action(analyticsCommand);

  // ── x scrape subgroup ──────────────────────────────────

  const xScrape = x
    .command('scrape')
    .description('Scrape X data');

  xScrape
    .command('timeline')
    .description('Scrape home timeline')
    .option('-l, --limit <n>', 'Max tweets', '20')
    .option('--scrollAttempts <n>', 'Scroll attempts', '5')
    .action(scrapeTimelineCommand);

  xScrape
    .command('bookmarks')
    .description('Scrape bookmarked tweets')
    .option('-l, --limit <n>', 'Max tweets', '20')
    .action(scrapeBookmarksCommand);

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
    .action(scrapeSearchCommand);

  xScrape
    .command('user-tweets <username>')
    .description('Scrape tweets from a user')
    .option('-l, --limit <n>', 'Max tweets', '20')
    .option('--scrollAttempts <n>', 'Scroll attempts', '5')
    .action(scrapeUserTweetsCommand);

  xScrape
    .command('user-profile <username>')
    .description('Get user profile info')
    .action(scrapeUserProfileCommand);

  xScrape
    .command('thread <url>')
    .description('Scrape a tweet thread')
    .action(scrapeThreadCommand);

  // ── x navigate subgroup ────────────────────────────────

  const xNav = x
    .command('navigate')
    .description('Navigate within X');

  xNav
    .command('url <url>')
    .description('Navigate to a URL')
    .action(navigateUrlCommand);

  // Also allow: bnbot x navigate <url> (without "url" subcommand)
  // handled via .argument() on navigate itself
  xNav
    .argument('[target]', 'URL to navigate to')
    .action((target?: string) => {
      if (target && (target.startsWith('http') || target.startsWith('x.com') || target.startsWith('twitter.com'))) {
        return navigateUrlCommand(target);
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
    .action(navigateSearchCommand);

  xNav
    .command('bookmarks')
    .description('Navigate to bookmarks')
    .action(navigateBookmarksCommand);

  xNav
    .command('notifications')
    .description('Navigate to notifications')
    .action(navigateNotificationsCommand);

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
    .action(async (query: string, options: { limit?: string; sort?: string }) => {
      await runPublicScraper('search-hackernews', { query, limit: Number(options.limit) || 20, sort: options.sort });
    });

  // stackoverflow
  const stackoverflow = program
    .command('stackoverflow')
    .description('Stack Overflow data');
  stackoverflow
    .command('search <query>')
    .description('Search Stack Overflow')
    .option('-l, --limit <n>', 'Max results', '10')
    .action(async (query: string, options: { limit?: string }) => {
      await runPublicScraper('search-stackoverflow', { query, limit: Number(options.limit) || 10 });
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
    .action(async (query: string, options: { lang?: string; limit?: string }) => {
      await runPublicScraper('search-wikipedia', { query, lang: options.lang, limit: Number(options.limit) || 10 });
    });

  // apple-podcasts
  const applePodcasts = program
    .command('apple-podcasts')
    .description('Apple Podcasts data');
  applePodcasts
    .command('search <query>')
    .description('Search Apple Podcasts')
    .option('-l, --limit <n>', 'Max results', '10')
    .action(async (query: string, options: { limit?: string }) => {
      await runPublicScraper('search-apple-podcasts', { query, limit: Number(options.limit) || 10 });
    });

  // substack
  const substack = program
    .command('substack')
    .description('Substack data');
  substack
    .command('search <query>')
    .description('Search Substack posts')
    .option('-l, --limit <n>', 'Max results', '20')
    .action(async (query: string, options: { limit?: string }) => {
      await runPublicScraper('search-substack', { query, limit: Number(options.limit) || 20 });
    });

  // v2ex
  const v2ex = program
    .command('v2ex')
    .description('V2EX data');
  v2ex
    .command('hot')
    .description('V2EX hot topics')
    .action(async () => {
      await runPublicScraper('fetch-v2ex-hot', {});
    });

  // bloomberg
  const bloomberg = program
    .command('bloomberg')
    .description('Bloomberg data');
  bloomberg
    .command('news')
    .description('Bloomberg news headlines')
    .option('-l, --limit <n>', 'Max results', '20')
    .action(async (options: { limit?: string }) => {
      await runPublicScraper('fetch-bloomberg-news', { limit: Number(options.limit) || 20 });
    });

  // bbc
  const bbc = program
    .command('bbc')
    .description('BBC data');
  bbc
    .command('news')
    .description('BBC news headlines')
    .option('-l, --limit <n>', 'Max results', '20')
    .action(async (options: { limit?: string }) => {
      await runPublicScraper('fetch-bbc-news', { limit: Number(options.limit) || 20 });
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
    .action(async (options: { limit?: string; type?: string }) => {
      await runPublicScraper('fetch-sinafinance-news', { limit: Number(options.limit) || 20, type: Number(options.type) || 0 });
    });

  // sinablog
  const sinablog = program
    .command('sinablog')
    .description('Sina Blog data');
  sinablog
    .command('search <query>')
    .description('Search Sina Blog')
    .option('-l, --limit <n>', 'Max results', '20')
    .action(async (query: string, options: { limit?: string }) => {
      await runPublicScraper('search-sinablog', { query, limit: Number(options.limit) || 20 });
    });

  // xiaoyuzhou
  const xiaoyuzhou = program
    .command('xiaoyuzhou')
    .description('Xiaoyuzhou FM data');
  xiaoyuzhou
    .command('podcast <id>')
    .description('Get podcast info')
    .action(async (id: string) => {
      await runPublicScraper('fetch-xiaoyuzhou-podcast', { podcastId: id });
    });

  // ── Content fetching (via extension) ───────────────────

  const weixin = program
    .command('weixin')
    .description('WeChat content');
  weixin
    .command('article <url>')
    .description('Fetch WeChat article')
    .action(fetchWeixinArticleCommand);

  const tiktok = program
    .command('tiktok')
    .description('TikTok content');
  tiktok
    .command('fetch <url>')
    .description('Fetch TikTok video info')
    .action(fetchTiktokCommand);

  const xiaohongshu = program
    .command('xiaohongshu')
    .description('Xiaohongshu content');
  xiaohongshu
    .command('fetch <url>')
    .description('Fetch Xiaohongshu note')
    .action(fetchXiaohongshuCommand);

  return program;
}

// ── Main ─────────────────────────────────────────────────────

async function main(): Promise<void> {
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
    if (PUBLIC_SCRAPER_NAMES.includes(firstArg)) {
      const toolArgs = userArgs.slice(1);
      const params: Record<string, unknown> = {};
      for (let i = 0; i < toolArgs.length; i++) {
        if (toolArgs[i].startsWith('--') && toolArgs[i + 1] && !toolArgs[i + 1].startsWith('--')) {
          params[toolArgs[i].slice(2)] = isNaN(Number(toolArgs[i + 1]))
            ? toolArgs[i + 1]
            : Number(toolArgs[i + 1]);
          i++;
        }
      }
      await runPublicScraper(firstArg, params);
      return;
    }

    // Legacy CLI tool: bnbot post-tweet --text "Hello"
    if (CLI_TOOL_NAMES.includes(firstArg)) {
      const toolArgs = userArgs.slice(1);
      await runCliTool(firstArg, toolArgs);
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
