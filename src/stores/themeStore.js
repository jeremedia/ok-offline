/**
 * Theme Store - Reactive theme state management
 */

import { ref, watchEffect } from 'vue'
import { getAvailableThemes, applyTheme, getCurrentTheme, loadThemes, refreshThemesFromServer } from '@/services/themeService'

// Current theme reactive reference
export const currentTheme = ref(getCurrentTheme())

// Available themes - will be populated from JSON
export const availableThemes = ref({})

// Load themes on store initialization
loadThemes().then(themes => {
  availableThemes.value = themes
})

// Watch for theme changes and apply them (only after themes are loaded)
watchEffect(() => {
  // Only apply theme if themes are loaded
  if (Object.keys(availableThemes.value).length > 0) {
    applyTheme(currentTheme.value)
  }
})

// Theme switching function
export function switchTheme(themeName) {
  if (availableThemes.value[themeName]) {
    currentTheme.value = themeName
  } else {
    console.error(`Theme "${themeName}" not found`)
  }
}

// Get theme info
export function getThemeInfo(themeName) {
  return availableThemes.value[themeName] || availableThemes.value.oknotok || {}
}

// Check if theme is currently active
export function isActiveTheme(themeName) {
  return currentTheme.value === themeName
}

// Refresh themes from server (useful for theme editor)
export async function refreshThemes() {
  // Force refresh from server by using the dedicated refresh function
  const themes = await refreshThemesFromServer()
  availableThemes.value = themes
  return themes
}