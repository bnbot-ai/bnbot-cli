# bnbot-cli

**BNBot (Brand & Bot)** — AI-powered personal brand and social media automation. Helps you run your personal brand and social accounts from the terminal. Currently supports X (Twitter), more platforms coming soon.

Powered by [BNBot Chrome Extension](https://chromewebstore.google.com/detail/bnbot-your-ai-growth-agen/haammgigdkckogcgnbkigfleejpaiiln).

## Architecture

```
Terminal
    → bnbot <command> [args]
    ↓ WebSocket (ws://localhost:18900)
BNBot Chrome Extension
    ↓ DOM / GraphQL API / CDP
Twitter/X (and 40+ platforms via opencli)
```

BNBot Extension has a built-in [OpenCLI](https://github.com/jackwener/opencli) bridge — no need to install the opencli extension separately. Install `opencli` CLI and BNBot Extension handles the rest.

## Install

```bash
npm install -g bnbot-cli
```

Install the [BNBot Chrome Extension](https://chromewebstore.google.com/detail/bnbot-your-ai-growth-agen/haammgigdkckogcgnbkigfleejpaiiln) and enable the **OpenClaw** toggle in Settings.

### Optional: OpenCLI (40+ platform support)

```bash
npm install -g @jackwener/opencli
```

With opencli installed, BNBot Extension acts as the browser bridge for both tools. One extension, two CLIs.

```bash
# BNBot commands (Twitter/X)
bnbot scrape user-tweets elonmusk -l 20

# OpenCLI commands (TikTok, YouTube, Reddit, etc.)
opencli tiktok explore --limit 10
opencli youtube search "AI agents" --limit 5
```

## Quick Start

```bash
# Start the server
bnbot

# Scrape & publish
bnbot scrape user-tweets elonmusk -l 10
bnbot tweet post "Hello from BNBot!" --media image.png
bnbot scrape search "AI agents" -t top -l 20
```

## Commands

### Scrape

| Command | Description | Key Params |
|---------|-------------|------------|
| `scrape user-tweets <username>` | Scrape a user's tweets | `-l 50` `--scrollAttempts 5` |
| `scrape user-profile <username>` | Get user profile info | |
| `scrape search <query>` | Search and scrape tweets | `-t top` `-l 20` |
| `scrape timeline` | Scrape home timeline | `-l 20` |
| `scrape bookmarks` | Scrape bookmarked tweets | `-l 20` |
| `scrape thread <url>` | Scrape a tweet thread | |

#### Advanced Search

```bash
bnbot scrape search "AI" \
  --from elonmusk \
  --since 2026-03-01 \
  --until 2026-03-30 \
  --lang en \
  --minLikes 100 \
  --has images \
  -t latest \
  -l 50
```

### Tweet

| Command | Description | Key Params |
|---------|-------------|------------|
| `tweet post <text>` | Post a tweet | `-m image.png` `-d` (draft) |
| `tweet close` | Close composer | `-s` (save draft) |

Draft mode fills the composer without posting:

```bash
bnbot tweet post "Review before posting" -d -m cover.png
```

### Engagement

| Command | Description |
|---------|-------------|
| `like <url>` | Like a tweet |
| `retweet <url>` | Retweet |
| `reply <url> <text>` | Reply to a tweet |
| `follow <username>` | Follow a user |

### Status

| Command | Description |
|---------|-------------|
| `status` | Check extension connection |
| `serve` | Start bridge server (`-p 9999` for custom port) |

## Login

```bash
# Auto-login via clawmoney API key
bnbot login

# Or via email
bnbot login --email you@example.com
```

## OpenCLI Bridge

BNBot Extension includes a built-in opencli-compatible browser bridge. When `opencli` CLI is installed, it automatically connects through BNBot Extension instead of needing the separate opencli Browser Bridge extension.

Supported platforms via opencli: TikTok, YouTube, Reddit, Bilibili, Instagram, LinkedIn, Twitter, and [40+ more](https://github.com/jackwener/opencli/blob/main/docs/adapters/index.md).

## Links

- [BNBot Chrome Extension](https://chromewebstore.google.com/detail/bnbot-your-ai-growth-agen/haammgigdkckogcgnbkigfleejpaiiln)
- [bnbot-editor](https://github.com/jackleeio/bnbot-editor) — AI social media editor skill for Claude Code
- [OpenCLI](https://github.com/jackwener/opencli) — 40+ platform CLI (uses BNBot Extension as bridge)
- Twitter: [@BNBOT_AI](https://x.com/BNBOT_AI)

## License

MIT
