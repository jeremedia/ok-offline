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

        <div class="reset-card">
          <h3>🗺️ Clear Map Tiles</h3>
          <p>Remove offline map tiles to test re-downloading</p>
          <button @click="clearMapTiles" class="reset-btn secondary" :disabled="resetting">
            {{ resetting ? 'Clearing...' : 'Clear Map Tiles' }}
          </button>
        </div>

        <div class="reset-card danger">
          <h3>🚨 Full Reset</h3>
          <p>Clear everything: onboarding, data, caches, and user preferences</p>
          <button @click="fullReset" class="reset-btn danger" :disabled="resetting">
            {{ resetting ? 'Resetting...' : 'Full Reset' }}
          </button>
        </div>

        <div class="reset-card danger">
          <h3>🏗️ PWA Test Reset</h3>
          <p>Complete wipe for testing fresh PWA installation (unregisters service workers)</p>
          <button @click="pwaTestReset" class="reset-btn danger" :disabled="resetting">
            {{ resetting ? 'Resetting...' : 'PWA Test Reset' }}
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
        <div class="log-header">
          <h3>📝 Reset Log</h3>
          <button @click="copyLogs" class="copy-logs-btn" title="Copy logs to clipboard">
            📋 Copy Logs
          </button>
        </div>
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

const clearMapTiles = async () => {
  resetting.value = true
  
  try {
    // Clear the leaflet.offline database
    addLogEntry('Clearing map tiles database...', 'info')
    
    const deleteReq = indexedDB.deleteDatabase('leaflet.offline')
    
    await new Promise((resolve, reject) => {
      deleteReq.onsuccess = () => {
        addLogEntry('Map tiles database cleared', 'success')
        resolve()
      }
      
      deleteReq.onerror = () => {
        addLogEntry('Failed to clear map tiles database', 'error')
        reject(new Error('Failed to delete database'))
      }
      
      deleteReq.onblocked = () => {
        addLogEntry('Map tiles database blocked - close map view and try again', 'warning')
        resolve() // Still resolve to complete the operation
      }
    })
    
    showSuccess('Map tiles cleared - re-download through Settings')
    await refreshStatus()
  } catch (error) {
    addLogEntry(`Failed to clear map tiles: ${error.message}`, 'error')
    showError('Failed to clear map tiles')
  } finally {
    resetting.value = false
  }
}

const pwaTestReset = async () => {
  console.log('PWA Test Reset clicked')
  if (!confirm('This will completely wipe the app for PWA testing. Continue?')) {
    console.log('Reset cancelled by user')
    return
  }
  
  console.log('Starting PWA test reset...')
  try {
    // Use the enhanced fullReset function
    await fullReset(true)
  } catch (error) {
    console.error('PWA test reset error:', error)
    resetting.value = false
  }
}

