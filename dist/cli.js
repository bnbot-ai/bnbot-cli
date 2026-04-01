"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CLI_TOOL_NAMES = void 0;
exports.runCliTool = runCliTool;
exports.runCliAction = runCliAction;
const ws_1 = __importDefault(require("ws"));
const crypto_1 = require("crypto");
const mediaUtils_js_1 = require("./tools/mediaUtils.js");
const DEFAULT_PORT = 18900;
const CLI_TIMEOUT = 120000; // 120s
/**
 * Map of CLI tool names (kebab-case) to WebSocket action types (snake_case).
 * Also serves as the canonical list of supported CLI tools.
 */
const TOOL_MAP = {
    // Status
    'get-extension-status': 'get_extension_status',
    'get-current-page-info': 'get_current_url',
    // Scrape
    'scrape-timeline': 'scrape_timeline',
    'scrape-bookmarks': 'scrape_bookmarks',
    'scrape-search-results': 'scrape_search_results',
    'scrape-current-view': 'scrape_current_view',
    'scrape-thread': 'scrape_thread',
    'scrape-user-profile': 'scrape_user_profile',
    'scrape-user-tweets': 'scrape_user_tweets',
    'account-analytics': 'account_analytics',
    // Tweet
    'post-tweet': 'post_tweet',
    'post-thread': 'post_thread',
    'submit-reply': 'submit_reply',
    'quote-tweet': 'quote_tweet',
    // Engagement
    'like-tweet': 'like_tweet',
    'unlike-tweet': 'unlike_tweet',
    'retweet': 'retweet',
    'unretweet': 'unretweet',
    'follow-user': 'follow_user',
    'unfollow-user': 'unfollow_user',
    'delete-tweet': 'delete_tweet',
    'bookmark-tweet': 'bookmark_tweet',
    'unbookmark-tweet': 'unbookmark_tweet',
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
exports.CLI_TOOL_NAMES = Object.keys(TOOL_MAP);
/**
 * Parse CLI flags into a params object.
 * Supports: --key value, --boolFlag (no value => true), --key 123 (auto-number).
 */
function parseArgs(argv) {
    let port = DEFAULT_PORT;
    const params = {};
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
            }
            else {
                let value;
                const num = Number(next);
                if (!isNaN(num) && next.trim() !== '') {
                    value = num;
                }
                else if (next === 'true') {
                    value = true;
                }
                else if (next === 'false') {
                    value = false;
                }
                else {
                    value = next;
                }
                // Collect repeated keys (e.g. --media a --media b) into arrays
                if (params[key] !== undefined) {
                    if (Array.isArray(params[key])) {
                        params[key].push(value);
                    }
                    else {
                        params[key] = [params[key], value];
                    }
                }
                else {
                    params[key] = value;
                }
                i += 2;
            }
        }
        else {
            i += 1;
        }
    }
    return { port, params };
}
/**
 * Run a CLI tool command by connecting to the WS server as a client.
 */
async function runCliTool(toolName, argv) {
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
        const mediaSources = (Array.isArray(raw) ? raw : [raw])
            .flatMap((s) => String(s).split(','))
            .map((s) => s.trim())
            .filter((s) => s.length > 0);
        try {
            params.media = await (0, mediaUtils_js_1.resolveMediaListAsync)(mediaSources);
        }
        catch (e) {
            console.error(`Failed to process media: ${e.message}`);
            process.exit(1);
        }
        delete params.images;
    }
    // Auto-split into thread when post-tweet has >4 media (Twitter limit: 4 per tweet)
    const MAX_MEDIA_PER_TWEET = 4;
    const resolvedMedia = params.media;
    if (toolName === 'post-tweet' && resolvedMedia && resolvedMedia.length > MAX_MEDIA_PER_TWEET) {
        const text = String(params.text || '');
        const draftOnly = params.draftOnly;
        const tweets = [];
        for (let i = 0; i < resolvedMedia.length; i += MAX_MEDIA_PER_TWEET) {
            const chunk = resolvedMedia.slice(i, i + MAX_MEDIA_PER_TWEET);
            tweets.push({
                text: i === 0 ? text : `(${Math.floor(i / MAX_MEDIA_PER_TWEET) + 1}/${Math.ceil(resolvedMedia.length / MAX_MEDIA_PER_TWEET)})`,
                media: chunk,
            });
        }
        // Switch to post_thread action
        console.error(`[BNBOT] ${resolvedMedia.length} media files detected, auto-splitting into ${tweets.length}-tweet thread`);
        params.tweets = tweets;
        params.draftOnly = draftOnly;
        delete params.text;
        delete params.media;
        // Override action type to post_thread
        return runCliAction('post_thread', params, port);
    }
    return runCliAction(actionType, params, port);
}
/**
 * Send an action to the WS server and print the result.
 */
function runCliAction(actionType, params, port) {
    return new Promise((resolve) => {
        const url = `ws://127.0.0.1:${port}`;
        const requestId = (0, crypto_1.randomUUID)();
        let ws;
        try {
            ws = new ws_1.default(url);
        }
        catch {
            console.error(`Failed to connect to BNBot server at ${url}`);
            console.error('Make sure "bnbot serve" or "bnbot mcp" is running first.');
            process.exit(1);
            return;
        }
        const timeout = setTimeout(() => {
            console.error(`Timeout: no response within ${CLI_TIMEOUT / 1000}s`);
            ws.close();
            process.exit(1);
        }, CLI_TIMEOUT);
        ws.on('open', () => {
            ws.send(JSON.stringify({
                type: 'cli_action',
                requestId,
                actionType,
                actionPayload: params,
            }));
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
            }
            catch {
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
            resolve();
        });
    });
}
//# sourceMappingURL=cli.js.map