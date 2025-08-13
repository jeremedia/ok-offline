<template>
  <div class="app-root">
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
    <AppHeader 
      :selected-year="selectedYear"
      :is-online="isOnline"
      @update:selected-year="selectedYear = $event"
      @navigate="handleHeaderNavigate"
      @toggle-menu="toggleMobileMenu"
    />
    
    <MobileMenu 
      :show="showMobileMenu"
      :selected-year="selectedYear"
      @close="closeMobileMenu"
      @update:selected-year="selectedYear = $event"
    />
    
    <main :class="{ 
      'has-bottom-nav': isMobile,
      'map-view': $route.name === 'map'
    }">
      <router-view :year="selectedYear"></router-view>
    </main>
    <BottomNav 
      v-if="!showOnboarding && !showTour" 
      :year="selectedYear" 
      @toggle-map-controls="handleToggleMapControls"
    />
    <AppFooter 
      v-if="!isMobile"
      :selected-theme="selectedTheme"
      :available-themes="availableThemes"
      @update:selected-theme="selectedTheme = $event; onThemeChange()"
      @reset="navigateToReset"
      @openThemeEditor="openThemeEditor"
    />
  </div>
  <!-- Theme Editor (Development Only) -->
  <ThemeEditor v-if="isDevelopment" ref="themeEditorRef" />
  </div>
</template>

<script setup>
import { ref, watch, computed, onMounted, onUnmounted, nextTick, provide, watchEffect } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useKeyboardShortcuts } from './composables/useKeyboardShortcuts'
import { useSwipeGestures } from './composables/useSwipeGestures'
import { getSyncMetadata } from './services/staticDataSync'
import ToastNotification from './components/ToastNotification.vue'
import WelcomeScreen from './components/WelcomeScreen.vue'
import GuidedTour from './components/GuidedTour.vue'
import BottomNav from './components/BottomNav.vue'
import AppHeader from './components/layout/AppHeader.vue'
import AppFooter from './components/layout/AppFooter.vue'
import MobileMenu from './components/layout/MobileMenu.vue'
import { setToastRef } from './composables/useToast'
import packageJson from '../package.json'
import { getCurrentTheme, applyTheme } from './services/themeService'
import { availableThemes as storeAvailableThemes } from './stores/themeStore'
import ThemeEditor from './components/ThemeEditor.vue'

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
const intendedDestination = ref(null) // Store route user was trying to access

// Check if device is truly mobile (phone, not tablet)
const checkIfMobile = () => {
  const isSmallScreen = window.innerWidth < 600
  const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0
  const mobileRegex = /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini|Mobile/i
  const isMobileUA = mobileRegex.test(navigator.userAgent)
  
  // For development: use screen width only
  if (import.meta.env.DEV) {
    return isSmallScreen
  }
  
  // Production mobile detection: small screen + touch capability or mobile UA
  return isSmallScreen && (hasTouch || isMobileUA)
}

const isMobile = ref(checkIfMobile())
const isDevelopment = ref(import.meta.env.DEV)
const themeEditorRef = ref(null)

// Apply body-level mobile class for global CSS targeting
watchEffect(() => {
  if (isMobile.value) {
    document.body.classList.add('mobile-device')
    document.body.classList.remove('desktop-device')
  } else {
    document.body.classList.add('desktop-device')
    document.body.classList.remove('mobile-device')
  }
})
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
  return Object.values(storeAvailableThemes.value)
})

// Check if user needs onboarding
const checkOnboardingStatus = () => {
  const onboardingCompleted = localStorage.getItem('onboarding_completed')
  const hasAnyCachedData = ['camp', 'art', 'event'].some(type => {
    return getSyncMetadata(type, selectedYear.value)?.lastSync
  })
  
  console.log('🔍 Onboarding check:', {
    onboardingCompleted,
    hasAnyCachedData,
    routeFullPath: route?.fullPath,
    windowLocation: window.location.pathname
  })
  
  const needsOnboarding = !onboardingCompleted && !hasAnyCachedData
  
  if (needsOnboarding) {
    // Capture the current route before showing onboarding
    intendedDestination.value = route?.fullPath || window.location.pathname
    console.log('🎯 Preserving intended destination:', intendedDestination.value)
  }
  
  console.log('🔍 Onboarding needed:', needsOnboarding)
  
  // Show onboarding if never completed AND no cached data exists
  showOnboarding.value = needsOnboarding
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
  
  // Refresh the current page instead of navigating
  console.log('Refreshing page after onboarding completion')
  window.location.reload()
}

// Helper function to determine valid post-onboarding destination
const getValidDestination = () => {
  console.log('🔍 getValidDestination called, intendedDestination:', intendedDestination.value)
  
  if (!intendedDestination.value) {
    // No preserved destination, use default
    console.log('🔍 No intended destination, using default map')
    return `/${selectedYear.value}/map`
  }
  
  // Check if the intended destination is a year-based route
  const yearRoutePattern = /^\/(\d{4})\//
  const match = intendedDestination.value.match(yearRoutePattern)
  
  if (match) {
    // Update year in the route to match selected year
    const routeWithoutYear = intendedDestination.value.replace(yearRoutePattern, '/')
    const result = `/${selectedYear.value}${routeWithoutYear}`
    console.log('🔍 Year-based route detected, updating:', intendedDestination.value, '->', result)
    return result
  }
  
  // For non-year routes (like /prompts, /settings, /dust), use as-is
  const yearlessRoutes = ['/prompts', '/settings', '/dust', '/reset', '/components', '/knowledge', '/icon_viewer']
  const isYearlessRoute = yearlessRoutes.some(route => intendedDestination.value.startsWith(route))
  
  if (isYearlessRoute) {
    console.log('🔍 Yearless route detected, using as-is:', intendedDestination.value)
    return intendedDestination.value
  }
  
  // Fallback to map if we can't determine the route type
  console.log('🔍 Unknown route type, fallback to map:', intendedDestination.value)
  return `/${selectedYear.value}/map`
}

