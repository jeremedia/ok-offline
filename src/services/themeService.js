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
    description: 'RANGERS/STAFF: Max contrast professional theme for emergency use',
    // KHAKI THEME - RANGER & STAFF OPTIMIZED
    // ====================================
    // This theme is specifically designed for Black Rock Rangers, Medical, Law Enforcement, 
    // and event staff who need maximum readability in harsh desert conditions.
    //
    // DESIGN PRINCIPLES:
    // - Maximum contrast: Pure white backgrounds with black text (WCAG AAA)
    // - Emergency color coding: Red for critical, Orange for warnings, Blue for professional
    // - Large, clear UI elements for quick access under stress
    // - Familiar iOS-style colors for universal recognition
    // - High-visibility status indicators for dust levels and weather conditions
    //
    // TESTED FOR:
    // - Bright desert sunlight readability
    // - Emergency response scenarios
    // - Mobile use in field conditions
    // - Professional appearance for official use
    // - Clear hierarchy for quick information scanning
    colors: {
      // Primary Brand Colors - Emergency & Professional
      primary: '#007AFF',              // iOS Blue (familiar, professional)
      primaryDark: '#0051D5',          // Darker Blue for active states
      primaryDarker: '#003D99',        // Deep Blue
      accent: '#FF3B30',               // iOS Red (critical/emergency)
      accentDark: '#D70015',           // Darker Red
      
      // Background Colors - Clean Professional
      bgBase: '#FFFFFF',               // Pure white background
      bgElevated: '#F2F2F7',           // iOS system gray 6
      bgHeader: '#E5E5EA',             // iOS system gray 5
      bgInput: '#FFFFFF',              // White inputs with borders
      bgHover: '#D1D1D6',              // iOS system gray 4
      bgActive: '#C7C7CC',             // iOS system gray 3
      
      // Text Colors - Maximum readability
      textPrimary: '#000000',          // Pure black text
      textSecondary: '#333333',        // Dark gray
      textMuted: '#666666',            // Medium gray
      textDisabled: '#999999',         // Light gray
      textInverse: '#FFFFFF',          // White on dark
      
      // Border Colors - Clear definition
      borderLight: '#CCCCCC',          // Light gray borders
      borderMedium: '#999999',         // Medium gray borders
      borderHeavy: '#666666',          // Dark gray borders
      
      // Status Colors - Emergency Levels
      success: '#34C759',              // iOS Green (all clear)
      error: '#FF3B30',                // iOS Red (emergency)
      warning: '#FF9500',              // iOS Orange (caution)
      info: '#007AFF',                 // iOS Blue (information)
      
      // Weather & Dust Colors - Clear Status Levels
      dustClear: '#34C759',            // Green - Safe
      dustLight: '#FFCC00',            // Yellow - Caution
      dustModerate: '#FF9500',         // Orange - Warning
      dustHeavy: '#FF3B30',            // Red - Dangerous
      dustWhiteout: '#000000',         // Black - Emergency
      weatherCardBg: '#F2F2F7',        // Light gray
      weatherIcon: '#FF9500',          // Warning orange
      
      // Transparency Effects - Professional blues
      primaryAlpha20: 'rgba(0, 102, 204, 0.2)',
      successGlow: 'rgba(0, 170, 0, 0.5)',
      errorGlow: 'rgba(255, 0, 0, 0.5)',
      bgInputAlpha50: 'rgba(255, 255, 255, 0.5)',
      shadowLight: 'rgba(0, 0, 0, 0.1)',           // Standard shadows
      shadowMedium: 'rgba(0, 0, 0, 0.2)',
      overlayDark: 'rgba(0, 0, 0, 0.7)',           // Standard black overlays
      overlaySubtle: 'rgba(0, 0, 0, 0.1)',
      overlayLight: 'rgba(0, 0, 0, 0.2)',
      overlayMedium: 'rgba(0, 0, 0, 0.4)',
      whiteAlpha10: 'rgba(255, 255, 255, 0.9)',
      modalOverlay: 'rgba(0, 0, 0, 0.8)',          // High contrast modal
      
      // Map Marker Colors - Emergency Response Optimized
      successAlpha90: 'rgba(52, 199, 89, 0.95)',   // Camp markers - green
      purpleAlpha90: 'rgba(175, 82, 222, 0.95)',   // Art markers - purple
      warningAlpha90: 'rgba(255, 149, 0, 0.95)',   // Event markers - orange
      infoAlpha90: 'rgba(0, 122, 255, 0.95)',      // Info markers - blue
      primaryAlpha90: 'rgba(0, 122, 255, 0.95)',   // Primary markers - blue
      accentAlpha50: 'rgba(255, 59, 48, 0.5)',     // Red glow for portal markers
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
  
  // Map marker alpha colors (if defined in theme)
  if (colors.successAlpha90) {
    root.style.setProperty('--color-success-alpha-90', colors.successAlpha90);
  }
  if (colors.purpleAlpha90) {
    root.style.setProperty('--color-purple-alpha-90', colors.purpleAlpha90);
  }
  if (colors.warningAlpha90) {
    root.style.setProperty('--color-warning-alpha-90', colors.warningAlpha90);
  }
  if (colors.infoAlpha90) {
    root.style.setProperty('--color-info-alpha-90', colors.infoAlpha90);
  }
  if (colors.primaryAlpha90) {
    root.style.setProperty('--color-primary-alpha-90', colors.primaryAlpha90);
  }
  if (colors.accentAlpha50) {
    root.style.setProperty('--color-accent-alpha-50', colors.accentAlpha50);
  }
  
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