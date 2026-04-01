/**
 * Commander action handlers for browser-based scraper commands.
 * These send WebSocket actions to the extension which executes chrome.scripting.
 */

import { runCliAction } from '../cli.js';

const DEFAULT_PORT = 18900;

async function scrape(actionType: string, params: Record<string, unknown>): Promise<void> {
  await runCliAction(actionType, params, DEFAULT_PORT);
}

// ── TikTok ───────────────────────────────────────────────────

export async function tiktokSearchCommand(query: string, options: { limit?: string }) {
  await scrape('SCRAPER_SEARCH_TIKTOK', { query, limit: parseInt(options.limit || '10', 10) });
}

// ── YouTube ──────────────────────────────────────────────────

export async function youtubeSearchCommand(query: string, options: { limit?: string }) {
  await scrape('SCRAPER_SEARCH_YOUTUBE', { query, limit: parseInt(options.limit || '20', 10) });
}

// ── Reddit ───────────────────────────────────────────────────

export async function redditSearchCommand(query: string, options: { limit?: string }) {
  await scrape('SCRAPER_SEARCH_REDDIT', { query, limit: parseInt(options.limit || '10', 10) });
}

// ── Bilibili ─────────────────────────────────────────────────

export async function bilibiliSearchCommand(query: string, options: { limit?: string }) {
  await scrape('SCRAPER_SEARCH_BILIBILI', { query, limit: parseInt(options.limit || '10', 10) });
}

// ── Zhihu ────────────────────────────────────────────────────

export async function zhihuSearchCommand(query: string, options: { limit?: string }) {
  await scrape('SCRAPER_SEARCH_ZHIHU', { query, limit: parseInt(options.limit || '10', 10) });
}

// ── Xueqiu ───────────────────────────────────────────────────

export async function xueqiuSearchCommand(query: string, options: { limit?: string }) {
  await scrape('SCRAPER_SEARCH_XUEQIU', { query, limit: parseInt(options.limit || '10', 10) });
}

// ── Instagram ────────────────────────────────────────────────

export async function instagramSearchCommand(query: string, options: { limit?: string }) {
  await scrape('SCRAPER_SEARCH_INSTAGRAM', { query, limit: parseInt(options.limit || '10', 10) });
}

// ── Linux.do ─────────────────────────────────────────────────

export async function linuxdoSearchCommand(query: string, options: { limit?: string }) {
  await scrape('SCRAPER_SEARCH_LINUX_DO', { query, limit: parseInt(options.limit || '10', 10) });
}

// ── Jike ─────────────────────────────────────────────────────

export async function jikeSearchCommand(query: string, options: { limit?: string }) {
  await scrape('SCRAPER_SEARCH_JIKE', { query, limit: parseInt(options.limit || '10', 10) });
}

// ── Xiaohongshu ──────────────────────────────────────────────

export async function xiaohongshuSearchCommand(query: string, options: { limit?: string }) {
  await scrape('SCRAPER_SEARCH_XIAOHONGSHU', { query, limit: parseInt(options.limit || '10', 10) });
}

// ── Weibo ────────────────────────────────────────────────────

export async function weiboSearchCommand(query: string, options: { limit?: string }) {
  await scrape('SCRAPER_SEARCH_WEIBO', { query, limit: parseInt(options.limit || '10', 10) });
}

// ── Douban ───────────────────────────────────────────────────

export async function doubanSearchCommand(query: string, options: { limit?: string }) {
  await scrape('SCRAPER_SEARCH_DOUBAN', { query, limit: parseInt(options.limit || '10', 10) });
}

// ── Medium ───────────────────────────────────────────────────

export async function mediumSearchCommand(query: string, options: { limit?: string }) {
  await scrape('SCRAPER_SEARCH_MEDIUM', { query, limit: parseInt(options.limit || '10', 10) });
}

// ── Google ───────────────────────────────────────────────────

export async function googleSearchCommand(query: string, options: { limit?: string }) {
  await scrape('SCRAPER_SEARCH_GOOGLE', { query, limit: parseInt(options.limit || '10', 10) });
}

// ── Facebook ─────────────────────────────────────────────────

export async function facebookSearchCommand(query: string, options: { limit?: string }) {
  await scrape('SCRAPER_SEARCH_FACEBOOK', { query, limit: parseInt(options.limit || '10', 10) });
}

// ── LinkedIn ─────────────────────────────────────────────────

export async function linkedinSearchCommand(query: string, options: { limit?: string }) {
  await scrape('SCRAPER_SEARCH_LINKEDIN', { query, limit: parseInt(options.limit || '10', 10) });
}

// ── 36Kr ─────────────────────────────────────────────────────

export async function kr36SearchCommand(query: string, options: { limit?: string }) {
  await scrape('SCRAPER_SEARCH_36KR', { query, limit: parseInt(options.limit || '10', 10) });
}

// ── ProductHunt ──────────────────────────────────────────────

export async function producthuntHotCommand(options: { limit?: string }) {
  await scrape('SCRAPER_FETCH_PRODUCTHUNT', { limit: parseInt(options.limit || '20', 10) });
}

// ── Yahoo Finance ────────────────────────────────────────────

export async function yahooFinanceQuoteCommand(symbol: string) {
  await scrape('SCRAPER_FETCH_YAHOO_FINANCE', { symbol });
}
