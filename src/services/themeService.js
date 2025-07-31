/**
 * Theme Service - Manages theme definitions and switching
 */

// Theme definitions with all CSS variable values
export const themes = {
  oknotok: {
    id: 'oknotok',
    name: 'OKNOTOK',
    description: 'Red, black, and gold - the original camp theme',
    colors: {
      // Primary Brand Colors
      primary: '#8B0000',              // OKNOTOK red
      primaryDark: '#680000',          // Darker red variant
      primaryDarker: '#5a0000',        // Even darker for deep shadows
      accent: '#FFD700',               // OKNOTOK gold
      accentDark: '#DAA520',           // Darker gold for hover
      
      // Background Colors - Dark Theme
      bgBase: '#1a1a1a',               // Main app background
      bgElevated: '#2a2a2a',           // Cards, elevated surfaces
      bgHeader: '#333',                // Headers, navigation
      bgInput: '#444',                 // Form inputs, selects
      bgHover: '#555',                 // Hover states
      bgActive: '#666',                // Active/selected states
      
      // Text Colors
      textPrimary: '#fff',             // Primary text, headings
      textSecondary: '#ccc',           // Body text
      textMuted: '#999',               // Muted, secondary info
      textDisabled: '#666',            // Disabled states
      textInverse: '#1a1a1a',          // Text on light backgrounds
      
      // Border Colors
      borderLight: '#333',             // Subtle borders
      borderMedium: '#444',            // Standard borders
      borderHeavy: '#555',             // Emphasized borders
      
      // Status Colors
      success: '#4CAF50',              // Success states
      error: '#f44336',                // Error states
      warning: '#ff9800',              // Warning states
      info: '#2196f3',                 // Info states
    }
  },
  
  sparkle: {
    id: 'sparkle',
    name: 'Sparkle Pony',
    description: 'Bright, magical, and fabulous',
    colors: {
      // Primary Brand Colors
      primary: '#FF1493',              // Deep Pink
      primaryDark: '#C71585',          // Medium Violet Red
      primaryDarker: '#8B0A50',        // Dark Magenta
      accent: '#00CED1',               // Dark Turquoise
      accentDark: '#008B8B',           // Dark Cyan
      
      // Background Colors - Dark Theme with Purple Tones
      bgBase: '#1a0a2e',               // Deep Purple Base
      bgElevated: '#2d1b69',           // Royal Purple
      bgHeader: '#3d2f7f',             // Lighter Purple
      bgInput: '#4c3f91',              // Lavender Purple
      bgHover: '#6b5b95',              // Medium Purple
      bgActive: '#8b7bae',             // Light Purple
      
      // Text Colors
      textPrimary: '#fff',             // Keep white for contrast
      textSecondary: '#e6d3ff',        // Light purple tint
      textMuted: '#b794f6',            // Muted purple
      textDisabled: '#9475cd',         // Disabled purple
      textInverse: '#1a0a2e',          // Dark purple
      
      // Border Colors
      borderLight: '#4a3c8c',          // Purple borders
      borderMedium: '#6b5b95',
      borderHeavy: '#8b7bae',
      
      // Status Colors - Keep recognizable
      success: '#4CAF50',
      error: '#ff6b6b',
      warning: '#ffd93d',
      info: '#6bcf7f',
    }
  },
  
  khaki: {
    id: 'khaki',
    name: 'Khaki',
    description: 'Desert-appropriate earth tones',
    colors: {
      // Primary Brand Colors
      primary: '#8B7355',              // Tan/Khaki
      primaryDark: '#5D4E37',          // Coffee Brown
      primaryDarker: '#3E2723',        // Dark Brown
      accent: '#DAA520',               // Goldenrod
      accentDark: '#B8860B',           // Dark Goldenrod
      
      // Background Colors - Light Desert Theme
      bgBase: '#f5f5dc',               // Beige
      bgElevated: '#fff8dc',           // Cornsilk
      bgHeader: '#deb887',             // Burlywood
      bgInput: '#d2b48c',              // Tan
      bgHover: '#cd853f',              // Peru
      bgActive: '#a0522d',             // Sienna
      
      // Text Colors - Dark for Light Backgrounds
      textPrimary: '#3E2723',          // Dark Brown
      textSecondary: '#5D4E37',        // Coffee Brown
      textMuted: '#8B7355',            // Tan
      textDisabled: '#a0826d',         // Light Brown
      textInverse: '#fff8dc',          // Cornsilk
      
      // Border Colors
      borderLight: '#d2b48c',          // Tan borders
      borderMedium: '#cd853f',         // Peru
      borderHeavy: '#a0522d',          // Sienna
      
      // Status Colors - Earth tones
      success: '#228B22',              // Forest Green
      error: '#B22222',                // Firebrick
      warning: '#FF8C00',              // Dark Orange
      info: '#4682B4',                 // Steel Blue
    }
  },
  
  mush: {
    id: 'mush',
    name: 'Mush Love',
    description: 'Psychedelic and groovy',
    colors: {
      // Primary Brand Colors
      primary: '#8B008B',              // Dark Magenta
      primaryDark: '#4B0082',          // Indigo
      primaryDarker: '#310062',        // Deep Purple
      accent: '#00FF00',               // Lime Green
      accentDark: '#32CD32',           // Lime Green Dark
      
      // Background Colors - Psychedelic Dark
      bgBase: '#0a0a0a',               // Near black
      bgElevated: '#1a0033',           // Dark Purple
      bgHeader: '#2d0052',             // Medium Purple
      bgInput: '#400070',              // Bright Purple
      bgHover: '#52008f',              // Electric Purple
      bgActive: '#6400ad',             // Neon Purple
      
      // Text Colors
      textPrimary: '#fff',             // White
      textSecondary: '#e0ffe0',        // Light green tint
      textMuted: '#b8b8ff',            // Light purple
      textDisabled: '#8888cc',         // Muted purple
      textInverse: '#0a0a0a',          // Black
      
      // Border Colors - Neon
      borderLight: '#7700ff',          // Electric Purple
      borderMedium: '#00ff77',         // Neon Green
      borderHeavy: '#ff00ff',          // Magenta
      
      // Status Colors - Psychedelic
      success: '#00ff00',              // Lime
      error: '#ff00ff',                // Magenta
      warning: '#ffff00',              // Yellow
      info: '#00ffff',                 // Cyan
    }
  }
};

