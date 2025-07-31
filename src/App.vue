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
    <AppHeader 
      :is-mobile="isMobile"
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
    <BottomNav v-if="!showOnboarding && !showTour" :year="selectedYear" />
    <AppFooter 
      :selected-theme="selectedTheme"
      :available-themes="availableThemes"
      @update:selected-theme="selectedTheme = $event; onThemeChange()"
      @reset="navigateToReset"
    />
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
import AppHeader from './components/layout/AppHeader.vue'
import AppFooter from './components/layout/AppFooter.vue'
import MobileMenu from './components/layout/MobileMenu.vue'
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

const navigateToReset = () => {
  router.push('/reset')
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
</script>


<style scoped>
/* ===== APP LAYOUT STYLES ===== */
/* Full-screen PWA layout */
.app-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden; /* Prevent body scrolling */
}

main {
  flex: 1 1 auto; /* Grow and shrink, take remaining space */
  overflow: hidden; /* Let individual views manage their own scrolling */
  position: relative;
  min-height: 0; /* Important for nested flex containers */
}

/* Bottom nav spacing handled by views themselves */

/* Special handling for map view */
main.map-view {
  position: relative;
  overflow: hidden;
}

/* Landscape mode adjustments moved to component files */
</style>