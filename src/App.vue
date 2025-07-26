<template>
  <div class="app-container">
    <ToastNotification ref="toastRef" />
    <header :class="{ 'mobile-header': isMobile }">
      <div class="header-row">
        <nav v-if="!isMobile">
          <select id="year-selector" v-model="selectedYear" @change="onYearChange">
            <option value="2023">2023</option>
            <option value="2024">2024</option>
            <option value="2025">2025</option>
          </select>
          <button @click="navigate('map')" :class="{ active: isActive('map') }">Map</button>
          <button @click="navigate('camps')" :class="{ active: isActive('camps') }">Camps</button>
          <button @click="navigate('art')" :class="{ active: isActive('art') }">Art</button>
          <button @click="navigate('events')" :class="{ active: isActive('events') }">Events</button>
          <button @click="navigate('search')" :class="{ active: isActive('search') }">🔍 Search</button>
          <button @click="navigate('schedule')" :class="{ active: isActive('schedule') }">📅 Schedule</button>
          <button @click="navigateToDust" :class="{ active: isActive('dust') }">🌪️ Dust</button>
        </nav>
        <h1 @click="navigateToSettings" class="app-title">OK-OFFLINE</h1>
        <div class="mobile-actions" v-if="isMobile">
          <button @click="navigate('search')" class="mobile-action-btn" aria-label="Search">
            🔍
          </button>
          <button @click="navigateToSettings" class="mobile-action-btn" aria-label="Settings">
            ⚙️
          </button>
        </div>
        <div class="status-indicator" v-if="!isMobile">
          <span :class="['online-status', { offline: !isOnline }]">
            {{ isOnline ? '🟢' : '🔴' }} {{ isOnline ? 'Online' : 'Offline' }}
          </span>
          <span v-if="lastSyncTime" class="last-sync">
            Last sync: {{ formatLastSync }}
          </span>
        </div>
      </div>
    </header>
    <main :class="{ 
      'has-bottom-nav': isMobile,
      'map-view': $route.name === 'map'
    }">
      <router-view :year="selectedYear"></router-view>
    </main>
    <BottomNav :year="selectedYear" />
    <footer>
      <p>
        Data provided by the Burning Man Public API and Innovate GIS data.
        See the Burning Man Innovate website for terms of service.
      </p>
    </footer>
  </div>
</template>

<script setup>
import { ref, watch, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useKeyboardShortcuts } from './composables/useKeyboardShortcuts'
import { useSwipeGestures } from './composables/useSwipeGestures'
import { getSyncMetadata } from './services/staticDataSync'
import ToastNotification from './components/ToastNotification.vue'
import BottomNav from './components/BottomNav.vue'
import { setToastRef } from './composables/useToast'

const route = useRoute()
const router = useRouter()

// Toast notification ref
const toastRef = ref(null)
const selectedYear = ref('2024')
const isOnline = ref(navigator.onLine)
const lastSyncTime = ref(null)
// Check if device is truly mobile (phone, not tablet)
const checkIfMobile = () => {
  // Check viewport width AND touch capability
  const isSmallScreen = window.innerWidth < 600
  const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0
  
  // Also check user agent for mobile devices (excluding iPads)
  const mobileRegex = /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini|Mobile/i
  const isMobileUA = mobileRegex.test(navigator.userAgent)
  
  // For development: use screen width only
  if (isSmallScreen) return true
  
  // Production mobile detection
  return isSmallScreen && (hasTouch || isMobileUA)
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

// Handle window resize
const handleResize = () => {
  isMobile.value = checkIfMobile()
}

onMounted(async () => {
  // Set up toast notifications after component is fully mounted
  await nextTick()
  setToastRef(toastRef)
  
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
</script>

<style scoped>
header {
  padding: 0;
}

.header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 0.75rem 1rem;
  gap: 1rem;
  flex-wrap: wrap;
}

nav {
  flex: 1;
  min-width: 0;
}

.app-title {
  cursor: pointer;
  transition: color 0.2s;
  margin: 0 1rem;
  flex-shrink: 0;
}

.app-title:hover {
  color: #8B0000;
}

button.active {
  background-color: #8B0000;
  color: #fff;
}

@media (prefers-color-scheme: dark) {
  button.active {
    background-color: #8B0000;
    color: #fff;
  }
}

.status-indicator {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.25rem;
  font-size: 0.8rem;
  flex-shrink: 0;
}

.online-status {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  color: #4CAF50;
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

.mobile-header {
  position: sticky;
  top: 0;
  z-index: 2000;
  background: #333;
}

.mobile-header .header-row {
  padding: 0.5rem 1rem;
  gap: 0.5rem;
}

.mobile-header .app-title {
  font-size: 1.1rem;
}

.mobile-header .status-indicator {
  display: none;
}

/* Mobile action buttons */
.mobile-actions {
  display: flex;
  gap: 0.5rem;
}

.mobile-action-btn {
  background: none;
  border: 1px solid #555;
  color: #fff;
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  cursor: pointer;
  transition: all 0.2s ease;
  -webkit-tap-highlight-color: transparent;
}

.mobile-action-btn:active {
  transform: scale(0.9);
  background: rgba(255, 255, 255, 0.1);
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
  
  /* Hide footer on mobile to save space */
  footer {
    display: none;
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