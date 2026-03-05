/**
 * Tool Registration - Register all MCP tools
 */

import type { BnbotWsServer } from '../wsServer.js';
import { registerScrapeTools } from './scrapeTools.js';
import { registerTweetTools } from './tweetTools.js';
import { registerNavigationTools } from './navigationTools.js';
import { registerStatusTools } from './statusTools.js';
import { registerEngagementTools } from './engagementTools.js';
import { registerContentTools } from './contentTools.js';
import { registerArticleTools } from './articleTools.js';

export function registerAllTools(server: any, wsServer: BnbotWsServer) {
  registerScrapeTools(server, wsServer);
  registerTweetTools(server, wsServer);
  registerNavigationTools(server, wsServer);
  registerStatusTools(server, wsServer);
  registerEngagementTools(server, wsServer);
  registerContentTools(server, wsServer);
  registerArticleTools(server, wsServer);

  console.error('[BNBOT MCP] All tools registered');
}
