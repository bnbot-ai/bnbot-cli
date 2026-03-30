"use strict";
/**
 * Tool Registration - Register all MCP tools
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerAllTools = registerAllTools;
const scrapeTools_js_1 = require("./scrapeTools.js");
const tweetTools_js_1 = require("./tweetTools.js");
const navigationTools_js_1 = require("./navigationTools.js");
const statusTools_js_1 = require("./statusTools.js");
const engagementTools_js_1 = require("./engagementTools.js");
const contentTools_js_1 = require("./contentTools.js");
const articleTools_js_1 = require("./articleTools.js");
const jobTools_js_1 = require("./jobTools.js");
function registerAllTools(server, wsServer) {
    (0, scrapeTools_js_1.registerScrapeTools)(server, wsServer);
    (0, tweetTools_js_1.registerTweetTools)(server, wsServer);
    (0, navigationTools_js_1.registerNavigationTools)(server, wsServer);
    (0, statusTools_js_1.registerStatusTools)(server, wsServer);
    (0, engagementTools_js_1.registerEngagementTools)(server, wsServer);
    (0, contentTools_js_1.registerContentTools)(server, wsServer);
    (0, articleTools_js_1.registerArticleTools)(server, wsServer);
    (0, jobTools_js_1.registerJobTools)(server);
    console.error('[BNBOT MCP] All tools registered');
}
//# sourceMappingURL=index.js.map