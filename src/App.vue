<template>
  <div>
    <WelcomeScreen 
      v-if="showOnboarding" 
      @complete="handleOnboardingComplete"
    />
    <GuidedTour 
      v-if="showTour"
      :tour-type="tourType"
      @complete="handleTourComplete"
      @skip="handleTourSkip"
    />
  <div class="app-container" v-if="!showOnboarding && !showTour">
    <ToastNotification ref="toastRef" />
    <header :class="{ 'mobile-header': isMobile }">
      <div class="header-row">
        <!-- Desktop Navigation -->
        <div class="nav-section" v-if="!isMobile">
          <!-- Theme Selector -->
          <div class="theme-selector-group">
            <select id="theme-selector" v-model="selectedTheme" @change="onThemeChange" class="unified-select">
              <option v-for="theme in availableThemes" :key="theme.id" :value="theme.id">
                {{ theme.name }}
              </option>
            </select>
          </div>
          <div class="year-selector-group">
            <select id="year-selector" v-model="selectedYear" @change="onYearChange" class="unified-select">
              <option value="2023">2023</option>
              <option value="2024">2024</option>
              <option value="2025">2025</option>
            </select>
          </div>
          <nav class="main-nav">
            <button @click="navigate('map')" :class="['nav-btn', { active: isActive('map') }]">MAP</button>
            <button @click="navigate('search')" :class="['nav-btn', { active: isActive('search') }]">SEARCH</button>
            <button @click="navigate('camps')" :class="['nav-btn', { active: isActive('camps') }]">CAMPS</button>
            <button @click="navigate('art')" :class="['nav-btn', { active: isActive('art') }]">ART</button>
            <button @click="navigate('events')" :class="['nav-btn', { active: isActive('events') }]">EVENTS</button>
            <button @click="navigate('infrastructure')" :class="['nav-btn', { active: isActive('infrastructure') }]">INFRA</button>
            <button @click="navigate('schedule')" :class="['nav-btn', { active: isActive('schedule') }]">SCHEDULE</button>
            <button @click="navigateToDust" :class="['nav-btn', { active: isActive('dust') }]">DUST</button>
          </nav>
        </div>
        
        <!-- App Title -->
        <div class="app-title-section">
          <h1 @click="navigateToSettings" class="app-title">OK-OFFLINE</h1>
          <button 
            @click="navigateToDataSync" 
            :class="['status-dot', { offline: !isOnline }]"
            :title="isOnline ? 'Online - Click for data sync' : 'Offline - Click for data sync'"
            aria-label="Connection status and data sync">
          </button>
        </div>
        
        <!-- Mobile Actions -->
        <div class="mobile-actions" v-if="isMobile">
          <button @click="navigate('search')" class="mobile-action-btn" aria-label="Search">
            🔍
          </button>
          <button @click="toggleMobileMenu" class="mobile-action-btn hamburger-btn" aria-label="Menu">
            ≡
          </button>
        </div>
      </div>
    </header>
    
    <!-- Mobile Menu Overlay -->
    <transition name="menu-overlay">
      <div v-if="showMobileMenu" class="mobile-menu-overlay" @click="closeMobileMenu"></div>
    </transition>
    
    <!-- Mobile Menu -->
    <transition name="menu-slide">
      <div v-if="showMobileMenu" class="mobile-menu">
        <div class="mobile-menu-header">
          <h3>MENU</h3>
          <button @click="closeMobileMenu" class="close-menu-btn" aria-label="Close menu">
            ✕
          </button>
        </div>
        
        <div class="mobile-menu-content">
          <!-- Year Selector -->
          <div class="menu-section">
            <label for="mobile-year-selector" class="menu-label">YEAR</label>
            <select id="mobile-year-selector" v-model="selectedYear" @change="onYearChange" class="menu-select">
              <option value="2023">2023</option>
              <option value="2024">2024</option>
              <option value="2025">2025</option>
            </select>
          </div>
          
          <!-- Additional Navigation -->
          <div class="menu-section">
            <h4 class="menu-section-title">MORE</h4>
            <button @click="navigateFromMenu('infrastructure')" class="menu-nav-btn">
              <span class="menu-icon">🏛️</span>
              <span class="menu-text">Infrastructure</span>
            </button>
            <button @click="navigateFromMenu('dust')" class="menu-nav-btn">
              <span class="menu-icon">🌪️</span>
              <span class="menu-text">Weather</span>
            </button>
            <button @click="navigateFromMenu('search')" class="menu-nav-btn">
              <span class="menu-icon">🔍</span>
              <span class="menu-text">Search</span>
            </button>
          </div>
          
          <!-- Settings & Info -->
          <div class="menu-section">
            <h4 class="menu-section-title">SETTINGS & INFO</h4>
            <button @click="navigateFromMenu('about')" class="menu-nav-btn">
              <span class="menu-icon">📱</span>
              <span class="menu-text">About</span>
            </button>
            <button @click="navigateFromMenu('features')" class="menu-nav-btn">
              <span class="menu-icon">✨</span>
              <span class="menu-text">Features</span>
            </button>
            <button @click="navigateFromMenu('settings')" class="menu-nav-btn">
              <span class="menu-icon">⚙️</span>
              <span class="menu-text">Settings</span>
            </button>
            <router-link to="/reset" class="menu-version">v{{ appVersion }}</router-link>
          </div>
        </div>
      </div>
    </transition>
    
    <main :class="{ 
      'has-bottom-nav': isMobile,
      'map-view': $route.name === 'map'
    }">
      <router-view :year="selectedYear"></router-view>
    </main>
    <BottomNav v-if="!showOnboarding && !showTour" :year="selectedYear" />
    <footer class="d-none" :class="{ 'mobile-footer': isMobile }" v-if="!isMobile || (isMobile && $route.name !== 'map')">
      <div class="footer-content">
        <!-- Mobile Footer: Compact Single Row -->
        <div class="footer-mobile d-none" v-if="isMobile">
          <div class="footer-brand">
            <span class="footer-title">OK-OFFLINE</span>
            <span class="footer-version">v{{ $route.meta?.version || '3.0.0' }}</span>
          </div>
          <div class="footer-links">
            <button @click="navigateToSettings" class="footer-link-btn">
              ⚙️ Settings
            </button>
          </div>
        </div>
        
        <!-- Desktop Footer: Multi-Column Professional Layout -->
        <!-- Disabled for evaluation of need -->
        <div class="footer-desktop d-none" v-else>
          <div class="footer-section footer-brand-section">
            <h3 class="footer-brand-title">OK-OFFLINE</h3>
            <p class="footer-description">
              Offline-first guide for Burning Man participants
            </p>
            <div class="footer-version-info">
              <span>Version {{ $route.meta?.version || '3.0.0' }}</span>
              <span class="footer-sync-status" v-if="lastSyncTime">
                Last sync: {{ formatLastSync }}
              </span>
            </div>
          </div>
          
          <div class="footer-section footer-data-section">
            <h4 class="footer-section-title">Data Sources</h4>
            <ul class="footer-links-list">
              <li>Burning Man Public API</li>
              <li>Innovate GIS Data</li>
              <li>Apple WeatherKit</li>
            </ul>
          </div>
          
          <div class="footer-section footer-legal-section">
            <h4 class="footer-section-title">Information</h4>
            <ul class="footer-links-list">
              <li>
                <button @click="navigateToSettings" class="footer-link-btn">
                  Settings & Sync
                </button>
              </li>
              <li>
                <a href="https://innovate.burningman.org" target="_blank" class="footer-external-link">
                  Terms of Service
                </a>
              </li>
            </ul>
          </div>
          
          <div class="footer-section footer-creator-section">
            <h4 class="footer-section-title">Brought to you by</h4>
            <p class="footer-creator">
              <a href="/2025/camps/a1XVI000009ssUT2AY" class="footer-camp-link">
                <span class="footer-brand-tag">Mr. OK of OKNOTOK</span>
              </a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  </div>
  </div>
