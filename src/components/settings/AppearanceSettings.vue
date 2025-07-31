<template>
  <div class="tab-content">
    <h2>Appearance</h2>
    
    <div class="settings-section">
      <h3>Choose Your Theme</h3>
      <p class="settings-description">
        Select a theme that matches your Burning Man vibe
      </p>
      
      <div class="theme-grid">
        <div
          v-for="(theme, key) in availableThemes"
          :key="key"
          :class="['theme-card', { active: isActiveTheme(key) }]"
          @click="selectTheme(key)"
        >
          <div class="theme-preview" :class="`theme-preview-${key}`">
            <div class="preview-header"></div>
            <div class="preview-content">
              <div class="preview-item"></div>
              <div class="preview-item"></div>
              <div class="preview-item"></div>
            </div>
          </div>
          <div class="theme-info">
            <h4>{{ theme.name }}</h4>
            <p>{{ theme.description }}</p>
          </div>
          <div v-if="isActiveTheme(key)" class="active-indicator">
            <span>✓ Active</span>
          </div>
        </div>
      </div>
    </div>
    
    <div class="settings-section">
      <h3>Theme Options</h3>
      
      <div class="setting-item">
        <label class="setting-toggle">
          <input type="checkbox" v-model="smoothTransitions">
          <span class="toggle-label">Smooth theme transitions</span>
        </label>
        <p class="setting-description">
          Enable smooth color transitions when switching themes
        </p>
      </div>
      
      <div class="setting-item">
        <label class="setting-toggle">
          <input type="checkbox" v-model="reduceMotion">
          <span class="toggle-label">Reduce motion</span>
        </label>
        <p class="setting-description">
          Disable animations for better accessibility
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { availableThemes, currentTheme, switchTheme, isActiveTheme } from '@/stores/themeStore'

// Theme preferences
const smoothTransitions = ref(localStorage.getItem('smoothTransitions') !== 'false')
const reduceMotion = ref(localStorage.getItem('reduceMotion') === 'true')

// Watch preferences and save
watch(smoothTransitions, (value) => {
  localStorage.setItem('smoothTransitions', value)
  document.documentElement.style.setProperty(
    'transition',
    value ? 'background-color 0.3s ease, color 0.3s ease' : 'none'
  )
})

watch(reduceMotion, (value) => {
  localStorage.setItem('reduceMotion', value)
  document.documentElement.classList.toggle('reduce-motion', value)
})

// Select theme
const selectTheme = (themeName) => {
  switchTheme(themeName)
}
</script>

<style scoped>
@import './settings-shared.css';

.theme-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
  margin-top: 1.5rem;
}

.theme-card {
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border-medium);
  border-radius: 8px;
  padding: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
}

.theme-card:hover {
  border-color: var(--color-primary);
  transform: translateY(-2px);
  box-shadow: 0 4px 8px var(--color-shadow-medium);
}

.theme-card.active {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px var(--color-primary);
}

.theme-preview {
  height: 120px;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 1rem;
  position: relative;
}

/* OKNOTOK Theme Preview */
.theme-preview-oknotok {
  background: #1a1a1a;
}

.theme-preview-oknotok .preview-header {
  height: 30px;
  background: #333;
  border-bottom: 1px solid #444;
}

.theme-preview-oknotok .preview-content {
  padding: 0.5rem;
}

.theme-preview-oknotok .preview-item {
  height: 20px;
  background: #8B0000;
  margin-bottom: 0.5rem;
  border-radius: 2px;
}

.theme-preview-oknotok .preview-item:nth-child(2) {
  background: #FFD700;
  width: 70%;
}

.theme-preview-oknotok .preview-item:nth-child(3) {
  background: #2a2a2a;
  width: 85%;
}

/* Sparkle Pony Theme Preview - Light "Barbie" Theme */
.theme-preview-sparkle {
  background: #FFF0F5; /* Lavender Blush - light pink background */
}

.theme-preview-sparkle .preview-header {
  height: 30px;
  background: #FFB6C1; /* Light Pink header */
  border-bottom: 1px solid #FFCDD2;
}

.theme-preview-sparkle .preview-content {
  padding: 0.5rem;
}

.theme-preview-sparkle .preview-item {
  height: 20px;
  background: #FF1493; /* Deep Pink (primary) */
  margin-bottom: 0.5rem;
  border-radius: 2px;
}

.theme-preview-sparkle .preview-item:nth-child(2) {
  background: #FF00FF; /* Electric Magenta (accent) */
  width: 70%;
}

.theme-preview-sparkle .preview-item:nth-child(3) {
  background: #FFFFFF; /* Pure White (elevated) */
  width: 85%;
  border: 1px solid #FFE4E6; /* Light pink border for visibility */
}

/* Khaki Theme Preview */
.theme-preview-khaki {
  background: #f5f5dc;
}

.theme-preview-khaki .preview-header {
  height: 30px;
  background: #deb887;
  border-bottom: 1px solid #cd853f;
}

.theme-preview-khaki .preview-content {
  padding: 0.5rem;
}

.theme-preview-khaki .preview-item {
  height: 20px;
  background: #8B7355;
  margin-bottom: 0.5rem;
  border-radius: 2px;
}

.theme-preview-khaki .preview-item:nth-child(2) {
  background: #DAA520;
  width: 70%;
}

.theme-preview-khaki .preview-item:nth-child(3) {
  background: #fff8dc;
  width: 85%;
}

/* Mush Love Theme Preview - Toned Down Psychedelic */
.theme-preview-mush {
  background: #0a0a0a; /* Near black base */
}

.theme-preview-mush .preview-header {
  height: 30px;
  background: #2d0052; /* Medium Purple header */
  border-bottom: 1px solid #6A0DAD; /* Purple border (toned down) */
}

.theme-preview-mush .preview-content {
  padding: 0.5rem;
}

.theme-preview-mush .preview-item {
  height: 20px;
  background: #8B008B; /* Dark Magenta (primary) */
  margin-bottom: 0.5rem;
  border-radius: 2px;
}

.theme-preview-mush .preview-item:nth-child(2) {
  background: #39FF14; /* Electric Lime (toned down from pure green) */
  width: 70%;
}

.theme-preview-mush .preview-item:nth-child(3) {
  background: #1a0033; /* Dark Purple (elevated) */
  width: 85%;
}

.theme-info h4 {
  margin: 0 0 0.5rem 0;
  color: var(--color-text-primary);
  font-size: 1.1rem;
}

.theme-info p {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.9rem;
}

.active-indicator {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: var(--color-primary);
  color: var(--color-text-inverse);
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
  font-size: 0.875rem;
  font-weight: 600;
}

.setting-toggle {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
}

.setting-toggle input[type="checkbox"] {
  width: 20px;
  height: 20px;
  cursor: pointer;
}

.toggle-label {
  font-weight: 600;
  color: var(--color-text-primary);
}

.setting-description {
  margin: 0.5rem 0 0 2rem;
  color: var(--color-text-muted);
  font-size: 0.875rem;
}

/* Reduce motion support */
@media (prefers-reduced-motion: reduce) {
  .theme-card {
    transition: none;
  }
}

.reduce-motion * {
  animation-duration: 0.01ms !important;
  animation-iteration-count: 1 !important;
  transition-duration: 0.01ms !important;
}
</style>