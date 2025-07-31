#!/usr/bin/env node

/**
 * Script to automatically replace hardcoded colors with CSS variables
 */

import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

// Comprehensive color to CSS variable mapping
const colorMap = new Map([
  // Primary colors
  ['#8B0000', 'var(--color-primary)'],
  ['#8b0000', 'var(--color-primary)'],
  ['#680000', 'var(--color-primary-dark)'],
  ['#5a0000', 'var(--color-primary-darker)'],
  ['#FFD700', 'var(--color-accent)'],
  ['#ffd700', 'var(--color-accent)'],
  ['#DAA520', 'var(--color-accent-dark)'],
  ['#daa520', 'var(--color-accent-dark)'],
  
  // Background colors
  ['#1a1a1a', 'var(--color-bg-base)'],
  ['#2a2a2a', 'var(--color-bg-elevated)'],
  ['#333', 'var(--color-bg-header)'],
  ['#333333', 'var(--color-bg-header)'],
  ['#444', 'var(--color-bg-input)'],
  ['#444444', 'var(--color-bg-input)'],
  ['#555', 'var(--color-bg-hover)'],
  ['#555555', 'var(--color-bg-hover)'],
  ['#666', 'var(--color-bg-active)'],
  ['#666666', 'var(--color-bg-active)'],
  
  // Text colors
  ['#fff', 'var(--color-text-primary)'],
  ['#ffffff', 'var(--color-text-primary)'],
  ['#FFF', 'var(--color-text-primary)'],
  ['#FFFFFF', 'var(--color-text-primary)'],
  ['white', 'var(--color-text-primary)'],
  
  ['#ccc', 'var(--color-text-secondary)'],
  ['#cccccc', 'var(--color-text-secondary)'],
  ['#999', 'var(--color-text-muted)'],
  ['#999999', 'var(--color-text-muted)'],
  ['#888', 'var(--color-text-muted)'],
  ['#888888', 'var(--color-text-muted)'],
  ['#777', 'var(--color-text-disabled)'],
  ['#777777', 'var(--color-text-disabled)'],
  
  // Status colors
  ['#4CAF50', 'var(--color-success)'],
  ['#4caf50', 'var(--color-success)'],
  ['#f44336', 'var(--color-error)'],
  ['#F44336', 'var(--color-error)'],
  ['#ff9800', 'var(--color-warning)'],
  ['#FF9800', 'var(--color-warning)'],
  ['#2196f3', 'var(--color-info)'],
  ['#2196F3', 'var(--color-info)'],
  
  // Special colors
  ['#ff6b6b', 'var(--color-schedule-conflict)'],
  ['#FF4444', 'var(--color-error)'],
  ['#ff4444', 'var(--color-error)'],
  ['#a00', 'var(--color-primary-dark)'],
  ['#aa0000', 'var(--color-primary-dark)'],
  ['#f0f0f0', 'var(--color-bg-elevated)'],
  ['#ddd', 'var(--color-border-light)'],
  ['#dddddd', 'var(--color-border-light)'],
  ['#eee', 'var(--color-border-light)'],
  ['#eeeeee', 'var(--color-border-light)'],
  ['#aaa', 'var(--color-text-muted)'],
  ['#aaaaaa', 'var(--color-text-muted)'],
  ['#bbb', 'var(--color-text-muted)'],
  ['#bbbbbb', 'var(--color-text-muted)'],
]);

// Function to replace colors in a line
function replaceColorsInLine(line) {
  // Skip if line already uses CSS variables or is a comment
  if (line.includes('var(--color-') || line.includes('//') || line.includes('/*')) {
    return line;
  }
  
  let modifiedLine = line;
  
  // Replace colors with word boundaries to avoid partial matches
  colorMap.forEach((variable, color) => {
    // Create regex that matches the color but not within other strings
    const regex = new RegExp(`(?<![-#a-zA-Z0-9])${color.replace('#', '#?')}(?![-a-zA-Z0-9])`, 'gi');
    modifiedLine = modifiedLine.replace(regex, variable);
  });
  
  return modifiedLine;
}

// Process a single file
function processFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  let modified = false;
  
  const newLines = lines.map(line => {
    const newLine = replaceColorsInLine(line);
    if (newLine !== line) {
      modified = true;
    }
    return newLine;
  });
  
  if (modified) {
    fs.writeFileSync(filePath, newLines.join('\n'));
    return true;
  }
  
  return false;
}

// Main execution
const vueFiles = glob.sync('src/**/*.vue');
const cssFiles = glob.sync('src/**/*.css');
const allFiles = [...vueFiles, ...cssFiles];

console.log(`\n🎨 Processing ${allFiles.length} files...\n`);

let modifiedCount = 0;
allFiles.forEach(file => {
  if (processFile(file)) {
    console.log(`✅ Updated: ${file}`);
    modifiedCount++;
  }
});

console.log(`\n✨ Complete! Modified ${modifiedCount} files.`);
console.log(`\n💡 Don't forget to review the changes and test thoroughly!`);