const fullReset = async (skipConfirm = false) => {
  if (!skipConfirm && !confirm('Are you sure you want to reset everything? This will clear all data and preferences.')) {
    return
  }
  
  resetting.value = true
  
  try {
    addLogEntry('Starting full reset...', 'info')
    
    // 1. Clear ALL localStorage items
    addLogEntry('Clearing localStorage...', 'info')
    localStorage.clear()
    
    // 2. Clear ALL sessionStorage items
    addLogEntry('Clearing sessionStorage...', 'info')
    sessionStorage.clear()
    
    // 3. Clear ALL IndexedDB databases
    addLogEntry('Clearing IndexedDB...', 'info')
    try {
      if ('indexedDB' in window) {
        // The databases() method is not widely supported, so we'll use known names
        const knownDatabases = ['bm2025-db', 'bm2024-db', 'bm2023-db']
      
      // If databases() is available, use it
      if (indexedDB.databases) {
        try {
          const databases = await indexedDB.databases()
          for (const db of databases) {
            await indexedDB.deleteDatabase(db.name)
            addLogEntry(`Deleted database: ${db.name}`, 'info')
          }
        } catch (e) {
          console.error('indexedDB.databases() error:', e)
          addLogEntry('Note: indexedDB.databases() not supported, using known names', 'info')
        }
      }
      
      // Add leaflet.offline to known databases
      knownDatabases.push('leaflet.offline')
      
      // Always try to delete known database names
      for (const dbName of knownDatabases) {
        try {
          const deleteReq = indexedDB.deleteDatabase(dbName)
          await new Promise((resolve, reject) => {
            deleteReq.onsuccess = () => {
              addLogEntry(`Deleted database: ${dbName}`, 'success')
              resolve()
            }
            deleteReq.onerror = () => {
              // Database might not exist, that's ok
              addLogEntry(`Database ${dbName} not found or already deleted`, 'info')
              resolve()
            }
            deleteReq.onblocked = () => {
              // Database is blocked, but we'll continue anyway
              addLogEntry(`Database ${dbName} blocked, continuing...`, 'info')
              resolve()
            }
            // Add timeout to prevent hanging
            setTimeout(() => {
              addLogEntry(`Database ${dbName} deletion timed out, continuing...`, 'info')
              resolve()
            }, 2000)
          })
        } catch (e) {
          console.error(`Error deleting database ${dbName}:`, e)
          addLogEntry(`Error with ${dbName}: ${e.message}`, 'error')
          // Continue with other databases
        }
      }
      }
    } catch (e) {
      console.error('IndexedDB clearing error:', e)
      addLogEntry(`IndexedDB error: ${e.message}, continuing...`, 'error')
    }
    
    addLogEntry('IndexedDB clearing completed', 'success')
    
    // 4. Clear ALL cookies
    addLogEntry('Clearing cookies...', 'info')
    try {
      const cookies = document.cookie.split(";")
      cookies.forEach(cookie => {
        if (cookie) {
          const eqPos = cookie.indexOf("=")
          const name = eqPos > -1 ? cookie.substring(0, eqPos).trim() : cookie.trim()
          if (name) {
            // Clear cookie for current path and domain variations
            document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`
            document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`
            document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=.${window.location.hostname}`
          }
        }
      })
      addLogEntry('Cookies cleared', 'success')
    } catch (e) {
      console.error('Cookie clearing error:', e)
      addLogEntry('Note: Some cookies may not be clearable', 'info')
    }
    
    // 5. Clear ALL service worker caches
    addLogEntry('Clearing service worker caches...', 'info')
    try {
      if ('caches' in window) {
        const cacheNames = await caches.keys()
        await Promise.all(cacheNames.map(name => {
          addLogEntry(`Deleting cache: ${name}`, 'info')
          return caches.delete(name)
        }))
        addLogEntry('Service worker caches cleared', 'success')
      } else {
        addLogEntry('Cache API not available in this context', 'info')
      }
    } catch (e) {
      console.error('Cache clearing error:', e)
      addLogEntry(`Cache clearing error: ${e.message}`, 'error')
    }
    
    // 6. Unregister ALL service workers
    addLogEntry('Unregistering service workers...', 'info')
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations()
      for (const registration of registrations) {
        await registration.unregister()
        addLogEntry('Service worker unregistered', 'success')
      }
    }
    
    // 7. Clear WebSQL (legacy, but just in case)
    if (window.openDatabase) {
      try {
        const db = window.openDatabase('', '', '', '')
        db.transaction(tx => {
          tx.executeSql('DROP TABLE IF EXISTS data')
        })
      } catch (e) {
        console.error('WebSQL clearing error:', e)
        // WebSQL might not be available or accessible
      }
    }
    
    // 8. Request persistent storage to be cleared (if granted)
    if ('storage' in navigator && 'persist' in navigator.storage) {
      try {
        const isPersisted = await navigator.storage.persisted()
        if (isPersisted) {
          addLogEntry('Requesting storage persistence removal...', 'info')
          // Note: We can't force unpersist, but we've cleared the data
        }
      } catch (e) {
        console.error('Storage persistence error:', e)
        // Storage persistence API might not be available
      }
    }
    
    addLogEntry('Full reset completed successfully!', 'success')
    showSuccess('Complete reset done! The page will reload to apply all changes.')
    
    // Force reload after a short delay to ensure everything is cleared
    setTimeout(() => {
      window.location.reload(true) // Hard reload
    }, 2000)
    
  } catch (error) {
    console.error('Full reset error:', error)
    addLogEntry(`Full reset failed: ${error.message || error}`, 'error')
    showError(`Reset failed: ${error.message || 'Unknown error'}`)
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

const copyLogs = async () => {
  try {
    // Format logs as text
    const logText = resetLog.value
      .map(entry => `${entry.time} - ${entry.message}`)
      .join('\n')
    
    // Add header with current status
    const header = `Reset Log - ${new Date().toLocaleString()}\n${'='.repeat(50)}\n`
    const fullText = header + logText
    
    // Copy to clipboard
    await navigator.clipboard.writeText(fullText)
    showSuccess('Logs copied to clipboard!')
  } catch (error) {
    console.error('Failed to copy logs:', error)
    showError('Failed to copy logs - please try selecting and copying manually')
  }
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
  color: var(--color-accent);
  margin-bottom: 0.5rem;
}

.reset-header p {
  color: var(--color-text-secondary);
  font-size: 1.1rem;
}

.reset-options {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-bottom: 3rem;
}

.reset-card {
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 1.5rem;
  transition: border-color 0.2s;
}

.reset-card:hover {
  border-color: var(--color-primary);
}

.reset-card.danger {
  border-color: var(--color-primary);
}

.reset-card.danger:hover {
  border-color: var(--color-primary-hover);
  background: var(--color-primary-alpha-10);
}

.reset-card h3 {
  color: var(--color-accent);
  margin: 0 0 0.5rem 0;
  font-size: 1.1rem;
}

.reset-card p {
  color: var(--color-text-secondary);
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
  background: var(--color-primary);
  color: var(--color-text-primary);
}

.reset-btn.primary:hover:not(:disabled) {
  background: var(--color-primary-hover);
}

.reset-btn.secondary {
  background: var(--color-bg-input);
  color: var(--color-text-secondary);
}

.reset-btn.secondary:hover:not(:disabled) {
  background: var(--color-bg-hover);
  color: var(--color-text-primary);
}

.reset-btn.danger {
  background: var(--color-primary);
  color: var(--color-text-primary);
}

.reset-btn.danger:hover:not(:disabled) {
  background: var(--color-primary-hover);
}

.current-status {
  background: var(--color-bg-base);
  border: 1px solid var(--color-border-light);
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 2rem;
}

.current-status h3 {
  color: var(--color-accent);
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
  color: var(--color-text-secondary);
}

.status-completed {
  color: var(--color-success);
  font-weight: 500;
}

.status-pending {
  color: var(--color-warning);
  font-weight: 500;
}

.status-info {
  color: var(--color-info);
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
  background: var(--color-bg-input);
  color: var(--color-text-secondary);
}

.refresh-btn:hover:not(:disabled) {
  background: var(--color-bg-hover);
  color: var(--color-text-primary);
}

.home-btn {
  background: var(--color-primary);
  color: var(--color-text-primary);
}

.home-btn:hover {
  background: var(--color-primary-hover);
}

.reset-log {
  background: var(--color-bg-base);
  border: 1px solid var(--color-border-light);
  border-radius: 8px;
  padding: 1.5rem;
}

.log-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.log-header h3 {
  color: var(--color-accent);
  margin: 0;
}

.copy-logs-btn {
  padding: 0.5rem 1rem;
  background: var(--color-bg-input);
  color: var(--color-text-secondary);
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.85rem;
  transition: all 0.2s;
}

.copy-logs-btn:hover {
  background: var(--color-bg-hover);
  color: var(--color-text-primary);
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
  background: var(--color-info-bg);
  border-left: 3px solid var(--color-info);
}

.log-success {
  background: var(--color-success-alpha-10);
  border-left: 3px solid var(--color-success);
}

.log-error {
  background: var(--color-error-alpha-10);
  border-left: 3px solid var(--color-error);
}

.log-warning {
  background: var(--color-warning-bg);
  border-left: 3px solid var(--color-warning);
}

.log-time {
  color: var(--color-text-muted);
  flex-shrink: 0;
  font-family: monospace;
  font-size: 0.8rem;
}

.log-message {
  color: var(--color-text-secondary);
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