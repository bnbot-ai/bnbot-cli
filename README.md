# bnbot-cli

**BNBot (Brand & Bot)** — AI-powered personal brand and social media automation. Helps you run your personal brand and social accounts on Twitter/X from the terminal.

Powered by [BNBot Chrome Extension](https://chromewebstore.google.com/detail/bnbot-your-ai-growth-agen/haammgigdkckogcgnbkigfleejpaiiln).

## Architecture

```
Terminal
    → bnbot <command> [args]
    ↓ WebSocket (ws://localhost:18900)
BNBot Chrome Extension
    ↓ DOM operations
Twitter/X
```

## Install

```bash
npm install -g bnbot-cli
```

Install the [BNBot Chrome Extension](https://chromewebstore.google.com/detail/bnbot-your-ai-growth-agen/haammgigdkckogcgnbkigfleejpaiiln) and enable the **OpenClaw** toggle in Settings.

## Quick Start

```bash
# Start the WebSocket server (keep running in background)
bnbot

# In another terminal, run commands:
bnbot scrape-user-tweets --username elonmusk --limit 10
bnbot post-tweet --text "Hello from BNBot!"
bnbot scrape-search-results --query "AI agents" --tab top --limit 20
```

## Commands

### Scrape

| Command | Description | Key Params |
|---------|-------------|------------|
| `scrape-timeline` | Scrape tweets from home timeline | `--limit 20` `--scrollAttempts 5` |
| `scrape-user-tweets` | Scrape a user's tweets | `--username handle` `--limit 20` |
| `scrape-user-profile` | Get user profile info (bio, followers, etc.) | `--username handle` |
| `scrape-search-results` | Search and scrape tweets | `--query "..."` `--tab top` `--limit 20` |
| `scrape-bookmarks` | Scrape bookmarked tweets | `--limit 20` |
| `scrape-thread` | Scrape a tweet thread | `--tweetUrl url` |
| `scrape-current-view` | Scrape visible tweets (no scroll) | |
| `account-analytics` | Get account analytics | `--startDate` `--endDate` |

#### Advanced Search Filters

`scrape-search-results` supports advanced Twitter search:

```bash
bnbot scrape-search-results \
  --query "AI" \
  --from elonmusk \
  --since 2026-03-01 \
  --until 2026-03-30 \
  --lang en \
  --minLikes 100 \
  --has images \
  --tab latest \
  --limit 50
```

### Tweet

| Command | Description | Key Params |
|---------|-------------|------------|
| `post-tweet` | Post a tweet | `--text "..."` `--media url` `--draft` |
| `post-thread` | Post a tweet thread | `--texts "t1" "t2" "t3"` |
| `submit-reply` | Reply to a tweet | `--tweetUrl url` `--text "..."` |
| `quote-tweet` | Quote tweet | `--tweetUrl url` `--text "..."` |

Draft mode fills the composer without posting:

```bash
bnbot post-tweet --text "Review before posting" --draft
```

### Engagement

| Command | Description |
|---------|-------------|
| `like-tweet` / `unlike-tweet` | Like/unlike a tweet |
| `retweet` / `unretweet` | Retweet/undo |
| `follow-user` / `unfollow-user` | Follow/unfollow |
| `delete-tweet` | Delete your tweet |
| `bookmark-tweet` / `unbookmark-tweet` | Bookmark/remove |

### Navigation

| Command | Description |
|---------|-------------|
| `navigate-to-tweet` | Go to a tweet (`--tweetUrl url`) |
| `navigate-to-search` | Go to search (`--query "..."`) |
| `navigate-to-bookmarks` | Go to bookmarks |
| `navigate-to-notifications` | Go to notifications |
| `navigate-to-following` | Go to following timeline |
| `return-to-timeline` | Back to home |

### Content Fetching

| Command | Description |
|---------|-------------|
| `fetch-wechat-article` | Extract WeChat article (`--url url`) |
| `fetch-tiktok-video` | Download TikTok video (`--url url`) |
| `fetch-xiaohongshu-note` | Extract Xiaohongshu note (`--url url`) |

### Article

| Command | Description |
|---------|-------------|
| `create-article` | End-to-end article creation |
| `open-article-editor` | Open X article editor |
| `fill-article-title` | Set article title |
| `fill-article-body` | Set body (plain/markdown/html) |
| `publish-article` | Publish or save draft |

### Status

| Command | Description |
|---------|-------------|
| `get-extension-status` | Check extension connection |
| `get-current-page-info` | Get current page URL/info |

## Login

```bash
# Auto-login via clawmoney API key (if ~/.clawmoney/config.yaml exists)
bnbot login

# Or via email verification
bnbot login --email you@example.com
```

## Links

- [BNBot Chrome Extension](https://chromewebstore.google.com/detail/bnbot-your-ai-growth-agen/haammgigdkckogcgnbkigfleejpaiiln)
- [ClawMoney](https://clawmoney.ai) — Social task marketplace
- Twitter: [@BNBOT_AI](https://x.com/BNBOT_AI)

## License

MIT
