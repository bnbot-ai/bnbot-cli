/**
 * Public API Scrapers — direct fetch, no browser/extension needed.
 * Called as CLI commands: bnbot search-hackernews --query "AI" --limit 5
 *
 * Respects http_proxy / https_proxy / all_proxy env vars via undici ProxyAgent.
 */
export declare const PUBLIC_SCRAPERS: Record<string, (params: Record<string, unknown>) => Promise<unknown>>;
/** Names of all public scraper commands */
export declare const PUBLIC_SCRAPER_NAMES: string[];
/** Run a public scraper directly (no WebSocket needed) */
export declare function runPublicScraper(name: string, params: Record<string, unknown>): Promise<void>;
//# sourceMappingURL=publicScrapers.d.ts.map