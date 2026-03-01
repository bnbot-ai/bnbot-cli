/**
 * Tweet Tools - Create and publish content on Twitter/X
 */

import { z } from 'zod';
import type { BnbotWsServer } from '../wsServer.js';

export function registerTweetTools(server: any, wsServer: BnbotWsServer) {
  server.tool(
    'post_tweet',
    'Post a new tweet on Twitter/X. Supports text and optional images.',
    {
      text: z.string().describe('Tweet text content (max 280 characters)'),
      images: z.array(z.string()).optional().describe('Array of image URLs to attach'),
    },
    async (params: { text: string; images?: string[] }) => {
      const result = await wsServer.sendAction('post_tweet', params);
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
        isError: !result.success,
      };
    }
  );

  server.tool(
    'post_thread',
    'Post a thread (multiple connected tweets) on Twitter/X.',
    {
      tweets: z.array(z.object({
        text: z.string().describe('Tweet text'),
        images: z.array(z.string()).optional().describe('Image URLs for this tweet'),
      })).describe('Array of tweets in the thread, in order'),
    },
    async (params: { tweets: Array<{ text: string; images?: string[] }> }) => {
      const result = await wsServer.sendAction('post_thread', params);
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
        isError: !result.success,
      };
    }
  );

  server.tool(
    'submit_reply',
    'Reply to a specific tweet. Navigate to the tweet first or provide the tweet URL.',
    {
      tweetUrl: z.string().optional().describe('URL of the tweet to reply to. If omitted, replies to the currently open tweet.'),
      text: z.string().describe('Reply text content'),
      image: z.string().optional().describe('Image URL to attach to the reply'),
    },
    async (params: { tweetUrl?: string; text: string; image?: string }) => {
      const result = await wsServer.sendAction('submit_reply', params);
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
        isError: !result.success,
      };
    }
  );
}
