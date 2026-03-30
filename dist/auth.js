"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runLogin = runLogin;
const readline_1 = require("readline");
const fs_1 = require("fs");
const path_1 = require("path");
const os_1 = require("os");
const ws_1 = __importDefault(require("ws"));
const crypto_1 = require("crypto");
const API_BASE = 'https://api.bnbot.ai';
const DEFAULT_PORT = 18900;
const CLAWMONEY_CONFIG = (0, path_1.join)((0, os_1.homedir)(), '.clawmoney', 'config.yaml');
function prompt(question) {
    const rl = (0, readline_1.createInterface)({ input: process.stdin, output: process.stderr });
    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            rl.close();
            resolve(answer.trim());
        });
    });
}
/**
 * Try to login using clawmoney API key (from ~/.clawmoney/config.yaml).
 * Returns login data if successful, null otherwise.
 */
async function tryClawmoneyLogin() {
    if (!(0, fs_1.existsSync)(CLAWMONEY_CONFIG))
        return null;
    try {
        const content = (0, fs_1.readFileSync)(CLAWMONEY_CONFIG, 'utf-8');
        // Simple YAML parse: extract api_key value
        const match = content.match(/^api_key:\s*(.+)$/m);
        const apiKey = match?.[1]?.trim().replace(/^['"]|['"]$/g, '');
        if (!apiKey)
            return null;
        console.error('Found clawmoney API key, logging in...');
        const res = await fetch(`${API_BASE}/api/v1/claw-agents/auth/login-extension`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            console.error(`API key login failed: ${err.detail || `HTTP ${res.status}`}`);
            return null;
        }
        const data = await res.json();
        console.error(`Logged in as ${data.user.email} (via clawmoney API key)`);
        return data;
    }
    catch (err) {
        console.error('Failed to read clawmoney config:', err.message);
        return null;
    }
}
/**
 * Login via email verification code. Returns login data.
 */
async function emailLogin(email) {
    // Step 1: Send verification code
    console.error(`Sending verification code to ${email}...`);
    const sendRes = await fetch(`${API_BASE}/api/v1/send-verification-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
    });
    if (!sendRes.ok) {
        console.error(`Failed to send verification code: HTTP ${sendRes.status}`);
        process.exit(1);
    }
    console.error('Verification code sent! Check your email.');
    // Step 2: Prompt for code
    const code = await prompt('Enter verification code: ');
    if (!code) {
        console.error('Verification code is required.');
        process.exit(1);
    }
    // Step 3: Verify and get tokens
    console.error('Verifying code...');
    const loginRes = await fetch(`${API_BASE}/api/v1/email-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
    });
    if (!loginRes.ok) {
        const errData = await loginRes.json().catch(() => ({}));
        console.error(`Login failed: ${errData.detail || `HTTP ${loginRes.status}`}`);
        process.exit(1);
    }
    const loginData = await loginRes.json();
    console.error(`Logged in as ${loginData.user.email}`);
    return loginData;
}
/**
 * Send auth tokens to extension via WebSocket.
 */
function sendTokensToExtension(loginData, port) {
    console.error('Sending auth to extension...');
    const ws = new ws_1.default(`ws://127.0.0.1:${port}`);
    const requestId = (0, crypto_1.randomUUID)();
    ws.on('open', () => {
        ws.send(JSON.stringify({
            type: 'cli_action',
            requestId,
            actionType: 'inject_auth_tokens',
            actionPayload: {
                access_token: loginData.access_token,
                refresh_token: loginData.refresh_token,
                user: loginData.user,
            },
        }));
    });
    ws.on('message', (data) => {
        try {
            const msg = JSON.parse(data.toString());
            if (msg.requestId === requestId) {
                if (msg.success !== false) {
                    console.error('Extension authenticated successfully!');
                    console.log(JSON.stringify({ success: true, email: loginData.user.email }));
                }
                else {
                    console.error('Extension auth failed:', msg.error);
                    console.log(JSON.stringify({ success: false, error: msg.error }));
                }
                ws.close();
                process.exit(0);
            }
        }
        catch { }
    });
    ws.on('error', () => {
        console.error('Extension not connected. Login successful but tokens not synced to extension.');
        console.log(JSON.stringify({ success: true, email: loginData.user.email, extensionSynced: false }));
        process.exit(0);
    });
    setTimeout(() => {
        console.error('Timeout waiting for extension response. Login successful but tokens may not be synced.');
        console.log(JSON.stringify({ success: true, email: loginData.user.email, extensionSynced: false }));
        ws.close();
        process.exit(0);
    }, 10000);
}
async function runLogin(argv) {
    // Parse --port
    let port = DEFAULT_PORT;
    const portIdx = argv.indexOf('--port');
    if (portIdx !== -1 && argv[portIdx + 1]) {
        port = parseInt(argv[portIdx + 1], 10) || DEFAULT_PORT;
    }
    // Try clawmoney API key first (no email needed)
    const clawLogin = await tryClawmoneyLogin();
    if (clawLogin) {
        sendTokensToExtension(clawLogin, port);
        return;
    }
    // Fallback: email verification
    let email = '';
    const emailIdx = argv.indexOf('--email');
    if (emailIdx !== -1 && argv[emailIdx + 1]) {
        email = argv[emailIdx + 1];
    }
    if (!email) {
        email = await prompt('Email: ');
    }
    if (!email) {
        console.error('Email is required.');
        process.exit(1);
    }
    const loginData = await emailLogin(email);
    sendTokensToExtension(loginData, port);
}
//# sourceMappingURL=auth.js.map