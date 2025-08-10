/**
 * Theme Service - Manages theme definitions and switching
 * 
 * THEME PHILOSOPHY:
 * - OKNOTOK (Dark): Original camp theme - red, black, gold
 * - Sparkle Pony (Light): "Barbie" theme - bright, magical, fabulous with light backgrounds  
 * - Khaki (Light): Desert earth tones - practical and sun-readable
 * - Mush Love (Dark): Psychedelic and groovy - but toned down for usability
 * - Additional themes can be added to themes.json
 */

// Theme storage - will be populated from JSON
export let themes = {};

// Default theme data (fallback if JSON fails to load)
// Available fonts for the typography system
export const availableFonts = {
  'berkeley-mono': { 
    name: 'Berkeley Mono', 
    type: 'monospace', 
    bundled: true,
    fallback: 'monospace',
    description: 'Current default - Clean monospace for technical precision'
  },
  'system-ui': { 
    name: 'System UI', 
    type: 'sans-serif', 
    system: true,
    fallback: 'system-ui, -apple-system, sans-serif',
    description: 'Native system font - Fast and familiar'
  },
  'inter': { 
    name: 'Inter', 
    type: 'sans-serif', 
    googleFont: 'Inter:wght@400;500;700',
    fallback: 'system-ui, sans-serif',
    description: 'Modern sans-serif optimized for screens'
  },
  'work-sans': { 
    name: 'Work Sans', 
    type: 'sans-serif', 
    googleFont: 'Work+Sans:wght@400;500;700',
    fallback: 'system-ui, sans-serif',
    description: 'Friendly and readable - great for long content'
  }
}

// Display fonts for headers (optional)
export const displayFonts = {
  'none': { name: 'Same as base', description: 'Use base font for everything' },
  'bebas-neue': { 
    name: 'Bebas Neue', 
    type: 'display', 
    googleFont: 'Bebas+Neue',
    fallback: 'system-ui, sans-serif',
    description: 'Bold condensed - perfect for impactful headers'
  },
  'oswald': { 
    name: 'Oswald', 
    type: 'display', 
    googleFont: 'Oswald:wght@400;500;700',
    fallback: 'system-ui, sans-serif',
    description: 'Strong and modern display font'
  }
}

