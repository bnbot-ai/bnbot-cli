"use strict";
/**
 * BNBot Setup — one command to install everything.
 *
 * Usage: npx bnbot-cli setup
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
const COMMANDS_DIR = (0, path_1.join)((0, os_1.homedir)(), '.claude', 'commands');
const SKILL_PATH = (0, path_1.join)(COMMANDS_DIR, 'bnbot.md');
const CHROME_URL = 'https://chromewebstore.google.com/detail/bnbot/haammgigdkckogcgnbkigfleejpaiiln';
async function runSetup() {
    console.log('');
    console.log('🦞 \x1b[1m\x1b[31mBNBot Setup\x1b[0m');
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
            (0, child_process_1.execSync)('npm i -g bnbot-cli', { stdio: 'inherit' });
            console.log('✅ bnbot-cli installed');
        }
        catch {
            console.log('⚠️  Global install failed (try: sudo npm i -g bnbot-cli)');
        }
    }
    // Step 2: Install Claude skill
    console.log('');
    console.log('📝 Installing Claude Code skill...');
    try {
        const res = await fetch(SKILL_URL);
        if (res.ok) {
            const content = await res.text();
            if (content.startsWith('---')) {
                (0, fs_1.mkdirSync)(COMMANDS_DIR, { recursive: true });
                (0, fs_1.writeFileSync)(SKILL_PATH, content);
                console.log('✅ Skill installed → use \x1b[1m\x1b[31m/bnbot\x1b[0m in Claude Code');
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
    console.log('   \x1b[4m\x1b[31m' + CHROME_URL + '\x1b[0m');
    // Done
    console.log('');
    console.log('🎉 Setup complete! Next steps:');
    console.log('   1. Install the Chrome extension (link above)');
    console.log('   2. Use \x1b[1m\x1b[31m/bnbot\x1b[0m in your AI agent (Claude Code, Codex, OpenClaw)');
    console.log('   3. Or run: \x1b[1m\x1b[31mbnbot --help\x1b[0m');
    console.log('');
}
//# sourceMappingURL=setup.js.map