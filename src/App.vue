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
    <ToastNotification ref="toastRef" />
    <header>
      <div class="header-row">
        <nav>
          <select id="year-selector" v-model="selectedYear" @change="onYearChange">
            <option value="2023">2023</option>
            <option value="2024">2024</option>
            <option value="2025">2025</option>
          </select>
          <button @click="navigate('map')" :class="{ active: isActive('map') }" data-view="map">Map</button>
          <button @click="navigate('camps')" :class="{ active: isActive('camps') }" data-view="camps">Camps</button>
          <button @click="navigate('art')" :class="{ active: isActive('art') }" data-view="art">Art</button>
          <button @click="navigate('events')" :class="{ active: isActive('events') }" data-view="events">Events</button>
          <button @click="navigate('search')" :class="{ active: isActive('search') }" data-view="search">🔍 Search</button>
          <button @click="navigate('schedule')" :class="{ active: isActive('schedule') }" data-view="schedule">📅 Schedule</button>
          <button @click="navigateToDust" :class="{ active: isActive('dust') }">🌪️ Dust</button>
        </nav>
        <h1 @click="navigateToSettings" class="app-title">OK-OFFLINE</h1>
        <div class="status-indicator">
          <span :class="['online-status', { offline: !isOnline }]">
            {{ isOnline ? '🟢' : '🔴' }} {{ isOnline ? 'Online' : 'Offline' }}
          </span>
          <span v-if="lastSyncTime" class="last-sync">
            Last sync: {{ formatLastSync }}
          </span>
        </div>
      </div>
    </header>
    <main>
      <router-view :year="selectedYear"></router-view>
    </main>
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
import { getSyncMetadata } from './services/staticDataSync'
import ToastNotification from './components/ToastNotification.vue'
import WelcomeScreen from './components/WelcomeScreen.vue'
import GuidedTour from './components/GuidedTour.vue'
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

// Enable keyboard shortcuts
useKeyboardShortcuts()

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

onMounted(async () => {
  // Set up toast notifications after component is fully mounted
  await nextTick()
  setToastRef(toastRef)
  
  // Check if user needs onboarding before setting up the rest
  checkOnboardingStatus()
  
  window.addEventListener('online', updateOnlineStatus)
  window.addEventListener('offline', updateOnlineStatus)
  updateLastSyncTime()
  
  // Update last sync time every minute
  const interval = setInterval(updateLastSyncTime, 60000)
  
  onUnmounted(() => {
    window.removeEventListener('online', updateOnlineStatus)
    window.removeEventListener('offline', updateOnlineStatus)
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

@media (max-width: 768px) {
  .header-row {
    flex-direction: column;
    align-items: stretch;
  }
  
  nav {
    order: 2;
    margin-top: 0.5rem;
  }
  
  .app-title {
    order: 1;
    text-align: center;
    margin: 0;
  }
  
  .status-indicator {
    order: 3;
    align-items: center;
    margin-top: 0.5rem;
  }
}
</style>