const defaultThemes = {
  oknotok: {
    id: 'oknotok',
    name: 'OKNOTOK',
    description: 'Red, black, and gold - the original camp theme',
    typography: {
      fontFamily: 'berkeley-mono',
      fontFamilyDisplay: 'none',
      baseFontSize: '16',
      baseLineHeight: '1.5',
      letterSpacing: '0',
      headingScale: '1.25',
      // Font size multipliers for computed sizes
      fontSizeMultipliers: {
        sm: '0.875',      // Small text (14px at 16px base)
        lg: '1.125',      // Large text (18px at 16px base)
        xl: '1.25',       // Extra large (20px at 16px base)
        '2xl': '1.5'      // 2x large (24px at 16px base)
      },
      fontWeight: {
        normal: '400',
        medium: '500',
        bold: '700'
      }
    },
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
      
      // Interactive Colors
      hoverBg: '#555',                 // Hover background for interactive elements
      
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
    typography: {
      fontFamily: 'work-sans',
      fontFamilyDisplay: 'none',
      baseFontSize: '16',
      baseLineHeight: '1.6',
      letterSpacing: '0.01em',
      headingScale: '1.35',
      // Font size multipliers for computed sizes - Work Sans optimized
      fontSizeMultipliers: {
        sm: '0.85',       // Small text - slightly larger for Work Sans readability
        lg: '1.15',       // Large text - slightly smaller for Work Sans
        xl: '1.3',        // Extra large - matches heading scale
        '2xl': '1.55'     // 2x large - slightly more dramatic
      },
      fontWeight: {
        normal: '400',
        medium: '500',
        bold: '700'
      }
    },
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
      
      // Interactive Colors  
      hoverBg: '#F8BBD9',              // Hover background for interactive elements
      
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
    typography: {
      fontFamily: 'system-ui',
      fontFamilyDisplay: 'none',
      baseFontSize: '16',
      baseLineHeight: '1.4',
      letterSpacing: '0',
      headingScale: '1.2',
      // Font size multipliers for computed sizes - System UI optimized for emergency readability
      fontSizeMultipliers: {
        sm: '0.9',        // Small text - larger for emergency readability
        lg: '1.1',        // Large text - conservative scaling
        xl: '1.2',        // Extra large - matches heading scale
        '2xl': '1.4'      // 2x large - professional, not dramatic
      },
      fontWeight: {
        normal: '400',
        medium: '500',
        bold: '700'
      }
    },
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
      
      // Interactive Colors
      hoverBg: '#666666',              // Hover background for interactive elements
      
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
    typography: {
      fontFamily: 'inter',
      fontFamilyDisplay: 'oswald',
      baseFontSize: '16',
      baseLineHeight: '1.6',
      letterSpacing: '0.02em',
      headingScale: '1.4',
      // Font size multipliers for computed sizes - Inter + Oswald psychedelic scaling
      fontSizeMultipliers: {
        sm: '0.88',       // Small text - Inter needs slightly larger small text
        lg: '1.12',       // Large text - balanced scaling
        xl: '1.4',        // Extra large - matches dramatic heading scale
        '2xl': '1.75'     // 2x large - psychedelic dramatic scaling
      },
      fontWeight: {
        normal: '400',
        medium: '500',
        bold: '700'
      }
    },
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
      
      // Interactive Colors
      hoverBg: '#DA70D6',              // Hover background for interactive elements
      
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

// Cache management for themes
const CACHE_KEY = 'themes_data'
const CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 hours

/**
 * Load themes from API with fallback to cache, then static file
 * Priority: Server → Cache → Static File
 * This ensures theme editor changes are immediately visible on refresh
 * @returns {Promise<Object>} Theme definitions
 */
export async function loadThemes() {
  // Check in-memory cache first (but only for subsequent calls, not page refresh)
  if (Object.keys(themes).length > 0) {
    return themes
  }
  
  // ALWAYS try server first to get latest theme changes
  try {
    console.log('Checking server for latest themes...')
    const response = await fetch('/api/v1/themes')
    
    if (response.ok) {
      const data = await response.json()
      // Cache the fresh server data
      setCachedThemes(data)
      themes = data.themes || {}
      console.log(`✅ Loaded ${Object.keys(themes).length} themes from server (latest)`)
      return themes
    } else {
      console.warn(`Server returned ${response.status}, falling back to cache`)
    }
  } catch (error) {
    console.warn('Server unavailable, falling back to cache:', error.message)
  }
  
  // Server failed - try cache as fallback
  const cached = getCachedThemes()
  if (cached) {
    themes = cached.data.themes || {}
    const cacheAge = Math.round((Date.now() - cached.timestamp) / (1000 * 60))
    console.log(`📦 Using cached themes (${cacheAge} minutes old) - ${Object.keys(themes).length} themes`)
    return themes
  }
  
  try {
    // Fallback to static JSON if API fails
    console.log('Using static themes data')
    const response = await fetch('/data/themes.json')
    const data = await response.json()
    themes = data.themes || defaultThemes
    console.log(`Loaded ${Object.keys(themes).length} themes from static file`)
    return themes
  } catch (error) {
    // Final fallback to hardcoded defaults
    console.error('Failed to load themes from any source, using defaults:', error)
    themes = defaultThemes
    return themes
  }
}

// Cache helper functions
function getCachedThemes() {
  try {
    const cached = localStorage.getItem(CACHE_KEY)
    return cached ? JSON.parse(cached) : null
  } catch {
    return null
  }
}

function setCachedThemes(data) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      data,
      timestamp: Date.now()
    }))
  } catch (error) {
    console.warn('Failed to cache themes data:', error)
  }
}

function isThemeCacheExpired(cached) {
  return Date.now() - cached.timestamp > CACHE_DURATION
}

/**
 * Clear themes cache
 */
export function clearThemesCache() {
  themes = {}
  localStorage.removeItem(CACHE_KEY)
}

/**
 * Force refresh themes from server (bypasses cache)
 * Useful after saving theme changes in the theme editor
 */
