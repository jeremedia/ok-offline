<template>
  <div class="tab-content">
    <h2>Data Sync Settings</h2>
    
    <div class="settings-section">
      <BaseButton 
        @click="syncAllYears" 
        :disabled="syncingAll"
        :loading="syncingAll"
        variant="primary"
      >
        {{ syncingAll ? 'Syncing All Years...' : 'Sync All Years' }}
      </BaseButton>
      <div v-if="syncingAll" class="sync-all-progress">
        {{ syncAllProgress }}
      </div>
    </div>
    
    <div class="settings-content">
      <div v-for="year in years" :key="year" class="settings-section">
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
          <BaseButton 
            @click="syncYear(year)" 
            :disabled="syncing[year]"
            :loading="syncing[year]"
            variant="primary"
          >
            {{ syncing[year] ? 'Syncing...' : 'Sync All Data' }}
          </BaseButton>
          
          <BaseButton 
            @click="clearYear(year)"
            :disabled="syncing[year]"
            variant="secondary"
            v-if="syncStatus[year] && hasData(year)"
          >
            Clear Data
          </BaseButton>
        </div>
        
        <div v-if="progress[year] || progressText[year]" class="progress-bar">
          <div class="progress-fill" :style="{ width: (progress[year] || 0) + '%' }"></div>
          <span class="progress-text">{{ progressText[year] }}</span>
        </div>
      </div>
    </div>
    
    <!-- Map Tiles Section -->
    <div class="settings-section">
      <h3>🗺️ Offline Map Tiles</h3>
      <div v-if="tileStats" class="tile-stats">
        <div class="stat-row">
          <span class="stat-label">Cached tiles:</span>
          <span class="stat-value">{{ tileStats.storedTiles }} / {{ tileStats.requiredTiles }}</span>
          <span class="stat-percentage">({{ tileStats.percentage }}%)</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Storage used:</span>
          <span class="stat-value">~{{ tileStats.estimatedSize }}MB</span>
        </div>
      </div>
      <div v-else class="tile-stats">
        <p class="loading-tiles">Loading tile statistics...</p>
      </div>
      <div v-if="tileProgress" class="tile-download-status">
        <div class="download-message">
          📥 Downloading map tiles for offline use...
        </div>
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: tileProgress.percentage + '%' }"></div>
          <span class="progress-text">{{ tileProgress.downloaded }}/{{ tileProgress.total }} tiles ({{ tileProgress.percentage }}%)</span>
        </div>
      </div>
      
      <div class="tile-actions">
        <BaseButton 
          @click="downloadTiles" 
          :disabled="downloadingTiles || (tileStats && tileStats.percentage >= 90)"
          :loading="downloadingTiles"
          variant="primary"
        >
          {{ downloadingTiles ? 'Downloading...' : 'Cache Map Tiles' }}
        </BaseButton>
        
        <BaseButton 
          @click="clearTiles"
          :disabled="downloadingTiles || !tileStats || tileStats.storedTiles === 0"
          variant="secondary"
        >
          Clear Tile Cache
        </BaseButton>
      </div>
    </div>
    
    <div class="settings-section">
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
import tileDownloader from '../../services/tileDownloader'
import { BaseButton } from '@/components/ui'

// Toast notifications
const { showSuccess, showError, showWarning, showInfo } = useToast()

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
const tileProgress = ref(null)
const tileStats = ref(null)
const downloadingTiles = ref(false)

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
  
  // Also load tile stats
  tileStats.value = await tileDownloader.getStorageStats()
}

