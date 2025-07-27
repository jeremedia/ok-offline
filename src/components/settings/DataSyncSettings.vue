<template>
  <div class="tab-content">
    <h2>Data Sync Settings</h2>
    
    <div class="sync-all-container">
      <button 
        @click="syncAllYears" 
        :disabled="syncingAll"
        class="sync-all-button"
      >
        {{ syncingAll ? 'Syncing All Years...' : 'Sync All Years' }}
      </button>
      <div v-if="syncingAll" class="sync-all-progress">
        {{ syncAllProgress }}
      </div>
    </div>
    
    <div class="settings-content">
      <div v-for="year in years" :key="year" class="year-section">
        <h3>{{ year }} Data</h3>
        
        <div class="sync-status">
          <div v-for="type in types" :key="type" class="status-row">
            <span class="type-label">{{ capitalize(type) }}s:</span>
            <span class="count">{{ syncStatus[year]?.[type]?.count || 0 }} items</span>
            <span class="last-sync" v-if="syncStatus[year]?.[type]?.lastSync">
              Last sync: {{ formatDate(syncStatus[year][type].lastSync) }}
            </span>
            <span class="never-synced" v-else>Never synced</span>
          </div>
        </div>
        
        <div class="sync-actions">
          <button 
            @click="syncYear(year)" 
            :disabled="syncing[year]"
            class="sync-button"
          >
            {{ syncing[year] ? 'Syncing...' : 'Sync All Data' }}
          </button>
          
          <button 
            @click="clearYear(year)"
            :disabled="syncing[year]"
            class="clear-button"
            v-if="syncStatus[year] && hasData(year)"
          >
            Clear Data
          </button>
        </div>
        
        <div v-if="progress[year] || progressText[year]" class="progress-bar">
          <div class="progress-fill" :style="{ width: (progress[year] || 0) + '%' }"></div>
          <span class="progress-text">{{ progressText[year] }}</span>
        </div>
      </div>
    </div>
    
    <div class="global-actions">
      <button @click="clearAllData" class="danger-button">
        Clear All Cached Data
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { syncYear as syncYearData, getSyncStatus, clearYear as clearYearData } from '../../services/staticDataSync'
import { clearCache } from '../../services/storage'
import { useToast } from '../../composables/useToast'
import { getErrorMessage } from '../../utils/errorHandler'

// Toast notifications
const { showToast } = useToast()

// Data configuration
const years = ['2023', '2024', '2025']
const types = ['camp', 'art', 'event']

// State
const syncStatus = ref({})
const syncing = ref({})
const progress = ref({})
const progressText = ref({})
const syncingAll = ref(false)
const syncAllProgress = ref('')

// Utility functions
const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1)

const formatDate = (dateStr) => {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now - date
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)
  
  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
  
  return date.toLocaleDateString()
}

const hasData = (year) => {
  const status = syncStatus.value[year]
  if (!status) return false
  return types.some(type => status[type]?.count > 0)
}

// Load sync status for all years
const loadSyncStatus = async () => {
  years.forEach(year => {
    syncStatus.value[year] = getSyncStatus(year)
  })
}

// Sync data for a specific year
const syncYear = async (year) => {
  syncing.value[year] = true
  progress.value[year] = 0
  progressText.value[year] = ''
  
  try {
    showToast(`Starting sync for ${year} data...`, 'info')
    
    await syncYearData(year, (type, current, total) => {
      // Progress callback
      const percentage = Math.round((current / total) * 100)
      progress.value[year] = percentage
      progressText.value[year] = `${capitalize(type)}s: ${current}/${total}`
    })
    
    showToast(`Successfully synced ${year} data!`, 'success')
    await loadSyncStatus()
  } catch (error) {
    console.error('Sync error:', error)
    const errorMsg = getErrorMessage(error)
    
    if (errorMsg.includes('Failed to fetch')) {
      showToast('Unable to connect to server. Please check your internet connection.', 'error')
    } else if (errorMsg.includes('API key')) {
      showToast('API key issue. Please check configuration.', 'error')
    } else {
      showToast(`Failed to sync ${year} data: ${errorMsg}`, 'error')
    }
    
    throw error  // Re-throw for syncAllYears to handle
  } finally {
    syncing.value[year] = false
    progress.value[year] = 0
    progressText.value[year] = ''
  }
}

// Sync all years
const syncAllYears = async () => {
  syncingAll.value = true
  syncAllProgress.value = ''
  
  for (let i = 0; i < years.length; i++) {
    const year = years[i]
    syncAllProgress.value = `Syncing ${year} (${i + 1}/${years.length})...`
    
    try {
      await syncYear(year)
    } catch (error) {
      // Error already shown by syncYear, just stop the process
      break
    }
  }
  
  syncingAll.value = false
  syncAllProgress.value = ''
}

// Clear data for a specific year
const clearYear = async (year) => {
  if (confirm(`Are you sure you want to clear all ${year} data? This cannot be undone.`)) {
    try {
      await clearYearData(year)
      await loadSyncStatus()
      showToast(`${year} data cleared successfully`, 'success')
    } catch (error) {
      showToast(`Failed to clear ${year} data: ${error.message}`, 'error')
    }
  }
}

// Clear all cached data
const clearAllData = async () => {
  if (confirm('Are you sure you want to clear ALL cached data? This cannot be undone.')) {
    try {
      await clearCache()
      await loadSyncStatus()
      showToast('All cached data cleared successfully', 'success')
    } catch (error) {
      showToast(`Failed to clear data: ${error.message}`, 'error')
    }
  }
}

// Load initial status
onMounted(() => {
  loadSyncStatus()
})
</script>

<style scoped>
.sync-all-container {
  margin-bottom: 2rem;
  padding: 1rem;
  background: #2a2a2a;
  border-radius: 8px;
}

.sync-all-button {
  background: #8B0000;
  color: #fff;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  transition: background 0.2s;
}

.sync-all-button:hover:not(:disabled) {
  background: #a00000;
}

.sync-all-button:disabled {
  background: #666;
  cursor: not-allowed;
}

.sync-all-progress {
  margin-top: 0.5rem;
  color: #999;
}

.year-section {
  background: #2a2a2a;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  border-radius: 8px;
}

.sync-status {
  margin-bottom: 1rem;
}

.status-row {
  display: grid;
  grid-template-columns: 100px 100px 1fr;
  gap: 1rem;
  padding: 0.5rem 0;
  align-items: center;
}

.type-label {
  font-weight: bold;
  color: #ccc;
}

.count {
  color: #fff;
}

.last-sync {
  color: #999;
  font-size: 0.9rem;
}

.never-synced {
  color: #666;
  font-style: italic;
}

.sync-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
}

.sync-button {
  background: #444;
  color: #fff;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.2s;
}

.progress-bar {
  margin-top: 1rem;
  height: 24px;
  background: #222;
  border-radius: 12px;
  overflow: hidden;
  position: relative;
  box-shadow: inset 0 2px 4px rgba(0,0,0,0.4);
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #8B0000 0%, #a00000 50%, #8B0000 100%);
  background-size: 200% 100%;
  transition: width 0.3s ease;
  animation: shimmer 2s ease-in-out infinite;
  box-shadow: 0 0 10px rgba(139, 0, 0, 0.5);
}

@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

.progress-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: #fff;
  font-size: 0.85rem;
  font-weight: 500;
  text-shadow: 0 1px 2px rgba(0,0,0,0.5);
  white-space: nowrap;
}

.global-actions {
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid #444;
}

/* Mobile responsive */
@media (max-width: 600px) {
  .sync-actions {
    flex-direction: column;
  }
}
</style>