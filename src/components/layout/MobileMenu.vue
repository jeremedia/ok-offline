<template>
  <div>
    <!-- Overlay -->
    <transition name="menu-overlay">
      <div v-if="show" class="mobile-menu-overlay" @click="$emit('close')"></div>
    </transition>
    
    <!-- Menu Panel -->
    <transition name="menu-slide">
      <div v-if="show" class="mobile-menu">
        <div class="mobile-menu-header">
          <h3>MENU</h3>
          <button @click="$emit('close')" class="close-menu-btn" aria-label="Close menu">
            ✕
          </button>
        </div>
        
        <div class="mobile-menu-content">
          <!-- Year Selector -->
          <div class="menu-section">
            <label for="mobile-year-selector" class="menu-label">YEAR</label>
            <select 
              id="mobile-year-selector" 
              :value="selectedYear" 
              @change="handleYearChange"
              class="menu-select"
            >
              <option value="2023">2023</option>
              <option value="2024">2024</option>
              <option value="2025">2025</option>
            </select>
          </div>
          
          <!-- Theme Selector -->
          <div class="menu-section">
            <label for="mobile-theme-selector" class="menu-label">THEME</label>
            <select 
              id="mobile-theme-selector" 
              :value="currentTheme" 
              @change="handleThemeChange"
              class="menu-select"
            >
              <option value="oknotok">OKNOTOK</option>
              <option value="sparkle">Sparkle</option>
              <option value="khaki">Khaki</option>
              <option value="mush">Mush</option>
            </select>
          </div>
          
          <!-- Additional Navigation -->
          <div class="menu-section">
            <h4 class="menu-section-title">MORE</h4>
            <ButtonGroup direction="vertical">
              <BaseButton @click="navigateTo('infrastructure')" variant="secondary" :uppercase="false" fullWidth class="menu-nav-btn">
                <span class="menu-icon">🏛️</span>
                <span class="menu-text">Infrastructure</span>
              </BaseButton>
              <BaseButton @click="navigateTo('dust')" variant="secondary" :uppercase="false" fullWidth class="menu-nav-btn">
                <span class="menu-icon">🌪️</span>
                <span class="menu-text">Weather</span>
              </BaseButton>
              <BaseButton @click="navigateTo('search')" variant="secondary" :uppercase="false" fullWidth class="menu-nav-btn">
                <span class="menu-icon">🔍</span>
                <span class="menu-text">Search</span>
              </BaseButton>
            </ButtonGroup>
          </div>
          
          <!-- Settings & Info -->
          <div class="menu-section">
            <h4 class="menu-section-title">SETTINGS & INFO</h4>
            <ButtonGroup direction="vertical">
              <BaseButton @click="navigateTo('about')" variant="secondary" :uppercase="false" fullWidth class="menu-nav-btn">
                <span class="menu-icon">📱</span>
                <span class="menu-text">About</span>
              </BaseButton>
              <BaseButton @click="navigateTo('features')" variant="secondary" :uppercase="false" fullWidth class="menu-nav-btn">
                <span class="menu-icon">✨</span>
                <span class="menu-text">Features</span>
              </BaseButton>
              <BaseButton @click="navigateTo('settings')" variant="secondary" :uppercase="false" fullWidth class="menu-nav-btn">
                <span class="menu-icon">⚙️</span>
                <span class="menu-text">Settings</span>
              </BaseButton>
            </ButtonGroup>
            <router-link to="/reset" class="menu-version">v{{ appVersion }}</router-link>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import packageJson from '../../../package.json'
import { getCurrentTheme, applyTheme } from '../../services/themeService'
import { BaseButton, ButtonGroup } from '../ui'

const appVersion = packageJson.version

const props = defineProps({
  show: {
    type: Boolean,
    required: true
  },
  selectedYear: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['close', 'update:selectedYear'])

const router = useRouter()
const currentTheme = ref(getCurrentTheme())

const handleYearChange = (event) => {
  emit('update:selectedYear', event.target.value)
}

const handleThemeChange = (event) => {
  const theme = event.target.value
  currentTheme.value = theme
  applyTheme(theme)
  localStorage.setItem('selectedTheme', theme)
}

const navigateTo = (route) => {
  // Routes that don't need year
  if (['dust', 'settings'].includes(route)) {
    router.push(`/${route}`)
  } else if (route === 'about') {
    router.push('/settings/about')
  } else if (route === 'features') {
    router.push('/settings/features')
  } else {
    // Routes that need year (infrastructure, search, etc)
    router.push(`/${props.selectedYear}/${route}`)
  }
  emit('close')
}
</script>

<style scoped>
/* Transitions - must be defined before elements that use them */
.menu-overlay-enter-active,
.menu-overlay-leave-active {
  transition: opacity 0.3s ease;
}

.menu-overlay-enter-from,
.menu-overlay-leave-to {
  opacity: 0;
}

.menu-slide-enter-active,
.menu-slide-leave-active {
  transition: transform 0.3s ease;
}

.menu-slide-enter-from,
.menu-slide-leave-to {
  transform: translateX(100%);
}

/* Mobile Menu Overlay */
.mobile-menu-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--color-overlay-dark);
  z-index: 2998;
  backdrop-filter: blur(4px);
}

/* Mobile Menu Panel */
.mobile-menu {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  width: 280px;
  max-width: 85vw;
  background: var(--color-bg-elevated);
  box-shadow: -2px 0 8px var(--color-shadow-medium);
  z-index: 2999;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.mobile-menu-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem;
  background: var(--color-bg-header);
  border-bottom: 1px solid var(--color-border-medium);
}

.mobile-menu-header h3 {
  margin: 0;
  color: var(--color-text-primary);
  font-size: 1.2rem;
  padding-left: 0.5rem;
}

.close-menu-btn {
  font-size: 1.5rem;
  width: 44px;
  height: 44px;
}

.mobile-menu-content {
  flex: 1;
  padding: 1rem;
  overflow-y: auto;
}

.menu-section {
  margin-bottom: 0.75rem;
  padding-bottom: 0.75rem;
}

.menu-section:last-child {
  border-bottom: none;
}

.menu-label {
  display: block;
  color: var(--color-accent);
  font-size: 0.875rem;
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.menu-section-title {
  color: var(--color-accent);
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0 0 1rem 0;
}

.menu-select {
  width: 100%;
  padding: 0.875rem 2.5rem 0.875rem 1rem;
  background: var(--color-bg-header);
  border: 1px solid var(--color-border-medium);
  border-radius: 4px;
  color: var(--color-text-primary);
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.menu-select:hover {
  background: var(--color-bg-input);
  border-color: var(--color-primary);
}

/* Button content styling */
.menu-nav-btn {
  text-align: left;
}

/* Force BaseButton content to flex layout */
.menu-nav-btn :deep(.btn-content) {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  justify-content: flex-start;
  padding: 0.75rem 1rem;
  text-align: left;
  min-height: 44px; /* Touch target */
}


.menu-icon {
  font-size: 1.25rem;
  width: 24px;
  text-align: center;
}

.menu-text {
  font-size: 1rem;
  flex: 1;
}

.menu-version {
  display: block;
  text-align: center;
  color: var(--color-accent);
  font-size: 0.875rem;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--color-bg-input);
  text-decoration: none;
  transition: opacity 0.2s ease;
}

.menu-version:hover {
  opacity: 0.8;
}
</style>