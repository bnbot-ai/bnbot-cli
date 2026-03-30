"use strict";
/**
 * Engagement Tools - Like, retweet, and follow on Twitter/X
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerEngagementTools = registerEngagementTools;
const zod_1 = require("zod");
const mediaUtils_js_1 = require("./mediaUtils.js");
function registerEngagementTools(server, wsServer) {
    server.tool('like_tweet', 'Like the tweet on the currently open tweet page. Navigate to the tweet first using navigate_to_tweet.', {}, async () => {
        const result = await wsServer.sendAction('like_tweet', {});
        return {
            content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
            isError: !result.success,
        };
    });
    server.tool('retweet', 'Retweet/repost the tweet on the currently open tweet page. Navigate to the tweet first using navigate_to_tweet.', {}, async () => {
        const result = await wsServer.sendAction('retweet', {});
        return {
            content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
            isError: !result.success,
        };
    });
    server.tool('quote_tweet', 'Quote tweet the currently open tweet with custom text. Navigate to the tweet first using navigate_to_tweet.', {
        text: zod_1.z.string().describe('The quote text to post with the retweet'),
        media: zod_1.z.array(zod_1.z.string()).optional().describe('Array of media to attach. Supports: URLs (https://...), local file paths (/path/to/file.png, ~/Downloads/video.mp4). Images: png/jpg/gif/webp. Videos: mp4/mov/webm.'),
        draftOnly: zod_1.z.boolean().optional().describe('If true, fill the composer but do not click send'),
    }, async (args) => {
        const actionParams = { text: args.text, draftOnly: args.draftOnly };
        if (args.media && args.media.length > 0) {
            actionParams.media = await (0, mediaUtils_js_1.resolveMediaListAsync)(args.media);
        }
        const result = await wsServer.sendAction('quote_tweet', actionParams);
        return {
            content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
            isError: !result.success,
        };
    });
    server.tool('unlike_tweet', 'Unlike/remove like from the tweet on the currently open tweet page. Navigate to the tweet first using navigate_to_tweet.', {}, async () => {
        const result = await wsServer.sendAction('unlike_tweet', {});
        return {
            content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
            isError: !result.success,
        };
    });
    server.tool('unretweet', 'Undo retweet/repost of the tweet on the currently open tweet page. Navigate to the tweet first using navigate_to_tweet.', {}, async () => {
        const result = await wsServer.sendAction('unretweet', {});
        return {
            content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
            isError: !result.success,
        };
    });
    server.tool('delete_tweet', 'Delete the tweet on the currently open tweet page. Only works for your own tweets. Navigate to the tweet first using navigate_to_tweet.', {}, async () => {
        const result = await wsServer.sendAction('delete_tweet', {});
        return {
            content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
            isError: !result.success,
        };
    });
    server.tool('bookmark_tweet', 'Bookmark/save the tweet on the currently open tweet page. Navigate to the tweet first using navigate_to_tweet.', {}, async () => {
        const result = await wsServer.sendAction('bookmark_tweet', {});
        return {
            content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
            isError: !result.success,
        };
    });
    server.tool('unbookmark_tweet', 'Remove bookmark from the tweet on the currently open tweet page. Navigate to the tweet first using navigate_to_tweet.', {}, async () => {
        const result = await wsServer.sendAction('unbookmark_tweet', {});
        return {
            content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
            isError: !result.success,
        };
    });
    server.tool('follow_user', 'Follow a user on Twitter/X. If username is provided, navigates to their profile first. Otherwise follows the author of the currently open tweet.', {
        username: zod_1.z.string().optional().describe('Optional Twitter username (without @) to navigate to their profile and follow'),
    }, async (args) => {
        const payload = {};
        if (args.username) {
            payload.username = args.username;
        }
        const result = await wsServer.sendAction('follow_user', payload);
        return {
            content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
            isError: !result.success,
        };
    });
    server.tool('unfollow_user', 'Unfollow a user on Twitter/X. If username is provided, navigates to their profile first. Otherwise unfollows the author of the currently open tweet.', {
        username: zod_1.z.string().optional().describe('Optional Twitter username (without @) to navigate to their profile and unfollow'),
    }, async (args) => {
        const payload = {};
        if (args.username) {
            payload.username = args.username;
        }
        const result = await wsServer.sendAction('unfollow_user', payload);
        return {
            content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
            isError: !result.success,
        };
    });
}
//# sourceMappingURL=engagementTools.js.map