</template>

<script setup>
import { ref, watch, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useKeyboardShortcuts } from './composables/useKeyboardShortcuts'
import { useSwipeGestures } from './composables/useSwipeGestures'
import { getSyncMetadata } from './services/staticDataSync'
import ToastNotification from './components/ToastNotification.vue'
import WelcomeScreen from './components/WelcomeScreen.vue'
import GuidedTour from './components/GuidedTour.vue'
import BottomNav from './components/BottomNav.vue'
import { setToastRef } from './composables/useToast'
import packageJson from '../package.json'
import { themes, getCurrentTheme, applyTheme } from './services/themeService'

const route = useRoute()
const router = useRouter()

// Get app version from package.json
const appVersion = packageJson.version

// Toast notification ref
const toastRef = ref(null)
const selectedYear = ref('2024')
const isOnline = ref(navigator.onLine)
const lastSyncTime = ref(null)
const showOnboarding = ref(false)
const showTour = ref(false)
const tourType = ref('general')
const selectedTheme = ref(getCurrentTheme())

// Check if device is truly mobile (phone, not tablet)
const checkIfMobile = () => {
  // Simple width-based detection for all environments
  return window.innerWidth < 600
}

const isMobile = ref(checkIfMobile())
const showMobileMenu = ref(false)

// Enable keyboard shortcuts - disabled for now
// useKeyboardShortcuts()

