#!/usr/bin/env node

/**
 * Script to find all hardcoded colors in Vue components
 * and suggest CSS variable replacements
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Color to CSS variable mapping
const colorMap = {
  '#8B0000': 'var(--color-primary)',
  '#8b0000': 'var(--color-primary)',
  '#680000': 'var(--color-primary-dark)',
  '#5a0000': 'var(--color-primary-darker)',
  '#FFD700': 'var(--color-accent)',
  '#ffd700': 'var(--color-accent)',
  '#DAA520': 'var(--color-accent-dark)',
  
  '#1a1a1a': 'var(--color-bg-base)',
  '#2a2a2a': 'var(--color-bg-elevated)',
  '#333': 'var(--color-bg-header)',
  '#333333': 'var(--color-bg-header)',
  '#444': 'var(--color-bg-input)',
  '#444444': 'var(--color-bg-input)',
  '#555': 'var(--color-bg-hover)',
  '#555555': 'var(--color-bg-hover)',
  '#666': 'var(--color-bg-active)',
  '#666666': 'var(--color-bg-active)',
  
  '#fff': 'var(--color-text-primary)',
  '#ffffff': 'var(--color-text-primary)',
  '#FFF': 'var(--color-text-primary)',
  '#FFFFFF': 'var(--color-text-primary)',
  'white': 'var(--color-text-primary)',
  
  '#ccc': 'var(--color-text-secondary)',
  '#cccccc': 'var(--color-text-secondary)',
  '#999': 'var(--color-text-muted)',
  '#999999': 'var(--color-text-muted)',
  '#666': 'var(--color-text-disabled)',
  '#666666': 'var(--color-text-disabled)',
  
  '#4CAF50': 'var(--color-success)',
  '#4caf50': 'var(--color-success)',
  '#f44336': 'var(--color-error)',
  '#F44336': 'var(--color-error)',
  '#ff9800': 'var(--color-warning)',
  '#FF9800': 'var(--color-warning)',
  '#2196f3': 'var(--color-info)',
  '#2196F3': 'var(--color-info)',
  
  '#ff6b6b': 'var(--color-schedule-conflict)',
  '#FF4444': 'var(--color-error)',
  '#ff4444': 'var(--color-error)',
};

// Find all Vue files
const vueFiles = glob.sync('src/**/*.vue');

let totalReplacements = 0;
const fileResults = [];

vueFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  const replacements = [];
  
  lines.forEach((line, index) => {
    // Skip if line already uses CSS variables
    if (line.includes('var(--color-')) return;
    
    // Check each color in our map
    Object.entries(colorMap).forEach(([color, variable]) => {
      if (line.includes(color)) {
        replacements.push({
          line: index + 1,
          original: line.trim(),
          color,
          variable,
          preview: line.replace(new RegExp(color, 'gi'), variable).trim()
        });
      }
    });
  });
  
  if (replacements.length > 0) {
    fileResults.push({
      file: file.replace('src/', ''),
      count: replacements.length,
      replacements
    });
    totalReplacements += replacements.length;
  }
});

// Output results
console.log(`\n🎨 Found ${totalReplacements} hardcoded colors in ${fileResults.length} files\n`);

fileResults
  .sort((a, b) => b.count - a.count)
  .forEach(({ file, count, replacements }) => {
    console.log(`\n📄 ${file} (${count} colors)`);
    console.log('─'.repeat(50));
    
    replacements.slice(0, 5).forEach(({ line, color, variable }) => {
      console.log(`  Line ${line}: ${color} → ${variable}`);
    });
    
    if (replacements.length > 5) {
      console.log(`  ... and ${replacements.length - 5} more`);
    }
  });

console.log(`\n✨ Run 'npm run theme:replace' to automatically replace all colors`);