export async function refreshThemesFromServer() {
  console.log('🔄 Force refreshing themes from server...')
  
  // Clear in-memory cache to force fresh fetch
  themes = {}
  
  try {
    const response = await fetch('/api/v1/themes')
    
    if (response.ok) {
      const data = await response.json()
      setCachedThemes(data)
      themes = data.themes || {}
      console.log(`✅ Refreshed ${Object.keys(themes).length} themes from server`)
      return themes
    } else {
      throw new Error(`Server returned ${response.status}`)
    }
  } catch (error) {
    console.error('Failed to refresh themes from server:', error)
    throw error
  }
}

/**
 * Apply a theme by updating CSS variables
 * @param {string} themeName - The theme ID to apply
 */
export function applyTheme(themeName) {
  // If themes haven't loaded yet, try defaults
  const availableThemes = Object.keys(themes).length > 0 ? themes : defaultThemes;
  const theme = availableThemes[themeName];
  if (!theme) {
    console.error(`Theme "${themeName}" not found`);
    return;
  }
  
  const root = document.documentElement;
  const colors = theme.colors;
  
  // ========================================
  // BRAND COLORS - Core theme identity
  // ========================================
  
  // PRIMARY: Main brand color - USE FOR: button backgrounds, active states, primary actions
  root.style.setProperty('--color-primary', colors.primary);
  root.style.setProperty('--color-primary-dark', colors.primaryDark);    // Hover states, darker variants
  root.style.setProperty('--color-primary-darker', colors.primaryDarker); // Deep shadows, darkest variant
  
  // ACCENT: Highlight color - USE FOR: text highlights, icons, borders ONLY (never backgrounds)
  root.style.setProperty('--color-accent', colors.accent);
  root.style.setProperty('--color-accent-dark', colors.accentDark);      // Darker accent for text contrast
  
  // ========================================
  // SURFACE COLORS - App structure layers  
  // ========================================
  
  // Background hierarchy (light to dark for dark themes, dark to light for light themes)
  root.style.setProperty('--color-bg-base', colors.bgBase);             // Main app background
  root.style.setProperty('--color-bg-elevated', colors.bgElevated);     // Cards, modals, elevated surfaces
  root.style.setProperty('--color-bg-header', colors.bgHeader);         // Navigation, headers
  root.style.setProperty('--color-bg-input', colors.bgInput);           // Form inputs, text fields
  root.style.setProperty('--color-bg-hover', colors.bgHover);           // Hover states for surfaces
  root.style.setProperty('--color-bg-active', colors.bgActive);         // Active/selected states
  
  // Background Aliases (CRITICAL - these were missing!)
  root.style.setProperty('--color-background-secondary', colors.bgBase);  // Alias for bg-base
  root.style.setProperty('--color-background-tertiary', colors.bgElevated);  // Alias for bg-elevated  
  root.style.setProperty('--color-background-form-focus', colors.bgHover);  // Form focus state
  
  // ========================================
  // TEXT COLORS - Content readability hierarchy
  // ========================================
  
  // Text hierarchy (high to low contrast)
  root.style.setProperty('--color-text-primary', colors.textPrimary);     // Main headings, important text
  root.style.setProperty('--color-text-secondary', colors.textSecondary); // Body text, secondary content
  root.style.setProperty('--color-text-muted', colors.textMuted);         // Helper text, less important info
  root.style.setProperty('--color-text-disabled', colors.textDisabled);   // Disabled form elements, inactive text
  root.style.setProperty('--color-text-inverse', colors.textInverse);     // Text on colored backgrounds
  
  // ========================================
  // BORDER COLORS - Visual separation system
  // ========================================
  
  // Border hierarchy (subtle to emphasized)
  root.style.setProperty('--color-border-light', colors.borderLight);     // Subtle divisions, grid lines
  root.style.setProperty('--color-border-medium', colors.borderMedium);   // Standard borders, cards
  root.style.setProperty('--color-border-heavy', colors.borderHeavy);     // Emphasized borders, sections
  root.style.setProperty('--color-border-focus', colors.primary);         // Focus rings, active borders
  
  // Border Aliases (CRITICAL - these were missing!)
  root.style.setProperty('--color-border', colors.borderMedium);  // Main border alias
  root.style.setProperty('--color-border-dark', colors.borderLight);  // Alias for subtle
  root.style.setProperty('--color-border-secondary', colors.borderHeavy);  // Alias for emphasized
  root.style.setProperty('--color-border-subtle', colors.borderLight);  // Alias for subtle
  
  // ========================================
  // STATUS COLORS - Semantic feedback system
  // ========================================
  
  // Status colors for user feedback (use consistently across themes)
  root.style.setProperty('--color-success', colors.success);             // Positive actions, completion states
  root.style.setProperty('--color-error', colors.error);                 // Errors, destructive actions, validation failures
  root.style.setProperty('--color-warning', colors.warning);             // Cautions, important notices, attention needed
  root.style.setProperty('--color-info', colors.info);                   // Information, helpful tips, neutral feedback
  root.style.setProperty('--color-danger', colors.error);                // Alias for error (legacy support)
  
  // Additional important aliases
  root.style.setProperty('--color-text', colors.textPrimary);  // Text alias
  root.style.setProperty('--color-purple', colors.primary);  // Purple fallback
  
  // ========================================
  // INTERACTIVE STATES - User interaction feedback
  // ========================================
  
  // Interactive backgrounds and states
  root.style.setProperty('--color-hover-bg', colors.hoverBg);            // Hover background for interactive elements
  
  // Link and selection colors
  root.style.setProperty('--color-link', colors.accent);                 // Text links - accent for visibility
  root.style.setProperty('--color-link-hover', colors.textPrimary);      // Hover state for links
  root.style.setProperty('--color-focus-ring', colors.primary);          // Focus indicators, accessibility
  root.style.setProperty('--color-selection-bg', colors.primary);        // Text selection background
  root.style.setProperty('--color-selection-text', colors.textPrimary);  // Text selection color
  
  // ========================================
  // COMPONENT-SPECIFIC COLORS - Specialized UI elements
  // ========================================
  
  // Navigation and layout components
  root.style.setProperty('--color-nav-bg', colors.bgHeader);             // Navigation bar backgrounds
  root.style.setProperty('--color-nav-hover', colors.primary);           // Navigation hover states
  root.style.setProperty('--color-card-bg', colors.bgElevated);          // Card backgrounds
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
  
  // ========================================
  // TRANSPARENCY EFFECTS - Alpha blended colors
  // ========================================
  
  // Pre-defined alpha variants (defined in theme data)
  root.style.setProperty('--color-primary-alpha-20', colors.primaryAlpha20);   // Primary with 20% opacity
  root.style.setProperty('--color-success-glow', colors.successGlow);           // Success color for glows/highlights
  root.style.setProperty('--color-error-glow', colors.errorGlow);               // Error color for glows/validation
  root.style.setProperty('--color-bg-input-alpha-50', colors.bgInputAlpha50);   // Semi-transparent input backgrounds
  root.style.setProperty('--color-shadow-light', colors.shadowLight);          // Light shadow for subtle depth
  root.style.setProperty('--color-shadow-medium', colors.shadowMedium);        // Medium shadow for cards/modals
  root.style.setProperty('--color-overlay-dark', colors.overlayDark);          // Dark overlay for modals
  root.style.setProperty('--color-white-alpha-10', colors.whiteAlpha10);       // Light overlay/highlight
  root.style.setProperty('--color-modal-overlay', colors.modalOverlay);        // Modal backdrop
  
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
  
  // ========================================
  // LEGACY SUPPORT - Deprecated colors (avoid in new code)
  // ========================================
  
  // Legacy color names for backwards compatibility (use semantic names above)
  root.style.setProperty('--color-gold', colors.accent);                // Use --color-accent instead
  root.style.setProperty('--color-dark-red', colors.primaryDark);       // Use --color-primary-dark instead  
  root.style.setProperty('--color-dark-red-original', colors.primary);  // Use --color-primary instead
  
  /* 
  ====================================================================
  ADDING NEW COLOR VARIABLES - Complete Process Documentation
  ====================================================================
  
  Follow this systematic process when adding new color variables to the theme system:
  
  1. IDENTIFY THE NEED
     - Find repeated color values across components
     - Identify semantic use cases (e.g., hover states, interactive elements)
     - Look for hard-coded colors that should be themeable
  
  2. ADD TO THEME DEFINITIONS (lines 67-397)
     - Add the new property to ALL theme objects (oknotok, sparkle, khaki, mush)
     - Use semantic naming: hoverBg, not lightGray
     - Add descriptive comment explaining usage
     - Example: hoverBg: '#555', // Hover background for interactive elements
  
  3. ADD CSS VARIABLE IN applyTheme() FUNCTION (lines 502+)
     - Add root.style.setProperty() call in appropriate section
     - Include descriptive comment about usage
     - Example: root.style.setProperty('--color-hover-bg', colors.hoverBg);
  
  4. UPDATE COMPONENT USAGE
     - Search for hard-coded values: Grep pattern: "background.*#[0-9a-fA-F]"
     - Search for existing similar patterns: Grep pattern: ":hover.*background"
     - Replace with new semantic variable: var(--color-hover-bg)
     - Test across all themes to ensure proper appearance
  
  5. VALIDATION CHECKLIST
     ✅ All 4 themes have the new property defined
     ✅ CSS variable is set in applyTheme() function  
     ✅ All relevant components use the new variable
     ✅ Theme switching works correctly for new variable
     ✅ Colors are semantically appropriate for each theme
  
  EXAMPLE: Adding --color-hover-bg Variable
  
  Theme definitions:
    oknotok:   { hoverBg: '#555' }      // Dark theme: medium gray
    sparkle:   { hoverBg: '#F8BBD9' }   // Light theme: soft pink  
    khaki:     { hoverBg: '#666666' }   // Professional: dark gray
    mush:      { hoverBg: '#DA70D6' }   // Psychedelic: orchid
  
  CSS Variable:
    root.style.setProperty('--color-hover-bg', colors.hoverBg);
  
  Component Usage:
    .interactive-item:hover { background: var(--color-hover-bg); }
  
  ====================================================================
  COLOR SYSTEM DESIGN PHILOSOPHY
  ====================================================================
  
  This system provides consistent theming across 4+ themes with different
  light/dark backgrounds and color schemes. Key principles:
  
  1. SEMANTIC NAMING: Colors are named by function, not appearance
     - Good: --color-text-primary, --color-bg-elevated
     - Bad: --color-red, --color-light-gray
  
  2. HIERARCHY: Each category has clear hierarchy (primary > secondary > muted)
     - Text: primary (headings) > secondary (body) > muted (helper) > disabled
     - Backgrounds: base (main) > elevated (cards) > header (nav) > input (forms)
     - Borders: light (subtle) > medium (standard) > heavy (emphasized)
  
  3. ACCENT COLORS: Only for text, icons, and borders - NEVER backgrounds
     - Use primary colors for button backgrounds and interactive elements
  
  4. ALPHA VARIANTS: Pre-defined in themes for consistency
     - Avoid computing colors on-the-fly when possible
     - Each theme can define custom alpha values for better appearance
  
  5. STATUS COLORS: Universal semantic meaning across all themes
     - Success (green): completion, positive feedback
     - Error (red): failures, destructive actions  
     - Warning (orange): caution, attention needed
     - Info (blue): helpful information, neutral feedback
     
  6. THEME COVERAGE: All themes should define the same base set of variables
     - Specialized colors (like map markers) can be theme-specific
     - Use fallbacks for missing variables in computed sections
  
  ====================================================================
  */
  
  // Apply typography if available
  if (theme.typography) {
    applyTypography(theme.typography);
  }
  
  // Save preference
  localStorage.setItem('selectedTheme', themeName);
  
  // Dispatch event for other components to react
  window.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme: themeName } }));
}

