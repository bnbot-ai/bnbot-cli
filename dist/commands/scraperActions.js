"use strict";
/**
 * Commander action handlers for browser-based scraper commands.
 * These send WebSocket actions to the extension which executes chrome.scripting.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.tiktokSearchCommand = tiktokSearchCommand;
exports.tiktokExploreCommand = tiktokExploreCommand;
exports.youtubeSearchCommand = youtubeSearchCommand;
exports.youtubeVideoCommand = youtubeVideoCommand;
exports.youtubeTranscriptCommand = youtubeTranscriptCommand;
exports.redditSearchCommand = redditSearchCommand;
exports.redditHotCommand = redditHotCommand;
exports.bilibiliSearchCommand = bilibiliSearchCommand;
exports.bilibiliHotCommand = bilibiliHotCommand;
exports.bilibiliRankingCommand = bilibiliRankingCommand;
exports.zhihuSearchCommand = zhihuSearchCommand;
exports.zhihuHotCommand = zhihuHotCommand;
exports.xueqiuSearchCommand = xueqiuSearchCommand;
exports.xueqiuHotCommand = xueqiuHotCommand;
exports.instagramSearchCommand = instagramSearchCommand;
exports.instagramExploreCommand = instagramExploreCommand;
exports.linuxdoSearchCommand = linuxdoSearchCommand;
exports.jikeSearchCommand = jikeSearchCommand;
exports.xiaohongshuSearchCommand = xiaohongshuSearchCommand;
exports.weiboSearchCommand = weiboSearchCommand;
exports.weiboHotCommand = weiboHotCommand;
exports.doubanSearchCommand = doubanSearchCommand;
exports.doubanMovieHotCommand = doubanMovieHotCommand;
exports.doubanBookHotCommand = doubanBookHotCommand;
exports.doubanTop250Command = doubanTop250Command;
exports.mediumSearchCommand = mediumSearchCommand;
exports.googleSearchCommand = googleSearchCommand;
exports.googleNewsCommand = googleNewsCommand;
exports.facebookSearchCommand = facebookSearchCommand;
exports.linkedinSearchCommand = linkedinSearchCommand;
exports.kr36SearchCommand = kr36SearchCommand;
exports.kr36HotCommand = kr36HotCommand;
exports.kr36NewsCommand = kr36NewsCommand;
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
async function tiktokExploreCommand(options) {
    await scrape('SCRAPER_FETCH_TIKTOK_EXPLORE', { limit: parseInt(options.limit || '20', 10) });
}
// ── YouTube ──────────────────────────────────────────────────
async function youtubeSearchCommand(query, options) {
    await scrape('SCRAPER_SEARCH_YOUTUBE', {
        query, limit: parseInt(options.limit || '20', 10),
        type: options.type || '', upload: options.upload || '', sort: options.sort || '',
    });
}
async function youtubeVideoCommand(url) {
    await scrape('SCRAPER_FETCH_YOUTUBE_VIDEO', { url });
}
async function youtubeTranscriptCommand(url) {
    await scrape('SCRAPER_FETCH_YOUTUBE_TRANSCRIPT', { url });
}
// ── Reddit ───────────────────────────────────────────────────
async function redditSearchCommand(query, options) {
    await scrape('SCRAPER_SEARCH_REDDIT', { query, limit: parseInt(options.limit || '10', 10) });
}
async function redditHotCommand(options) {
    await scrape('SCRAPER_FETCH_REDDIT_HOT', { limit: parseInt(options.limit || '20', 10) });
}
// ── Bilibili ─────────────────────────────────────────────────
async function bilibiliSearchCommand(query, options) {
    await scrape('SCRAPER_SEARCH_BILIBILI', { query, limit: parseInt(options.limit || '10', 10) });
}
async function bilibiliHotCommand(options) {
    await scrape('SCRAPER_FETCH_BILIBILI_HOT', { limit: parseInt(options.limit || '20', 10) });
}
async function bilibiliRankingCommand(options) {
    await scrape('SCRAPER_FETCH_BILIBILI_RANKING', { limit: parseInt(options.limit || '20', 10) });
}
// ── Zhihu ────────────────────────────────────────────────────
async function zhihuSearchCommand(query, options) {
    await scrape('SCRAPER_SEARCH_ZHIHU', { query, limit: parseInt(options.limit || '10', 10) });
}
async function zhihuHotCommand(options) {
    await scrape('SCRAPER_FETCH_ZHIHU_HOT', { limit: parseInt(options.limit || '50', 10) });
}
// ── Xueqiu ───────────────────────────────────────────────────
async function xueqiuSearchCommand(query, options) {
    await scrape('SCRAPER_SEARCH_XUEQIU', { query, limit: parseInt(options.limit || '10', 10) });
}
async function xueqiuHotCommand(options) {
    await scrape('SCRAPER_FETCH_XUEQIU_HOT', { limit: parseInt(options.limit || '20', 10) });
}
// ── Instagram ────────────────────────────────────────────────
async function instagramSearchCommand(query, options) {
    await scrape('SCRAPER_SEARCH_INSTAGRAM', { query, limit: parseInt(options.limit || '10', 10) });
}
async function instagramExploreCommand(options) {
    await scrape('SCRAPER_FETCH_INSTAGRAM_EXPLORE', { limit: parseInt(options.limit || '20', 10) });
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
async function weiboHotCommand(options) {
    await scrape('SCRAPER_FETCH_WEIBO_HOT', { limit: parseInt(options.limit || '50', 10) });
}
// ── Douban ───────────────────────────────────────────────────
async function doubanSearchCommand(query, options) {
    await scrape('SCRAPER_SEARCH_DOUBAN', { query, limit: parseInt(options.limit || '10', 10) });
}
async function doubanMovieHotCommand(options) {
    await scrape('SCRAPER_FETCH_DOUBAN_MOVIE_HOT', { limit: parseInt(options.limit || '20', 10) });
}
async function doubanBookHotCommand(options) {
    await scrape('SCRAPER_FETCH_DOUBAN_BOOK_HOT', { limit: parseInt(options.limit || '20', 10) });
}
async function doubanTop250Command(options) {
    await scrape('SCRAPER_FETCH_DOUBAN_TOP250', { limit: parseInt(options.limit || '20', 10) });
}
// ── Medium ───────────────────────────────────────────────────
async function mediumSearchCommand(query, options) {
    await scrape('SCRAPER_SEARCH_MEDIUM', { query, limit: parseInt(options.limit || '10', 10) });
}
// ── Google ───────────────────────────────────────────────────
async function googleSearchCommand(query, options) {
    await scrape('SCRAPER_SEARCH_GOOGLE', { query, limit: parseInt(options.limit || '10', 10) });
}
async function googleNewsCommand(query, options) {
    await scrape('SCRAPER_SEARCH_GOOGLE_NEWS', { query, limit: parseInt(options.limit || '10', 10) });
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
async function kr36HotCommand(options) {
    await scrape('SCRAPER_FETCH_36KR_HOT', { limit: parseInt(options.limit || '20', 10) });
}
async function kr36NewsCommand(options) {
    await scrape('SCRAPER_FETCH_36KR_NEWS', { limit: parseInt(options.limit || '20', 10) });
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