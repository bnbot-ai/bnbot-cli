"use strict";
/**
 * Status Tools - Extension status and diagnostics
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerStatusTools = registerStatusTools;
function registerStatusTools(server, wsServer) {
    server.tool('get_extension_status', 'Check if the BNBOT Chrome extension is connected and get its current status.', {}, async () => {
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
            content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
            isError: false,
        };
    });
    server.tool('get_current_page_info', 'Get information about the current page open in the Twitter/X tab (URL, page type, etc.).', {}, async () => {
        const result = await wsServer.sendAction('get_current_url', {});
        return {
            content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
            isError: !result.success,
        };
    });
}
//# sourceMappingURL=statusTools.js.map