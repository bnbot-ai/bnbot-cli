"use strict";
/**
 * Media Utilities - Shared helpers for local file to data URL conversion
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.VIDEO_EXTS = void 0;
exports.localFileToDataUrl = localFileToDataUrl;
exports.resolveSingleMediaSource = resolveSingleMediaSource;
exports.resolveMediaList = resolveMediaList;
exports.resolveMediaListAsync = resolveMediaListAsync;
const fs_1 = require("fs");
const path_1 = require("path");
exports.VIDEO_EXTS = ['.mp4', '.mov', '.avi', '.webm'];
const MAX_MEDIA_SIZE_MB = 50;
const REMOTE_FETCH_TIMEOUT_MS = 45000;
function localFileToDataUrl(filePath) {
    const buffer = (0, fs_1.readFileSync)(filePath);
    const ext = (0, path_1.extname)(filePath).toLowerCase();
    const mimeMap = {
        '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
        '.gif': 'image/gif', '.webp': 'image/webp', '.svg': 'image/svg+xml',
        '.mp4': 'video/mp4', '.mov': 'video/quicktime', '.avi': 'video/x-msvideo', '.webm': 'video/webm',
    };
    const mime = mimeMap[ext] || 'application/octet-stream';
    const sizeMB = buffer.length / 1024 / 1024;
    if (sizeMB > MAX_MEDIA_SIZE_MB) {
        throw new Error(`File too large: ${sizeMB.toFixed(1)}MB (max ${MAX_MEDIA_SIZE_MB}MB)`);
    }
    return {
        dataUrl: `data:${mime};base64,${buffer.toString('base64')}`,
        isVideo: exports.VIDEO_EXTS.includes(ext),
    };
}
function guessMimeFromPath(pathOrUrl) {
    const ext = (0, path_1.extname)(pathOrUrl.split('?')[0]).toLowerCase();
    const mimeMap = {
        '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
        '.gif': 'image/gif', '.webp': 'image/webp', '.svg': 'image/svg+xml',
        '.mp4': 'video/mp4', '.mov': 'video/quicktime', '.avi': 'video/x-msvideo', '.webm': 'video/webm',
    };
    return mimeMap[ext] || 'application/octet-stream';
}
function isLikelyLocalPath(src) {
    return src.startsWith('/') || src.startsWith('~');
}
function isHttpUrl(src) {
    return /^https?:\/\//i.test(src);
}
function isVideoSource(src, mime) {
    if (mime?.startsWith('video/'))
        return true;
    const clean = src.split('?')[0].toLowerCase();
    return exports.VIDEO_EXTS.some((ext) => clean.endsWith(ext));
}
async function remoteUrlToDataUrl(url) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REMOTE_FETCH_TIMEOUT_MS);
    const response = await fetch(url, { signal: controller.signal }).finally(() => {
        clearTimeout(timer);
    });
    if (!response.ok) {
        throw new Error(`Failed to fetch media URL (${response.status})`);
    }
    const contentLength = Number(response.headers.get('content-length') || 0);
    if (contentLength > MAX_MEDIA_SIZE_MB * 1024 * 1024) {
        throw new Error(`Remote file too large: ${(contentLength / 1024 / 1024).toFixed(1)}MB (max ${MAX_MEDIA_SIZE_MB}MB)`);
    }
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const sizeMB = buffer.length / 1024 / 1024;
    if (sizeMB > MAX_MEDIA_SIZE_MB) {
        throw new Error(`Remote file too large: ${sizeMB.toFixed(1)}MB (max ${MAX_MEDIA_SIZE_MB}MB)`);
    }
    const contentType = response.headers.get('content-type') || guessMimeFromPath(url);
    const isVideo = isVideoSource(url, contentType);
    return {
        dataUrl: `data:${contentType};base64,${buffer.toString('base64')}`,
        isVideo,
    };
}
async function resolveSingleMediaSource(src) {
    if (src.startsWith('data:')) {
        const isVideo = src.startsWith('data:video/');
        return { type: isVideo ? 'video' : 'photo', url: src };
    }
    if (isLikelyLocalPath(src)) {
        const resolved = src.replace(/^~/, process.env.HOME || '');
        const { dataUrl, isVideo } = localFileToDataUrl(resolved);
        return { type: isVideo ? 'video' : 'photo', url: dataUrl };
    }
    if (isHttpUrl(src)) {
        // Prefer converting remote media to data URL to avoid browser-side CORS on x.com.
        try {
            const { dataUrl, isVideo } = await remoteUrlToDataUrl(src);
            return { type: isVideo ? 'video' : 'photo', url: dataUrl };
        }
        catch {
            // Fallback to original URL to preserve previous behavior when remote fetch fails.
            return { type: isVideoSource(src) ? 'video' : 'photo', url: src };
        }
    }
    return { type: isVideoSource(src) ? 'video' : 'photo', url: src };
}
function resolveMediaList(sources) {
    return sources.map(src => {
        if (isLikelyLocalPath(src)) {
            const resolved = src.replace(/^~/, process.env.HOME || '');
            const { dataUrl, isVideo } = localFileToDataUrl(resolved);
            return { type: isVideo ? 'video' : 'photo', url: dataUrl };
        }
        const isVideo = exports.VIDEO_EXTS.some(ext => src.toLowerCase().includes(ext));
        return { type: isVideo ? 'video' : 'photo', url: src };
    });
}
async function resolveMediaListAsync(sources) {
    return Promise.all(sources.map((src) => resolveSingleMediaSource(src)));
}
//# sourceMappingURL=mediaUtils.js.map