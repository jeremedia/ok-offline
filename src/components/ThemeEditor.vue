<template>
  <div v-if="isVisible" 
    class="theme-editor-container" 
    :class="{ 'docked': isDocked }"
    :style="editorStyle"
    ref="containerRef"
  >
    <div class="theme-editor" ref="editorRef">
      <div class="editor-header" @mousedown="startDrag" style="cursor: move;">
        <h3>Theme Editor</h3>
        <div class="editor-controls">
          <button @click="toggleDocked" class="icon-button" title="Toggle docked mode">
            {{ isDocked ? '⬜' : '🔲' }}
          </button>
          <button @click="close" class="icon-button" title="Close editor">
            ✕
          </button>
        </div>
      </div>
      
      <div class="editor-content">
        <!-- Theme Selector -->
        <div class="theme-selector-section">
          <label>Active Theme</label>
          <div class="theme-selector-row">
            <select v-model="selectedTheme" @change="handleThemeChange" class="theme-selector">
              <option v-for="(theme, key) in availableThemes" :key="key" :value="key">
                {{ theme.name }} - {{ theme.description }}
              </option>
            </select>
            <button @click="duplicateTheme" class="duplicate-button" title="Duplicate current theme">
              📋 Duplicate
            </button>
          </div>
        </div>
        
        <!-- Color Variables -->
        <div class="color-variables-section">
          <div class="color-group" v-for="group in colorGroups" :key="group.name">
            <h4>{{ group.name }}</h4>
            <div class="color-grid">
              <div v-for="varName in group.vars" :key="varName" class="color-item">
                <div class="color-label-row">
                  <label :for="`color-${varName}`">{{ formatVarName(varName) }}</label>
                  <button 
                    @click="flashColor(varName)" 
                    class="flash-button"
                    title="Flash all instances of this color"
                  >
                    ⚡
                  </button>
                </div>
                <div class="color-input-group">
                  <AlphaColorPicker
                    :modelValue="currentColors[varName]"
                    @update:modelValue="updateColor(varName, $event)"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Typography Section -->
        <div class="editor-section">
          <h4>Typography</h4>
          <div class="typography-controls">
            <!-- Font Family Controls (Base and Display on same line) -->
            <div class="control-group">
              <div class="font-controls-row">
                <div class="font-control">
                  <label>Base Font</label>
                  <select v-model="currentTypography.fontFamily" @change="updateTypography">
                    <option v-for="(font, id) in availableFonts" :key="id" :value="id">
                      {{ font.name }} ({{ font.type }})
                    </option>
                  </select>
                  <span class="control-description">{{ availableFonts[currentTypography.fontFamily]?.description }}</span>
                </div>
                <div class="font-control">
                  <label>Display Font (Headers)</label>
                  <select v-model="currentTypography.fontFamilyDisplay" @change="updateTypography">
                    <option v-for="(font, id) in displayFonts" :key="id" :value="id">
                      {{ font.name }}
                    </option>
                  </select>
                  <span class="control-description">{{ displayFonts[currentTypography.fontFamilyDisplay]?.description }}</span>
                </div>
              </div>
            </div>
            
            <!-- Font Size -->
            <div class="control-group">
              <label>Font Size</label>
              <div class="slider-control">
                <input 
                  type="range" 
                  min="12" 
                  max="20" 
                  step="1"
                  v-model="currentTypography.baseFontSize" 
                  @input="updateTypography"
                />
                <span class="slider-value">{{ currentTypography.baseFontSize }}px</span>
              </div>
            </div>
            
            <!-- Line Height -->
            <div class="control-group">
              <label>Line Height</label>
              <div class="slider-control">
                <input 
                  type="range" 
                  min="1.2" 
                  max="2.0" 
                  step="0.1"
                  v-model="currentTypography.baseLineHeight" 
                  @input="updateTypography"
                />
                <span class="slider-value">{{ currentTypography.baseLineHeight }}</span>
              </div>
            </div>
            
            <!-- Letter Spacing -->
            <div class="control-group">
              <label>Letter Spacing</label>
              <div class="slider-control">
                <input 
                  type="range" 
                  min="-0.05" 
                  max="0.1" 
                  step="0.01"
                  v-model="currentTypography.letterSpacing" 
                  @input="updateTypography"
                />
                <span class="slider-value">{{ currentTypography.letterSpacing }}em</span>
              </div>
            </div>
            
            <!-- Font Size Multipliers -->
            <div class="control-group">
              <label>Font Size Multipliers</label>
              <div class="multiplier-controls">
                <div class="multiplier-row">
                  <label class="multiplier-label">Small (sm)</label>
                  <input 
                    type="range" 
                    min="0.7" 
                    max="1.0" 
                    step="0.025"
                    v-model="currentTypography.fontSizeMultipliers.sm" 
                    @input="updateTypography"
                    class="multiplier-slider"
                  />
                  <span class="multiplier-value">{{ currentTypography.fontSizeMultipliers?.sm || '0.875' }}×</span>
                </div>
                <div class="multiplier-row">
                  <label class="multiplier-label">Large (lg)</label>
                  <input 
                    type="range" 
                    min="1.0" 
                    max="1.4" 
                    step="0.025"
                    v-model="currentTypography.fontSizeMultipliers.lg" 
                    @input="updateTypography"
                    class="multiplier-slider"
                  />
                  <span class="multiplier-value">{{ currentTypography.fontSizeMultipliers?.lg || '1.125' }}×</span>
                </div>
                <div class="multiplier-row">
                  <label class="multiplier-label">Extra Large (xl)</label>
                  <input 
                    type="range" 
                    min="1.1" 
                    max="1.6" 
                    step="0.025"
                    v-model="currentTypography.fontSizeMultipliers.xl" 
                    @input="updateTypography"
                    class="multiplier-slider"
                  />
                  <span class="multiplier-value">{{ currentTypography.fontSizeMultipliers?.xl || '1.25' }}×</span>
                </div>
                <div class="multiplier-row">
                  <label class="multiplier-label">2X Large (2xl)</label>
                  <input 
                    type="range" 
                    min="1.3" 
                    max="2.0" 
                    step="0.025"
                    v-model="currentTypography.fontSizeMultipliers['2xl']" 
                    @input="updateTypography"
                    class="multiplier-slider"
                  />
                  <span class="multiplier-value">{{ currentTypography.fontSizeMultipliers?.['2xl'] || '1.5' }}×</span>
                </div>
              </div>
            </div>
            
            <!-- Typography Preview -->
            <div class="typography-preview">
              <h5>Preview</h5>
              <div class="preview-content">
                <h1 class="preview-h1">Heading 1 Text</h1>
                <h2 class="preview-h2">Heading 2 Text</h2>
                <h3 class="preview-h3">Heading 3 Text</h3>
                <p class="preview-body">Body text: The quick brown fox jumps over the lazy dog. 1234567890</p>
                <p class="preview-2xl">2XL Text: Large display text for emphasis</p>
                <p class="preview-xl">XL Text: Extra large for important content</p>
                <p class="preview-lg">Large Text: Prominent but readable content</p>
                <p class="preview-sm">Small Text: Secondary information and fine print</p>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Actions -->
        <div class="editor-actions">
          <button @click="saveTheme" class="save-button">Save Theme</button>
          <button @click="resetTheme" class="reset-button">Reset Changes</button>
          <button @click="resetToFactory" class="factory-reset-button">Reset to Factory</button>
          <button @click="copyThemeJson" class="copy-button">Copy as JSON</button>
        </div>
      </div>
    </div>
    
    <!-- Duplicate Theme Modal -->
    <div v-if="showDuplicateModal" class="modal-overlay" @click="cancelDuplicate">
      <div class="duplicate-modal" @click.stop>
        <h3>Duplicate Theme</h3>
        <p>Create a copy of "{{ availableThemes[selectedTheme]?.name }}" theme</p>
        
        <div class="modal-form">
          <div class="form-group">
            <label for="themeName">Theme Name</label>
            <input 
              id="themeName"
              v-model="newThemeName" 
              type="text" 
              placeholder="Enter theme name"
              @input="generateThemeId"
            />
          </div>
          
          <div class="form-group">
            <label for="themeId">Theme ID</label>
            <input 
              id="themeId"
              v-model="newThemeId" 
              type="text" 
              placeholder="theme-id"
            />
          </div>
          
          <div class="form-group">
            <label for="themeDescription">Description (optional)</label>
            <input 
              id="themeDescription"
              v-model="newThemeDescription" 
              type="text" 
              placeholder="Describe your theme"
            />
          </div>
        </div>
        
        <div class="modal-actions">
          <button @click="cancelDuplicate" class="cancel-button">Cancel</button>
          <button @click="confirmDuplicate" class="confirm-button" :disabled="!newThemeName || !newThemeId">
            Create Theme
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { availableThemes, currentTheme, switchTheme, refreshThemes } from '@/stores/themeStore'
import { applyTheme, availableFonts, displayFonts, applyTypography, refreshThemesFromServer } from '@/services/themeService'
import { useToast } from '@/composables/useToast'
import { API_URLS } from '@/config'
import AlphaColorPicker from '@/components/ui/AlphaColorPicker.vue'

