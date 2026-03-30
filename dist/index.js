#!/usr/bin/env node
"use strict";
/**
 * BNBot - Control Twitter/X via CLI
 *
 * Modes:
 *   bnbot                        # Default: start WebSocket server
 *   bnbot serve [--port 18900]   # Same as above (explicit)
 *   bnbot login [--email EMAIL]  # Login to BNBot
 *   bnbot <tool> [args]          # Send command via WebSocket
 *   bnbot --version / -v         # Print version
 *   bnbot --help / -h            # Print help
 */
Object.defineProperty(exports, "__esModule", { value: true });
// Handle --version before any imports
if (process.argv.includes('--version') || process.argv.includes('-v')) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pkg = require('../package.json');
    console.log(pkg.version);
    process.exit(0);
}
const wsServer_js_1 = require("./wsServer.js");
const cli_js_1 = require("./cli.js");
const DEFAULT_PORT = 18900;
function printHelp() {
    const help = `
BNBot - Control Twitter/X via CLI

USAGE:
  bnbot                          Start WebSocket server (default)
  bnbot serve [--port PORT]      Start WebSocket server (explicit)
  bnbot login [--email EMAIL]    Login to BNBot (auto-detects clawmoney API key)
  bnbot <tool> [--param value]   Send a command to a running server via WebSocket
  bnbot --version, -v            Print version
  bnbot --help, -h               Print this help

AUTH:
  bnbot login [--email EMAIL]    Login to BNBot via email verification
                                 Auto-uses clawmoney API key if available
                                 Sends auth tokens to connected extension

AVAILABLE TOOLS:
  Status:
    get-extension-status         Check extension connection status
    get-current-page-info        Get current Twitter/X page info

  Scrape:
    scrape-timeline              Scrape tweets from timeline
    scrape-bookmarks             Scrape bookmarked tweets
    scrape-search-results        Search and scrape results
    scrape-current-view          Scrape currently visible tweets
    scrape-thread                Scrape a tweet thread
    account-analytics            Get account analytics

  Tweet:
    post-tweet                   Post a tweet (--text "..." [--media url])
    post-thread                  Post a tweet thread
    submit-reply                 Reply to a tweet
    quote-tweet                  Quote a tweet

  Engagement:
    like-tweet                   Like current tweet
    retweet                      Retweet current tweet
    follow-user                  Follow a user (--username handle)

  Navigation:
    navigate-to-tweet            Go to a tweet (--tweetUrl url)
    navigate-to-search           Go to search (--query "...")
    navigate-to-bookmarks        Go to bookmarks
    navigate-to-notifications    Go to notifications
    navigate-to-following        Go to following timeline
    return-to-timeline           Go back to timeline

  Content:
    fetch-wechat-article         Fetch WeChat article (--url url)
    fetch-tiktok-video           Fetch TikTok video (--url url)
    fetch-xiaohongshu-note       Fetch Xiaohongshu note (--url url)

  Article:
    open-article-editor          Open article editor
    fill-article-title           Fill article title (--title "...")
    fill-article-body            Fill article body (--content "...")
    upload-article-header-image  Upload header image (--headerImage path)
    publish-article              Publish article
    create-article               Full article creation flow

EXAMPLES:
  bnbot                                            # Start server
  bnbot get-extension-status                       # Check if extension is connected
  bnbot post-tweet --text "Hello from BNBot!"      # Post a tweet
  bnbot scrape-timeline --limit 10                 # Scrape 10 tweets
  bnbot navigate-to-search --query "AI agents"     # Navigate to search

ARCHITECTURE:
  "bnbot" starts a WebSocket server the Chrome Extension connects to.
  "bnbot <tool>" connects as a client to an already-running server.
  Extension auto-login is handled via clawmoney API key (~/.clawmoney/config.yaml).
`.trimStart();
    console.log(help);
}
function parsePort(args) {
    const idx = args.indexOf('--port');
    if (idx !== -1 && args[idx + 1]) {
        const p = parseInt(args[idx + 1], 10);
        if (!isNaN(p))
            return p;
    }
    return DEFAULT_PORT;
}
/**
 * Start WebSocket server.
 * The Chrome Extension connects here. CLI tools also connect here.
 */
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
async function main() {
    const args = process.argv.slice(2);
    // --help / -h
    if (args.includes('--help') || args.includes('-h')) {
        printHelp();
        process.exit(0);
    }
    // Find the first non-flag argument as the subcommand
    const subcommand = args.find((a) => !a.startsWith('-'));
    const port = parsePort(args);
    if (subcommand === 'login') {
        const { runLogin } = await import('./auth.js');
        await runLogin(args);
        return;
    }
    if (subcommand === 'serve') {
        await runServe(port);
        return;
    }
    // CLI tool mode: if the subcommand matches a known tool name
    if (subcommand && cli_js_1.CLI_TOOL_NAMES.includes(subcommand)) {
        // Pass remaining args after the tool name
        const toolArgIndex = args.indexOf(subcommand);
        const toolArgs = args.slice(toolArgIndex + 1);
        await (0, cli_js_1.runCliTool)(subcommand, toolArgs);
        return;
    }
    // Unknown subcommand
    if (subcommand) {
        console.error(`Unknown command: ${subcommand}`);
        console.error('Run "bnbot --help" to see available commands.');
        process.exit(1);
    }
    // No subcommand: default to serve mode
    await runServe(port);
}
main().catch((err) => {
    console.error('[BNBOT] Fatal error:', err);
    process.exit(1);
});
//# sourceMappingURL=index.js.map