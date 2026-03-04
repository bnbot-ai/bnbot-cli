/**
 * Navigation Tools - Navigate within Twitter/X
 */

import { z } from 'zod';
import type { BnbotWsServer } from '../wsServer.js';

export function registerNavigationTools(server: any, wsServer: BnbotWsServer) {
  server.tool(
    'navigate_to_tweet',
    'Navigate to a specific tweet by URL.',
    {
      tweetUrl: z.string().describe('Full URL of the tweet (e.g., https://x.com/user/status/123)'),
    },
    async (params: { tweetUrl: string }) => {
      const result = await wsServer.sendAction('navigate_to_tweet', params);
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
        isError: !result.success,
      };
    }
  );

  server.tool(
    'navigate_to_search',
    'Navigate to Twitter/X search page with an optional query.',
    {
      query: z.string().optional().describe('Search query. If omitted, navigates to the search page.'),
    },
    async (params: { query?: string }) => {
      const result = await wsServer.sendAction('navigate_to_search', params);
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
        isError: !result.success,
      };
    }
  );

  server.tool(
    'navigate_to_bookmarks',
    'Navigate to the Twitter/X bookmarks page.',
    {},
    async () => {
      const result = await wsServer.sendAction('navigate_to_bookmarks', {});
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
        isError: !result.success,
      };
    }
  );

  server.tool(
    'navigate_to_notifications',
    'Navigate to the Twitter/X notifications page.',
    {},
    async () => {
      const result = await wsServer.sendAction('navigate_to_notifications', {});
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
        isError: !result.success,
      };
    }
  );

  server.tool(
    'return_to_timeline',
    'Navigate back to the Twitter/X home timeline.',
    {},
    async () => {
      const result = await wsServer.sendAction('return_to_timeline', {});
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
        isError: !result.success,
      };
    }
  );

  server.tool(
    'get_current_page_info',
    'Get information about the current page open in the Twitter/X tab (URL, page type, etc.).',
    {},
    async () => {
      const result = await wsServer.sendAction('get_current_url', {});
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
        isError: !result.success,
      };
    }
  );
}
