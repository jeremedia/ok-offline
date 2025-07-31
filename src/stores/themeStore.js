/**
 * Theme Store - Reactive theme state management
 */

import { ref, watchEffect } from 'vue'
import { themes, applyTheme, getCurrentTheme } from '@/services/themeService'

// Current theme reactive reference
export const currentTheme = ref(getCurrentTheme())

// Available themes
export const availableThemes = ref(themes)

// Watch for theme changes and apply them
watchEffect(() => {
  applyTheme(currentTheme.value)
})

// Theme switching function
export function switchTheme(themeName) {
  if (themes[themeName]) {
    currentTheme.value = themeName
  } else {
    console.error(`Theme "${themeName}" not found`)
  }
}

// Get theme info
export function getThemeInfo(themeName) {
  return themes[themeName] || themes.oknotok
}

// Check if theme is currently active
export function isActiveTheme(themeName) {
  return currentTheme.value === themeName
}