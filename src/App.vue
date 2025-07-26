<template>
  <div>
    <ToastNotification ref="toastRef" />
    <header>
      <div class="header-row">
        <nav>
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
          <button @click="navigateToEmergency" :class="['emergency-btn', { active: isActive('emergency') }]">🚨 Emergency</button>
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
import { setToastRef } from './composables/useToast'

const route = useRoute()
const router = useRouter()

// Toast notification ref
const toastRef = ref(null)
const selectedYear = ref('2025')
const isOnline = ref(navigator.onLine)
const lastSyncTime = ref(null)

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

onMounted(async () => {
  // Set up toast notifications after component is fully mounted
  await nextTick()
  setToastRef(toastRef)
  
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

// Load saved year from localStorage
const savedYear = localStorage.getItem('selectedYear')
if (savedYear && ['2023', '2024', '2025'].includes(savedYear)) {
  selectedYear.value = savedYear
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

const navigateToEmergency = () => {
  router.push('/emergency')
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

.emergency-btn {
  background: #8B0000 !important;
  color: #fff !important;
  border: 1px solid #a00000 !important;
}

.emergency-btn:hover {
  background: #a00000 !important;
}

.emergency-btn.active {
  background: #ff0000 !important;
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