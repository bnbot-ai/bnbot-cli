/**
 * Media Utilities - Shared helpers for local file to data URL conversion
 */
export declare const VIDEO_EXTS: string[];
export declare function localFileToDataUrl(filePath: string): {
    dataUrl: string;
    isVideo: boolean;
};
export declare function resolveSingleMediaSource(src: string): Promise<{
    type: 'photo' | 'video';
    url: string;
}>;
export declare function resolveMediaList(sources: string[]): Array<{
    type: string;
    url: string;
}>;
export declare function resolveMediaListAsync(sources: string[]): Promise<Array<{
    type: 'photo' | 'video';
    url: string;
}>>;
//# sourceMappingURL=mediaUtils.d.ts.map