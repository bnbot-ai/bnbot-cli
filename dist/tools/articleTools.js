"use strict";
/**
 * Article Tools - Create and publish Twitter/X articles
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerArticleTools = registerArticleTools;
const zod_1 = require("zod");
const mediaUtils_js_1 = require("./mediaUtils.js");
function registerArticleTools(server, wsServer) {
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    async function waitForExtensionReconnect(timeoutMs = 20000) {
        const start = Date.now();
        while (Date.now() - start < timeoutMs) {
            if (wsServer.isExtensionConnected())
                return true;
            await sleep(500);
        }
        return wsServer.isExtensionConnected();
    }
    async function sendWithTimeoutRetry(actionType, params, timeout = 60000, retries = 2) {
        let last = await wsServer.sendAction(actionType, params, timeout);
        let attempts = 0;
        while (!last.success && attempts < retries) {
            const err = last.error || '';
            const isTimeout = err.includes('timed out');
            const isDisconnected = err.includes('Extension disconnected') || err.includes('Extension not connected');
            if (!isTimeout && !isDisconnected)
                break;
            attempts++;
            if (isDisconnected) {
                await waitForExtensionReconnect(20000);
            }
            await sleep(1500);
            last = await wsServer.sendAction(actionType, params, timeout);
        }
        return last;
    }
    function toToolResult(result) {
        return {
            content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
            isError: !result.success,
        };
    }
    async function openArticleEditorFlow() {
        await sendWithTimeoutRetry('navigate_to_compose_article', {}, 30000, 1);
        const openResult = await sendWithTimeoutRetry('open_article_editor', {}, 90000, 2);
        if (!openResult.success)
            return openResult;
        await sleep(2000);
        return openResult;
    }
    async function fillArticleTitleFlow(title) {
        return sendWithTimeoutRetry('fill_article_title', { title }, 90000, 2);
    }
    async function fillArticleBodyFlow(content, bodyImages, format) {
        const resolvedBodyImages = bodyImages && bodyImages.length > 0
            ? await Promise.all(bodyImages.map(async (src) => {
                const resolved = await (0, mediaUtils_js_1.resolveSingleMediaSource)(src);
                return resolved.url;
            }))
            : undefined;
        const result = await sendWithTimeoutRetry('fill_article_body', {
            content,
            format,
            bodyImages: resolvedBodyImages,
        }, 120000, 2);
        if (result.success && resolvedBodyImages) {
            return {
                success: true,
                data: {
                    ...(typeof result.data === 'object' && result.data ? result.data : {}),
                    bodyImagesCount: resolvedBodyImages.length,
                },
            };
        }
        return result;
    }
    async function uploadArticleHeaderFlow(headerImage) {
        const resolved = await (0, mediaUtils_js_1.resolveSingleMediaSource)(headerImage);
        if (!resolved.url.startsWith('data:')) {
            return {
                success: false,
                error: 'Header image must be data URL at upload step. Please use local file path or reachable URL.',
            };
        }
        return sendWithTimeoutRetry('upload_article_header_image', { imageData: resolved.url }, 120000, 1);
    }
    async function publishArticleFlow(publish, asDraft) {
        const draft = typeof asDraft === 'boolean' ? asDraft : !publish;
        if (draft) {
            return { success: true, data: { draftOnly: true, note: 'Draft relies on auto-save in editor' } };
        }
        return sendWithTimeoutRetry('publish_article', { asDraft: false }, 90000, 2);
    }
    server.tool('open_article_editor', 'Open the Twitter/X article editor using the stable flow (navigate to compose page then click create).', {}, async () => toToolResult(await openArticleEditorFlow()));
    server.tool('fill_article_title', 'Fill article title in the current Twitter/X article editor.', {
        title: zod_1.z.string().describe('Article title'),
    }, async (params) => toToolResult(await fillArticleTitleFlow(params.title)));
    server.tool('fill_article_body', 'Fill article body in the current editor. Supports optional body images.', {
        content: zod_1.z.string().describe('Article body content'),
        format: zod_1.z.enum(['plain', 'markdown', 'html']).optional().describe('Body format'),
        bodyImages: zod_1.z.array(zod_1.z.string()).optional().describe('Optional body images (URL/local path/data URL)'),
    }, async (params) => toToolResult(await fillArticleBodyFlow(params.content, params.bodyImages, params.format)));
    server.tool('upload_article_header_image', 'Upload a header image in the current article editor. Supports URL/local path/data URL.', {
        headerImage: zod_1.z.string().describe('Header image source (URL/local path/data URL)'),
    }, async (params) => toToolResult(await uploadArticleHeaderFlow(params.headerImage)));
    server.tool('publish_article', 'Publish article or keep as draft (auto-save).', {
        publish: zod_1.z.boolean().optional().describe('Publish immediately if true'),
        asDraft: zod_1.z.boolean().optional().describe('Force draft mode if true'),
    }, async (params) => toToolResult(await publishArticleFlow(params.publish, params.asDraft)));
    server.tool('create_article', 'Create and publish a Twitter/X article (long-form content). Handles the full flow: open editor, fill title, fill body, and optionally publish.', {
        title: zod_1.z.string().describe('Article title'),
        content: zod_1.z.string().describe('Article body content'),
        headerImage: zod_1.z.string().optional().describe('Optional header image. Supports URL, local file path, or data URL.'),
        bodyImages: zod_1.z.array(zod_1.z.string()).optional().describe('Optional body images. Supports URLs, local file paths, or data URLs.'),
        format: zod_1.z.enum(['plain', 'markdown', 'html']).optional().describe('Body content format (default: plain)'),
        publish: zod_1.z.boolean().optional().describe('Whether to publish immediately (default: false, saves as draft)'),
    }, async (params) => {
        const openResult = await openArticleEditorFlow();
        if (!openResult.success) {
            return {
                content: [{ type: 'text', text: JSON.stringify({ success: false, error: `Open editor failed: ${openResult.error}` }, null, 2) }],
                isError: true,
            };
        }
        // 2. Fill title
        const titleResult = await fillArticleTitleFlow(params.title);
        if (!titleResult.success) {
            return {
                content: [{ type: 'text', text: JSON.stringify({ success: false, error: `Fill title failed: ${titleResult.error}` }, null, 2) }],
                isError: true,
            };
        }
        await sleep(800);
        // 3. Fill body
        const bodyResult = await fillArticleBodyFlow(params.content, params.bodyImages, params.format || 'plain');
        if (!bodyResult.success) {
            return {
                content: [{ type: 'text', text: JSON.stringify({ success: false, error: `Fill body failed: ${bodyResult.error}` }, null, 2) }],
                isError: true,
            };
        }
        // 3.5. Upload header image (optional)
        if (params.headerImage) {
            const headerResult = await uploadArticleHeaderFlow(params.headerImage);
            if (!headerResult.success) {
                return {
                    content: [{ type: 'text', text: JSON.stringify({ success: false, error: `Upload header image failed: ${headerResult.error}` }, null, 2) }],
                    isError: true,
                };
            }
        }
        // 4. Draft mode: Twitter article editor auto-saves; avoid brittle save button matching.
        if (!params.publish) {
            return {
                content: [{ type: 'text', text: JSON.stringify({
                            success: true,
                            data: {
                                draftOnly: true,
                                title: params.title,
                                bodyImagesCount: params.bodyImages?.length || 0,
                                headerImage: !!params.headerImage,
                            },
                        }, null, 2) }],
                isError: false,
            };
        }
        // 5. Publish immediately when requested
        const publishResult = await publishArticleFlow(params.publish, false);
        return {
            content: [{ type: 'text', text: JSON.stringify(publishResult, null, 2) }],
            isError: !publishResult.success,
        };
    });
}
//# sourceMappingURL=articleTools.js.map