const { showToast } = useToast()

// Editor state - load saved visibility state
const savedVisibility = localStorage.getItem('themeEditorVisible')
const isVisible = ref(savedVisibility === 'true')
const isDocked = ref(false) // Start in floating mode
const selectedTheme = ref('')
const currentColors = ref({})
const originalColors = ref({})
const factoryColors = ref({}) // Store the original factory colors

// Typography state
const currentTypography = ref({
  fontFamily: 'berkeley-mono',
  fontFamilyDisplay: 'none',
  baseFontSize: '16',
  baseLineHeight: '1.5',
  letterSpacing: '0',
  headingScale: '1.25',
  fontSizeMultipliers: {
    sm: '0.875',
    lg: '1.125',
    xl: '1.25',
    '2xl': '1.5'
  },
  fontWeight: {
    normal: '400',
    medium: '500',
    bold: '700'
  }
})
const originalTypography = ref({})
const editorRef = ref(null)
const containerRef = ref(null)

// Duplication state
const showDuplicateModal = ref(false)
const newThemeName = ref('')
const newThemeId = ref('')
const newThemeDescription = ref('')

// Dragging state
const isDragging = ref(false)
const dragStart = ref({ x: 0, y: 0 })
const position = ref({ x: 0, y: 0 })

// Load saved position and docked state
const savedPosition = localStorage.getItem('themeEditorPosition')
if (savedPosition) {
  try {
    position.value = JSON.parse(savedPosition)
  } catch (e) {
    // Default center position will be set on mounted
  }
}