/**
 * Apply a theme by updating CSS variables
 * @param {string} themeName - The theme ID to apply
 */
export function applyTheme(themeName) {
  const theme = themes[themeName];
  if (!theme) {
    console.error(`Theme "${themeName}" not found`);
    return;
  }
  
  const root = document.documentElement;
  const colors = theme.colors;
  
  // Primary Brand Colors
  root.style.setProperty('--color-primary', colors.primary);
  root.style.setProperty('--color-primary-dark', colors.primaryDark);
  root.style.setProperty('--color-primary-darker', colors.primaryDarker);
  root.style.setProperty('--color-accent', colors.accent);
  root.style.setProperty('--color-accent-dark', colors.accentDark);
  
  // Background Colors
  root.style.setProperty('--color-bg-base', colors.bgBase);
  root.style.setProperty('--color-bg-elevated', colors.bgElevated);
  root.style.setProperty('--color-bg-header', colors.bgHeader);
  root.style.setProperty('--color-bg-input', colors.bgInput);
  root.style.setProperty('--color-bg-hover', colors.bgHover);
  root.style.setProperty('--color-bg-active', colors.bgActive);
  
  // Text Colors
  root.style.setProperty('--color-text-primary', colors.textPrimary);
  root.style.setProperty('--color-text-secondary', colors.textSecondary);
  root.style.setProperty('--color-text-muted', colors.textMuted);
  root.style.setProperty('--color-text-disabled', colors.textDisabled);
  root.style.setProperty('--color-text-inverse', colors.textInverse);
  
  // Border Colors
  root.style.setProperty('--color-border-light', colors.borderLight);
  root.style.setProperty('--color-border-medium', colors.borderMedium);
  root.style.setProperty('--color-border-heavy', colors.borderHeavy);
  root.style.setProperty('--color-border-focus', colors.primary);
  
  // Status Colors
  root.style.setProperty('--color-success', colors.success);
  root.style.setProperty('--color-error', colors.error);
  root.style.setProperty('--color-warning', colors.warning);
  root.style.setProperty('--color-info', colors.info);
  
  // Interactive States
  root.style.setProperty('--color-link', colors.accent);
  root.style.setProperty('--color-link-hover', colors.textPrimary);
  root.style.setProperty('--color-focus-ring', colors.primary);
  root.style.setProperty('--color-selection-bg', colors.primary);
  root.style.setProperty('--color-selection-text', colors.textPrimary);
  
  // Component-Specific Colors
  root.style.setProperty('--color-nav-bg', colors.bgHeader);
  root.style.setProperty('--color-nav-hover', colors.primary);
  root.style.setProperty('--color-card-bg', colors.bgElevated);
  root.style.setProperty('--color-modal-overlay', 'rgba(0, 0, 0, 0.7)');
  
  // Map Colors
  root.style.setProperty('--color-map-control-bg', colors.bgElevated);
  root.style.setProperty('--color-map-control-border', colors.borderMedium);
  root.style.setProperty('--color-map-marker-camp', colors.primary);
  root.style.setProperty('--color-map-marker-art', colors.accent);
  root.style.setProperty('--color-map-marker-event', colors.error);
  
  // Schedule Colors
  root.style.setProperty('--color-schedule-conflict', colors.error);
  root.style.setProperty('--color-schedule-grid', colors.borderLight);
  
  // Special Effects
  root.style.setProperty('--color-glow', colors.accent);
  root.style.setProperty('--color-shadow', 'rgba(0, 0, 0, 0.5)');
  
  // Legacy support
  root.style.setProperty('--color-gold', colors.accent);
  root.style.setProperty('--color-dark-red', colors.primaryDark);
  root.style.setProperty('--color-dark-red-original', colors.primary);
  
  // Save preference
  localStorage.setItem('selectedTheme', themeName);
  
  // Dispatch event for other components to react
  window.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme: themeName } }));
}

/**
 * Get the current theme
 * @returns {string} The current theme ID
 */
export function getCurrentTheme() {
  return localStorage.getItem('selectedTheme') || 'oknotok';
}

/**
 * Get all available themes
 * @returns {Object} All theme definitions
 */
export function getAvailableThemes() {
  return themes;
}

/**
 * Initialize theme on app load
 */
export function initializeTheme() {
  const savedTheme = getCurrentTheme();
  applyTheme(savedTheme);
}