// Sync data for a specific year
const syncYear = async (year) => {
  syncing.value[year] = true
  progress.value[year] = 0
  progressText.value[year] = ''
  
  try {
    showInfo(`Starting sync for ${year} data...`)
    
    await syncYearData(year, (type, current, total, extra) => {
      // Progress callback
      console.log('[DataSyncSettings] Progress:', type, current, total, extra)
      
      if (type === 'tiles' && extra) {
        // Tile download progress
        tileProgress.value = {
          downloaded: extra.tilesDownloaded,
          total: extra.tilesTotal,
          percentage: extra.tilesPercentage
        }
        progress.value[year] = extra.tilesPercentage
        progressText.value[year] = `Downloading map tiles: ${extra.tilesDownloaded}/${extra.tilesTotal}`
      } else if (type === 'complete') {
        progress.value[year] = 100
        progressText.value[year] = 'Complete!'
      } else {
        // Regular data sync progress
        const percentage = Math.round((current / total) * 100)
        progress.value[year] = percentage
        progressText.value[year] = `${capitalize(type)}s: ${current}/${total}`
      }
    })
    
    showSuccess(`Successfully synced ${year} data!`)
    await loadSyncStatus()
  } catch (error) {
    console.error('Sync error:', error)
    const errorMsg = getErrorMessage(error)
    
    if (errorMsg.includes('Failed to fetch')) {
      showError('Unable to connect to server. Please check your internet connection.')
    } else if (errorMsg.includes('API key')) {
      showError('API key issue. Please check configuration.')
    } else {
      showError(`Failed to sync ${year} data: ${errorMsg}`)
    }
    
    throw error  // Re-throw for syncAllYears to handle
  } finally {
    syncing.value[year] = false
    progress.value[year] = 0
    progressText.value[year] = ''
    tileProgress.value = null
  }
}

// Sync all years
const syncAllYears = async () => {
  syncingAll.value = true
  syncAllProgress.value = ''
  
  // First sync all years' data
  for (let i = 0; i < years.length; i++) {
    const year = years[i]
    syncAllProgress.value = `Syncing ${year} (${i + 1}/${years.length})...`
    
    try {
      await syncYear(year)
    } catch (error) {
      // Error already shown by syncYear, just stop the process
      syncingAll.value = false
      syncAllProgress.value = ''
      return
    }
  }
  
  // Then download map tiles if needed
  const alreadyDownloaded = await tileDownloader.areTilesDownloaded()
  if (!alreadyDownloaded) {
    syncAllProgress.value = 'Downloading map tiles for offline use...'
    tileProgress.value = { downloaded: 0, total: 0, percentage: 0 }
    
    try {
      await tileDownloader.downloadAllTiles((downloaded, total, percentage) => {
        tileProgress.value = { downloaded, total, percentage }
        
        // Different messages for ZIP download vs extraction
        if (percentage <= 50) {
          syncAllProgress.value = `Downloading map package: ${percentage * 2}%`
        } else {
          const extractPercent = (percentage - 50) * 2
          syncAllProgress.value = `Extracting map tiles: ${extractPercent}%`
        }
        
        // console.log('[DataSyncSettings] Tile progress in syncAllYears:', downloaded, total, percentage)
      })
      
      showSuccess('Map tiles downloaded successfully!')
    } catch (error) {
      console.error('Failed to download tiles:', error)
      showWarning('Failed to download map tiles. Maps may not work offline.')
    }
    
    tileProgress.value = null
  }
  
  syncingAll.value = false
  syncAllProgress.value = ''
  
  // Reload stats
  await loadSyncStatus()
}

// Clear data for a specific year
const clearYear = async (year) => {
  if (confirm(`Are you sure you want to clear all ${year} data? This cannot be undone.`)) {
    try {
      await clearYearData(year)
      await loadSyncStatus()
      showSuccess(`${year} data cleared successfully`)
    } catch (error) {
      showError(`Failed to clear ${year} data: ${error.message}`)
    }
  }
}

// Clear all cached data
const clearAllData = async () => {
  if (confirm('Are you sure you want to clear ALL cached data? This cannot be undone.')) {
    try {
      await clearCache()
      await loadSyncStatus()
      showSuccess('All cached data cleared successfully')
    } catch (error) {
      showError(`Failed to clear data: ${error.message}`)
    }
  }
}

