#!/usr/bin/env node

/**
 * Validate Release Notes Script
 * 
 * This script validates the JSONL release notes file and can display releases.
 * 
 * Usage:
 *   node scripts/validate-release-notes.mjs [options]
 * 
 * Options:
 *   --show        Display all releases
 *   --latest N    Display latest N releases (default: 5)
 *   --fix         Fix common issues (trailing spaces, missing newlines)
 *   --version X   Show specific version details
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const RELEASE_NOTES_FILE = path.join(__dirname, '../public/data/release-notes.jsonl');

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    show: false,
    latest: 0,
    fix: false,
    version: null
  };
  
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--show':
        options.show = true;
        break;
      case '--latest':
        options.latest = parseInt(args[++i]) || 5;
        break;
      case '--fix':
        options.fix = true;
        break;
      case '--version':
        options.version = args[++i];
        break;
    }
  }
  
  // Default to showing latest 5 if no options specified
  if (!options.show && !options.latest && !options.fix && !options.version) {
    options.latest = 5;
  }
  
  return options;
}

// Read and parse JSONL file
function readReleases() {
  if (!fs.existsSync(RELEASE_NOTES_FILE)) {
    console.error(`❌ Release notes file not found: ${RELEASE_NOTES_FILE}`);
    process.exit(1);
  }
  
  const content = fs.readFileSync(RELEASE_NOTES_FILE, 'utf8');
  const lines = content.split('\n').filter(line => line.trim());
  
  const releases = [];
  const errors = [];
  
  lines.forEach((line, index) => {
    try {
      const release = JSON.parse(line);
      releases.push(release);
    } catch (error) {
      errors.push({
        line: index + 1,
        content: line,
        error: error.message
      });
    }
  });
  
  return { releases, errors, lines };
}

// Display release information
function displayRelease(release, index) {
  console.log(`\n📦 Version ${release.version} - ${release.date}`);
  
  const categories = [
    { key: 'added', emoji: '✨', label: 'Added' },
    { key: 'fixed', emoji: '🐛', label: 'Fixed' },
    { key: 'changed', emoji: '🔄', label: 'Changed' },
    { key: 'security', emoji: '🔒', label: 'Security' },
    { key: 'breaking', emoji: '💥', label: 'Breaking' },
    { key: 'technical', emoji: '🔧', label: 'Technical' }
  ];
  
  categories.forEach(({ key, emoji, label }) => {
    if (release[key] && release[key].length > 0) {
      console.log(`\n${emoji} ${label}:`);
      release[key].forEach(item => {
        console.log(`  • ${item}`);
      });
    }
  });
}

// Fix common issues in JSONL file
function fixIssues() {
  const { releases, errors } = readReleases();
  
  if (errors.length > 0) {
    console.log(`Found ${errors.length} invalid lines. Removing them...`);
    errors.forEach(({ line, error }) => {
      console.log(`  Line ${line}: ${error}`);
    });
  }
  
  // Rewrite the file with only valid releases
  const lines = releases.map(release => JSON.stringify(release));
  fs.writeFileSync(RELEASE_NOTES_FILE, lines.join('\n') + '\n');
  
  console.log(`✅ Fixed! File now contains ${releases.length} valid releases.`);
}

// Main function
function main() {
  const options = parseArgs();
  
  try {
    const { releases, errors } = readReleases();
    
    // Report validation results
    console.log(`📋 Release Notes Validation`);
    console.log(`File: ${RELEASE_NOTES_FILE}`);
    console.log(`Total releases: ${releases.length}`);
    console.log(`Valid releases: ${releases.length - errors.length}`);
    console.log(`Invalid lines: ${errors.length}`);
    
    if (errors.length > 0) {
      console.log('\n❌ Errors found:');
      errors.forEach(({ line, content, error }) => {
        console.log(`  Line ${line}: ${error}`);
        console.log(`    Content: ${content.substring(0, 100)}...`);
      });
      
      if (!options.fix) {
        console.log('\nRun with --fix to clean up the file.');
      }
    } else {
      console.log('\n✅ All releases are valid!');
    }
    
    // Handle fix option
    if (options.fix && errors.length > 0) {
      fixIssues();
      return;
    }
    
    // Reverse to show newest first
    const sortedReleases = [...releases].reverse();
    
    // Handle version lookup
    if (options.version) {
      const release = sortedReleases.find(r => r.version === options.version);
      if (release) {
        displayRelease(release);
      } else {
        console.log(`\n❌ Version ${options.version} not found.`);
      }
      return;
    }
    
    // Handle show options
    if (options.show) {
      console.log('\n📦 All Releases:');
      sortedReleases.forEach((release, index) => displayRelease(release, index));
    } else if (options.latest > 0) {
      console.log(`\n📦 Latest ${options.latest} Releases:`);
      sortedReleases.slice(0, options.latest).forEach((release, index) => displayRelease(release, index));
    }
    
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
}

// Run the script
main();