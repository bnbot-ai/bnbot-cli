import chalk from 'chalk';
import { sendAction, BridgeServer } from '../utils/bridge.js';

export async function tweetCommand(text: string, options: { media?: string; draft?: boolean }) {
  const isDraft = options.draft || false;
  const preview = text.slice(0, 80) + (text.length > 80 ? '...' : '');
  console.log(chalk.dim(`${isDraft ? 'Drafting' : 'Posting'}: "${preview}"`));

  try {
    const params: Record<string, unknown> = { text, draftOnly: isDraft };
    if (options.media) {
      const ext = options.media.split('.').pop()?.toLowerCase();
      const videoExts = ['mp4', 'mov', 'webm', 'avi', 'mkv'];
      const mediaType = videoExts.includes(ext ?? '') ? 'video' : 'image';
      params.media = [{ type: mediaType, url: options.media }];
    }

    const result = await sendAction('post_tweet', params);
    if (!result.success) {
      console.error(chalk.red(result.error || 'Failed'));
      process.exit(1);
    }

    if (isDraft) {
      console.log(chalk.green('Draft ready — review and post manually'));
    } else {
      const data = result.data as Record<string, string> | undefined;
      const url = data?.tweetUrl || data?.url || data?.tweet_url;
      if (url) {
        console.log(chalk.green('Tweet posted'));
        console.log(url);
      } else {
        console.log(chalk.green('Tweet posted'));
      }
    }
  } catch (err) {
    console.error(chalk.red((err as Error).message));
    process.exit(1);
  }
}

export async function likeCommand(url: string) {
  console.log(chalk.dim(`Liking: ${url}`));
  try {
    const result = await sendAction('like_tweet', { tweetUrl: url });
    if (!result.success) { console.error(chalk.red(result.error || 'Failed')); process.exit(1); }
    console.log(chalk.green('Liked'));
  } catch (err) {
    console.error(chalk.red((err as Error).message));
    process.exit(1);
  }
}

export async function retweetCommand(url: string) {
  console.log(chalk.dim(`Retweeting: ${url}`));
  try {
    const result = await sendAction('retweet', { tweetUrl: url });
    if (!result.success) { console.error(chalk.red(result.error || 'Failed')); process.exit(1); }
    console.log(chalk.green('Retweeted'));
  } catch (err) {
    console.error(chalk.red((err as Error).message));
    process.exit(1);
  }
}

export async function replyCommand(url: string, text: string, options: { media?: string }) {
  console.log(chalk.dim(`Replying to: ${url}`));
  try {
    // Step 1: Navigate to tweet
    const nav = await sendAction('navigate_to_tweet', { tweetUrl: url });
    if (!nav.success) { console.error(chalk.red(nav.error || 'Navigate failed')); process.exit(1); }

    // Step 2: Open reply composer
    const open = await sendAction('open_reply_composer', {});
    if (!open.success) { console.error(chalk.red(open.error || 'Open composer failed')); process.exit(1); }

    // Step 3: Fill reply text
    const fill = await sendAction('fill_reply_text', { content: text, highlight: false });
    if (!fill.success) { console.error(chalk.red(fill.error || 'Fill text failed')); process.exit(1); }

    // Step 4: Submit
    const result = await sendAction('submit_reply', { waitForSuccess: true, replyText: text });
    if (!result.success) { console.error(chalk.red(result.error || 'Submit failed')); process.exit(1); }
    console.log(chalk.green('Replied'));
    const data = result.data as Record<string, string> | undefined;
    if (data?.tweetUrl) console.log(data.tweetUrl);
  } catch (err) {
    console.error(chalk.red((err as Error).message));
    process.exit(1);
  }
}

export async function followCommand(username: string) {
  console.log(chalk.dim(`Following: @${username}`));
  try {
    const result = await sendAction('follow_user', { username });
    if (!result.success) { console.error(chalk.red(result.error || 'Failed')); process.exit(1); }
    console.log(chalk.green('Followed'));
  } catch (err) {
    console.error(chalk.red((err as Error).message));
    process.exit(1);
  }
}

export async function closeCommand(options: { save?: boolean }) {
  const isSave = options.save || false;
  console.log(chalk.dim(isSave ? 'Saving draft and closing...' : 'Discarding and closing...'));
  try {
    const result = await sendAction('close_composer', { save: isSave });
    if (!result.success) { console.error(chalk.red(result.error || 'Failed')); process.exit(1); }
    const data = result.data as Record<string, string> | undefined;
    if (data?.action === 'saved_as_draft') {
      console.log(chalk.green('Saved as draft'));
    } else if (data?.action === 'discarded') {
      console.log(chalk.green('Discarded'));
    } else {
      console.log(chalk.green('Closed'));
    }
  } catch (err) {
    console.error(chalk.red((err as Error).message));
    process.exit(1);
  }
}

// ── Scrape commands ──────────────────────────────────────────

async function ensureUserPage(username: string): Promise<void> {
  const page = await sendAction('get_current_url', {});
  const currentUrl = ((page.data as Record<string, string>)?.url || '').toLowerCase();
  const target = `x.com/${username.toLowerCase()}`;
  if (currentUrl.includes(target) && !currentUrl.includes('/status/')) {
    return; // Already on user's profile page
  }
  console.error(chalk.dim(`Navigating to @${username}...`));
  await sendAction('navigate_to_url', { url: `https://x.com/${username}` });
  await new Promise(r => setTimeout(r, 2000));
}

