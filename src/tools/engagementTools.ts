/**
 * Engagement Tools - Like, retweet, and follow on Twitter/X
 */

import { z } from 'zod';
import type { BnbotWsServer } from '../wsServer.js';

export function registerEngagementTools(server: any, wsServer: BnbotWsServer) {
  server.tool(
    'like_tweet',
    'Like the tweet on the currently open tweet page. Navigate to the tweet first using navigate_to_tweet.',
    {},
    async () => {
      const result = await wsServer.sendAction('like_tweet', {});
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
        isError: !result.success,
      };
    }
  );

  server.tool(
    'retweet',
    'Retweet/repost the tweet on the currently open tweet page. Navigate to the tweet first using navigate_to_tweet.',
    {},
    async () => {
      const result = await wsServer.sendAction('retweet', {});
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
        isError: !result.success,
      };
    }
  );

  server.tool(
    'quote_tweet',
    'Quote tweet the currently open tweet with custom text. Navigate to the tweet first using navigate_to_tweet.',
    {
      text: z.string().describe('The quote text to post with the retweet'),
    },
    async (args: { text: string }) => {
      const result = await wsServer.sendAction('quote_tweet', { text: args.text });
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
        isError: !result.success,
      };
    }
  );

  server.tool(
    'follow_user',
    'Follow a user on Twitter/X. If username is provided, navigates to their profile first. Otherwise follows the author of the currently open tweet.',
    {
      username: z.string().optional().describe('Optional Twitter username (without @) to navigate to their profile and follow'),
    },
    async (args: { username?: string }) => {
      const payload: Record<string, unknown> = {};
      if (args.username) {
        payload.username = args.username;
      }
      const result = await wsServer.sendAction('follow_user', payload);
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
        isError: !result.success,
      };
    }
  );
}
