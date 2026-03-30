#!/usr/bin/env node

import { Command } from 'commander';
import { tweetCommand, closeCommand, likeCommand, retweetCommand, replyCommand, followCommand, serveCommand, statusCommand, scrapeUserTweetsCommand, scrapeUserProfileCommand, scrapeSearchCommand, scrapeTimelineCommand, scrapeBookmarksCommand, scrapeThreadCommand } from './commands/actions.js';

const program = new Command();

program
  .name('bnbot')
  .description('BNBot (Brand & Bot) — AI-powered personal brand and social media automation')
  .version('2.7.3');

// tweet subcommand group
const tweet = program.command('tweet').description('Tweet commands');

tweet
  .command('post <text>')
  .description('Post a tweet')
  .option('-m, --media <url>', 'Media URL to attach')
  .option('-d, --draft', 'Draft mode: fill composer without posting')
  .action(tweetCommand);

tweet
  .command('close')
  .description('Close tweet composer')
  .option('-s, --save', 'Save as draft instead of discarding')
  .action(closeCommand);

// scrape subcommand group
const scrape = program.command('scrape').description('Scrape social media data');

scrape
  .command('user-tweets <username>')
  .description('Scrape tweets from a user')
  .option('-l, --limit <n>', 'Max tweets to collect', '20')
  .option('--scrollAttempts <n>', 'Scroll attempts', '5')
  .action(scrapeUserTweetsCommand);

scrape
  .command('user-profile <username>')
  .description('Get user profile info (bio, followers, etc.)')
  .action(scrapeUserProfileCommand);

scrape
  .command('search <query>')
  .description('Search and scrape tweets')
  .option('-t, --tab <tab>', 'Search tab: top, latest, people, media', 'top')
  .option('-l, --limit <n>', 'Max results', '20')
  .option('--from <username>', 'Filter by author')
  .option('--since <date>', 'Start date (YYYY-MM-DD)')
  .option('--until <date>', 'End date (YYYY-MM-DD)')
  .option('--lang <code>', 'Language filter (en, zh, etc.)')
  .option('--minLikes <n>', 'Minimum likes')
  .option('--minRetweets <n>', 'Minimum retweets')
  .option('--has <type>', 'Media filter: images, videos, links')
  .action(scrapeSearchCommand);

scrape
  .command('timeline')
  .description('Scrape home timeline')
  .option('-l, --limit <n>', 'Max tweets', '20')
  .option('--scrollAttempts <n>', 'Scroll attempts', '5')
  .action(scrapeTimelineCommand);

scrape
  .command('bookmarks')
  .description('Scrape bookmarked tweets')
  .option('-l, --limit <n>', 'Max tweets', '20')
  .action(scrapeBookmarksCommand);

scrape
  .command('thread <url>')
  .description('Scrape a tweet thread')
  .action(scrapeThreadCommand);

// engagement commands
program
  .command('like <url>')
  .description('Like a tweet')
  .action(likeCommand);

program
  .command('retweet <url>')
  .description('Retweet a tweet')
  .action(retweetCommand);

program
  .command('reply <url> <text>')
  .description('Reply to a tweet')
  .option('-m, --media <url>', 'Media URL to attach')
  .action(replyCommand);

program
  .command('follow <username>')
  .description('Follow a user')
  .action(followCommand);

// utility commands
program
  .command('status')
  .description('Check browser extension connection')
  .action(statusCommand);

program
  .command('serve')
  .description('Start bridge server (usually auto-started)')
  .option('-p, --port <port>', 'WebSocket port', '18900')
  .action(serveCommand);

program.parse();
