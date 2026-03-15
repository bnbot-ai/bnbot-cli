# bnbot

CLI and MCP Server for [BNBOT Chrome Extension](https://chromewebstore.google.com/detail/bnbot-your-ai-growth-agen/haammgigdkckogcgnbkigfleejpaiiln) - Control Twitter/X via AI assistants like OpenClaw or Claude Desktop.

## Architecture

```
AI Assistant (OpenClaw / Claude Desktop)
    ↓ stdio (MCP protocol)
bnbot mcp (local Node.js process)
    ↓↑ WebSocket (ws://localhost:18900)
BNBOT Chrome Extension
    ↓ DOM operations
Twitter/X
```

CLI mode connects to the same WebSocket server:

```
Terminal
    → bnbot <tool> [args]
    ↓ WebSocket client (ws://localhost:18900)
bnbot serve (WebSocket server)
    ↓↑ WebSocket
BNBOT Chrome Extension
```

## Setup

### 1. Install

```bash
npm install -g bnbot
```

### 2. Install BNBOT Chrome Extension

Install from the Chrome Web Store.

### 3. Enable OpenClaw Integration

In the BNBOT extension sidebar, open **Settings** and turn on the **OpenClaw** toggle.

### 4. Configure Your AI Assistant

#### OpenClaw / Claude Desktop

Add to your MCP config:

```json
{
  "mcpServers": {
    "bnbot": {
      "command": "npx",
      "args": ["bnbot"]
    }
  }
}
```

#### Custom Port

```json
{
  "mcpServers": {
    "bnbot": {
      "command": "npx",
      "args": ["bnbot", "--port", "9999"]
    }
  }
}
```

### 5. Use It

Ask your AI assistant:
- "Scrape my Twitter timeline"
- "Search for tweets about AI"
- "Post a tweet saying hello world"
- "Navigate to my bookmarks and scrape them"

## Usage Modes

### MCP Mode (Default)

Starts both the WebSocket server and MCP stdio transport. This is the default when no subcommand is given, preserving backward compatibility.

```bash
bnbot                   # Start MCP + WebSocket server
bnbot mcp               # Same as above (explicit)
bnbot mcp --port 9999   # Custom port
```

### Serve Mode (Daemon)

Starts the WebSocket server only. Use this when you want to run the server in the background and send commands via CLI.

```bash
bnbot serve              # Start WebSocket server on port 18900
bnbot serve --port 9999  # Custom port
```

### CLI Mode

Send a command to an already-running WebSocket server. Requires `bnbot serve` or `bnbot mcp` to be running.

```bash
bnbot get-extension-status
bnbot post-tweet --text "Hello from BNBot!"
bnbot scrape-timeline --limit 10
bnbot navigate-to-search --query "AI agents"
```

## Available Tools

### Scrape
| Tool | Description |
|------|-------------|
| `scrape_timeline` | Scrape tweets from the timeline |
| `scrape_bookmarks` | Scrape bookmarked tweets |
| `scrape_search_results` | Search and scrape results |
| `scrape_current_view` | Scrape currently visible tweets |
| `scrape_thread` | Scrape a tweet thread from URL |
| `account_analytics` | Get account analytics data |

### Tweet
| Tool | Description |
|------|-------------|
| `post_tweet` | Post a tweet with optional images |
| `post_thread` | Post a thread of tweets |
| `submit_reply` | Reply to a tweet |
| `quote_tweet` | Quote a tweet with optional comment |

### Engagement
| Tool | Description |
|------|-------------|
| `like_tweet` | Like a target tweet |
| `retweet` | Retweet a target tweet |
| `follow_user` | Follow a target user |

### Navigation
| Tool | Description |
|------|-------------|
| `navigate_to_tweet` | Go to a specific tweet |
| `navigate_to_search` | Go to search page |
| `navigate_to_bookmarks` | Go to bookmarks |
| `navigate_to_notifications` | Go to notifications |
| `navigate_to_following` | Go to following timeline |
| `return_to_timeline` | Go back to timeline |

### Status
| Tool | Description |
|------|-------------|
| `get_extension_status` | Check extension connection |
| `get_current_page_info` | Get current page info |

### Content
| Tool | Description |
|------|-------------|
| `fetch_wechat_article` | Fetch and extract WeChat article content |
| `fetch_tiktok_video` | Fetch TikTok metadata and download video locally |
| `fetch_xiaohongshu_note` | Fetch Xiaohongshu note content and metadata |

### Article
| Tool | Description |
|------|-------------|
| `open_article_editor` | Open X article editor via stable flow |
| `fill_article_title` | Fill article title field |
| `fill_article_body` | Fill article body (`plain` / `markdown` / `html`) |
| `upload_article_header_image` | Upload article header image |
| `publish_article` | Publish article (or keep draft) |
| `create_article` | End-to-end article creation flow |

## Testing

Use the MCP Inspector to test tools directly:

```bash
npx @modelcontextprotocol/inspector npx bnbot
```

## Links

- [BNBot Chrome Extension](https://chromewebstore.google.com/detail/bnbot-your-ai-growth-agen/haammgigdkckogcgnbkigfleejpaiiln)
- [BNBot Skill for OpenClaw](https://github.com/bnbot-ai/bnbot-skill)
- [ClawMoney](https://clawmoney.ai) — Social task marketplace powered by BNBot
- [OpenClaw](https://openclaw.ai) — AI agent framework
- Twitter: [@BNBOT_AI](https://x.com/BNBOT_AI)

## License

MIT
