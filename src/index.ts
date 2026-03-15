#!/usr/bin/env node

/**
 * BNBot - Control Twitter/X via AI assistants
 *
 * Modes:
 *   bnbot                        # Default: MCP stdio mode (backward compat)
 *   bnbot serve [--port 18900]   # Run WebSocket daemon
 *   bnbot mcp [--port 18900]     # Explicit MCP stdio mode
 *   bnbot <tool> [args]          # CLI mode: send command via WebSocket
 *   bnbot --version / -v         # Print version
 *   bnbot --help / -h            # Print help
 */

// Handle --version before any imports
if (process.argv.includes('--version') || process.argv.includes('-v')) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pkg = require('../package.json');
  console.log(pkg.version);
  process.exit(0);
}

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { BnbotWsServer } from './wsServer.js';
import { registerAllTools } from './tools/index.js';
import { CLI_TOOL_NAMES, runCliTool } from './cli.js';

const DEFAULT_PORT = 18900;

function printHelp(): void {
  const help = `
BNBot - Control Twitter/X via AI assistants

USAGE:
  bnbot                          Start MCP server with WebSocket (default)
  bnbot serve [--port PORT]      Start WebSocket server only (daemon mode)
  bnbot mcp   [--port PORT]      Start MCP + WebSocket server (same as default)
  bnbot <tool> [--param value]   Send a command to a running server via WebSocket
  bnbot --version, -v            Print version
  bnbot --help, -h               Print this help

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
  bnbot serve                                    # Start daemon
  bnbot get-extension-status                     # Check if extension is connected
  bnbot post-tweet --text "Hello from BNBot!"    # Post a tweet
  bnbot scrape-timeline --limit 10               # Scrape 10 tweets
  bnbot navigate-to-search --query "AI agents"   # Navigate to search

ARCHITECTURE:
  "bnbot serve" starts a WebSocket server the Chrome Extension connects to.
  "bnbot mcp" also starts the WebSocket server, plus an MCP stdio transport.
  "bnbot <tool>" connects as a client to an already-running WebSocket server.
`.trimStart();

  console.log(help);
}

function parsePort(args: string[]): number {
  const idx = args.indexOf('--port');
  if (idx !== -1 && args[idx + 1]) {
    const p = parseInt(args[idx + 1], 10);
    if (!isNaN(p)) return p;
  }
  return DEFAULT_PORT;
}

/**
 * Serve mode: start WebSocket server only (no MCP stdio).
 * The Chrome Extension connects here. CLI tools also connect here.
 */
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

/**
 * MCP mode: start WebSocket server AND MCP stdio transport.
 * This is the original/default behavior for backward compatibility.
 */
async function runMcp(port: number): Promise<void> {
  const wsServer = new BnbotWsServer(port);

  try {
    await wsServer.start();
  } catch (err) {
    console.error('[BNBOT MCP] Failed to start WebSocket server:', err);
    process.exit(1);
  }

  const mcpServer = new McpServer({
    name: 'bnbot',
    version: '1.0.0',
  });

  registerAllTools(mcpServer, wsServer);

  const transport = new StdioServerTransport();
  await mcpServer.connect(transport);

  console.error('[BNBOT MCP] Server started. Waiting for extension connection...');

  const shutdown = () => {
    console.error('[BNBOT MCP] Shutting down...');
    wsServer.stop();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  // --help / -h
  if (args.includes('--help') || args.includes('-h')) {
    printHelp();
    process.exit(0);
  }

  // Find the first non-flag argument as the subcommand
  const subcommand = args.find((a) => !a.startsWith('-'));
  const port = parsePort(args);

  if (subcommand === 'serve') {
    await runServe(port);
    return;
  }

  if (subcommand === 'mcp') {
    await runMcp(port);
    return;
  }

  // CLI tool mode: if the subcommand matches a known tool name
  if (subcommand && CLI_TOOL_NAMES.includes(subcommand)) {
    // Pass remaining args after the tool name
    const toolArgIndex = args.indexOf(subcommand);
    const toolArgs = args.slice(toolArgIndex + 1);
    await runCliTool(subcommand, toolArgs);
    return;
  }

  // Unknown subcommand
  if (subcommand) {
    console.error(`Unknown command: ${subcommand}`);
    console.error('Run "bnbot --help" to see available commands.');
    process.exit(1);
  }

  // No subcommand: default to MCP mode (backward compat)
  await runMcp(port);
}

main().catch((err) => {
  console.error('[BNBOT] Fatal error:', err);
  process.exit(1);
});