// Enable swipe gestures on mobile
useSwipeGestures()

// Update online status
const updateOnlineStatus = () => {
  isOnline.value = navigator.onLine
}

// Get last sync time
const updateLastSyncTime = () => {
  // Check sync times for all types in current year
  const types = ['camp', 'art', 'event']
  let mostRecentSync = null
  
  types.forEach(type => {
    const metadata = getSyncMetadata(type, selectedYear.value)
    if (metadata?.lastSync) {
      const syncDate = new Date(metadata.lastSync)
      if (!mostRecentSync || syncDate > mostRecentSync) {
        mostRecentSync = syncDate
      }
    }
  })
  
  lastSyncTime.value = mostRecentSync
}

// Format last sync time
const formatLastSync = computed(() => {
  if (!lastSyncTime.value) return 'Never'
  
  const now = new Date()
  const diff = now - lastSyncTime.value
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  return `${days}d ago`
})

// Get available themes for selector
const availableThemes = computed(() => {
  return Object.values(themes)
})

// Check if user needs onboarding
const checkOnboardingStatus = () => {
  const onboardingCompleted = localStorage.getItem('onboarding_completed')
  const hasAnyCachedData = ['camp', 'art', 'event'].some(type => {
    return getSyncMetadata(type, selectedYear.value)?.lastSync
  })
  
  // Show onboarding if never completed AND no cached data exists
  showOnboarding.value = !onboardingCompleted && !hasAnyCachedData
}

// Handle onboarding completion
const handleOnboardingComplete = (data) => {
  showOnboarding.value = false
  
  if (data.selectedYear) {
    selectedYear.value = data.selectedYear
    localStorage.setItem('selectedYear', data.selectedYear)
  }
  
  if (data.showTour) {
    // Start guided tour after a brief delay
    setTimeout(() => {
      tourType.value = 'general'
      showTour.value = true
    }, 500)
  }
  
  // Navigate to map view
  router.push(`/${selectedYear.value}/map`)
}

// Handle guided tour completion
const handleTourComplete = () => {
  showTour.value = false
}

const handleTourSkip = () => {
  showTour.value = false
}

// Handle window resize
const handleResize = () => {
  isMobile.value = checkIfMobile()
}

// Store interval reference outside
let syncInterval = null

onMounted(async () => {
  // Set up toast notifications after component is fully mounted
  await nextTick()
  setToastRef(toastRef)
  
  // Delay onboarding check slightly to ensure loading screen shows first
  setTimeout(() => {
    checkOnboardingStatus()
  }, 100)
  
  window.addEventListener('online', updateOnlineStatus)
  window.addEventListener('offline', updateOnlineStatus)
  window.addEventListener('resize', handleResize)
  updateLastSyncTime()
  
  // Update last sync time every minute
  syncInterval = setInterval(updateLastSyncTime, 60000)
})

// Register cleanup separately at top level
onUnmounted(() => {
  window.removeEventListener('online', updateOnlineStatus)
  window.removeEventListener('offline', updateOnlineStatus)
  window.removeEventListener('resize', handleResize)
  if (syncInterval) {
    clearInterval(syncInterval)
  }
})

// Load saved year from localStorage (default to 2024)
const savedYear = localStorage.getItem('selectedYear')
if (savedYear && ['2023', '2024', '2025'].includes(savedYear)) {
  selectedYear.value = savedYear
} else {
  // Default to 2024 if no saved year
  selectedYear.value = '2024'
  localStorage.setItem('selectedYear', '2024')
}