export async function scrapeUserTweetsCommand(username: string, options: { limit?: string; scrollAttempts?: string }) {
  const limit = parseInt(options.limit || '20', 10);
  const scrollAttempts = parseInt(options.scrollAttempts || '5', 10);
  try {
    await ensureUserPage(username);
    console.error(chalk.dim(`Scraping @${username} tweets (limit: ${limit})...`));
    const result = await sendAction('scrape_user_tweets', { username, limit, scrollAttempts });
    if (!result.success) { console.error(chalk.red(result.error || 'Failed')); process.exit(1); }
    console.log(JSON.stringify(result.data, null, 2));
  } catch (err) { console.error(chalk.red((err as Error).message)); process.exit(1); }
}

export async function scrapeUserProfileCommand(username: string) {
  try {
    await ensureUserPage(username);
    console.error(chalk.dim(`Scraping @${username} profile...`));
    const result = await sendAction('scrape_user_profile', { username });
    if (!result.success) { console.error(chalk.red(result.error || 'Failed')); process.exit(1); }
    console.log(JSON.stringify(result.data, null, 2));
  } catch (err) { console.error(chalk.red((err as Error).message)); process.exit(1); }
}

export async function scrapeSearchCommand(query: string, options: { tab?: string; limit?: string; from?: string; since?: string; until?: string; lang?: string; minLikes?: string; minRetweets?: string; has?: string }) {
  const limit = parseInt(options.limit || '20', 10);
  const tab = options.tab || 'top';
  console.error(chalk.dim(`Searching: "${query}" (tab: ${tab}, limit: ${limit})...`));
  try {
    const params: Record<string, unknown> = { query, tab, limit };
    if (options.from) params.from = options.from;
    if (options.since) params.since = options.since;
    if (options.until) params.until = options.until;
    if (options.lang) params.lang = options.lang;
    if (options.minLikes) params.minLikes = parseInt(options.minLikes, 10);
    if (options.minRetweets) params.minRetweets = parseInt(options.minRetweets, 10);
    if (options.has) params.has = options.has;
    const result = await sendAction('scrape_search_results', params);
    if (!result.success) { console.error(chalk.red(result.error || 'Failed')); process.exit(1); }
    console.log(JSON.stringify(result.data, null, 2));
  } catch (err) { console.error(chalk.red((err as Error).message)); process.exit(1); }
}

export async function scrapeTimelineCommand(options: { limit?: string; scrollAttempts?: string }) {
  const limit = parseInt(options.limit || '20', 10);
  const scrollAttempts = parseInt(options.scrollAttempts || '5', 10);
  console.error(chalk.dim(`Scraping timeline (limit: ${limit})...`));
  try {
    const result = await sendAction('scrape_timeline', { limit, scrollAttempts });
    if (!result.success) { console.error(chalk.red(result.error || 'Failed')); process.exit(1); }
    console.log(JSON.stringify(result.data, null, 2));
  } catch (err) { console.error(chalk.red((err as Error).message)); process.exit(1); }
}

export async function scrapeBookmarksCommand(options: { limit?: string }) {
  const limit = parseInt(options.limit || '20', 10);
  console.error(chalk.dim(`Scraping bookmarks (limit: ${limit})...`));
  try {
    const result = await sendAction('scrape_bookmarks', { limit });
    if (!result.success) { console.error(chalk.red(result.error || 'Failed')); process.exit(1); }
    console.log(JSON.stringify(result.data, null, 2));
  } catch (err) { console.error(chalk.red((err as Error).message)); process.exit(1); }
}

export async function scrapeThreadCommand(url: string) {
  console.error(chalk.dim(`Scraping thread: ${url}`));
  try {
    const result = await sendAction('scrape_thread', { tweetUrl: url });
    if (!result.success) { console.error(chalk.red(result.error || 'Failed')); process.exit(1); }
    console.log(JSON.stringify(result.data, null, 2));
  } catch (err) { console.error(chalk.red((err as Error).message)); process.exit(1); }
}

export async function statusCommand() {
  try {
    const result = await sendAction('get_extension_status', {});
    if (result.success) {
      console.log(chalk.green('Extension connected'));
      if (result.data) console.log(chalk.dim(JSON.stringify(result.data, null, 2)));
    } else {
      console.log(chalk.yellow(result.error || 'Extension not connected'));
    }
  } catch (err) {
    console.log(chalk.red('Bridge not running or extension not connected'));
    console.log(chalk.dim((err as Error).message));
  }
}

export async function serveCommand(options: { port?: string }) {
  const port = parseInt(options.port || '18900', 10);
  const server = new BridgeServer(port);

  try {
    await server.start();
  } catch (err) {
    console.error(chalk.red((err as Error).message));
    process.exit(1);
  }

  console.log(chalk.green(`Bridge server running on ws://127.0.0.1:${port}`));
  console.log(chalk.dim('Waiting for Chrome Extension...'));

  const check = setInterval(() => {
    if (server.isExtensionConnected()) {
      console.log(chalk.green(`Extension connected (v${server.getExtensionVersion() || '?'})`));
      clearInterval(check);
    }
  }, 2000);

  const shutdown = () => { clearInterval(check); server.stop(); process.exit(0); };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}
