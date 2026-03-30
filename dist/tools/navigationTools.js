"use strict";
/**
 * Navigation Tools - Navigate within Twitter/X
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerNavigationTools = registerNavigationTools;
const zod_1 = require("zod");
function registerNavigationTools(server, wsServer) {
    server.tool('navigate_to_tweet', 'Navigate to a specific tweet by URL.', {
        tweetUrl: zod_1.z.string().describe('Full URL of the tweet (e.g., https://x.com/user/status/123)'),
    }, async (params) => {
        const result = await wsServer.sendAction('navigate_to_tweet', params);
        if (!result.success) {
            return {
                content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
                isError: true,
            };
        }
        // 等待页面加载后验证地址
        await new Promise(r => setTimeout(r, 2000));
        const urlCheck = await wsServer.sendAction('get_current_url', {});
        if (urlCheck.success) {
            const urlData = urlCheck.data;
            const currentUrl = urlData?.url || '';
            const statusMatch = params.tweetUrl.match(/status\/(\d+)/);
            if (statusMatch && !currentUrl.includes(statusMatch[1])) {
                return {
                    content: [{ type: 'text', text: JSON.stringify({
                                success: false,
                                error: `Navigation verification failed: expected tweet ${statusMatch[1]}, but current URL is ${currentUrl}`,
                            }, null, 2) }],
                    isError: true,
                };
            }
        }
        const verifiedUrl = urlCheck.data?.url;
        return {
            content: [{ type: 'text', text: JSON.stringify({
                        success: true,
                        data: { ...(result.data || {}), verifiedUrl },
                    }, null, 2) }],
            isError: false,
        };
    });
    server.tool('navigate_to_search', 'Navigate to Twitter/X search page with an optional query.', {
        query: zod_1.z.string().optional().describe('Search query. If omitted, navigates to the search page.'),
        sort: zod_1.z.enum(['top', 'latest', 'people', 'media']).optional().describe('Search tab: top (default), latest, people, or media.'),
    }, async (params) => {
        const result = await wsServer.sendAction('navigate_to_search', params);
        return {
            content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
            isError: !result.success,
        };
    });
    server.tool('navigate_to_bookmarks', 'Navigate to the Twitter/X bookmarks page.', {}, async () => {
        const result = await wsServer.sendAction('navigate_to_bookmarks', {});
        return {
            content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
            isError: !result.success,
        };
    });
    server.tool('navigate_to_notifications', 'Navigate to the Twitter/X notifications page.', {}, async () => {
        const result = await wsServer.sendAction('navigate_to_notifications', {});
        return {
            content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
            isError: !result.success,
        };
    });
    server.tool('return_to_timeline', 'Navigate back to the Twitter/X home timeline.', {}, async () => {
        const result = await wsServer.sendAction('return_to_timeline', {});
        return {
            content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
            isError: !result.success,
        };
    });
    server.tool('navigate_to_following', 'Navigate to the Following timeline tab on the home page. Navigates to /home first if needed.', {}, async () => {
        const result = await wsServer.sendAction('navigate_to_following', {});
        return {
            content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
            isError: !result.success,
        };
    });
}
//# sourceMappingURL=navigationTools.js.map