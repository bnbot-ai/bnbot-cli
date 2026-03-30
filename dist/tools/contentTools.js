"use strict";
/**
 * Content Tools - Fetch content from external platforms (WeChat, TikTok, Xiaohongshu)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerContentTools = registerContentTools;
const zod_1 = require("zod");
const fs_1 = require("fs");
const path_1 = require("path");
const os_1 = require("os");
function registerContentTools(server, wsServer) {
    server.tool('fetch_wechat_article', 'Fetch and extract content from a WeChat Official Account article. Returns markdown-formatted article content including title, author, and body text.', {
        url: zod_1.z.string().describe('WeChat article URL (mp.weixin.qq.com)'),
    }, async (params) => {
        const result = await wsServer.sendAction('fetch_wechat_article', params);
        return {
            content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
            isError: !result.success,
        };
    });
    server.tool('fetch_tiktok_video', 'Fetch TikTok video metadata including description, author info, and video download URL. Automatically downloads the video via the browser extension and saves it locally.', {
        url: zod_1.z.string().describe('TikTok video URL'),
        savePath: zod_1.z.string().optional().describe('Local path to save the video file. Defaults to ~/Downloads/tiktok_{video_id}.mp4'),
    }, async (params) => {
        const result = await wsServer.sendAction('fetch_tiktok_video', { url: params.url }, 60000);
        if (!result.success) {
            return {
                content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
                isError: true,
            };
        }
        const data = result.data;
        const videoBase64 = data?.video_base64;
        if (videoBase64) {
            const videoId = data?.video_id || 'unknown';
            const filePath = params.savePath || (0, path_1.join)((0, os_1.homedir)(), 'Downloads', `tiktok_${videoId}.mp4`);
            try {
                const buffer = Buffer.from(videoBase64, 'base64');
                (0, fs_1.writeFileSync)(filePath, buffer);
                delete data.video_base64;
                data.local_file = filePath;
                data.file_size_mb = +(buffer.length / 1024 / 1024).toFixed(2);
            }
            catch (e) {
                data.download_error = e instanceof Error ? e.message : 'Failed to save file';
            }
        }
        return {
            content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
            isError: false,
        };
    });
    server.tool('fetch_xiaohongshu_note', 'Fetch content from a Xiaohongshu (Little Red Book) note including text, images, author, and engagement metrics.', {
        url: zod_1.z.string().describe('Xiaohongshu note URL (xiaohongshu.com or xhslink.com)'),
    }, async (params) => {
        const result = await wsServer.sendAction('fetch_xiaohongshu_note', params);
        return {
            content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
            isError: !result.success,
        };
    });
}
//# sourceMappingURL=contentTools.js.map