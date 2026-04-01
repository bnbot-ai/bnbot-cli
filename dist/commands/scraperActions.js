"use strict";
/**
 * Commander action handlers for browser-based scraper commands.
 * These send WebSocket actions to the extension which executes chrome.scripting.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.tiktokSearchCommand = tiktokSearchCommand;
exports.youtubeSearchCommand = youtubeSearchCommand;
exports.redditSearchCommand = redditSearchCommand;
exports.bilibiliSearchCommand = bilibiliSearchCommand;
exports.zhihuSearchCommand = zhihuSearchCommand;
exports.xueqiuSearchCommand = xueqiuSearchCommand;
exports.instagramSearchCommand = instagramSearchCommand;
exports.linuxdoSearchCommand = linuxdoSearchCommand;
exports.jikeSearchCommand = jikeSearchCommand;
exports.xiaohongshuSearchCommand = xiaohongshuSearchCommand;
exports.weiboSearchCommand = weiboSearchCommand;
exports.doubanSearchCommand = doubanSearchCommand;
exports.mediumSearchCommand = mediumSearchCommand;
exports.googleSearchCommand = googleSearchCommand;
exports.facebookSearchCommand = facebookSearchCommand;
exports.linkedinSearchCommand = linkedinSearchCommand;
exports.kr36SearchCommand = kr36SearchCommand;
exports.producthuntHotCommand = producthuntHotCommand;
exports.yahooFinanceQuoteCommand = yahooFinanceQuoteCommand;
const cli_js_1 = require("../cli.js");
const DEFAULT_PORT = 18900;
async function scrape(actionType, params) {
    await (0, cli_js_1.runCliAction)(actionType, params, DEFAULT_PORT);
}
// ── TikTok ───────────────────────────────────────────────────
async function tiktokSearchCommand(query, options) {
    await scrape('SCRAPER_SEARCH_TIKTOK', { query, limit: parseInt(options.limit || '10', 10) });
}
// ── YouTube ──────────────────────────────────────────────────
async function youtubeSearchCommand(query, options) {
    await scrape('SCRAPER_SEARCH_YOUTUBE', { query, limit: parseInt(options.limit || '20', 10) });
}
// ── Reddit ───────────────────────────────────────────────────
async function redditSearchCommand(query, options) {
    await scrape('SCRAPER_SEARCH_REDDIT', { query, limit: parseInt(options.limit || '10', 10) });
}
// ── Bilibili ─────────────────────────────────────────────────
async function bilibiliSearchCommand(query, options) {
    await scrape('SCRAPER_SEARCH_BILIBILI', { query, limit: parseInt(options.limit || '10', 10) });
}
// ── Zhihu ────────────────────────────────────────────────────
async function zhihuSearchCommand(query, options) {
    await scrape('SCRAPER_SEARCH_ZHIHU', { query, limit: parseInt(options.limit || '10', 10) });
}
// ── Xueqiu ───────────────────────────────────────────────────
async function xueqiuSearchCommand(query, options) {
    await scrape('SCRAPER_SEARCH_XUEQIU', { query, limit: parseInt(options.limit || '10', 10) });
}
// ── Instagram ────────────────────────────────────────────────
async function instagramSearchCommand(query, options) {
    await scrape('SCRAPER_SEARCH_INSTAGRAM', { query, limit: parseInt(options.limit || '10', 10) });
}
// ── Linux.do ─────────────────────────────────────────────────
async function linuxdoSearchCommand(query, options) {
    await scrape('SCRAPER_SEARCH_LINUX_DO', { query, limit: parseInt(options.limit || '10', 10) });
}
// ── Jike ─────────────────────────────────────────────────────
async function jikeSearchCommand(query, options) {
    await scrape('SCRAPER_SEARCH_JIKE', { query, limit: parseInt(options.limit || '10', 10) });
}
// ── Xiaohongshu ──────────────────────────────────────────────
async function xiaohongshuSearchCommand(query, options) {
    await scrape('SCRAPER_SEARCH_XIAOHONGSHU', { query, limit: parseInt(options.limit || '10', 10) });
}
// ── Weibo ────────────────────────────────────────────────────
async function weiboSearchCommand(query, options) {
    await scrape('SCRAPER_SEARCH_WEIBO', { query, limit: parseInt(options.limit || '10', 10) });
}
// ── Douban ───────────────────────────────────────────────────
async function doubanSearchCommand(query, options) {
    await scrape('SCRAPER_SEARCH_DOUBAN', { query, limit: parseInt(options.limit || '10', 10) });
}
// ── Medium ───────────────────────────────────────────────────
async function mediumSearchCommand(query, options) {
    await scrape('SCRAPER_SEARCH_MEDIUM', { query, limit: parseInt(options.limit || '10', 10) });
}
// ── Google ───────────────────────────────────────────────────
async function googleSearchCommand(query, options) {
    await scrape('SCRAPER_SEARCH_GOOGLE', { query, limit: parseInt(options.limit || '10', 10) });
}
// ── Facebook ─────────────────────────────────────────────────
async function facebookSearchCommand(query, options) {
    await scrape('SCRAPER_SEARCH_FACEBOOK', { query, limit: parseInt(options.limit || '10', 10) });
}
// ── LinkedIn ─────────────────────────────────────────────────
async function linkedinSearchCommand(query, options) {
    await scrape('SCRAPER_SEARCH_LINKEDIN', { query, limit: parseInt(options.limit || '10', 10) });
}
// ── 36Kr ─────────────────────────────────────────────────────
async function kr36SearchCommand(query, options) {
    await scrape('SCRAPER_SEARCH_36KR', { query, limit: parseInt(options.limit || '10', 10) });
}
// ── ProductHunt ──────────────────────────────────────────────
async function producthuntHotCommand(options) {
    await scrape('SCRAPER_FETCH_PRODUCTHUNT', { limit: parseInt(options.limit || '20', 10) });
}
// ── Yahoo Finance ────────────────────────────────────────────
async function yahooFinanceQuoteCommand(symbol) {
    await scrape('SCRAPER_FETCH_YAHOO_FINANCE', { symbol });
}
//# sourceMappingURL=scraperActions.js.map