// Load saved docked state
const savedDocked = localStorage.getItem('themeEditorDocked')
if (savedDocked) {
  isDocked.value = savedDocked === 'true'
}

// Color groups for organization
const colorGroups = [
  {
    name: 'Primary Colors',
    vars: ['primary', 'primaryDark', 'primaryDarker', 'accent', 'accentDark', 'hoverBg']
  },
  {
    name: 'Backgrounds',
    vars: ['bgBase', 'bgElevated', 'bgHeader', 'bgInput', 'bgHover', 'bgActive']
  },
  {
    name: 'Text',
    vars: ['textPrimary', 'textSecondary', 'textMuted', 'textDisabled', 'textInverse']
  },
  {
    name: 'Borders',
    vars: ['borderLight', 'borderMedium', 'borderHeavy']
  },
  {
    name: 'Status',
    vars: ['success', 'error', 'warning', 'info']
  },
  {
    name: 'Weather & Dust',
    vars: ['dustClear', 'dustLight', 'dustModerate', 'dustHeavy', 'dustWhiteout', 'weatherCardBg', 'weatherIcon']
  },
  {
    name: 'Transparency Effects',
    vars: ['primaryAlpha20', 'successGlow', 'errorGlow', 'bgInputAlpha50', 'shadowLight', 'shadowMedium', 
           'overlayDark', 'overlaySubtle', 'overlayLight', 'overlayMedium', 'whiteAlpha10', 'modalOverlay']
  }
]

// Computed style for positioning
const editorStyle = computed(() => {
  if (isDocked.value) return {}
  
  return {
    left: `${position.value.x}px`,
    top: `${position.value.y}px`,
    transform: 'none'
  }
})

// Initialize
onMounted(() => {
  selectedTheme.value = currentTheme.value
  loadTheme()
  
  // Set default center position if not loaded
  if (!savedPosition && containerRef.value) {
    const rect = containerRef.value.getBoundingClientRect()
    position.value = {
      x: (window.innerWidth - rect.width) / 2,
      y: (window.innerHeight - rect.height) / 2
    }
  }
  
  // Add keyboard shortcut listener
  window.addEventListener('keydown', handleKeyboard)
  window.addEventListener('mousemove', handleDrag)
  window.addEventListener('mouseup', stopDrag)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyboard)
  window.removeEventListener('mousemove', handleDrag)
  window.removeEventListener('mouseup', stopDrag)
})

// Keyboard shortcuts
const handleKeyboard = (e) => {
  // Cmd/Ctrl + Shift + T to toggle editor
  if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'T') {
    e.preventDefault()
    toggle()
  }
}

// Public methods for external control
const show = () => {
  isVisible.value = true
  saveEditorState()
}

const hide = () => {
  isVisible.value = false
  saveEditorState()
}

const toggle = () => {
  isVisible.value = !isVisible.value
  saveEditorState()
}

const close = () => {
  hide()
}

const toggleDocked = () => {
  isDocked.value = !isDocked.value
  if (!isDocked.value) {
    // When switching to floating, center the editor
    if (containerRef.value) {
      const rect = containerRef.value.getBoundingClientRect()
      position.value = {
        x: (window.innerWidth - rect.width) / 2,
        y: (window.innerHeight - rect.height) / 2
      }
    }
  }
  saveEditorState()
}

// Dragging functions
const startDrag = (e) => {
  if (isDocked.value) return
  
  isDragging.value = true
  dragStart.value = {
    x: e.clientX - position.value.x,
    y: e.clientY - position.value.y
  }
  e.preventDefault()
}

const handleDrag = (e) => {
  if (!isDragging.value) return
  
  position.value = {
    x: e.clientX - dragStart.value.x,
    y: e.clientY - dragStart.value.y
  }
}

const stopDrag = () => {
  if (isDragging.value) {
    isDragging.value = false
    savePosition()
  }
}

const savePosition = () => {
  localStorage.setItem('themeEditorPosition', JSON.stringify(position.value))
}

// Save editor state to localStorage
const saveEditorState = () => {
  localStorage.setItem('themeEditorVisible', isVisible.value.toString())
  localStorage.setItem('themeEditorDocked', isDocked.value.toString())
  if (!isDocked.value) {
    savePosition()
  }
}

