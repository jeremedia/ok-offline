#!/usr/bin/env node

/**
 * Add Release Notes Script
 * 
 * This script appends a new release entry to the JSONL release notes file.
 * It validates the JSON structure and ensures proper formatting.
 * 
 * Usage:
 *   node scripts/add-release-notes.js <version> <date> [options]
 * 
 * Examples:
 *   # Basic usage with minimal data
 *   node scripts/add-release-notes.js 3.26.0 2025-08-03 --added "🌊 Seven Pools Knowledge Graph"
 *   
 *   # Multiple items per category
 *   node scripts/add-release-notes.js 3.26.0 2025-08-03 \
 *     --added "🌊 Seven Pools Knowledge Graph" \
 *     --added "🎯 Smart search with context" \
 *     --fixed "🐛 Fixed search bug" \
 *     --changed "⚡ Improved performance"
 *   
 *   # Using JSON input
 *   echo '{"version":"3.26.0","date":"2025-08-03","added":["🌊 Seven Pools"]}' | \
 *     node scripts/add-release-notes.js --json
 */

const fs = require('fs');
const path = require('path');

const RELEASE_NOTES_FILE = path.join(__dirname, '../public/data/release-notes.jsonl');

// Command line argument parsing
function parseArgs() {
  const args = process.argv.slice(2);
  
  // Check for JSON input mode
  if (args.includes('--json')) {
    return { jsonMode: true };
  }
  
  // Parse standard arguments
  if (args.length < 2) {
    console.error('Usage: add-release-notes.js <version> <date> [options]');
    console.error('   or: add-release-notes.js --json < release.json');
    process.exit(1);
  }
  
  const release = {
    version: args[0],
    date: args[1],
    added: [],
    fixed: [],
    changed: [],
    security: [],
    breaking: [],
    technical: []
  };
  
  // Parse category flags
  let currentCategory = null;
  for (let i = 2; i < args.length; i++) {
    const arg = args[i];
    
    if (arg.startsWith('--')) {
      currentCategory = arg.substring(2);
      if (!release.hasOwnProperty(currentCategory)) {
        console.error(`Unknown category: ${currentCategory}`);
        console.error('Valid categories: added, fixed, changed, security, breaking, technical');
        process.exit(1);
      }
    } else if (currentCategory) {
      release[currentCategory].push(arg);
    }
  }
  
  return { release, jsonMode: false };
}

// Read JSON from stdin
async function readJsonFromStdin() {
  return new Promise((resolve, reject) => {
    let data = '';
    process.stdin.setEncoding('utf8');
    
    process.stdin.on('data', chunk => {
      data += chunk;
    });
    
    process.stdin.on('end', () => {
      try {
        const release = JSON.parse(data);
        resolve(release);
      } catch (error) {
        reject(new Error(`Invalid JSON input: ${error.message}`));
      }
    });
    
    process.stdin.on('error', reject);
  });
}

// Validate release structure
function validateRelease(release) {
  // Required fields
  if (!release.version) {
    throw new Error('Missing required field: version');
  }
  if (!release.date) {
    throw new Error('Missing required field: date');
  }
  
  // Validate date format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(release.date)) {
    throw new Error('Invalid date format. Use YYYY-MM-DD');
  }
  
  // Ensure all category arrays exist
  const categories = ['added', 'fixed', 'changed', 'security', 'breaking', 'technical'];
  categories.forEach(category => {
    if (!release.hasOwnProperty(category)) {
      release[category] = [];
    }
    if (!Array.isArray(release[category])) {
      throw new Error(`${category} must be an array`);
    }
  });
  
  return release;
}

// Append release to JSONL file
function appendRelease(release) {
  try {
    // Ensure the directory exists
    const dir = path.dirname(RELEASE_NOTES_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    // Create file if it doesn't exist
    if (!fs.existsSync(RELEASE_NOTES_FILE)) {
      fs.writeFileSync(RELEASE_NOTES_FILE, '');
    }
    
    // Read existing content to check if we need a newline
    const existingContent = fs.readFileSync(RELEASE_NOTES_FILE, 'utf8');
    const needsNewline = existingContent.length > 0 && !existingContent.endsWith('\n');
    
    // Append the release (with newline if needed)
    const jsonLine = JSON.stringify(release);
    const content = needsNewline ? '\n' + jsonLine + '\n' : jsonLine + '\n';
    
    fs.appendFileSync(RELEASE_NOTES_FILE, content);
    
    console.log(`✅ Successfully added release ${release.version} to ${RELEASE_NOTES_FILE}`);
    console.log('\nAdded release:');
    console.log(JSON.stringify(release, null, 2));
    
  } catch (error) {
    console.error(`❌ Failed to append release: ${error.message}`);
    process.exit(1);
  }
}

// Main function
async function main() {
  try {
    const parsed = parseArgs();
    
    let release;
    if (parsed.jsonMode) {
      console.log('Reading release data from stdin...');
      release = await readJsonFromStdin();
    } else {
      release = parsed.release;
    }
    
    // Validate and clean up the release
    release = validateRelease(release);
    
    // Append to file
    appendRelease(release);
    
    // Show next steps
    console.log('\n📝 Next steps:');
    console.log('1. Update CHANGELOG.md with the same release information');
    console.log('2. Increment service worker cache version in public/sw.js');
    console.log('3. Update public/data/features.json if new features were added');
    console.log('4. Commit all changes together');
    
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}