// Update year from route
watch(() => route.params.year, (year) => {
  if (year && ['2023', '2024', '2025'].includes(year)) {
    selectedYear.value = year
    localStorage.setItem('selectedYear', year)
    updateLastSyncTime() // Update sync time when year changes
  }
}, { immediate: true })

const navigate = (view) => {
  router.push(`/${selectedYear.value}/${view}`)
}

const onYearChange = () => {
  localStorage.setItem('selectedYear', selectedYear.value)
  const currentView = route.name || 'map'
  router.push(`/${selectedYear.value}/${currentView}`)
}

const isActive = (view) => {
  return route.name === view
}

const navigateToSettings = () => {
  router.push('/settings')
}

const navigateToDust = () => {
  router.push('/dust')
}

const navigateToDataSync = () => {
  router.push('/settings/data_sync')
}

// Mobile menu methods
const toggleMobileMenu = () => {
  showMobileMenu.value = !showMobileMenu.value
  if (showMobileMenu.value) {
    // Use nextTick to ensure DOM is updated before setting overflow
    nextTick(() => {
      document.body.style.overflow = 'hidden'
      document.body.style.position = 'fixed'
      document.body.style.width = '100%'
    })
  } else {
    document.body.style.overflow = ''
    document.body.style.position = ''
    document.body.style.width = ''
  }
}

const closeMobileMenu = () => {
  showMobileMenu.value = false
  document.body.style.overflow = ''
  document.body.style.position = ''
  document.body.style.width = ''
}

const navigateFromMenu = (destination) => {
  closeMobileMenu()
  
  switch(destination) {
    case 'infrastructure':
      router.push(`/${selectedYear.value}/infrastructure`)
      break
    case 'dust':
      router.push('/dust')
      break
    case 'search':
      router.push(`/${selectedYear.value}/search`)
      break
    case 'settings':
      router.push('/settings')
      break
    case 'about':
      router.push('/settings/about')
      break
    case 'features':
      router.push('/settings/features')
      break
  }
}

// Theme selector handler
const onThemeChange = () => {
  applyTheme(selectedTheme.value)
}
</script>

<style>
/* Global styles for map view header/footer spacing */
@media (min-width: 600px) {
  main.map-view .view {
    top: 67px !important;
    bottom: 222px !important;
  }
}
</style>

<style scoped>
/* ===== HEADER BASE STYLES ===== */
header {
  padding: 0;
  background: var(--color-bg-header);
  border-bottom: 1px solid var(--color-border-medium);
}

.header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 0.75rem 1rem;
  gap: 1rem;
  max-width: 1200px;
  margin: 0 auto;
}

/* ===== DESKTOP NAVIGATION SECTION ===== */
.nav-section {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
}

.year-selector-group,
.theme-selector-group {
  display: flex;
  align-items: center;
}

.unified-select {
  background-color: var(--color-bg-input);
  color: var(--color-text-secondary);
  border: 1px solid var(--color-border-heavy);
  padding: 0.5rem 2rem 0.5rem 0.75rem;
  border-radius: 4px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease;
  appearance: none;
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23666666' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
  background-position: right 0.5rem center;
  background-repeat: no-repeat;
  background-size: 1.25rem;
}

.unified-select:hover {
  background-color: var(--color-bg-hover);
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23333333' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
  background-position: right 0.5rem center;
  background-repeat: no-repeat;
  background-size: 1.25rem;
  color: var(--color-text-primary);
  border-color: var(--color-primary);
}

.unified-select:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px var(--color-primary-alpha-20);
}

