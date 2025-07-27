<template>
  <section id="reset-section" class="view">
    <div class="reset-container">
      <div class="reset-header">
        <h1>🔧 Development Reset</h1>
        <p>Reset the app to test onboarding and caching features</p>
      </div>

      <div class="reset-options">
        <div class="reset-card">
          <h3>🎯 Quick Onboarding Reset</h3>
          <p>Clear onboarding status to see the welcome screen again</p>
          <button @click="resetOnboarding" class="reset-btn primary" :disabled="resetting">
            {{ resetting ? 'Resetting...' : 'Reset Onboarding' }}
          </button>
        </div>

        <div class="reset-card">
          <h3>🗄️ Clear Cached Data</h3>
          <p>Remove all synced data (camps, art, events) to test sync flow</p>
          <button @click="clearCachedData" class="reset-btn secondary" :disabled="resetting">
            {{ resetting ? 'Clearing...' : 'Clear Data Cache' }}
          </button>
        </div>

        <div class="reset-card">
          <h3>💾 Clear Service Worker Cache</h3>
          <p>Remove service worker caches for fresh app load testing</p>
          <button @click="clearServiceWorkerCache" class="reset-btn secondary" :disabled="resetting">
            {{ resetting ? 'Clearing...' : 'Clear SW Cache' }}
          </button>
        </div>

        <div class="reset-card danger">
          <h3>🚨 Full Reset</h3>
          <p>Clear everything: onboarding, data, caches, and user preferences</p>
          <button @click="fullReset" class="reset-btn danger" :disabled="resetting">
            {{ resetting ? 'Resetting...' : 'Full Reset' }}
          </button>
        </div>
      </div>

      <div class="current-status">
        <h3>📊 Current Status</h3>
        <div class="status-grid">
          <div class="status-item">
            <strong>Onboarding:</strong>
            <span :class="onboardingStatus.completed ? 'status-completed' : 'status-pending'">
              {{ onboardingStatus.completed ? 'Completed' : 'Pending' }}
            </span>
          </div>
          <div class="status-item">
            <strong>Cached Data:</strong>
            <span :class="dataStatus.hasData ? 'status-completed' : 'status-pending'">
              {{ dataStatus.totalItems }} items cached
            </span>
          </div>
          <div class="status-item">
            <strong>Selected Year:</strong>
            <span class="status-info">{{ currentYear }}</span>
          </div>
          <div class="status-item">
            <strong>Service Worker:</strong>
            <span :class="swStatus.active ? 'status-completed' : 'status-pending'">
              {{ swStatus.active ? 'Active' : 'Not Active' }}
            </span>
          </div>
          <div class="status-item">
            <strong>Storage Used:</strong>
            <span class="status-info">{{ formatBytes(storageInfo.usage) }}</span>
          </div>
        </div>
      </div>

      <div class="reset-actions">
        <button @click="refreshStatus" class="refresh-btn" :disabled="resetting">
          🔄 Refresh Status
        </button>
        <button @click="goHome" class="home-btn">
          🏠 Back to App
        </button>
      </div>

      <div v-if="resetLog.length > 0" class="reset-log">
        <h3>📝 Reset Log</h3>
        <div class="log-entries">
          <div 
            v-for="(entry, index) in resetLog" 
            :key="index"
            :class="['log-entry', `log-${entry.type}`]"
          >
            <span class="log-time">{{ entry.time }}</span>
            <span class="log-message">{{ entry.message }}</span>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { clearYear, getSyncStatus } from '../services/staticDataSync'
import { clearCache } from '../services/storage'
import { serviceWorkerManager, getCacheInfo } from '../services/serviceWorkerManager'
import { useToast } from '../composables/useToast'

const props = defineProps({
  autoReset: {
    type: Boolean,
    default: false
  }
})

const router = useRouter()
const { showSuccess, showInfo, showError } = useToast()

const resetting = ref(false)
const resetLog = ref([])
const onboardingStatus = ref({ completed: false })
const dataStatus = ref({ hasData: false, totalItems: 0 })
const currentYear = ref('2024')
const swStatus = ref({ active: false })
const storageInfo = ref({ usage: 0, quota: 0 })

const addLogEntry = (message, type = 'info') => {
  resetLog.value.unshift({
    time: new Date().toLocaleTimeString(),
    message,
    type
  })
  
  // Keep only last 10 entries
  if (resetLog.value.length > 10) {
    resetLog.value = resetLog.value.slice(0, 10)
  }
}

