/**
 * Content Tools - Fetch content from external platforms (WeChat, TikTok, Xiaohongshu)
 */

import { z } from 'zod';
import type { BnbotWsServer } from '../wsServer.js';

export function registerContentTools(server: any, wsServer: BnbotWsServer) {
  server.tool(
    'fetch_wechat_article',
    'Fetch and extract content from a WeChat Official Account article. Returns markdown-formatted article content including title, author, and body text.',
    {
      url: z.string().describe('WeChat article URL (mp.weixin.qq.com)'),
    },
    async (params: { url: string }) => {
      const result = await wsServer.sendAction('fetch_wechat_article', params);
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
        isError: !result.success,
      };
    }
  );

  server.tool(
    'fetch_tiktok_video',
    'Fetch TikTok video metadata including description, author info, and video download URL.',
    {
      url: z.string().describe('TikTok video URL'),
    },
    async (params: { url: string }) => {
      const result = await wsServer.sendAction('fetch_tiktok_video', params);
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
        isError: !result.success,
      };
    }
  );

  server.tool(
    'fetch_xiaohongshu_note',
    'Fetch content from a Xiaohongshu (Little Red Book) note including text, images, author, and engagement metrics.',
    {
      url: z.string().describe('Xiaohongshu note URL (xiaohongshu.com or xhslink.com)'),
    },
    async (params: { url: string }) => {
      const result = await wsServer.sendAction('fetch_xiaohongshu_note', params);
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
        isError: !result.success,
      };
    }
  );

  server.tool(
    'fetch_youtube_video',
    'Fetch YouTube video metadata including title, author, and thumbnail via oEmbed API.',
    {
      url: z.string().describe('YouTube video URL'),
    },
    async (params: { url: string }) => {
      const result = await wsServer.sendAction('fetch_youtube_video', params);
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
        isError: !result.success,
      };
    }
  );
}
