"use strict";
/**
 * BNBot Setup — one command to install everything.
 *
 * Usage: npx @bnbot/cli setup
 *
 * What it does:
 * 1. Install bnbot-cli globally (if not already)
 * 2. Install Claude Code skill to ~/.claude/commands/
 * 3. Print next steps
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.runSetup = runSetup;
const fs_1 = require("fs");
const path_1 = require("path");
const os_1 = require("os");
const child_process_1 = require("child_process");
const SKILL_URL = 'https://bnbot.ai/skill.md';
const CHROME_URL = 'https://chromewebstore.google.com/detail/bnbot/haammgigdkckogcgnbkigfleejpaiiln';
// Skill install paths for different agents
const SKILL_TARGETS = [
    { dir: (0, path_1.join)((0, os_1.homedir)(), '.claude', 'commands'), file: 'bnbot.md' },
    { dir: (0, path_1.join)((0, os_1.homedir)(), '.openclaw', 'skills', 'bnbot'), file: 'SKILL.md' },
    { dir: (0, path_1.join)((0, os_1.homedir)(), '.agents', 'skills', 'bnbot'), file: 'SKILL.md' },
];
// Detect if terminal supports ANSI colors (not in OpenClaw/chat environments)
const isTTY = process.stdout.isTTY === true;
const bold = (s) => isTTY ? `\x1b[1m${s}\x1b[0m` : s;
const red = (s) => isTTY ? `\x1b[1m\x1b[31m${s}\x1b[0m` : s;
const link = (s) => isTTY ? `\x1b[4m\x1b[31m${s}\x1b[0m` : s;
async function runSetup() {
    console.log('');
    console.log(`🦞 ${bold('BNBot Setup')}`);
    console.log('');
    // Step 1: Install globally
    try {
        const which = (0, child_process_1.execSync)('which bnbot 2>/dev/null || where bnbot 2>nul', { encoding: 'utf-8' }).trim();
        if (which) {
            console.log('✅ bnbot-cli already installed');
        }
    }
    catch {
        console.log('📦 Installing bnbot-cli globally...');
        try {
            (0, child_process_1.execSync)('npm i -g @bnbot/cli', { stdio: 'inherit' });
            console.log('✅ bnbot-cli installed');
        }
        catch {
            console.log('⚠️  Global install failed (try: sudo npm i -g @bnbot/cli)');
        }
    }
    // Step 2: Install skill to all agent platforms
    console.log('');
    console.log('📝 Installing skill...');
    try {
        const res = await fetch(SKILL_URL);
        if (res.ok) {
            const content = await res.text();
            if (content.startsWith('---')) {
                for (const target of SKILL_TARGETS) {
                    try {
                        (0, fs_1.mkdirSync)(target.dir, { recursive: true });
                        (0, fs_1.writeFileSync)((0, path_1.join)(target.dir, target.file), content);
                    }
                    catch { /* skip if dir not writable */ }
                }
                console.log(`✅ Skill installed → use ${red('/bnbot')} in Claude Code, Codex, or OpenClaw`);
            }
            else {
                console.log('⚠️  skill.md format unexpected, skipping');
            }
        }
        else {
            console.log('⚠️  Could not download skill.md (HTTP ' + res.status + ')');
        }
    }
    catch {
        console.log('⚠️  Could not download skill.md (network error)');
        console.log('   Manual: curl -o ~/.claude/commands/bnbot.md ' + SKILL_URL);
    }
    // Step 3: Chrome extension reminder
    console.log('');
    console.log('🌐 Chrome Extension:');
    console.log(`   ${link(CHROME_URL)}`);
    // Done
    console.log('');
    console.log('🎉 Setup complete! Next steps:');
    console.log('   1. Install the Chrome extension (link above)');
    console.log(`   2. Use ${red('/bnbot')} in your AI agent (Claude Code, Codex, OpenClaw)`);
    console.log(`   3. Or run: ${red('bnbot --help')}`);
    console.log('');
}
//# sourceMappingURL=setup.js.map