const resetOnboarding = async () => {
  resetting.value = true
  
  try {
    // Clear onboarding completion flag
    localStorage.removeItem('onboarding_completed')
    
    // Clear tour completion flags
    const tourKeys = ['general', 'map', 'list', 'search']
    tourKeys.forEach(tour => {
      localStorage.removeItem(`tour_completed_${tour}`)
    })
    
    addLogEntry('Onboarding status cleared', 'success')
    showSuccess('Onboarding reset complete - refresh to see welcome screen')
    
    await refreshStatus()
  } catch (error) {
    addLogEntry(`Failed to reset onboarding: ${error.message}`, 'error')
    showError('Failed to reset onboarding')
  } finally {
    resetting.value = false
  }
}

const clearCachedData = async () => {
  resetting.value = true
  
  try {
    // Clear IndexedDB data
    await clearCache()
    
    // Clear sync metadata for all years
    const years = ['2023', '2024', '2025']
    await Promise.all(years.map(year => clearYear(year)))
    
    addLogEntry('Cached data cleared', 'success')
    showSuccess('Cached data cleared - sync will be required')
    
    await refreshStatus()
  } catch (error) {
    addLogEntry(`Failed to clear cached data: ${error.message}`, 'error')
    showError('Failed to clear cached data')
  } finally {
    resetting.value = false
  }
}

const clearServiceWorkerCache = async () => {
  resetting.value = true
  
  try {
    // Clear all caches
    const cacheNames = await caches.keys()
    await Promise.all(cacheNames.map(name => caches.delete(name)))
    
    // Try to update service worker
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration()
      if (registration) {
        await registration.update()
      }
    }
    
    addLogEntry('Service Worker caches cleared', 'success')
    showSuccess('Service Worker caches cleared - refresh for full effect')
    
    await refreshStatus()
  } catch (error) {
    addLogEntry(`Failed to clear SW cache: ${error.message}`, 'error')
    showError('Failed to clear Service Worker cache')
  } finally {
    resetting.value = false
  }
}

const fullReset = async (skipConfirm = false) => {
  if (!skipConfirm && !confirm('Are you sure you want to reset everything? This will clear all data and preferences.')) {
    return
  }
  
  resetting.value = true
  
  try {
    // Clear onboarding
    localStorage.removeItem('onboarding_completed')
    
    // Clear tour flags
    const tourKeys = ['general', 'map', 'list', 'search']
    tourKeys.forEach(tour => {
      localStorage.removeItem(`tour_completed_${tour}`)
    })
    
    // Clear cached data
    await clearCache()
    
    // Clear sync metadata for all years
    const years = ['2023', '2024', '2025']
    await Promise.all(years.map(year => clearYear(year)))
    
    // Clear user preferences
    localStorage.removeItem('selectedYear')
    localStorage.removeItem('favorites_camp')
    localStorage.removeItem('favorites_art')
    localStorage.removeItem('favorites_event')
    localStorage.removeItem('schedule')
    localStorage.removeItem('emergency_contacts')
    localStorage.removeItem('visits_camp')
    localStorage.removeItem('visits_art')
    localStorage.removeItem('visits_event')
    
    // Clear service worker caches
    const cacheNames = await caches.keys()
    await Promise.all(cacheNames.map(name => caches.delete(name)))
    
    addLogEntry('Full reset completed', 'success')
    showSuccess('Full reset complete - refresh to start fresh')
    
    await refreshStatus()
  } catch (error) {
    addLogEntry(`Full reset failed: ${error.message}`, 'error')
    showError('Full reset failed')
  } finally {
    resetting.value = false
  }
}

const refreshStatus = async () => {
  try {
    // Check onboarding status
    onboardingStatus.value.completed = !!localStorage.getItem('onboarding_completed')
    
    // Check data status
    const years = ['2023', '2024', '2025']
    let totalItems = 0
    let hasData = false
    
    for (const year of years) {
      const status = await getSyncStatus(year)
      const yearTotal = Object.values(status).reduce((sum, s) => sum + (s.count || 0), 0)
      totalItems += yearTotal
      if (yearTotal > 0) hasData = true
    }
    
    dataStatus.value = { hasData, totalItems }
    
    // Check current year
    currentYear.value = localStorage.getItem('selectedYear') || '2024'
    
    // Check service worker status
    swStatus.value.active = 'serviceWorker' in navigator && 
      !!(await navigator.serviceWorker.getRegistration())
    
    // Check storage info
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate()
      storageInfo.value = {
        usage: estimate.usage || 0,
        quota: estimate.quota || 0
      }
    }
    
    addLogEntry('Status refreshed', 'info')
  } catch (error) {
    addLogEntry(`Status refresh failed: ${error.message}`, 'error')
  }
}