// Load theme colors and typography
const loadTheme = () => {
  const theme = availableThemes.value[selectedTheme.value]
  if (!theme) return
  
  // Expand any 3-digit hex colors to 6-digit for HTML color inputs
  const expandedColors = {}
  for (const [key, value] of Object.entries(theme.colors)) {
    expandedColors[key] = expandHexColor(value)
  }
  
  currentColors.value = { ...expandedColors }
  originalColors.value = { ...expandedColors }
  
  // Load typography if available
  if (theme.typography) {
    currentTypography.value = { 
      ...theme.typography,
      // Ensure fontSizeMultipliers exists with default values
      fontSizeMultipliers: theme.typography.fontSizeMultipliers || {
        sm: '0.875',
        lg: '1.125', 
        xl: '1.25',
        '2xl': '1.5'
      }
    }
    originalTypography.value = { ...currentTypography.value }
  }
  
  // Store factory colors on first load
  if (!factoryColors.value[selectedTheme.value]) {
    factoryColors.value[selectedTheme.value] = { 
      colors: { ...theme.colors },
      typography: theme.typography ? { ...theme.typography } : null
    }
  }
}

// Handle theme change in dropdown
const handleThemeChange = () => {
  // Switch the active theme globally
  switchTheme(selectedTheme.value)
  // Load the new theme colors for editing
  loadTheme()
}

// Format variable names for display
const formatVarName = (varName) => {
  return varName
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
}

// Convert 3-digit hex to 6-digit hex for HTML color inputs
const expandHexColor = (hex) => {
  if (!hex || typeof hex !== 'string') return hex
  
  // Remove any whitespace
  hex = hex.trim()
  
  // If it's 3 digits (plus #), expand it
  if (hex.length === 4 && hex.startsWith('#')) {
    const r = hex[1]
    const g = hex[2] 
    const b = hex[3]
    const expanded = `#${r}${r}${g}${g}${b}${b}`
    return expanded
  }
  
  // Otherwise return as-is
  return hex
}

// Convert rgba to hex for color picker
const getColorHex = (color) => {
  if (!color) return '#000000'
  
  // If already hex, expand 3-digit to 6-digit if needed
  if (color.startsWith('#')) return expandHexColor(color)
  
  // If rgba, try to extract RGB values
  const rgbaMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i)
  if (rgbaMatch) {
    const r = parseInt(rgbaMatch[1]).toString(16).padStart(2, '0')
    const g = parseInt(rgbaMatch[2]).toString(16).padStart(2, '0')
    const b = parseInt(rgbaMatch[3]).toString(16).padStart(2, '0')
    return `#${r}${g}${b}`
  }
  
  return '#000000'
}

// Update color and apply live
const updateColor = (varName, value) => {
  currentColors.value[varName] = value
  
  // Apply all colors immediately for live preview
  applyColorsToCSS()
}

// Apply current colors to CSS variables
const applyColorsToCSS = () => {
  const root = document.documentElement
  const colors = currentColors.value
  
  // Apply all color variables just like in applyTheme
  root.style.setProperty('--color-primary', colors.primary)
  root.style.setProperty('--color-primary-dark', colors.primaryDark)
  root.style.setProperty('--color-primary-darker', colors.primaryDarker)
  root.style.setProperty('--color-accent', colors.accent)
  root.style.setProperty('--color-accent-dark', colors.accentDark)
  
  root.style.setProperty('--color-bg-base', colors.bgBase)
  root.style.setProperty('--color-bg-elevated', colors.bgElevated)
  root.style.setProperty('--color-bg-header', colors.bgHeader)
  root.style.setProperty('--color-bg-input', colors.bgInput)
  root.style.setProperty('--color-bg-hover', colors.bgHover)
  root.style.setProperty('--color-bg-active', colors.bgActive)
  
  // Interactive Colors - NEW semantic hover variable
  root.style.setProperty('--color-hover-bg', colors.hoverBg)
  
  root.style.setProperty('--color-text-primary', colors.textPrimary)
  root.style.setProperty('--color-text-secondary', colors.textSecondary)
  root.style.setProperty('--color-text-muted', colors.textMuted)
  root.style.setProperty('--color-text-disabled', colors.textDisabled)
  root.style.setProperty('--color-text-inverse', colors.textInverse)
  
  root.style.setProperty('--color-border-light', colors.borderLight)
  root.style.setProperty('--color-border-medium', colors.borderMedium)
  root.style.setProperty('--color-border-heavy', colors.borderHeavy)
  
  root.style.setProperty('--color-success', colors.success)
  root.style.setProperty('--color-error', colors.error)
  root.style.setProperty('--color-warning', colors.warning)
  root.style.setProperty('--color-info', colors.info)
  
  // Weather & dust colors
  root.style.setProperty('--color-dust-clear', colors.dustClear)
  root.style.setProperty('--color-dust-light', colors.dustLight)
  root.style.setProperty('--color-dust-moderate', colors.dustModerate)
  root.style.setProperty('--color-dust-heavy', colors.dustHeavy)
  root.style.setProperty('--color-dust-whiteout', colors.dustWhiteout)
  root.style.setProperty('--color-weather-card-bg', colors.weatherCardBg)
  root.style.setProperty('--color-weather-icon', colors.weatherIcon)
  
  // Transparency effects
  root.style.setProperty('--color-primary-alpha-20', colors.primaryAlpha20)
  root.style.setProperty('--color-success-glow', colors.successGlow)
  root.style.setProperty('--color-error-glow', colors.errorGlow)
  root.style.setProperty('--color-bg-input-alpha-50', colors.bgInputAlpha50)
  root.style.setProperty('--color-shadow-light', colors.shadowLight)
  root.style.setProperty('--color-shadow-medium', colors.shadowMedium)
  root.style.setProperty('--color-overlay-dark', colors.overlayDark)
  root.style.setProperty('--color-overlay-subtle', colors.overlaySubtle)
  root.style.setProperty('--color-overlay-light', colors.overlayLight)
  root.style.setProperty('--color-overlay-medium', colors.overlayMedium)
  root.style.setProperty('--color-white-alpha-10', colors.whiteAlpha10)
  root.style.setProperty('--color-modal-overlay', colors.modalOverlay)
  
  // Important aliases
  root.style.setProperty('--color-background-secondary', colors.bgBase)
  root.style.setProperty('--color-background-tertiary', colors.bgElevated)
  root.style.setProperty('--color-border', colors.borderMedium)
  root.style.setProperty('--color-border-focus', colors.primary)
}

