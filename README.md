# @bnbot/cli

**BNBot (Brand & Bot)** — AI-powered personal branding toolkit for X. Discover trends from 30+ platforms, create content with AI, and automate your growth.

## Quick Start

```bash
npx @bnbot/cli setup
```

This installs the CLI globally and sets up the Claude Code skill (`/bnbot`).

Then install the [BNBot Chrome Extension](https://chromewebstore.google.com/detail/bnbot/haammgigdkckogcgnbkigfleejpaiiln) for browser automation.

## Architecture

```
Terminal
    → bnbot <command> [args]
    ↓ WebSocket (ws://localhost:18900)
BNBot Chrome Extension
    ↓ chrome.scripting / DOM / Internal APIs
X + 30 platforms (TikTok, YouTube, Reddit, Bilibili, etc.)
```

## Commands

### Setup & Status

| Command | Description |
|---------|-------------|
| `bnbot setup` | Install CLI + Claude skill |
| `bnbot serve` | Start WebSocket server |
| `bnbot login` | Login to BNBot |
| `bnbot --help` | Show all commands |

### Scrape (via Chrome Extension)

| Command | Description |
|---------|-------------|
| `scrape-timeline` | Scrape home timeline |
| `scrape-search-results --query "AI"` | Search and scrape tweets |
| `scrape-user-profile --username elonmusk` | Get user profile |
| `scrape-user-tweets --username elonmusk` | Scrape user's tweets |
| `scrape-bookmarks` | Scrape bookmarked tweets |
| `scrape-thread --tweetUrl <url>` | Scrape a tweet thread |
| `account-analytics` | Get account analytics |

### Tweet & Engage (via Chrome Extension)

| Command | Description |
|---------|-------------|
| `post-tweet --text "Hello!"` | Post a tweet |
| `post-thread --tweets '[...]'` | Post a thread |
| `submit-reply --text "..."` | Reply to current tweet |
| `like-tweet` | Like current tweet |
| `retweet` | Retweet |
| `follow-user --username handle` | Follow a user |

### Public Data (direct fetch, no extension needed)

| Command | Description |
|---------|-------------|
| `search-hackernews --query "AI"` | Search Hacker News |
| `search-stackoverflow --query "react"` | Search Stack Overflow |
| `search-wikipedia --query "ChatGPT"` | Search Wikipedia |
| `search-apple-podcasts --query "tech"` | Search Apple Podcasts |
| `search-substack --query "AI"` | Search Substack |
| `fetch-v2ex-hot` | V2EX hot topics |
| `fetch-bbc-news` | BBC news headlines |
| `fetch-bloomberg-news` | Bloomberg news |
| `fetch-sinafinance-news` | Sina Finance 7x24 |
| `search-sinablog --query "AI"` | Search Sina Blog |
| `fetch-xiaoyuzhou-podcast --podcastId <id>` | Xiaoyuzhou podcast info |

### Content (via Chrome Extension)

| Command | Description |
|---------|-------------|
| `fetch-wechat-article --url <url>` | Fetch WeChat article |
| `fetch-tiktok-video --url <url>` | Fetch TikTok video |
| `fetch-xiaohongshu-note --url <url>` | Fetch Xiaohongshu note |

### Article

| Command | Description |
|---------|-------------|
| `create-article --title "..." --content "..."` | Create long-form article |
| `open-article-editor` | Open article editor |

## Login

```bash
# Auto-login via clawmoney API key
bnbot login

# Or via email
bnbot login --email you@example.com
```

## Links

- [BNBot Chrome Extension](https://chromewebstore.google.com/detail/bnbot/haammgigdkckogcgnbkigfleejpaiiln)
- [BNBot Website](https://bnbot.ai)
- Twitter: [@BNBOT_AI](https://x.com/BNBOT_AI)

## License

MIT
