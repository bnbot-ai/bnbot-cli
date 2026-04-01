#!/usr/bin/env node

/**
 * Post-install: automatically install BNBot skill to Claude Code.
 * Runs after `npm i -g bnbot-cli`.
 */

const { mkdirSync, writeFileSync, existsSync } = require('fs');
const { join } = require('path');
const { homedir } = require('os');

const SKILL_URL = 'https://bnbot.ai/skill.md';
const COMMANDS_DIR = join(homedir(), '.claude', 'commands');
const SKILL_PATH = join(COMMANDS_DIR, 'bnbot.md');

async function main() {
  try {
    // Download skill.md
    const res = await fetch(SKILL_URL);
    if (!res.ok) {
      // Fallback: network might not be available, skip silently
      return;
    }
    const content = await res.text();

    // Only save if it looks like a valid skill file (starts with ---)
    if (!content.startsWith('---')) {
      return;
    }

    // Create directory and save
    mkdirSync(COMMANDS_DIR, { recursive: true });
    writeFileSync(SKILL_PATH, content);
    console.log('[BNBot] ✅ Skill installed → use /bnbot in Claude Code');
  } catch {
    // Silent fail — don't break npm install
  }
}

main();