// Update typography and apply to CSS for live preview
const updateTypography = () => {
  applyTypography(currentTypography.value)
}

// Save theme to JSON
const saveTheme = async () => {
  let serverUpdateSuccessful = false
  let serverUpdateAttempted = false
  
  try {
    const themeData = {
      id: selectedTheme.value,
      name: availableThemes.value[selectedTheme.value].name,
      description: availableThemes.value[selectedTheme.value].description || '',
      colors: { ...currentColors.value },
      typography: { ...currentTypography.value }
    }
    
    // In development, save to API
    if (import.meta.env.DEV) {
      serverUpdateAttempted = true
      try {
        // Check if theme exists to determine method (PUT for update, POST for create)
        const themeExists = availableThemes.value[selectedTheme.value]
        showToast(`${themeExists ? 'Updating' : 'Creating'} theme on server...`, 'info')
        const method = themeExists ? 'PUT' : 'POST'
        const url = themeExists 
          ? `${API_URLS.VECTOR_API}/themes/${selectedTheme.value}`
          : `${API_URLS.VECTOR_API}/themes`
        
        const response = await fetch(url, {
          method: method,
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(themeData)
        })
        
        if (response.ok) {
          const result = await response.json()
          serverUpdateSuccessful = true
          showToast(`✅ Theme ${themeExists ? 'updated' : 'created'} successfully on server!`, 'success')
          originalColors.value = { ...currentColors.value }
          originalTypography.value = { ...currentTypography.value }
          
          // Refresh themes from server
          await refreshThemes()
        } else {
          const error = await response.json()
          throw new Error(error.error || 'Failed to save theme')
        }
      } catch (apiError) {
        console.error('API save failed:', apiError)
        serverUpdateSuccessful = false
        showToast(`⚠️  Server update failed: ${apiError.message}`, 'error')
        showToast('💾 Falling back to clipboard export...', 'info')
        
        // Fall back to clipboard
        await copyThemeToClipboard(themeData)
      }
    } else {
      // Production: only clipboard available
      showToast('💾 Saving theme to clipboard (server not available in production)...', 'info')
      await copyThemeToClipboard(themeData)
      showToast('📋 Theme saved to clipboard! Paste into themes.json to make permanent.', 'success')
    }
    
    // Show server update status if attempted
    if (serverUpdateAttempted) {
      if (serverUpdateSuccessful) {
        showToast('🔄 Theme changes now live on server', 'success')
      } else {
        showToast('⚠️  Changes saved locally but not synced to server', 'warning')
      }
    }
    
  } catch (error) {
    console.error('Failed to save theme:', error)
    showToast('❌ Failed to save theme - please try again', 'error')
  }
}

// Helper function to copy theme to clipboard
const copyThemeToClipboard = async (themeData) => {
  const updatedThemes = {
    themes: {
      ...availableThemes.value,
      [themeData.id]: {
        id: themeData.id,
        name: themeData.name,
        description: themeData.description,
        colors: themeData.colors
      }
    }
  }
  
  await navigator.clipboard.writeText(JSON.stringify(updatedThemes, null, 2))
  showToast('Theme copied to clipboard! Paste into /public/data/themes.json to save.', 'info')
}

// Reset to original colors (last saved state)
const resetTheme = () => {
  currentColors.value = { ...originalColors.value }
  // Re-apply all colors
  applyColorsToCSS()
  showToast('Theme reset to last saved state', 'info')
}

// Reset to factory defaults
const resetToFactory = async () => {
  try {
    // Re-fetch themes from JSON to get true factory defaults
    const response = await fetch('/data/themes.json')
    const data = await response.json()
    const factoryTheme = data.themes[selectedTheme.value]
    
    if (factoryTheme && factoryTheme.colors) {
      currentColors.value = { ...factoryTheme.colors }
      originalColors.value = { ...factoryTheme.colors }
      factoryColors.value[selectedTheme.value] = { ...factoryTheme.colors }
      
      // Re-apply all colors
      applyColorsToCSS()
      showToast('Theme reset to factory defaults', 'success')
    } else {
      showToast('Failed to load factory defaults', 'error')
    }
  } catch (error) {
    console.error('Failed to reset to factory:', error)
    showToast('Failed to load factory defaults', 'error')
  }
}

