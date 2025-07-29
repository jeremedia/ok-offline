#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CLAUDE_LOGS_DIR = '/Users/jeremy/.claude/projects/-Users-jeremy-ok-offline-ecosystem';
const OUTPUT_FILE = path.join(__dirname, '../public/data/claude-prompts.json');

async function extractPrompts() {
  const prompts = [];
  
  // Get all .jsonl files
  const files = fs.readdirSync(CLAUDE_LOGS_DIR)
    .filter(f => f.endsWith('.jsonl'))
    .map(f => path.join(CLAUDE_LOGS_DIR, f));
  
  console.log(`Found ${files.length} log files to process...`);
  
  for (const file of files) {
    await processFile(file, prompts);
  }
  
  // Sort by timestamp (newest first)
  prompts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  
  // Ensure output directory exists
  const outputDir = path.dirname(OUTPUT_FILE);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // Write to file
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(prompts, null, 2));
  console.log(`Extracted ${prompts.length} prompts to ${OUTPUT_FILE}`);
}

async function processFile(filePath, prompts) {
  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  for await (const line of rl) {
    try {
      const entry = JSON.parse(line);
      
      // Extract user prompts (excluding meta and command messages)
      // Only include messages where content is a string (not tool results)
      if (entry.type === 'user' && 
          entry.message?.content && 
          typeof entry.message.content === 'string' &&
          !entry.isMeta &&
          !entry.isCompactSummary &&
          entry.userType === 'external') {
        
        const content = entry.message.content;
        
        // Skip tool results and system messages
        if (content.includes('<command-') ||
            content.includes('[Request interrupted') ||
            content.includes('tool_use_id') ||
            content.includes('tool_result')) {
          continue;
        }
        
        // Skip agent prompts (formal, structured messages)
        if (content.startsWith('You are working on') ||
            content.startsWith('Your task') ||
            content.startsWith('Please:') ||
            content.includes('\n\n\n') || // Multiple paragraphs
            content.includes('\n1.') ||   // Numbered lists
            content.includes('\n2.') ||
            content.includes('\n3.') ||
            content.includes('```') ||     // Code blocks
            content.length > 1000) {       // Very long messages
          continue;
        }
        
        // Skip build output and error messages
        if (content.includes('vite build') ||
            content.includes('npm run') ||
            content.includes('error during build') ||
            content.includes('✓') ||
            content.includes('x Build failed')) {
          continue;
        }
        
        prompts.push({
          timestamp: entry.timestamp,
          prompt: entry.message.content,
          session: entry.sessionId,
          branch: entry.gitBranch || 'main',
          directory: entry.cwd || 'unknown',
          version: entry.version || 'unknown'
        });
      }
    } catch (e) {
      // Skip invalid JSON lines
    }
  }
}

// Run the extraction
extractPrompts().catch(console.error);