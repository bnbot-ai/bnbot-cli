/**
 * Status Tools - Extension status and diagnostics
 */

import { z } from 'zod';
import type { BnbotWsServer } from '../wsServer.js';

export function registerStatusTools(server: any, wsServer: BnbotWsServer) {
  server.tool(
    'get_extension_status',
    'Check if the BNBOT Chrome extension is connected and get its current status.',
    {},
    async () => {
      const info = wsServer.getExtensionInfo();
      const result = {
        success: true,
        data: {
          connected: info.connected,
          extensionVersion: info.version,
          wsPort: 18900,
        },
      };
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
        isError: false,
      };
    }
  );

  server.tool(
    'get_current_page_info',
    'Get information about the current page open in the Twitter/X tab (URL, page type, etc.).',
    {},
    async () => {
      const result = await wsServer.sendAction('scrape_current_view', {});
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
        isError: !result.success,
      };
    }
  );
}
