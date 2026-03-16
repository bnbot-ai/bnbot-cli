/**
 * CLI Client - Connect to a running BNBot WebSocket server and send a tool command.
 *
 * Usage:
 *   bnbot <tool-name> [--param value ...]
 *
 * Example:
 *   bnbot get-extension-status
 *   bnbot scrape-timeline --limit 10 --scrollAttempts 3
 *   bnbot post-tweet --text "Hello world"
 *   bnbot navigate-to-search --query "AI agents"
 */

import WebSocket from 'ws';
import { randomUUID } from 'crypto';
import { resolveMediaListAsync } from './tools/mediaUtils.js';

const DEFAULT_PORT = 18900;
const CLI_TIMEOUT = 60000; // 60s

/**
 * Map of CLI tool names (kebab-case) to WebSocket action types (snake_case).
 * Also serves as the canonical list of supported CLI tools.
 */
const TOOL_MAP: Record<string, string> = {
  // Status
  'get-extension-status': 'get_extension_status',
  'get-current-page-info': 'get_current_url',
  // Scrape
  'scrape-timeline': 'scrape_timeline',
  'scrape-bookmarks': 'scrape_bookmarks',
  'scrape-search-results': 'scrape_search_results',
  'scrape-current-view': 'scrape_current_view',
  'scrape-thread': 'scrape_thread',
  'account-analytics': 'account_analytics',
  // Tweet
  'post-tweet': 'post_tweet',
  'post-thread': 'post_thread',
  'submit-reply': 'submit_reply',
  'quote-tweet': 'quote_tweet',
  // Engagement
  'like-tweet': 'like_tweet',
  'retweet': 'retweet',
  'follow-user': 'follow_user',
  // Navigation
  'navigate-to-tweet': 'navigate_to_tweet',
  'navigate-to-search': 'navigate_to_search',
  'navigate-to-bookmarks': 'navigate_to_bookmarks',
  'navigate-to-notifications': 'navigate_to_notifications',
  'navigate-to-following': 'navigate_to_following',
  'return-to-timeline': 'return_to_timeline',
  // Content
  'fetch-wechat-article': 'fetch_wechat_article',
  'fetch-tiktok-video': 'fetch_tiktok_video',
  'fetch-xiaohongshu-note': 'fetch_xiaohongshu_note',
  // Article
  'open-article-editor': 'open_article_editor',
  'fill-article-title': 'fill_article_title',
  'fill-article-body': 'fill_article_body',
  'upload-article-header-image': 'upload_article_header_image',
  'publish-article': 'publish_article',
  'create-article': 'create_article',
};

/** All known CLI tool names */
export const CLI_TOOL_NAMES = Object.keys(TOOL_MAP);

/**
 * Parse CLI flags into a params object.
 * Supports: --key value, --boolFlag (no value => true), --key 123 (auto-number).
 */
function parseArgs(argv: string[]): { port: number; params: Record<string, unknown> } {
  let port = DEFAULT_PORT;
  const params: Record<string, unknown> = {};

  let i = 0;
  while (i < argv.length) {
    const arg = argv[i];
    if (arg === '--port' && argv[i + 1]) {
      port = parseInt(argv[i + 1], 10) || DEFAULT_PORT;
      i += 2;
      continue;
    }
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const next = argv[i + 1];
      // If next arg is missing or is another flag, treat as boolean true
      if (!next || next.startsWith('--')) {
        params[key] = true;
        i += 1;
      } else {
        let value: unknown;
        const num = Number(next);
        if (!isNaN(num) && next.trim() !== '') {
          value = num;
        } else if (next === 'true') {
          value = true;
        } else if (next === 'false') {
          value = false;
        } else {
          value = next;
        }
        // Collect repeated keys (e.g. --media a --media b) into arrays
        if (params[key] !== undefined) {
          if (Array.isArray(params[key])) {
            (params[key] as unknown[]).push(value);
          } else {
            params[key] = [params[key], value];
          }
        } else {
          params[key] = value;
        }
        i += 2;
      }
    } else {
      i += 1;
    }
  }

  return { port, params };
}

/**
 * Run a CLI tool command by connecting to the WS server as a client.
 */
export async function runCliTool(toolName: string, argv: string[]): Promise<void> {
  const actionType = TOOL_MAP[toolName];
  if (!actionType) {
    console.error(`Unknown tool: ${toolName}`);
    console.error(`Run "bnbot --help" to see available tools.`);
    process.exit(1);
  }

  const { port, params } = parseArgs(argv);

  // Resolve media files/URLs to base64 data URLs before sending
  if (params.media || params.images) {
    const raw = params.media || params.images;
    // Normalize to flat string array: supports --media a --media b, --media a,b, or --media a
    const mediaSources: string[] = (Array.isArray(raw) ? raw : [raw])
      .flatMap((s: unknown) => String(s).split(','))
      .map((s: string) => s.trim())
      .filter((s: string) => s.length > 0);
    try {
      params.media = await resolveMediaListAsync(mediaSources);
    } catch (e: any) {
      console.error(`Failed to process media: ${e.message}`);
      process.exit(1);
    }
    delete params.images;
  }

  const url = `ws://127.0.0.1:${port}`;
  const requestId = randomUUID();

  // For get-extension-status, we handle it specially since it's a local-only query
  // on the MCP server side. In CLI mode, we just check if the WS server is reachable
  // and if an extension is connected by sending the action and getting the response.

  let ws: WebSocket;
  try {
    ws = new WebSocket(url);
  } catch {
    console.error(`Failed to connect to BNBot server at ${url}`);
    console.error('Make sure "bnbot serve" or "bnbot mcp" is running first.');
    process.exit(1);
    return; // unreachable, but keeps TS happy
  }

  const timeout = setTimeout(() => {
    console.error(`Timeout: no response within ${CLI_TIMEOUT / 1000}s`);
    ws.close();
    process.exit(1);
  }, CLI_TIMEOUT);

  ws.on('open', () => {
    const request = {
      type: 'cli_action',
      requestId,
      actionType,
      actionPayload: params,
    };
    ws.send(JSON.stringify(request));
  });

  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data.toString());
      if (msg.requestId === requestId && msg.type === 'action_result') {
        clearTimeout(timeout);
        console.log(JSON.stringify(msg, null, 2));
        ws.close();
        process.exit(msg.success ? 0 : 1);
      }
    } catch {
      // Ignore non-JSON messages
    }
  });

  ws.on('error', (err) => {
    clearTimeout(timeout);
    console.error(`Connection error: ${err.message}`);
    console.error('Make sure "bnbot serve" or "bnbot mcp" is running first.');
    process.exit(1);
  });

  ws.on('close', () => {
    clearTimeout(timeout);
  });
}
