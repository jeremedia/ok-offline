#!/usr/bin/env node

// This script adds transparency effects to all themes based on their primary colors

const transparencyConfig = {
  sparkle: {
    primaryAlpha20: 'rgba(255, 20, 147, 0.2)',      // Deep Pink with transparency
    successGlow: 'rgba(76, 175, 80, 0.5)',
    errorGlow: 'rgba(255, 107, 107, 0.5)', 
    bgInputAlpha50: 'rgba(77, 63, 145, 0.5)',      // Purple tone
    shadowLight: 'rgba(0, 0, 0, 0.2)',
    shadowMedium: 'rgba(0, 0, 0, 0.3)',
    overlayDark: 'rgba(0, 0, 0, 0.5)',
    whiteAlpha10: 'rgba(255, 255, 255, 0.1)',
    modalOverlay: 'rgba(0, 0, 0, 0.7)',
  },
  khaki: {
    primaryAlpha20: 'rgba(139, 115, 85, 0.2)',      // Tan/Khaki with transparency
    successGlow: 'rgba(34, 139, 34, 0.5)',          // Forest Green
    errorGlow: 'rgba(178, 34, 34, 0.5)',            // Firebrick
    bgInputAlpha50: 'rgba(210, 180, 140, 0.5)',    // Tan
    shadowLight: 'rgba(0, 0, 0, 0.2)',
    shadowMedium: 'rgba(0, 0, 0, 0.3)',
    overlayDark: 'rgba(0, 0, 0, 0.5)',
    whiteAlpha10: 'rgba(62, 39, 35, 0.1)',         // Dark brown for light theme
    modalOverlay: 'rgba(0, 0, 0, 0.7)',
  },
  mush: {
    primaryAlpha20: 'rgba(139, 0, 139, 0.2)',       // Dark Magenta with transparency
    successGlow: 'rgba(0, 255, 0, 0.5)',            // Lime
    errorGlow: 'rgba(255, 0, 255, 0.5)',            // Magenta
    bgInputAlpha50: 'rgba(64, 0, 112, 0.5)',       // Bright Purple
    shadowLight: 'rgba(0, 0, 0, 0.2)',
    shadowMedium: 'rgba(0, 0, 0, 0.3)',
    overlayDark: 'rgba(0, 0, 0, 0.5)',
    whiteAlpha10: 'rgba(255, 255, 255, 0.1)',
    modalOverlay: 'rgba(0, 0, 0, 0.7)',
  }
};

console.log('Add these transparency effects to each theme in themeService.js:');
console.log('\n');

Object.entries(transparencyConfig).forEach(([theme, colors]) => {
  console.log(`${theme} theme:`);
  console.log('      // Transparency Effects');
  Object.entries(colors).forEach(([key, value]) => {
    console.log(`      ${key}: '${value}',`);
  });
  console.log('\n');
});