/**
 * Apply typography settings to CSS variables
 * @param {Object} typography - Typography configuration object
 */
export function applyTypography(typography) {
  const root = document.documentElement;
  
  // Get font families with fallbacks
  const baseFont = getFontFamily(typography.fontFamily);
  const displayFont = typography.fontFamilyDisplay === 'none' 
    ? baseFont 
    : getFontFamily(typography.fontFamilyDisplay);
  
  // Set base typography variables
  root.style.setProperty('--font-family-base', baseFont);
  root.style.setProperty('--font-family-display', displayFont);
  root.style.setProperty('--font-size-base', `${typography.baseFontSize}px`);
  root.style.setProperty('--line-height-base', typography.baseLineHeight);
  root.style.setProperty('--letter-spacing-base', typography.letterSpacing);
  root.style.setProperty('--heading-scale', typography.headingScale);
  
  // Set font size multipliers and computed sizes
  if (typography.fontSizeMultipliers) {
    const baseSize = parseFloat(typography.baseFontSize);
    const multipliers = typography.fontSizeMultipliers;
    
    // Set multiplier variables for theme editor
    Object.entries(multipliers).forEach(([size, multiplier]) => {
      root.style.setProperty(`--font-size-multiplier-${size}`, multiplier);
    });
    
    // Calculate and set computed font sizes
    root.style.setProperty('--font-size-sm', `${baseSize * parseFloat(multipliers.sm)}px`);
    root.style.setProperty('--font-size-lg', `${baseSize * parseFloat(multipliers.lg)}px`);
    root.style.setProperty('--font-size-xl', `${baseSize * parseFloat(multipliers.xl)}px`);
    root.style.setProperty('--font-size-2xl', `${baseSize * parseFloat(multipliers['2xl'])}px`);
    
    // Calculate heading sizes using the heading scale and multipliers
    const headingScale = parseFloat(typography.headingScale);
    root.style.setProperty('--font-size-h1', `${baseSize * Math.pow(headingScale, 3)}px`);
    root.style.setProperty('--font-size-h2', `${baseSize * Math.pow(headingScale, 2)}px`);
    root.style.setProperty('--font-size-h3', `${baseSize * headingScale}px`);
    root.style.setProperty('--font-size-h4', `${baseSize}px`);
  }
  
  // Set font weight variables
  if (typography.fontWeight) {
    Object.entries(typography.fontWeight).forEach(([weight, value]) => {
      root.style.setProperty(`--font-weight-${weight}`, value);
    });
  }
  
  // Load Google Fonts if needed
  loadFontsForTheme(typography);
}