// Copy theme as JSON
const copyThemeJson = async () => {
  try {
    const themeData = {
      [selectedTheme.value]: {
        ...availableThemes.value[selectedTheme.value],
        colors: { ...currentColors.value }
      }
    }
    
    await navigator.clipboard.writeText(JSON.stringify(themeData, null, 2))
    showToast('Theme JSON copied to clipboard!', 'success')
  } catch (error) {
    console.error('Failed to copy theme:', error)
    showToast('Failed to copy theme', 'error')
  }
}

// Flash a color to show where it's used
const flashColor = (varName) => {
  const cssVarName = `--color-${varName.replace(/([A-Z])/g, '-$1').toLowerCase()}`
  const originalValue = currentColors.value[varName]
  const flashValue = '#ffffff'
  
  // Set to flash color
  document.documentElement.style.setProperty(cssVarName, flashValue)
  
  // Flash back after a short delay
  setTimeout(() => {
    document.documentElement.style.setProperty(cssVarName, originalValue)
  }, 200)
  
  // Second flash for better visibility
  setTimeout(() => {
    document.documentElement.style.setProperty(cssVarName, flashValue)
    setTimeout(() => {
      document.documentElement.style.setProperty(cssVarName, originalValue)
    }, 200)
  }, 400)
}

// Theme duplication functions
const duplicateTheme = () => {
  const currentThemeName = availableThemes.value[selectedTheme.value]?.name || 'Theme'
  newThemeName.value = `${currentThemeName} Copy`
  newThemeDescription.value = `Custom theme based on ${currentThemeName}`
  generateThemeId()
  showDuplicateModal.value = true
}

const generateThemeId = () => {
  if (newThemeName.value) {
    newThemeId.value = newThemeName.value
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
  }
}

const cancelDuplicate = () => {
  showDuplicateModal.value = false
  newThemeName.value = ''
  newThemeId.value = ''
  newThemeDescription.value = ''
}

const confirmDuplicate = async () => {
  let serverUpdateSuccessful = false
  
  try {
    // Create new theme object
    const baseTheme = availableThemes.value[selectedTheme.value]
    const newTheme = {
      id: newThemeId.value,
      name: newThemeName.value,
      description: newThemeDescription.value || `Custom theme based on ${baseTheme.name}`,
      colors: { ...baseTheme.colors }
    }
    
    // In development, save to API
    if (import.meta.env.DEV) {
      try {
        showToast(`Creating theme "${newThemeName.value}" on server...`, 'info')
        
        const response = await fetch(`${API_URLS.VECTOR_API}/themes`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(newTheme)
        })
        
        if (response.ok) {
          serverUpdateSuccessful = true
          showToast(`✅ Theme "${newThemeName.value}" created successfully on server!`, 'success')
          
          // Refresh themes from server
          await refreshThemes()
          
          // Switch to the new theme
          selectedTheme.value = newThemeId.value
          switchTheme(newThemeId.value)
          loadTheme()
          
          showToast(`🎨 Now editing your new theme: ${newThemeName.value}`, 'success')
        } else {
          const error = await response.json()
          throw new Error(error.error || 'Failed to save new theme')
        }
      } catch (apiError) {
        console.error('API save failed:', apiError)
        serverUpdateSuccessful = false
        showToast(`⚠️  Server creation failed: ${apiError.message}`, 'error')
        
        // Still add locally
        availableThemes.value[newThemeId.value] = newTheme
        selectedTheme.value = newThemeId.value
        switchTheme(newThemeId.value)
        loadTheme()
        showToast(`📝 Theme "${newThemeName.value}" created locally (not saved to server)`, 'warning')
      }
    } else {
      // Production: only add locally
      availableThemes.value[newThemeId.value] = newTheme
      selectedTheme.value = newThemeId.value
      switchTheme(newThemeId.value)
      loadTheme()
      showToast(`🎨 Created new theme: ${newThemeName.value}`, 'success')
      showToast(`💾 Theme created locally - use "Save Theme" to export`, 'info')
    }
    
    showDuplicateModal.value = false
    
    // Clear form
    newThemeName.value = ''
    newThemeId.value = ''
    newThemeDescription.value = ''
    
  } catch (error) {
    console.error('Failed to create theme:', error)
    showToast(`❌ Failed to create theme "${newThemeName.value}" - please try again`, 'error')
  }
}

// Expose methods for external use
defineExpose({
  show,
  hide,
  toggle
})
</script>

<style scoped>
.theme-editor-container {
  position: fixed;
  z-index: 9999;
  max-width: 90vw;
  max-height: 90vh;
}

.theme-editor-container.docked {
  position: fixed;
  top: auto;
  left: auto;
  right: 20px;
  bottom: 20px;
  transform: none;
  max-width: 600px;
}