.main-nav {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

/* ===== UNIFIED BUTTON SYSTEM ===== */
.nav-btn {
  background: transparent;
  color: var(--color-text-secondary);
  border: 1px solid transparent;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.nav-btn:hover {
  background: var(--color-primary);
  color: var(--color-text-inverse);
  border-color: var(--color-primary);
}

.nav-btn.active {
  background: var(--color-primary);
  color: var(--color-text-inverse);
  border-color: var(--color-primary);
}

/* ===== APP TITLE ===== */
.app-title-section {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
}

.app-title {
  cursor: pointer;
  transition: color 0.2s;
  margin: 0;
  flex-shrink: 0;
  font-size: 1.5rem;
  font-weight: bold;
  color: var(--color-text-primary);
}

.app-title:hover {
  color: var(--color-primary);
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--color-success);
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.status-dot.offline {
  background: var(--color-error);
}

.status-dot:hover {
  transform: scale(1.2);
  box-shadow: 0 0 8px var(--color-success-glow);
}

.status-dot.offline:hover {
  box-shadow: 0 0 8px var(--color-error-glow);
}

/* ===== STATUS SECTION ===== */
.status-section {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.status-indicator {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.25rem;
  padding: 0.5rem;
  background: var(--color-bg-input-alpha-50);
  border-radius: 4px;
  border: 1px solid var(--color-border-heavy);
}

.status-primary {
  display: flex;
  align-items: center;
}

.status-secondary {
  display: flex;
  align-items: center;
}

.online-status {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  color: var(--color-success);
  font-size: 0.85rem;
  font-weight: 500;
}

.online-status.offline {
  color: var(--color-error);
}

.last-sync {
  color: var(--color-text-muted);
  font-size: 0.75rem;
}

/* Mobile-specific styles */
.app-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

main {
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

main.has-bottom-nav {
  /* Account for bottom nav height + safe area */
  padding-bottom: calc(60px + env(safe-area-inset-bottom, 0));
}

/* Special handling for map view */
main.map-view {
  overflow: hidden; /* Prevent scrolling on map view */
}

main.map-view .view {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}

/* Desktop map view should account for header/footer */
@media (min-width: 600px) {
  main.map-view .view {
    top: 67px; /* Account for header height */
    left: 0;
    right: 0;
    bottom: 222px; /* Account for footer height */
  }
}

/* Ensure header and footer are above map */
header {
  position: relative;
  z-index: 10;
}

footer {
  position: relative;
  z-index: 10;
}

/* ===== MOBILE HEADER ENHANCEMENTS ===== */
.mobile-header {
  position: sticky;
  top: 0;
  z-index: 2000;
  background: var(--color-bg-header);
  border-bottom: 1px solid var(--color-border-medium);
  box-shadow: 0 2px 4px var(--color-shadow-light);
}

.mobile-header .header-row {
  padding: 0.75rem 1rem;
  gap: 0.75rem;
  max-width: none; /* Full width on mobile */
}

.mobile-header .app-title {
  font-size: 1.2rem;
  font-weight: bold;
  color: var(--color-text-primary);
  flex: 1;
  text-align: center;
}

.mobile-header .status-indicator {
  display: none;
}

/* ===== MOBILE ACTION BUTTONS (UNIFIED SYSTEM) ===== */
.mobile-actions {
  display: flex;
  gap: 0;
}

.mobile-action-btn {
  background: var(--color-bg-input);
  border: 1px solid var(--color-border-heavy);
  color: var(--color-text-secondary);
  min-width: 44px;  /* Touch-friendly minimum */
  height: 44px; /* Touch-friendly minimum */
  padding: 0 12px; /* Add horizontal padding */
  border-radius: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  cursor: pointer;
  transition: all 0.2s ease;
  -webkit-tap-highlight-color: transparent;
  position: relative;
}

/* First button (search) */
.mobile-action-btn:first-child {
  border-top-left-radius: 8px;
  border-bottom-left-radius: 8px;
  border-right: none;
}

/* Last button (hamburger) */
.mobile-action-btn:last-child {
  border-top-right-radius: 8px;
  border-bottom-right-radius: 8px;
}

.mobile-action-btn:hover {
  background: var(--color-primary);
  color: var(--color-text-primary);
  border-color: var(--color-primary);
  z-index: 1;
}

.mobile-action-btn:active {
  transform: scale(0.95);
  background: var(--color-primary);
  color: var(--color-text-primary);
}

/* Hamburger button specific styles */
.hamburger-btn {
  font-size: 36px;
  line-height: 1;
  padding-bottom: 4px; /* Adjust for visual centering */
}

/* ===== FOOTER UNIFIED DESIGN ===== */
footer {
  background: var(--color-bg-header);
  border-top: 1px solid var(--color-border-medium);
  margin-top: auto;
}

.footer-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem;
}

/* ===== MOBILE FOOTER ===== */
.footer-mobile {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 0;
  gap: 1rem;
}

.footer-brand {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.footer-title {
  font-weight: bold;
  color: var(--color-text-primary);
  font-size: 0.9rem;
}

.footer-version {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  background: var(--color-bg-input);
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
}

.footer-links {
  display: flex;
  gap: 0.5rem;
}

.footer-link-btn {
  background: var(--color-bg-input);
  color: var(--color-text-secondary);
  border: 1px solid var(--color-border-heavy);
  padding: 0.5rem 0.75rem;
  border-radius: 4px;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.footer-link-btn:hover,
.footer-link-btn:active {
  background: var(--color-primary);
  color: var(--color-text-primary);
  border-color: var(--color-primary);
}

/* ===== DESKTOP FOOTER ===== */
.footer-desktop {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr;
  gap: 2rem;
  padding: 2rem 0;
}

.footer-section {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.footer-brand-title {
  font-size: 1.5rem;
  font-weight: bold;
  color: var(--color-text-primary);
  margin: 0;
}

.footer-description {
  color: var(--color-text-secondary);
  font-size: 0.9rem;
  line-height: 1.4;
  margin: 0;
}

.footer-version-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-size: 0.8rem;
  color: var(--color-text-muted);
}

.footer-sync-status {
  color: var(--color-text-muted);
}

.footer-section-title {
  font-size: 1rem;
  font-weight: bold;
  color: var(--color-text-primary);
  margin: 0 0 0.5rem 0;
}

.footer-links-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.footer-links-list li {
  font-size: 0.9rem;
  color: var(--color-text-secondary);
}

.footer-external-link {
  color: var(--color-text-secondary);
  text-decoration: none;
  transition: color 0.2s ease;
}

.footer-external-link:hover {
  color: var(--color-primary);
}

.footer-creator {
  font-size: 0.9rem;
  color: var(--color-text-secondary);
  margin: 0;
  line-height: 1.4;
}

.footer-brand-tag {
  color: var(--color-primary);
  font-weight: bold;
}

.footer-camp-link {
  text-decoration: none;
  transition: opacity 0.2s ease;
}

.footer-camp-link:hover {
  opacity: 0.8;
}

.footer-camp-link:hover .footer-brand-tag {
  color: var(--color-error);
}

/* Utility class for hiding elements */
.d-none {
  display: none !important;
}

@media (max-width: 600px) {
  .header-row {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
  
  .app-title {
    order: 1;
    text-align: left;
    margin: 0;
  }
  
  nav {
    display: none; /* Hidden on mobile since we have bottom nav */
  }
  
  /* Mobile footer: compact and accessible */
  .mobile-footer {
    display: block;
  }
}

/* Landscape mode adjustments */
@media (max-width: 600px) and (orientation: landscape) {
  main.has-bottom-nav {
    padding-bottom: calc(50px + env(safe-area-inset-bottom, 0));
  }
  
  .bottom-nav {
    height: 50px;
  }
  
  .nav-item {
    min-height: 40px;
  }
}

/* ===== MOBILE MENU STYLES ===== */
.mobile-menu-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--color-overlay-dark);
  z-index: 2998;
}

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
  background: none;
  border: none;
  color: var(--color-text-secondary);
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0.5rem;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.close-menu-btn:hover {
  background: var(--color-white-alpha-10);
  color: var(--color-text-primary);
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

.menu-section-title {
  color: var(--color-accent);
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0 0 1rem 0;
}

.menu-nav-btn {
  display: flex;
  align-items: center;
  gap: 1rem;
  width: 100%;
  padding: 0.875rem 1rem;
  background: var(--color-bg-header);
  border: 1px solid var(--color-border-medium);
  border-radius: 0;
  color: var(--color-text-secondary);
  cursor: pointer;
  margin-bottom: 0;
  transition: all 0.2s ease;
  text-align: left;
  border-top: 0;
}

/* First button in each section */
.menu-section .menu-nav-btn:first-of-type {
  border-top: 1px solid var(--color-border-medium);
  border-top-left-radius: 4px;
  border-top-right-radius: 4px;
}

/* Last button in each section */
.menu-section .menu-nav-btn:last-of-type {
  border-bottom-left-radius: 4px;
  border-bottom-right-radius: 4px;
}

.menu-nav-btn:hover {
  background: var(--color-primary);
  color: var(--color-text-primary);
  border-color: var(--color-primary);
  z-index: 1;
  position: relative;
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
  opacity: 0.7;
  text-decoration: underline;
}

/* Menu transitions */
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
</style>