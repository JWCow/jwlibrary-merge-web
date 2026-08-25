#!/usr/bin/env node

/**
 * Cloud Agent Runner for GitHub Actions
 * Autonomous coding loop that reads task specs, edits code, runs test suites,
 * self-heals any test/compiler errors, and outputs a structured PR summary.
 * 
 * Supports:
 * - Google Gemini (GEMINI_API_KEY / GOOGLE_API_KEY) — defaults to gemini-2.5-flash
 * - Anthropic Claude (ANTHROPIC_API_KEY) — defaults to claude-3-5-sonnet-20241022
 */

import fs from 'node:fs';
import path from 'node:path';
import { execSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

// Auto-load .env from repo root or parent workspace root
function loadEnv() {
  const possibleEnvFiles = [
    path.join(ROOT_DIR, '.env'),
    path.join(ROOT_DIR, '..', '.env')
  ];
  for (const envPath of possibleEnvFiles) {
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      content.split('\n').forEach(line => {
        const match = line.trim().match(/^([^=+#]+)=(.*)$/);
        if (match) {
          const key = match[1].trim();
          const value = match[2].trim().replace(/^["']|["']$/g, '');
          if (!process.env[key]) {
            process.env[key] = value;
          }
        }
      });
    }
  }
}
loadEnv();

// CLI / Env inputs
const TASK_PROMPT = process.env.AGENT_PROMPT || process.argv[2] || '';
const ISSUE_NUMBER = process.env.ISSUE_NUMBER || '';
const ISSUE_TITLE = process.env.ISSUE_TITLE || '';
const MAX_TURNS = parseInt(process.env.AGENT_MAX_TURNS || '15', 10);

if (!TASK_PROMPT && !ISSUE_TITLE) {
  console.error('Error: No task prompt or issue title provided.');
  process.exit(1);
}

const fullPrompt = [
  ISSUE_TITLE ? `# Task: ${ISSUE_TITLE}` : '',
  ISSUE_NUMBER ? `Issue Number: #${ISSUE_NUMBER}` : '',
  TASK_PROMPT ? `\nDetails / Spec:\n${TASK_PROMPT}` : '',
  `\nInstructions:`,
  `1. Inspect the codebase to understand the task.`,
  `2. Make only the necessary surgical changes to satisfy the requirements.`,
  `3. Run tests using 'run_command' ('npm test' and/or 'npm run build') to verify your changes.`,
  `4. If any tests or builds fail, inspect the output, fix the errors, and re-test.`,
  `5. Once everything passes and you are confident, call 'finish_task' with a concise summary of changes for the Pull Request.`
].filter(Boolean).join('\n');

// Tool definitions
const TOOLS = [
  {
    name: 'read_file',
    description: 'Read the text content of a file in the repository.',
    parameters: {
      type: 'object',
      properties: {
        file_path: { type: 'string', description: 'Relative path from repository root' }
      },
      required: ['file_path']
    }
  },
  {
    name: 'write_file',
    description: 'Write or overwrite a file in the repository with new content.',
    parameters: {
      type: 'object',
      properties: {
        file_path: { type: 'string', description: 'Relative path from repository root' },
        content: { type: 'string', description: 'Complete file content to write' }
      },
      required: ['file_path', 'content']
    }
  },
  {
    name: 'list_directory',
    description: 'List files and subdirectories in a given directory path.',
    parameters: {
      type: 'object',
      properties: {
        dir_path: { type: 'string', description: 'Relative directory path (e.g. "src", "tests", "")' }
      },
      required: ['dir_path']
    }
  },
  {
    name: 'run_command',
    description: 'Run a shell command (e.g. "npm test", "npm run build", "git status") in the repo root.',
    parameters: {
      type: 'object',
      properties: {
        command: { type: 'string', description: 'Command to execute' }
      },
      required: ['command']
    }
  },
  {
    name: 'finish_task',
    description: 'Call this when all edits are complete and verified by passing tests.',
    parameters: {
      type: 'object',
      properties: {
        summary: { type: 'string', description: 'Markdown summary of what was done, files changed, and test results' }
      },
      required: ['summary']
    }
  }
];

const MODIFIED_FILES = new Set();

function executeTool(name, args) {
  try {
    if (name === 'read_file') {
      const targetPath = path.resolve(ROOT_DIR, args.file_path);
      if (!targetPath.startsWith(ROOT_DIR)) return { error: 'Access denied: outside root' };
      if (!fs.existsSync(targetPath)) return { error: `File not found: ${args.file_path}` };
      const content = fs.readFileSync(targetPath, 'utf8');
      return { content: content.length > 50000 ? content.slice(0, 50000) + '\n...[truncated]' : content };
    }
    
    if (name === 'write_file') {
      const targetPath = path.resolve(ROOT_DIR, args.file_path);
      if (!targetPath.startsWith(ROOT_DIR)) return { error: 'Access denied: outside root' };
      fs.mkdirSync(path.dirname(targetPath), { recursive: true });
      fs.writeFileSync(targetPath, args.content, 'utf8');
      const relPath = path.relative(ROOT_DIR, targetPath).replace(/\\/g, '/');
      MODIFIED_FILES.add(relPath);
      return { success: true, message: `Wrote ${args.file_path}` };
    }
    
    if (name === 'list_directory') {
      const targetPath = path.resolve(ROOT_DIR, args.dir_path || '.');
      if (!targetPath.startsWith(ROOT_DIR)) return { error: 'Access denied: outside root' };
      if (!fs.existsSync(targetPath)) return { error: `Directory not found: ${args.dir_path}` };
      const entries = fs.readdirSync(targetPath, { withFileTypes: true });
      const items = entries.map(e => (e.isDirectory() ? `${e.name}/` : e.name));
      return { files: items };
    }
    
    if (name === 'run_command') {
      console.log(`\n> [Tool Run] ${args.command}`);
      try {
        const output = execSync(args.command, {
          cwd: ROOT_DIR,
          encoding: 'utf8',
          timeout: 60000,
          maxBuffer: 5 * 1024 * 1024
        });
        return { success: true, stdout: output };
      } catch (err) {
        return {
          success: false,
          exitCode: err.status,
          stdout: err.stdout?.toString() || '',
          stderr: err.stderr?.toString() || err.message
        };
      }
    }
    
    if (name === 'finish_task') {
      return { finished: true, summary: args.summary };
    }
    
    return { error: `Unknown tool: ${name}` };
  } catch (err) {
    return { error: err.message };
  }
}

// Model drivers: Gemini vs Claude
async function runWithGemini(apiKey) {
  const model = process.env.GEMINI_MODEL || 'gemini-3.7-flash';
  console.log(`[Cloud Agent] Initializing with Gemini Model: ${model}`);
  
  const functionDeclarations = TOOLS.map(t => ({
    name: t.name,
    description: t.description,
    parameters: {
      type: 'OBJECT',
      properties: Object.fromEntries(
        Object.entries(t.parameters.properties).map(([k, v]) => [
          k,
          {
            type: v.type.toUpperCase(),
            description: v.description
          }
        ])
      ),
      required: t.parameters.required
    }
  }));

  const contents = [
    {
      role: 'user',
      parts: [{ text: fullPrompt }]
    }
  ];

  let turn = 0;
  let finalSummary = '';

  while (turn < MAX_TURNS) {
    turn++;
    console.log(`\n--- Agent Turn ${turn}/${MAX_TURNS} ---`);

    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        tools: [{ functionDeclarations }],
        systemInstruction: {
          parts: [{
            text: `You are an autonomous senior software engineer working in a GitHub Action. You have full access to tools to read, edit, and test code. Your goal is to solve the issue cleanly, verify with tests, and call finish_task.`
          }]
        }
      })
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Gemini API Error (${res.status}): ${errText}`);
    }

    const data = await res.json();
    const candidate = data.candidates?.[0];
    const parts = candidate?.content?.parts || [];

    // Append model response to conversation history
    contents.push(candidate.content);

    const toolCalls = parts.filter(p => p.functionCall);
    const textPart = parts.find(p => p.text);
    if (textPart?.text) {
      console.log(`[Model]: ${textPart.text.trim()}`);
    }

    if (!toolCalls.length) {
      console.log('[Cloud Agent] No tool calls returned. Prompting to continue or finish...');
      contents.push({
        role: 'user',
        parts: [{ text: 'Please proceed with making edits, running verification tests, or call finish_task when done.' }]
      });
      continue;
    }

    const responseParts = [];
    let isFinished = false;

    for (const call of toolCalls) {
      const fnName = call.functionCall.name;
      const fnArgs = call.functionCall.args || {};
      console.log(`[Agent Action] ${fnName}(${JSON.stringify(fnArgs)})`);
      
      const result = executeTool(fnName, fnArgs);
      if (fnName === 'finish_task' && result.finished) {
        isFinished = true;
        finalSummary = result.summary;
      }

      responseParts.push({
        functionResponse: {
          name: fnName,
          response: { result }
        }
      });
    }

    contents.push({
      role: 'user',
      parts: responseParts
    });

    if (isFinished) {
      console.log('\n✅ [Cloud Agent] Task marked as completed!');
      return finalSummary;
    }
  }

  throw new Error(`Agent reached maximum turns (${MAX_TURNS}) without finishing.`);
}

async function runWithClaude(apiKey) {
  const model = process.env.CLAUDE_MODEL || 'claude-3-5-sonnet-20241022';
  console.log(`[Cloud Agent] Initializing with Claude Model: ${model}`);

  const tools = TOOLS.map(t => ({
    name: t.name,
    description: t.description,
    input_schema: t.parameters
  }));

  const messages = [
    { role: 'user', content: fullPrompt }
  ];

  let turn = 0;
  let finalSummary = '';

  while (turn < MAX_TURNS) {
    turn++;
    console.log(`\n--- Agent Turn ${turn}/${MAX_TURNS} ---`);

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        model,
        max_tokens: 4096,
        system: `You are an autonomous senior software engineer working in a GitHub Action. You have full access to tools to read, edit, and test code. Your goal is to solve the issue cleanly, verify with tests, and call finish_task.`,
        tools,
        messages
      })
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Anthropic API Error (${res.status}): ${errText}`);
    }

    const data = await res.json();
    messages.push({ role: 'assistant', content: data.content });

    const toolUses = data.content.filter(c => c.type === 'tool_use');
    const textBlocks = data.content.filter(c => c.type === 'text');
    for (const text of textBlocks) {
      console.log(`[Model]: ${text.text.trim()}`);
    }

    if (!toolUses.length) {
      console.log('[Cloud Agent] No tool calls returned. Prompting to continue or finish...');
      messages.push({
        role: 'user',
        content: 'Please proceed with making edits, running verification tests, or call finish_task when done.'
      });
      continue;
    }

    const toolResults = [];
    let isFinished = false;

    for (const tool of toolUses) {
      console.log(`[Agent Action] ${tool.name}(${JSON.stringify(tool.input)})`);
      const result = executeTool(tool.name, tool.input);
      if (tool.name === 'finish_task' && result.finished) {
        isFinished = true;
        finalSummary = result.summary;
      }
      toolResults.push({
        type: 'tool_result',
        tool_use_id: tool.id,
        content: JSON.stringify(result)
      });
    }

    messages.push({
      role: 'user',
      content: toolResults
    });

    if (isFinished) {
      console.log('\n✅ [Cloud Agent] Task marked as completed!');
      return finalSummary;
    }
  }

  throw new Error(`Agent reached maximum turns (${MAX_TURNS}) without finishing.`);
}

function saveAgentArtifacts(summary) {
  // 1. Surgical modified files tracking
  const modifiedPath = path.resolve(ROOT_DIR, '.agent_modified_files.json');
  let files = Array.from(MODIFIED_FILES);
  if (files.length === 0) {
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
  }
  fs.writeFileSync(modifiedPath, JSON.stringify(files, null, 2), 'utf8');
  console.log(`[Cloud Agent] Tracked ${files.length} modified file(s) in ${modifiedPath}`);

  // 2. PR Summary
  const summaryPath = path.resolve(ROOT_DIR, '.agent_pr_summary.md');
  const finalSummary = (fs.existsSync(summaryPath) && fs.readFileSync(summaryPath, 'utf8').trim())
    || summary
    || `Implemented changes for issue #${ISSUE_NUMBER || ''} (${ISSUE_TITLE || 'Task'}) and verified test suite.`;
  fs.writeFileSync(summaryPath, finalSummary, 'utf8');
  console.log(`[Cloud Agent] PR summary saved to ${summaryPath}`);
}

async function main() {
  const claudeAvailable = (() => {
    try {
      const res = spawnSync(process.platform === 'win32' ? 'where.exe' : 'which', ['claude'], { encoding: 'utf8' });
      return res.status === 0;
    } catch {
      return false;
    }
  })();

  const agyAvailable = (() => {
    try {
      const res = spawnSync(process.platform === 'win32' ? 'where.exe' : 'which', ['agy'], { encoding: 'utf8' });
      return res.status === 0;
    } catch {
      return false;
    }
  })();

  const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;

  let summary = '';
  const promptInstruction = fullPrompt + '\n\nIMPORTANT: Make only the necessary surgical changes to resolve this task. Run `npm test` to verify your changes. When done, write a concise summary of changes to `.agent_pr_summary.md` and ensure tests pass.';

  if (claudeAvailable) {
    console.log('[Cloud Agent] Running with Claude Code CLI ($20/mo Anthropic subscription)');
    const res = spawnSync('claude', ['-p', promptInstruction, '--dangerously-skip-permissions'], {
      cwd: ROOT_DIR,
      stdio: 'inherit',
      encoding: 'utf8',
      shell: true,
      timeout: 10 * 60 * 1000 // 10 minutes
    });
    if (res.error || (res.status !== 0 && res.status !== null)) {
      console.warn(`[Cloud Agent] Claude CLI exited with status ${res.status}: ${res.error?.message || res.stderr || ''}`);
    }
  } else if (agyAvailable) {
    console.log('[Cloud Agent] Running with Antigravity CLI agy ($20/mo Google subscription)');
    const res = spawnSync('agy', ['--dangerously-skip-permissions', '--disable-slash-commands', '-p', promptInstruction], {
      cwd: ROOT_DIR,
      stdio: 'inherit',
      encoding: 'utf8',
      shell: true,
      timeout: 10 * 60 * 1000
    });
    if (res.error || (res.status !== 0 && res.status !== null)) {
      console.warn(`[Cloud Agent] agy exited with status ${res.status}: ${res.error?.message || res.stderr || ''}`);
    }
  } else if (geminiKey) {
    summary = await runWithGemini(geminiKey);
  } else if (anthropicKey) {
    summary = await runWithClaude(anthropicKey);
  } else {
    console.error('Error: No usable engine found (no claude/agy CLI in PATH, no GEMINI_API_KEY, no ANTHROPIC_API_KEY).');
    process.exit(1);
  }

  saveAgentArtifacts(summary);
}

main().catch(err => {
  console.error('[Cloud Agent Fatal Error]:', err);
  process.exit(1);
});
