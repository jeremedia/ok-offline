/**
 * Theme Service - Manages theme definitions and switching
 * 
 * THEME PHILOSOPHY:
 * - OKNOTOK (Dark): Original camp theme - red, black, gold
 * - Sparkle Pony (Light): "Barbie" theme - bright, magical, fabulous with light backgrounds  
 * - Khaki (Light): Desert earth tones - practical and sun-readable
 * - Mush Love (Dark): Psychedelic and groovy - but toned down for usability
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
      textInverse: '#fff',             // Text on colored backgrounds (same as textPrimary for dark theme)
      
      // Border Colors
      borderLight: '#333',             // Subtle borders
      borderMedium: '#444',            // Standard borders
      borderHeavy: '#555',             // Emphasized borders
      
      // Status Colors
      success: '#4CAF50',              // Success states
      error: '#f44336',                // Error states
      warning: '#ff9800',              // Warning states
      info: '#2196f3',                 // Info states
      
      // Weather & Dust Colors
      dustClear: '#4CAF50',
      dustLight: '#FFC107',
      dustModerate: '#FF9800',
      dustHeavy: '#FF5722',
      dustWhiteout: '#F44336',
      weatherCardBg: '#2a2a2a',
      weatherIcon: '#FFD700',
      
      // Transparency Effects
      primaryAlpha20: 'rgba(139, 0, 0, 0.2)',
      successGlow: 'rgba(76, 175, 80, 0.5)',
      errorGlow: 'rgba(244, 67, 54, 0.5)',
      bgInputAlpha50: 'rgba(68, 68, 68, 0.5)',
      shadowLight: 'rgba(0, 0, 0, 0.2)',
      shadowMedium: 'rgba(0, 0, 0, 0.3)',
      overlayDark: 'rgba(0, 0, 0, 0.5)',
      overlaySubtle: 'rgba(0, 0, 0, 0.3)',       // Dark theme - black overlays work
      overlayLight: 'rgba(0, 0, 0, 0.2)',        // Light black overlay
      overlayMedium: 'rgba(0, 0, 0, 0.4)',       // Medium black overlay
      whiteAlpha10: 'rgba(255, 255, 255, 0.1)',
      modalOverlay: 'rgba(0, 0, 0, 0.7)',
    }
  },
  
  sparkle: {
    id: 'sparkle',
    name: 'Sparkle Pony',
    description: 'Bright, magical, and fabulous - Barbie vibes!',
    colors: {
      // Primary Brand Colors
      primary: '#FF1493',              // Deep Pink (Barbie Pink)
      primaryDark: '#E91E63',          // Bright Pink
      primaryDarker: '#C2185B',        // Rich Pink
      accent: '#FF00FF',               // Electric Magenta (maximum electric pop!)
      accentDark: '#E91E63',           // Hot Pink Dark
      
      // Background Colors - LIGHT Theme (Barbie Colors)
      bgBase: '#FFF0F5',               // Lavender Blush (very light pink)
      bgElevated: '#FFFFFF',           // Pure White
      bgHeader: '#FFB6C1',             // Light Pink
      bgInput: '#FFFFFF',              // White inputs
      bgHover: '#FFE4E1',              // Misty Rose (light pink hover)
      bgActive: '#FFC0CB',             // Pink (active state)
      
      // Text Colors - DARK for light backgrounds
      textPrimary: '#2D1B69',          // Deep Purple (excellent contrast)
      textSecondary: '#4A4A4A',        // Dark Gray
      textMuted: '#777777',            // Medium Gray
      textDisabled: '#BBBBBB',         // Light Gray
      textInverse: '#FFFFFF',          // White (for dark elements)
      
      // Border Colors - Soft but visible
      borderLight: '#FFE4E6',          // Very light pink
      borderMedium: '#FFCDD2',         // Light pink
      borderHeavy: '#F8BBD9',          // Medium pink
      
      // Status Colors - Bright but readable
      success: '#4CAF50',              // Keep green recognizable
      error: '#E91E63',                // Use primary pink for errors (fun!)
      warning: '#FF9800',              // Orange (good contrast)
      info: '#FF00FF',                 // Electric Magenta (matches new accent)
      
      // Weather & Dust Colors - Bright variants
      dustClear: '#4CAF50',
      dustLight: '#FFD54F',
      dustModerate: '#FF8A65',
      dustHeavy: '#E91E63',
      dustWhiteout: '#C2185B',
      weatherCardBg: '#FFFFFF',
      weatherIcon: '#FF00FF',
      
      // Transparency Effects - Adjusted for light theme
      primaryAlpha20: 'rgba(255, 20, 147, 0.2)',
      successGlow: 'rgba(76, 175, 80, 0.5)',
      errorGlow: 'rgba(233, 30, 99, 0.5)',
      bgInputAlpha50: 'rgba(255, 255, 255, 0.5)',
      shadowLight: 'rgba(45, 27, 105, 0.1)',     // Purple shadow for light theme
      shadowMedium: 'rgba(45, 27, 105, 0.2)',   // Purple shadow for light theme
      overlayDark: 'rgba(45, 27, 105, 0.5)',    // Purple overlay instead of black
      overlaySubtle: 'rgba(45, 27, 105, 0.1)',  // Very subtle purple overlay for light theme
      overlayLight: 'rgba(45, 27, 105, 0.15)',  // Light purple overlay 
      overlayMedium: 'rgba(45, 27, 105, 0.3)',  // Medium purple overlay
      whiteAlpha10: 'rgba(255, 255, 255, 0.9)',  // More opaque for light theme
      modalOverlay: 'rgba(45, 27, 105, 0.7)',   // Purple modal overlay
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
      
      // Weather & Dust Colors
      dustClear: '#228B22',
      dustLight: '#DAA520',
      dustModerate: '#D2691E',
      dustHeavy: '#A0522D',
      dustWhiteout: '#8B4513',
      weatherCardBg: '#fff8dc',
      weatherIcon: '#DAA520',
      
      // Transparency Effects - Light theme needs darker overlays for contrast
      primaryAlpha20: 'rgba(139, 115, 85, 0.2)',
      successGlow: 'rgba(34, 139, 34, 0.5)',
      errorGlow: 'rgba(178, 34, 34, 0.5)',
      bgInputAlpha50: 'rgba(210, 180, 140, 0.5)',
      shadowLight: 'rgba(62, 39, 35, 0.1)',         // Brown shadow for light theme
      shadowMedium: 'rgba(62, 39, 35, 0.2)',       // Brown shadow for light theme
      overlayDark: 'rgba(62, 39, 35, 0.5)',        // Brown overlay instead of black
      overlaySubtle: 'rgba(62, 39, 35, 0.1)',      // Very subtle brown overlay for light theme
      overlayLight: 'rgba(62, 39, 35, 0.15)',      // Light brown overlay
      overlayMedium: 'rgba(62, 39, 35, 0.3)',      // Medium brown overlay
      whiteAlpha10: 'rgba(255, 255, 255, 0.9)',    // More opaque for light theme
      modalOverlay: 'rgba(62, 39, 35, 0.7)',       // Brown modal overlay
    }
  },
  
  mush: {
    id: 'mush',
    name: 'Mush Love',
    description: 'Psychedelic and groovy - but readable!',
    colors: {
      // Primary Brand Colors
      primary: '#8B008B',              // Dark Magenta
      primaryDark: '#4B0082',          // Indigo
      primaryDarker: '#310062',        // Deep Purple
      accent: '#39FF14',               // Electric Lime (toned down from pure #00FF00)
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
      textInverse: '#39FF14',          // Electric Lime (matches accent for psychedelic pop!)
      
      // Border Colors - Toned down but still psychedelic
      borderLight: '#6A0DAD',          // Purple (toned down from electric)
      borderMedium: '#32CD32',         // Lime Green (readable)
      borderHeavy: '#DA70D6',          // Orchid (softer than pure magenta)
      
      // Status Colors - Psychedelic but usable
      success: '#39FF14',              // Electric Lime (same as accent)
      error: '#FF1493',                // Deep Pink (readable)
      warning: '#FFD700',              // Gold (much more readable than pure yellow)
      info: '#00CED1',                 // Dark Turquoise (readable)
      
      // Weather & Dust Colors - Toned down
      dustClear: '#39FF14',
      dustLight: '#FFD700',
      dustModerate: '#FF8C00',
      dustHeavy: '#FF1493',
      dustWhiteout: '#8B008B',
      weatherCardBg: '#1a0033',
      weatherIcon: '#39FF14',
      
      // Transparency Effects - Dark theme with black overlays
      primaryAlpha20: 'rgba(139, 0, 139, 0.2)',
      successGlow: 'rgba(57, 255, 20, 0.5)',      // Updated for new green
      errorGlow: 'rgba(255, 20, 147, 0.5)',       // Updated for new error color
      bgInputAlpha50: 'rgba(64, 0, 112, 0.5)',
      shadowLight: 'rgba(0, 0, 0, 0.2)',
      shadowMedium: 'rgba(0, 0, 0, 0.3)',
      overlayDark: 'rgba(0, 0, 0, 0.5)',          // Dark theme - black overlays work
      overlaySubtle: 'rgba(0, 0, 0, 0.3)',        // Black overlay
      overlayLight: 'rgba(0, 0, 0, 0.2)',         // Light black overlay
      overlayMedium: 'rgba(0, 0, 0, 0.4)',        // Medium black overlay
      whiteAlpha10: 'rgba(255, 255, 255, 0.1)',
      modalOverlay: 'rgba(0, 0, 0, 0.7)',
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
  
  // Background Aliases (CRITICAL - these were missing!)
  root.style.setProperty('--color-background-secondary', colors.bgBase);  // Alias for bg-base
  root.style.setProperty('--color-background-tertiary', colors.bgElevated);  // Alias for bg-elevated  
  root.style.setProperty('--color-background-form-focus', colors.bgHover);  // Form focus state
  
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
  
  // Border Aliases (CRITICAL - these were missing!)
  root.style.setProperty('--color-border', colors.borderMedium);  // Main border alias
  root.style.setProperty('--color-border-dark', colors.borderLight);  // Alias for subtle
  root.style.setProperty('--color-border-secondary', colors.borderHeavy);  // Alias for emphasized
  root.style.setProperty('--color-border-subtle', colors.borderLight);  // Alias for subtle
  
  // Status Colors
  root.style.setProperty('--color-success', colors.success);
  root.style.setProperty('--color-error', colors.error);
  root.style.setProperty('--color-warning', colors.warning);
  root.style.setProperty('--color-info', colors.info);
  root.style.setProperty('--color-danger', colors.error);  // Alias for error
  
  // Additional important aliases
  root.style.setProperty('--color-text', colors.textPrimary);  // Text alias
  root.style.setProperty('--color-purple', colors.primary);  // Purple fallback
  
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
  
  // Weather & Dust Colors
  root.style.setProperty('--color-dust-clear', colors.dustClear);
  root.style.setProperty('--color-dust-light', colors.dustLight);
  root.style.setProperty('--color-dust-moderate', colors.dustModerate);
  root.style.setProperty('--color-dust-heavy', colors.dustHeavy);
  root.style.setProperty('--color-dust-whiteout', colors.dustWhiteout);
  root.style.setProperty('--color-weather-card-bg', colors.weatherCardBg);
  root.style.setProperty('--color-weather-icon', colors.weatherIcon);
  
  // Transparency Effects
  root.style.setProperty('--color-primary-alpha-20', colors.primaryAlpha20);
  root.style.setProperty('--color-success-glow', colors.successGlow);
  root.style.setProperty('--color-error-glow', colors.errorGlow);
  root.style.setProperty('--color-bg-input-alpha-50', colors.bgInputAlpha50);
  root.style.setProperty('--color-shadow-light', colors.shadowLight);
  root.style.setProperty('--color-shadow-medium', colors.shadowMedium);
  root.style.setProperty('--color-overlay-dark', colors.overlayDark);
  root.style.setProperty('--color-white-alpha-10', colors.whiteAlpha10);
  root.style.setProperty('--color-modal-overlay', colors.modalOverlay);
  
  // Overlay Colors (CRITICAL - these were missing!)
  root.style.setProperty('--color-overlay-subtle', colors.overlaySubtle);
  root.style.setProperty('--color-overlay-light', colors.overlayLight);
  root.style.setProperty('--color-overlay-medium', colors.overlayMedium);

  // Additional transparency variants (CRITICAL - these were missing!)
  root.style.setProperty('--color-background-secondary-alpha-90', `${colors.bgBase}e6`);  // 90% opacity
  root.style.setProperty('--color-background-secondary-alpha-95', `${colors.bgBase}f2`);  // 95% opacity
  root.style.setProperty('--color-primary-alpha-10', colors.primaryAlpha20.replace('0.2', '0.1'));
  root.style.setProperty('--color-primary-alpha-30', colors.primaryAlpha20.replace('0.2', '0.3'));
  root.style.setProperty('--color-accent-alpha-10', colors.successGlow.replace(colors.success, colors.accent).replace('0.5', '0.1'));
  root.style.setProperty('--color-accent-alpha-80', colors.successGlow.replace(colors.success, colors.accent).replace('0.5', '0.8'));
  
  // Background aliases for transparency
  root.style.setProperty('--color-primary-bg', colors.primaryAlpha20.replace('0.2', '0.1'));
  root.style.setProperty('--color-success-bg', colors.successGlow.replace('0.5', '0.1'));
  root.style.setProperty('--color-error-bg', colors.errorGlow.replace('0.5', '0.1'));
  root.style.setProperty('--color-warning-bg', colors.errorGlow.replace(colors.error, colors.warning).replace('0.5', '0.1'));
  
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