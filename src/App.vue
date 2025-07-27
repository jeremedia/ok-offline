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
          <button @click="navigateToSettings" class="mobile-action-btn" aria-label="Settings">
            ⚙️
          </button>
        </div>
      </div>
    </header>
    <main :class="{ 
      'has-bottom-nav': isMobile,
      'map-view': $route.name === 'map'
    }">
      <router-view :year="selectedYear"></router-view>
    </main>
    <BottomNav v-if="!showOnboarding && !showTour" :year="selectedYear" />
    <footer :class="{ 'mobile-footer': isMobile }" v-if="!isMobile || (isMobile && $route.name !== 'map')">
      <div class="footer-content">
        <!-- Mobile Footer: Compact Single Row -->
        <div class="footer-mobile" v-if="isMobile">
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

const route = useRoute()
const router = useRouter()

// Toast notification ref
const toastRef = ref(null)
const selectedYear = ref('2024')
const isOnline = ref(navigator.onLine)
const lastSyncTime = ref(null)
const showOnboarding = ref(false)
const showTour = ref(false)
const tourType = ref('general')

// Check if device is truly mobile (phone, not tablet)
const checkIfMobile = () => {
  // Simple width-based detection for all environments
  return window.innerWidth < 600
}

const isMobile = ref(checkIfMobile())

// Enable keyboard shortcuts
useKeyboardShortcuts()

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

onMounted(async () => {
  // Set up toast notifications after component is fully mounted
  await nextTick()
  setToastRef(toastRef)
  
  // Check if user needs onboarding before setting up the rest
  checkOnboardingStatus()
  
  window.addEventListener('online', updateOnlineStatus)
  window.addEventListener('offline', updateOnlineStatus)
  window.addEventListener('resize', handleResize)
  updateLastSyncTime()
  
  // Update last sync time every minute
  const interval = setInterval(updateLastSyncTime, 60000)
  
  onUnmounted(() => {
    window.removeEventListener('online', updateOnlineStatus)
    window.removeEventListener('offline', updateOnlineStatus)
    window.removeEventListener('resize', handleResize)
    clearInterval(interval)
  })
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
  background: #333;
  border-bottom: 1px solid #444;
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

.year-selector-group {
  display: flex;
  align-items: center;
}

.unified-select {
  background: #444;
  color: #ccc;
  border: 1px solid #555;
  padding: 0.5rem 0.75rem;
  border-radius: 4px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.unified-select:hover {
  background: #555;
  color: #fff;
  border-color: #8B0000;
}

.unified-select:focus {
  outline: none;
  border-color: #8B0000;
  box-shadow: 0 0 0 2px rgba(139, 0, 0, 0.2);
}

.main-nav {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

/* ===== UNIFIED BUTTON SYSTEM ===== */
.nav-btn {
  background: transparent;
  color: #ccc;
  border: 1px solid transparent;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.nav-btn:hover {
  background: #8B0000;
  color: #fff;
  border-color: #8B0000;
}

.nav-btn.active {
  background: #8B0000;
  color: #fff;
  border-color: #8B0000;
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
  color: #fff;
}

.app-title:hover {
  color: #8B0000;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #4CAF50;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.status-dot.offline {
  background: #f44336;
}

.status-dot:hover {
  transform: scale(1.2);
  box-shadow: 0 0 8px rgba(76, 175, 80, 0.5);
}

.status-dot.offline:hover {
  box-shadow: 0 0 8px rgba(244, 67, 54, 0.5);
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
  background: rgba(68, 68, 68, 0.5);
  border-radius: 4px;
  border: 1px solid #555;
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
  color: #4CAF50;
  font-size: 0.85rem;
  font-weight: 500;
}

.online-status.offline {
  color: #f44336;
}

.last-sync {
  color: #999;
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
  background: #333;
  border-bottom: 1px solid #444;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.mobile-header .header-row {
  padding: 0.75rem 1rem;
  gap: 0.75rem;
  max-width: none; /* Full width on mobile */
}

.mobile-header .app-title {
  font-size: 1.2rem;
  font-weight: bold;
  color: #fff;
  flex: 1;
  text-align: center;
}

.mobile-header .status-indicator {
  display: none;
}

/* ===== MOBILE ACTION BUTTONS (UNIFIED SYSTEM) ===== */
.mobile-actions {
  display: flex;
  gap: 0.5rem;
}

.mobile-action-btn {
  background: #444;
  border: 1px solid #555;
  color: #ccc;
  width: 44px;  /* Touch-friendly minimum */
  height: 44px; /* Touch-friendly minimum */
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  cursor: pointer;
  transition: all 0.2s ease;
  -webkit-tap-highlight-color: transparent;
}

.mobile-action-btn:hover {
  background: #8B0000;
  color: #fff;
  border-color: #8B0000;
}

.mobile-action-btn:active {
  transform: scale(0.95);
  background: #8B0000;
  color: #fff;
}

/* ===== FOOTER UNIFIED DESIGN ===== */
footer {
  background: #333;
  border-top: 1px solid #444;
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
  color: #fff;
  font-size: 0.9rem;
}

.footer-version {
  font-size: 0.75rem;
  color: #999;
  background: #444;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
}

.footer-links {
  display: flex;
  gap: 0.5rem;
}

.footer-link-btn {
  background: #444;
  color: #ccc;
  border: 1px solid #555;
  padding: 0.5rem 0.75rem;
  border-radius: 4px;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.footer-link-btn:hover,
.footer-link-btn:active {
  background: #8B0000;
  color: #fff;
  border-color: #8B0000;
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
  color: #fff;
  margin: 0;
}

.footer-description {
  color: #ccc;
  font-size: 0.9rem;
  line-height: 1.4;
  margin: 0;
}

.footer-version-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-size: 0.8rem;
  color: #999;
}

.footer-sync-status {
  color: #888;
}

.footer-section-title {
  font-size: 1rem;
  font-weight: bold;
  color: #fff;
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
  color: #ccc;
}

.footer-external-link {
  color: #ccc;
  text-decoration: none;
  transition: color 0.2s ease;
}

.footer-external-link:hover {
  color: #8B0000;
}

.footer-creator {
  font-size: 0.9rem;
  color: #ccc;
  margin: 0;
  line-height: 1.4;
}

.footer-brand-tag {
  color: #8B0000;
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
  color: #FF4444;
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
</style>