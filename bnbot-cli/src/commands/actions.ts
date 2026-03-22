import chalk from 'chalk';
import { sendAction, BridgeServer } from '../utils/bridge.js';

export async function tweetCommand(text: string, options: { media?: string; draft?: boolean }) {
  const isDraft = options.draft || false;
  const preview = text.slice(0, 80) + (text.length > 80 ? '...' : '');
  console.log(chalk.dim(`${isDraft ? 'Drafting' : 'Posting'}: "${preview}"`));

  try {
    const params: Record<string, unknown> = { text, draftOnly: isDraft };
    if (options.media) params.media = [{ type: 'image', url: options.media }];

    const result = await sendAction('post_tweet', params);
    if (!result.success) {
      console.error(chalk.red(result.error || 'Failed'));
      process.exit(1);
    }

    if (isDraft) {
      console.log(chalk.green('Draft ready — review and post manually'));
    } else {
      console.log(chalk.green('Tweet posted'));
      const data = result.data as Record<string, string> | undefined;
      if (data?.url || data?.tweet_url) {
        console.log(chalk.cyan(data.url || data.tweet_url));
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
    const params: Record<string, unknown> = { tweetUrl: url, text };
    if (options.media) params.image = options.media;

    const result = await sendAction('submit_reply', params);
    if (!result.success) { console.error(chalk.red(result.error || 'Failed')); process.exit(1); }
    console.log(chalk.green('Replied'));
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