.theme-editor {
  background: var(--color-bg-elevated);
  border: 2px solid var(--color-border-heavy);
  border-radius: 8px;
  box-shadow: 0 10px 40px var(--color-shadow-medium);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  height: 100%;
  max-height: 80vh;
}

.editor-header {
  background: var(--color-bg-header);
  padding: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--color-border-medium);
}

.editor-header h3 {
  margin: 0;
  color: var(--color-text-primary);
}

.editor-controls {
  display: flex;
  gap: 0.5rem;
}

.icon-button {
  background: none;
  border: none;
  color: var(--color-text-secondary);
  cursor: pointer;
  padding: 0.5rem;
  font-size: 1.2rem;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.icon-button:hover {
  background: var(--color-bg-hover);
}

.editor-content {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
}

.theme-selector-section {
  margin-bottom: 2rem;
}

.theme-selector-section label {
  display: block;
  margin-bottom: 0.5rem;
  color: var(--color-text-secondary);
  font-weight: 600;
}

.theme-selector-row {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.theme-selector {
  flex: 1;
  padding: 0.75rem;
  background: var(--color-bg-input);
  border: 1px solid var(--color-border-medium);
  border-radius: 4px;
  color: var(--color-text-primary);
  font-size: 1rem;
}

.duplicate-button {
  background: var(--color-primary);
  color: var(--color-text-inverse);
  border: none;
  border-radius: 4px;
  padding: 0.75rem 1rem;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s;
  white-space: nowrap;
}

.duplicate-button:hover {
  background: var(--color-primary-dark);
}

.color-variables-section {
  margin-bottom: 2rem;
}

.color-group {
  margin-bottom: 2rem;
}

.color-group h4 {
  color: var(--color-text-primary);
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--color-border-light);
}

.color-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1rem;
}

.color-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.color-label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.color-item label {
  color: var(--color-text-secondary);
  font-size: 0.875rem;
  flex: 1;
}

.flash-button {
  background: var(--color-bg-input);
  border: 1px solid var(--color-border-light);
  border-radius: 4px;
  padding: 0.25rem 0.5rem;
  cursor: pointer;
  font-size: 0.875rem;
  transition: all 0.2s;
  color: var(--color-text-secondary);
}

.flash-button:hover {
  background: var(--color-primary);
  color: var(--color-text-inverse);
  border-color: var(--color-primary);
}

.color-input-group {
  display: flex;
  gap: 0.5rem;
}

.color-picker {
  width: 50px;
  height: 36px;
  border: 2px solid var(--color-border-heavy);
  border-radius: 4px;
  cursor: pointer;
  background-color: white;
  background-image: 
    linear-gradient(45deg, #ccc 25%, transparent 25%),
    linear-gradient(-45deg, #ccc 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, #ccc 75%),
    linear-gradient(-45deg, transparent 75%, #ccc 75%);
  background-size: 10px 10px;
  background-position: 0 0, 0 5px, 5px -5px, -5px 0px;
}

.color-text {
  flex: 1;
  padding: 0.5rem;
  background: var(--color-bg-input);
  border: 1px solid var(--color-border-medium);
  border-radius: 4px;
  color: var(--color-text-primary);
  font-family: 'Berkeley Mono', monospace;
  font-size: 0.875rem;
}

.editor-actions {
  display: flex;
  gap: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--color-border-light);
}

.save-button,
.reset-button,
.factory-reset-button,
.copy-button {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.save-button {
  background: var(--color-primary);
  color: var(--color-text-inverse);
}

.save-button:hover {
  background: var(--color-primary-dark);
}

.reset-button {
  background: var(--color-bg-input);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border-medium);
}

.reset-button:hover {
  background: var(--color-bg-hover);
}

.factory-reset-button {
  background: var(--color-warning);
  color: var(--color-bg-base);
}

.factory-reset-button:hover {
  background: var(--color-error);
  color: var(--color-text-inverse);
}

.copy-button {
  background: var(--color-primary);
  color: var(--color-text-inverse);
}

.copy-button:hover {
  background: var(--color-primary-dark);
}

/* Mobile responsiveness */
body.mobile-device .theme-editor-container {
  max-width: 100vw;
  max-height: 100vh;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  transform: none;
}

body.mobile-device .theme-editor-container.docked {
  right: 0;
  bottom: 0;
  max-width: 100%;
}

body.mobile-device .color-grid {
  grid-template-columns: 1fr;
}

/* Modal styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--color-modal-overlay);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
}

.duplicate-modal {
  background: var(--color-bg-elevated);
  border: 2px solid var(--color-border-heavy);
  border-radius: 8px;
  padding: 2rem;
  max-width: 500px;
  width: 90%;
  box-shadow: 0 20px 60px var(--color-shadow-medium);
}

.duplicate-modal h3 {
  margin: 0 0 0.5rem 0;
  color: var(--color-text-primary);
}

.duplicate-modal p {
  margin: 0 0 1.5rem 0;
  color: var(--color-text-secondary);
}

.modal-form {
  margin-bottom: 2rem;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: var(--color-text-secondary);
  font-weight: 600;
}

.form-group input {
  width: 100%;
  padding: 0.75rem;
  background: var(--color-bg-input);
  border: 1px solid var(--color-border-medium);
  border-radius: 4px;
  color: var(--color-text-primary);
  font-size: 1rem;
}

.form-group input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px var(--color-primary-alpha-20);
}

.modal-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
}

.cancel-button,
.confirm-button {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.cancel-button {
  background: var(--color-bg-input);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border-medium);
}

.cancel-button:hover {
  background: var(--color-bg-hover);
}

.confirm-button {
  background: var(--color-primary);
  color: var(--color-text-inverse);
}

.confirm-button:hover:not(:disabled) {
  background: var(--color-primary-dark);
}

.confirm-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Editor Sections */
.editor-section {
  margin-bottom: 2rem;
}

.editor-section h4 {
  color: var(--color-text-primary);
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--color-border-light);
}

/* Typography Controls */
.typography-controls {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.control-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.control-group label {
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--color-text-secondary);
}

.control-group select {
  padding: 0.5rem;
  border: 1px solid var(--color-border-medium);
  border-radius: 4px;
  background: var(--color-bg-input);
  color: var(--color-text-primary);
  font-family: var(--font-family-base);
  font-size: 0.9rem;
}

.control-description {
  font-size: 0.8rem;
  color: var(--color-text-muted);
  font-style: italic;
}

.slider-control {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.slider-control input[type="range"] {
  flex: 1;
  -webkit-appearance: none;
  appearance: none;
  height: 4px;
  background: var(--color-bg-hover);
  border-radius: 2px;
  outline: none;
}

.slider-control input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  background: var(--color-primary);
  border-radius: 50%;
  cursor: pointer;
}

.slider-control input[type="range"]::-moz-range-thumb {
  width: 16px;
  height: 16px;
  background: var(--color-primary);
  border-radius: 50%;
  cursor: pointer;
  border: none;
}

.slider-value {
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--color-text-primary);
  min-width: 3rem;
  text-align: right;
}

