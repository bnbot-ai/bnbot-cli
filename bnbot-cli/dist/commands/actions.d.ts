export declare function tweetCommand(text: string, options: {
    media?: string;
    draft?: boolean;
}): Promise<void>;
export declare function likeCommand(url: string): Promise<void>;
export declare function retweetCommand(url: string): Promise<void>;
export declare function replyCommand(url: string, text: string, options: {
    media?: string;
}): Promise<void>;
export declare function followCommand(username: string): Promise<void>;
export declare function closeCommand(options: {
    save?: boolean;
}): Promise<void>;
export declare function scrapeUserTweetsCommand(username: string, options: {
    limit?: string;
    scrollAttempts?: string;
}): Promise<void>;
export declare function scrapeUserProfileCommand(username: string): Promise<void>;
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
export declare function scrapeTimelineCommand(options: {
    limit?: string;
    scrollAttempts?: string;
}): Promise<void>;
export declare function scrapeBookmarksCommand(options: {
    limit?: string;
}): Promise<void>;
export declare function scrapeThreadCommand(url: string): Promise<void>;
export declare function statusCommand(): Promise<void>;
export declare function serveCommand(options: {
    port?: string;
}): Promise<void>;