// Handle guided tour completion
const handleTourComplete = () => {
  showTour.value = false
  
  // If we have an intended destination and we're not already there, navigate to it
  if (intendedDestination.value && route.fullPath !== intendedDestination.value) {
    const destination = getValidDestination()
    console.log('Post-tour navigation to intended destination:', destination)
    router.push(destination)
  }
  
  // Clear the intended destination after use
  intendedDestination.value = null
}

const handleTourSkip = () => {
  showTour.value = false
  
  // Same logic as tour completion
  if (intendedDestination.value && route.fullPath !== intendedDestination.value) {
    const destination = getValidDestination()
    console.log('Post-tour-skip navigation to intended destination:', destination)
    router.push(destination)
  }
  
  // Clear the intended destination after use
  intendedDestination.value = null
}

// Handle window resize
const handleResize = () => {
  const wasMobile = isMobile.value
  isMobile.value = checkIfMobile()
  
  // Log mobile state changes for debugging
  if (wasMobile !== isMobile.value) {
    console.log(`Device mode changed: ${isMobile.value ? 'mobile' : 'desktop'} (${window.innerWidth}px)`)
  }
}

// Store interval reference outside
let syncInterval = null

// Handle keyboard shortcuts for theme editor
const handleKeyPress = (e) => {
  // Cmd/Ctrl + Shift + T to toggle theme editor
  if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'T') {
    e.preventDefault()
    if (themeEditorRef.value) {
      themeEditorRef.value.toggle()
    }
  }
}

onMounted(async () => {
  // Set up toast notifications after component is fully mounted
  await nextTick()
  setToastRef(toastRef)
  
  // APP PATTERN: Handle initial year detection here (not in watch immediate)
  // Check route for year parameter and update selectedYear if found
  if (route.params?.year && ['2023', '2024', '2025'].includes(route.params.year)) {
    selectedYear.value = route.params.year
    localStorage.setItem('selectedYear', route.params.year)
    updateLastSyncTime()
  }
  
  // Delay onboarding check slightly to ensure loading screen shows first
  setTimeout(() => {
    checkOnboardingStatus()
  }, 100)
  
  window.addEventListener('online', updateOnlineStatus)
  window.addEventListener('keydown', handleKeyPress)
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
  window.removeEventListener('keydown', handleKeyPress)
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
// IMPORTANT: No { immediate: true } - follows app-wide pattern
// - onMounted() handles initial year detection (see below)
// - watch() handles reactive route changes only
watch(() => route.params?.year, (year) => {
  if (year && ['2023', '2024', '2025'].includes(year)) {
    selectedYear.value = year
    localStorage.setItem('selectedYear', year)
    updateLastSyncTime() // Update sync time when year changes
  }
})

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

const navigateToReset = () => {
  router.push('/reset')
}

const openThemeEditor = () => {
  if (themeEditorRef.value) {
    themeEditorRef.value.show()
  }
}

const handleHeaderNavigate = (path) => {
  if (path === 'settings') {
    router.push('/settings')
  } else if (path === 'settings/data_sync') {
    router.push('/settings/data_sync')
  }
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

// Map controls toggle event
const mapControlsToggleEvent = ref(0)

const handleToggleMapControls = () => {
  console.log('App: Received toggle-map-controls event')
  // Increment to trigger watchers in MapView
  mapControlsToggleEvent.value++
  console.log('App: mapControlsToggleEvent value:', mapControlsToggleEvent.value)
}

// Provide the event to child components
provide('mapControlsToggle', mapControlsToggleEvent)
</script>


<style scoped>
/* ===== APP LAYOUT STYLES ===== */
/* Root element must not exceed parent height */
.app-root {
  height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* Full-screen PWA layout */
.app-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden; /* Prevent body scrolling */
  min-height: 0; /* Important for nested flexbox */
}

main {
  flex: 1 1 auto; /* Grow and shrink, take remaining space */
  overflow: hidden; /* Let individual views manage their own scrolling */
  position: relative;
  min-height: 0; /* Important for nested flex containers */
}

/* Global content width constraint */
.content-container {
  height: 100%;
  max-width: 1200px; /* Match header width constraint */
  margin: 0 auto;
  position: relative;
  overflow: hidden; /* Let views handle scrolling */
}

/* Desktop borders for content container */
body.desktop-device .content-container {
  border-left: 1px solid var(--color-border-medium);
  border-right: 1px solid var(--color-border-medium);
}

/* Map view should fill full width without borders */
main.map-view .content-container {
  max-width: none;
  border-left: none;
  border-right: none;
}

/* Landscape mode adjustments moved to component files */
</style>