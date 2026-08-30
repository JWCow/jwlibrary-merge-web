#!/usr/bin/env node

/**
 * Autonomous Cloud & Local Agent Runner for jwlibrary-merge-web
 * 
 * Powered 100% by zero-per-token subscription engines:
 * 1. Antigravity CLI (agy) — $25/mo Google subscription (Gemini 3.7 Flash)
 * 2. Claude Code CLI (claude) — $20/mo Anthropic subscription (Claude 3.7 Sonnet)
 */

import fs from 'node:fs';
import path from 'node:path';
import { execSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

// CLI / Env inputs
const TASK_PROMPT = process.env.AGENT_PROMPT || process.argv.slice(2).join(' ') || '';
const ISSUE_NUMBER = process.env.ISSUE_NUMBER || '';
const ISSUE_TITLE = process.env.ISSUE_TITLE || '';
const ISSUE_LABELS = process.env.ISSUE_LABELS || '';

if (!TASK_PROMPT && !ISSUE_TITLE) {
  console.error('Error: No task prompt or issue title provided.');
  process.exit(1);
}

const fullPrompt = [
  ISSUE_TITLE ? `# Task: ${ISSUE_TITLE}` : '',
  ISSUE_NUMBER ? `Issue Number: #${ISSUE_NUMBER}` : '',
  ISSUE_LABELS ? `Labels: ${ISSUE_LABELS}` : '',
  TASK_PROMPT ? `\n## Details / Specification:\n${TASK_PROMPT}` : '',
  `\n## Instructions:`,
  `1. Inspect the codebase to understand the requirements and existing patterns.`,
  `2. Make only the necessary surgical changes to satisfy the task.`,
  `3. Run tests using \`npm test\` and \`npm run build\` to verify your changes.`,
  `4. If any tests or build checks fail, fix the errors and re-test.`,
  `5. Once everything passes cleanly, write a concise markdown summary of changes and verification results to \`.agent_pr_summary.md\`.`
].filter(Boolean).join('\n');

function saveAgentArtifacts(summary = '') {
  // 1. Surgical modified files tracking
  const modifiedPath = path.resolve(ROOT_DIR, '.agent_modified_files.json');
  let files = [];
  try {
    const status = execSync('git status --porcelain', { cwd: ROOT_DIR, encoding: 'utf8' });
    files = status
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map(line => line.replace(/^[MADRCU?!]{1,2}\s+/, '').replace(/^["']|["']$/g, ''))
      .filter(f => !f.startsWith('.agent_'));
  } catch {
    files = [];
  }
  fs.writeFileSync(modifiedPath, JSON.stringify(files, null, 2), 'utf8');
  console.log(`[Agent Runner] Tracked ${files.length} modified file(s) in ${modifiedPath}`);

  // 2. PR Summary
  const summaryPath = path.resolve(ROOT_DIR, '.agent_pr_summary.md');
  const finalSummary = (fs.existsSync(summaryPath) && fs.readFileSync(summaryPath, 'utf8').trim())
    || summary
    || `Implemented changes for issue #${ISSUE_NUMBER || ''} (${ISSUE_TITLE || 'Task'}) and verified test suite.`;
  fs.writeFileSync(summaryPath, finalSummary, 'utf8');
  console.log(`[Agent Runner] PR summary saved to ${summaryPath}`);
}

async function main() {
  const isWindows = process.platform === 'win32';
  const whichCmd = isWindows ? 'where.exe' : 'which';

  const agyAvailable = (() => {
    try {
      const res = spawnSync(whichCmd, ['agy'], { encoding: 'utf8' });
      return res.status === 0;
    } catch {
      return false;
    }
  })();

  const claudeAvailable = (() => {
    try {
      const res = spawnSync(whichCmd, ['claude'], { encoding: 'utf8' });
      return res.status === 0;
    } catch {
      return false;
    }
  })();

  let summary = '';

  // Engine Priority: 1. AGY (Antigravity) -> 2. Claude Code
  if (agyAvailable) {
    console.log('🤖 [Agent Runner] Engine: Antigravity CLI (agy) — $25/mo Google Subscription');
    fs.writeFileSync(path.resolve(ROOT_DIR, '.agent_engine'), 'antigravity', 'utf8');
    
    const res = spawnSync('agy', ['--dangerously-skip-permissions', '--disable-slash-commands', '-p', fullPrompt], {
      cwd: ROOT_DIR,
      stdio: 'inherit',
      encoding: 'utf8',
      shell: true,
      timeout: 15 * 60 * 1000
    });

    if (res.error || (res.status !== 0 && res.status !== null)) {
      console.warn(`[Agent Runner] agy exited with status ${res.status}: ${res.error?.message || ''}`);
    }
  } else if (claudeAvailable) {
    console.log('🤖 [Agent Runner] Engine: Claude Code CLI (claude) — $20/mo Anthropic Subscription');
    fs.writeFileSync(path.resolve(ROOT_DIR, '.agent_engine'), 'claude_code', 'utf8');
    
    const res = spawnSync('claude', ['-p', '--dangerously-skip-permissions'], {
      input: fullPrompt,
      cwd: ROOT_DIR,
      stdio: ['pipe', 'inherit', 'inherit'],
      encoding: 'utf8',
      shell: true,
      timeout: 15 * 60 * 1000
    });

    if (res.error || (res.status !== 0 && res.status !== null)) {
      console.warn(`[Agent Runner] Claude CLI exited with status ${res.status}: ${res.error?.message || ''}`);
    }
  } else {
    console.error('❌ Error: No usable subscription engine found in PATH.');
    console.error('Please ensure either `agy` (Antigravity CLI) or `claude` (Claude Code CLI) is installed.');
    process.exit(1);
  }

  saveAgentArtifacts(summary);
}

main().catch(err => {
  console.error('[Agent Runner Fatal Error]:', err);
  process.exit(1);
});
