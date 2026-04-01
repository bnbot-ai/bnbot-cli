/**
 * Commander action handlers for X platform commands.
 *
 * Each handler maps commander arguments/options to the WebSocket action format
 * and uses `runCliAction` from cli.ts to send them to the running server.
 */
export declare function postCommand(text: string, options: {
    media?: string | string[];
    draft?: boolean;
}): Promise<void>;
export declare function closeCommand(options: {
    save?: boolean;
}): Promise<void>;
export declare function threadCommand(tweetsJson: string): Promise<void>;
export declare function replyCommand(url: string, text: string, options: {
    media?: string | string[];
}): Promise<void>;
export declare function quoteCommand(url: string, text: string): Promise<void>;
export declare function likeCommand(url: string): Promise<void>;
export declare function unlikeCommand(url: string): Promise<void>;
export declare function retweetCommand(url: string): Promise<void>;
export declare function unretweetCommand(url: string): Promise<void>;
export declare function followCommand(username: string): Promise<void>;
export declare function unfollowCommand(username: string): Promise<void>;
export declare function deleteCommand(url: string): Promise<void>;
export declare function bookmarkCommand(url: string): Promise<void>;
export declare function unbookmarkCommand(url: string): Promise<void>;
export declare function scrapeTimelineCommand(options: {
    limit?: string;
    scrollAttempts?: string;
}): Promise<void>;
export declare function scrapeBookmarksCommand(options: {
    limit?: string;
}): Promise<void>;
export declare function scrapeSearchCommand(query: string, options: {
    tab?: string;
    limit?: string;
    from?: string;
    since?: string;
    until?: string;
    lang?: string;
    minLikes?: string;
    minRetweets?: string;
    has?: string;
}): Promise<void>;
export declare function scrapeUserTweetsCommand(username: string, options: {
    limit?: string;
    scrollAttempts?: string;
}): Promise<void>;
export declare function scrapeUserProfileCommand(username: string): Promise<void>;
export declare function scrapeThreadCommand(url: string): Promise<void>;
export declare function analyticsCommand(): Promise<void>;
export declare function navigateUrlCommand(url: string): Promise<void>;
export declare function navigateSearchCommand(query: string): Promise<void>;
export declare function navigateBookmarksCommand(): Promise<void>;
export declare function navigateNotificationsCommand(): Promise<void>;
export declare function statusCommand(): Promise<void>;
export declare function fetchWeixinArticleCommand(url: string): Promise<void>;
export declare function fetchTiktokCommand(url: string): Promise<void>;
export declare function fetchXiaohongshuCommand(url: string): Promise<void>;
//# sourceMappingURL=actions.d.ts.map