"use strict";
/**
 * Tweet Tools - Create and publish content on Twitter/X
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerTweetTools = registerTweetTools;
const zod_1 = require("zod");
const mediaUtils_js_1 = require("./mediaUtils.js");
function registerTweetTools(server, wsServer) {
    server.tool('post_tweet', 'Post a new tweet on Twitter/X. Supports text and optional images/videos.', {
        text: zod_1.z.string().describe('Tweet text content (max 280 characters)'),
        media: zod_1.z.array(zod_1.z.string()).optional().describe('Array of media to attach. Supports: URLs (https://...), local file paths (/path/to/file.png, ~/Downloads/video.mp4). Images: png/jpg/gif/webp. Videos: mp4/mov/webm.'),
        draftOnly: zod_1.z.boolean().optional().describe('If true, fill the tweet composer but do not click send'),
    }, async (params) => {
        const actionParams = { text: params.text, draftOnly: params.draftOnly };
        if (params.media && params.media.length > 0) {
            actionParams.media = await (0, mediaUtils_js_1.resolveMediaListAsync)(params.media);
        }
        const result = await wsServer.sendAction('post_tweet', actionParams);
        return {
            content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
            isError: !result.success,
        };
    });
    server.tool('post_thread', 'Post a thread (multiple connected tweets) on Twitter/X.', {
        tweets: zod_1.z.array(zod_1.z.object({
            text: zod_1.z.string().describe('Tweet text'),
            media: zod_1.z.array(zod_1.z.object({
                type: zod_1.z.enum(['photo', 'video', 'animated_gif']).optional().describe('Media type'),
                url: zod_1.z.string().optional().describe('Media URL'),
                media_url: zod_1.z.string().optional().describe('Media URL (draft timeline format)'),
                base64: zod_1.z.string().optional().describe('Base64 media data URL'),
                video_url: zod_1.z.string().optional().describe('Video source URL'),
            })).optional().describe('Media array (same as draft timeline format)'),
            images: zod_1.z.array(zod_1.z.string()).optional().describe('Backward compatible image URL list'),
        })).describe('Array of tweets in the thread, in order'),
        draftOnly: zod_1.z.boolean().optional().describe('If true, fill the thread composer but do not click send'),
    }, async (params) => {
        const normalizedTweets = params.tweets.map((tweet) => {
            const mediaList = [
                ...((tweet.media || []).map((item) => ({
                    src: item.url || item.media_url || item.base64 || '',
                    typeHint: item.type,
                    video_url: item.video_url,
                }))),
                ...((tweet.images || []).map((url) => ({ src: url, typeHint: 'photo', video_url: undefined }))),
            ].filter((m) => !!m.src);
            return { text: tweet.text, media: mediaList };
        });
        const resolvedTweets = await Promise.all(normalizedTweets.map(async (tweet) => {
            const resolvedMedia = await Promise.all(tweet.media.map(async (item) => {
                const resolved = await (0, mediaUtils_js_1.resolveSingleMediaSource)(item.src);
                const type = item.typeHint || resolved.type;
                return {
                    type,
                    url: resolved.url,
                    media_url: resolved.url,
                    video_url: item.video_url,
                };
            }));
            return {
                text: tweet.text,
                media: resolvedMedia,
            };
        }));
        const result = await wsServer.sendAction('post_thread', {
            tweets: resolvedTweets,
            draftOnly: params.draftOnly,
        }, 300000);
        return {
            content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
            isError: !result.success,
        };
    });
    server.tool('submit_reply', 'Reply to a specific tweet. Navigate to the tweet first or provide the tweet URL.', {
        tweetUrl: zod_1.z.string().optional().describe('URL of the tweet to reply to. If omitted, replies to the currently open tweet.'),
        text: zod_1.z.string().describe('Reply text content'),
        image: zod_1.z.string().optional().describe('Image URL to attach to the reply'),
    }, async (params) => {
        // 如果提供了 tweetUrl，先导航并验证地址
        if (params.tweetUrl) {
            const navResult = await wsServer.sendAction('navigate_to_tweet', { tweetUrl: params.tweetUrl });
            if (!navResult.success) {
                return {
                    content: [{ type: 'text', text: JSON.stringify({ success: false, error: `Navigation failed: ${navResult.error}` }, null, 2) }],
                    isError: true,
                };
            }
            await new Promise(r => setTimeout(r, 2000));
            // 验证导航后的地址是否包含目标推文 ID
            const urlCheck = await wsServer.sendAction('get_current_url', {});
            if (urlCheck.success) {
                const urlData = urlCheck.data;
                const currentUrl = urlData?.url || '';
                // 从 tweetUrl 提取 status ID
                const statusMatch = params.tweetUrl.match(/status\/(\d+)/);
                if (statusMatch && !currentUrl.includes(statusMatch[1])) {
                    return {
                        content: [{ type: 'text', text: JSON.stringify({ success: false, error: `Navigation verification failed: expected tweet ${statusMatch[1]}, but current URL is ${currentUrl}` }, null, 2) }],
                        isError: true,
                    };
                }
            }
        }
        // 1. 打开回复框
        const openResult = await wsServer.sendAction('open_reply_composer', {});
        if (!openResult.success) {
            return {
                content: [{ type: 'text', text: JSON.stringify({ success: false, error: `Open reply composer failed: ${openResult.error}` }, null, 2) }],
                isError: true,
            };
        }
        // 2. 填充文本
        const fillResult = await wsServer.sendAction('fill_reply_text', { content: params.text });
        if (!fillResult.success) {
            return {
                content: [{ type: 'text', text: JSON.stringify({ success: false, error: `Fill text failed: ${fillResult.error}` }, null, 2) }],
                isError: true,
            };
        }
        // 3. 上传图片（如果有）
        if (params.image) {
            const imgResult = await wsServer.sendAction('upload_image_to_reply', { imageUrl: params.image });
            if (!imgResult.success) {
                return {
                    content: [{ type: 'text', text: JSON.stringify({ success: false, error: `Upload image failed: ${imgResult.error}` }, null, 2) }],
                    isError: true,
                };
            }
        }
        // 4. 提交回复（传入回复文本用于验证）
        const result = await wsServer.sendAction('submit_reply', { replyText: params.text });
        return {
            content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
            isError: !result.success,
        };
    });
}
//# sourceMappingURL=tweetTools.js.map