/* Font Controls Row Layout */
.font-controls-row {
  display: flex;
  gap: 1rem;
}

.font-control {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.font-control label {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--color-text-secondary);
}

.font-control select {
  width: 100%;
}

/* Font Size Multiplier Controls */
.multiplier-controls {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 0.75rem;
  background: var(--color-bg-elevated);
  border-radius: 6px;
  border: 1px solid var(--color-border-light);
}

.multiplier-row {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.multiplier-label {
  font-size: 0.8rem;
  color: var(--color-text-secondary);
  min-width: 90px;
  margin: 0;
}

.multiplier-slider {
  flex: 1;
  -webkit-appearance: none;
  appearance: none;
  height: 3px;
  background: var(--color-bg-hover);
  border-radius: 2px;
  outline: none;
}

.multiplier-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 14px;
  height: 14px;
  background: var(--color-accent);
  border-radius: 50%;
  cursor: pointer;
}

.multiplier-slider::-moz-range-thumb {
  width: 14px;
  height: 14px;
  background: var(--color-accent);
  border-radius: 50%;
  cursor: pointer;
  border: none;
}

.multiplier-value {
  font-size: 0.8rem;
  color: var(--color-accent);
  min-width: 45px;
  text-align: right;
  font-weight: 500;
}

/* Typography Preview */
.typography-preview {
  margin-top: 1rem;
  padding: 1rem;
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border-medium);
  border-radius: 6px;
}

.typography-preview h5 {
  margin: 0 0 0.75rem 0;
  font-size: 0.9rem;
  color: var(--color-text-secondary);
  font-weight: 500;
}

.preview-content {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.preview-h1 {
  font-family: var(--font-family-display);
  font-size: var(--font-size-h1);
  font-weight: var(--font-weight-bold);
  line-height: 1.2;
  margin: 0;
  color: var(--color-text-primary);
}

.preview-h2 {
  font-family: var(--font-family-display);
  font-size: var(--font-size-h2);
  font-weight: var(--font-weight-bold);
  line-height: 1.2;
  margin: 0;
  color: var(--color-text-primary);
}

.preview-body {
  font-family: var(--font-family-base);
  font-size: var(--font-size-base);
  line-height: var(--line-height-base);
  letter-spacing: var(--letter-spacing-base);
  margin: 0;
  color: var(--color-text-secondary);
}

.preview-sm {
  font-family: var(--font-family-base);
  font-size: var(--font-size-sm);
  line-height: var(--line-height-base);
  letter-spacing: var(--letter-spacing-base);
  margin: 0;
}

.preview-lg {
  font-family: var(--font-family-base);
  font-size: var(--font-size-lg);
  line-height: var(--line-height-base);
  letter-spacing: var(--letter-spacing-base);
  margin: 0;
}

.preview-xl {
  font-family: var(--font-family-base);
  font-size: var(--font-size-xl);
  line-height: var(--line-height-base);
  letter-spacing: var(--letter-spacing-base);
  margin: 0;
}

.preview-2xl {
  font-family: var(--font-family-base);
  font-size: var(--font-size-2xl);
  line-height: var(--line-height-base);
  letter-spacing: var(--letter-spacing-base);
  margin: 0;
  color: var(--color-text-muted);
}
</style>