const formatBytes = (bytes) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

const goHome = () => {
  router.push('/')
}

onMounted(async () => {
  if (props.autoReset) {
    // Perform immediate full reset and redirect
    addLogEntry('Auto-reset initiated', 'info')
    await fullReset(true) // Skip confirmation
    
    // Redirect to home after a brief delay
    setTimeout(() => {
      router.push('/')
    }, 1000)
  } else {
    refreshStatus()
    addLogEntry('Reset page loaded', 'info')
  }
})
</script>

<style scoped>
.reset-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
}

.reset-header {
  text-align: center;
  margin-bottom: 3rem;
}

.reset-header h1 {
  color: #FFD700;
  margin-bottom: 0.5rem;
}

.reset-header p {
  color: #ccc;
  font-size: 1.1rem;
}

.reset-options {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-bottom: 3rem;
}

.reset-card {
  background: #2a2a2a;
  border: 1px solid #444;
  border-radius: 8px;
  padding: 1.5rem;
  transition: border-color 0.2s;
}

.reset-card:hover {
  border-color: #8B0000;
}

.reset-card.danger {
  border-color: #ff6b6b;
}

.reset-card.danger:hover {
  border-color: #ff5252;
  background: rgba(255, 107, 107, 0.1);
}

.reset-card h3 {
  color: #FFD700;
  margin: 0 0 0.5rem 0;
  font-size: 1.1rem;
}

.reset-card p {
  color: #ccc;
  margin: 0 0 1rem 0;
  font-size: 0.9rem;
  line-height: 1.4;
}

.reset-btn {
  width: 100%;
  padding: 0.75rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  transition: all 0.2s;
}

.reset-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.reset-btn.primary {
  background: #8B0000;
  color: #fff;
}

.reset-btn.primary:hover:not(:disabled) {
  background: #a00;
}

.reset-btn.secondary {
  background: #444;
  color: #ccc;
}

.reset-btn.secondary:hover:not(:disabled) {
  background: #555;
  color: #fff;
}

.reset-btn.danger {
  background: #ff6b6b;
  color: #fff;
}

.reset-btn.danger:hover:not(:disabled) {
  background: #ff5252;
}

.current-status {
  background: #1a1a1a;
  border: 1px solid #333;
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 2rem;
}

.current-status h3 {
  color: #FFD700;
  margin: 0 0 1rem 0;
}

.status-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.status-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #ccc;
}

.status-completed {
  color: #4CAF50;
  font-weight: 500;
}

.status-pending {
  color: #ff9800;
  font-weight: 500;
}

.status-info {
  color: #2196F3;
  font-weight: 500;
}

.reset-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-bottom: 2rem;
}

.refresh-btn, .home-btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s;
}

.refresh-btn {
  background: #444;
  color: #ccc;
}

.refresh-btn:hover:not(:disabled) {
  background: #555;
  color: #fff;
}

.home-btn {
  background: #8B0000;
  color: #fff;
}

.home-btn:hover {
  background: #a00;
}

.reset-log {
  background: #1a1a1a;
  border: 1px solid #333;
  border-radius: 8px;
  padding: 1.5rem;
}

.reset-log h3 {
  color: #FFD700;
  margin: 0 0 1rem 0;
}

.log-entries {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-height: 200px;
  overflow-y: auto;
}

.log-entry {
  display: flex;
  gap: 1rem;
  padding: 0.5rem;
  border-radius: 4px;
  font-size: 0.9rem;
}

.log-info {
  background: rgba(33, 150, 243, 0.1);
  border-left: 3px solid #2196F3;
}

.log-success {
  background: rgba(76, 175, 80, 0.1);
  border-left: 3px solid #4CAF50;
}

.log-error {
  background: rgba(244, 67, 54, 0.1);
  border-left: 3px solid #f44336;
}

.log-time {
  color: #999;
  flex-shrink: 0;
  font-family: monospace;
  font-size: 0.8rem;
}

.log-message {
  color: #ccc;
}

@media (max-width: 768px) {
  .reset-container {
    padding: 1rem;
  }
  
  .reset-options {
    grid-template-columns: 1fr;
  }
  
  .status-grid {
    grid-template-columns: 1fr;
  }
  
  .reset-actions {
    flex-direction: column;
  }
}
</style>