// Download tiles manually
const downloadTiles = async () => {
  // console.log('[DataSyncSettings] Manual tile download requested')
  downloadingTiles.value = true
  tileProgress.value = { downloaded: 0, total: 0, percentage: 0 }
  
  try {
    const result = await tileDownloader.downloadAllTiles((downloaded, total, percentage) => {
      // console.log('[DataSyncSettings] Tile progress:', downloaded, total, percentage)
      tileProgress.value = { downloaded, total, percentage }
    })
    
    // console.log('[DataSyncSettings] Tile download result:', result)
    
    if (result.success) {
      showSuccess(`Downloaded ${result.downloaded} map tiles successfully!`)
    } else {
      showWarning('Failed to download some tiles. Maps may not work fully offline.')
    }
  } catch (error) {
    // console.error('[DataSyncSettings] Tile download error:', error)
    showError(`Failed to download map tiles: ${error.message}`)
  } finally {
    downloadingTiles.value = false
    tileProgress.value = null
    await loadSyncStatus() // Refresh stats
  }
}

// Clear tile cache
const clearTiles = async () => {
  if (confirm('Are you sure you want to clear all cached map tiles? You will need to download them again for offline use.')) {
    try {
      const success = await tileDownloader.clearTiles()
      if (success) {
        showSuccess('Map tile cache cleared successfully')
        await loadSyncStatus() // Refresh stats
      } else {
        showError('Failed to clear map tile cache')
      }
    } catch (error) {
      console.error('[DataSyncSettings] Clear tiles error:', error)
      showError(`Failed to clear tiles: ${error.message}`)
    }
  }
}

// Load initial status
onMounted(async () => {
  await loadSyncStatus()
  // console.log('[DataSyncSettings] Initial tile stats:', tileStats.value)
})
</script>

<style>
@import './settings-shared.css';
</style>

<style scoped>
/* Custom styles specific to DataSyncSettings only */

.sync-all-progress {
  margin-top: 0.5rem;
  color: var(--color-text-muted);
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

.sync-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
}

/* Enhanced progress bar with shimmer effect */
.progress-bar {
  margin-top: 1rem;
  height: 24px;
  background: var(--color-bg-base);
  border-radius: 12px;
  overflow: hidden;
  position: relative;
  box-shadow: inset 0 2px 4px var(--color-shadow-medium);
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--color-primary) 0%, var(--color-primary-dark) 50%, var(--color-primary) 100%);
  background-size: 200% 100%;
  transition: width 0.3s ease;
  animation: shimmer 2s ease-in-out infinite;
  box-shadow: 0 0 10px var(--color-primary-alpha-20);
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
  color: var(--color-text-primary);
  font-size: 0.85rem;
  font-weight: 500;
  text-shadow: 0 1px 2px var(--color-overlay-dark);
  white-space: nowrap;
}

/* Tile statistics specific styling */
.tile-stats {
  margin-bottom: 1rem;
}

.stat-row {
  display: flex;
  align-items: center;
  padding: 0.5rem 0;
  gap: 1rem;
}

.stat-label {
  color: var(--color-text-secondary);
  min-width: 120px;
}

.stat-value {
  color: var(--color-text-primary);
  font-weight: bold;
}

.stat-percentage {
  color: var(--color-text-muted);
}

.loading-tiles {
  color: var(--color-text-muted);
  font-style: italic;
  margin: 0;
}

.tile-download-status {
  margin-top: 1rem;
}

.download-message {
  color: var(--color-accent);
  font-weight: bold;
  margin-bottom: 0.5rem;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.6; }
  100% { opacity: 1; }
}

.tile-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
}

.tile-actions .primary-button,
.tile-actions .secondary-button {
  flex: 1;
}

/* Mobile responsive */
@media (max-width: 600px) {
  .sync-actions {
    flex-direction: column;
  }
}
</style>