/**
 * Get font family string with fallbacks
 * @param {string} fontId - Font identifier
 * @returns {string} CSS font-family value
 */
function getFontFamily(fontId) {
  const font = availableFonts[fontId] || displayFonts[fontId];
  if (!font) return "'Berkeley Mono', monospace"; // Fallback
  
  if (font.system) {
    return font.fallback;
  }
  
  return `'${font.name}', ${font.fallback}`;
}

/**
 * Load Google Fonts dynamically
 * @param {Object} typography - Typography configuration
 */
function loadFontsForTheme(typography) {
  const fontsToLoad = [];
  
  // Check base font
  const baseFont = availableFonts[typography.fontFamily];
  if (baseFont && baseFont.googleFont) {
    fontsToLoad.push(baseFont.googleFont);
  }
  
  // Check display font
  if (typography.fontFamilyDisplay !== 'none') {
    const displayFont = displayFonts[typography.fontFamilyDisplay];
    if (displayFont && displayFont.googleFont) {
      fontsToLoad.push(displayFont.googleFont);
    }
  }
  
  // Load fonts via Google Fonts API
  if (fontsToLoad.length > 0) {
    loadGoogleFonts(fontsToLoad);
  }
}

/**
 * Load Google Fonts via CSS import
 * @param {Array} fonts - Array of Google Font family strings
 */
function loadGoogleFonts(fonts) {
  const fontUrl = `https://fonts.googleapis.com/css2?${fonts.map(f => `family=${f}`).join('&')}&display=swap`;
  
  // Check if already loaded
  if (document.querySelector(`link[href="${fontUrl}"]`)) {
    return;
  }
  
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = fontUrl;
  link.crossOrigin = 'anonymous';
  document.head.appendChild(link);
  
  console.log(`Loading Google Fonts: ${fonts.join(', ')}`);
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
  // Return themes if loaded, otherwise return defaults
  return Object.keys(themes).length > 0 ? themes : defaultThemes;
}

/**
 * Initialize theme on app load
 */
export async function initializeTheme() {
  // Load themes from JSON first
  await loadThemes();
  
  const savedTheme = getCurrentTheme();
  // Validate saved theme exists in loaded themes
  if (!themes[savedTheme]) {
    console.warn(`Saved theme "${savedTheme}" not found in themes.json, using oknotok`);
    applyTheme('oknotok');
  } else {
    applyTheme(savedTheme);
  }
}