#!/usr/bin/env node

import { Command } from 'commander';
import { tweetCommand, likeCommand, retweetCommand, replyCommand, followCommand, serveCommand, statusCommand } from './commands/actions.js';

const program = new Command();

program
  .name('bnbot')
  .description('BNBot CLI — Control Twitter/X via Chrome Extension')
  .version('2.0.0');

program
  .command('tweet <text>')
  .description('Post a tweet')
  .option('-m, --media <url>', 'Media URL to attach')
  .option('-d, --draft', 'Draft mode: fill composer without posting')
  .action(tweetCommand);

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

program
  .command('status')
  .description('Check Chrome Extension connection')
  .action(statusCommand);

program
  .command('serve')
  .description('Start bridge server (usually auto-started)')
  .option('-p, --port <port>', 'WebSocket port', '18900')
  .action(serveCommand);

program.parse();
