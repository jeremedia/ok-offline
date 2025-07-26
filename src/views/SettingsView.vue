<template>
  <section id="settings-section" class="view">
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
        
        <div v-if="syncing[year]" class="progress">
          <div class="progress-bar">
            <div 
              class="progress-fill" 
              :style="{ width: `${progress[year] || 0}%` }"
            ></div>
          </div>
          <span class="progress-text">{{ progressText[year] || 'Starting...' }}</span>
        </div>
      </div>
      
      <div class="storage-info">
        <h3>Storage Information</h3>
        <p>IndexedDB is used to store data for offline access.</p>
        <p class="note">Note: Historical data (2023, 2024) doesn't change and only needs to be synced once.</p>
        <p class="note">2025 data can be refreshed before heading to the playa.</p>
      </div>
    </div>
    
    <button id="back-to-app" @click="goBack">← Back to App</button>
  </section>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { syncYear as syncYearData, getSyncStatus, clearYear as clearYearData } from '../services/dataSync'

const router = useRouter()
const years = ['2023', '2024', '2025']
const types = ['camp', 'art', 'event']

const syncStatus = ref({})
const syncing = ref({})
const progress = ref({})
const progressText = ref({})
const syncingAll = ref(false)
const syncAllProgress = ref('')

const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1)

const formatDate = (dateStr) => {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now - date
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)
  
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

const loadSyncStatus = async () => {
  for (const year of years) {
    syncStatus.value[year] = await getSyncStatus(year)
  }
}

const syncYear = async (year) => {
  if (syncing.value[year]) return
  
  syncing.value[year] = true
  progress.value[year] = 0
  progressText.value[year] = 'Starting sync...'
  
  try {
    await syncYearData(year, (type, current, total) => {
      const percent = Math.round((current / total) * 100)
      progress.value[year] = percent
      
      if (type === 'enriching') {
        progressText.value[year] = 'Enriching event locations...'
      } else if (type === 'complete') {
        progressText.value[year] = 'Complete!'
      } else {
        progressText.value[year] = `Syncing ${type}s...`
      }
    })
    
    // Reload sync status
    await loadSyncStatus()
    
    // Show complete message briefly
    setTimeout(() => {
      progress.value[year] = 0
      progressText.value[year] = ''
    }, 2000)
  } catch (err) {
    console.error(`Failed to sync ${year}:`, err)
    progressText.value[year] = `Error: ${err.message}`
  } finally {
    syncing.value[year] = false
  }
}

const clearYear = async (year) => {
  if (syncing.value[year]) return
  
  if (confirm(`Are you sure you want to clear all ${year} data? This cannot be undone.`)) {
    try {
      await clearYearData(year)
      await loadSyncStatus()
    } catch (err) {
      console.error(`Failed to clear ${year} data:`, err)
      alert(`Failed to clear data: ${err.message}`)
    }
  }
}

const syncAllYears = async () => {
  if (syncingAll.value) return
  
  syncingAll.value = true
  let completedYears = 0
  
  for (const year of years) {
    syncAllProgress.value = `Syncing ${year} data... (${completedYears + 1}/3)`
    await syncYear(year)
    completedYears++
  }
  
  syncAllProgress.value = 'All years synced successfully!'
  setTimeout(() => {
    syncingAll.value = false
    syncAllProgress.value = ''
  }, 2000)
}

const goBack = () => {
  const year = localStorage.getItem('selectedYear') || '2025'
  router.push(`/${year}/map`)
}

onMounted(() => {
  loadSyncStatus()
})
</script>

<style scoped>
#settings-section {
  padding: 1rem;
  max-width: 800px;
  margin: 0 auto;
  background: #1a1a1a;
  color: #ccc;
  min-height: 100vh;
}

h2 {
  color: #fff;
  margin-bottom: 2rem;
}

h3 {
  color: #fff;
  margin-bottom: 1rem;
}

.settings-content {
  margin-bottom: 2rem;
}

.year-section {
  background: #2a2a2a;
  border: 1px solid #444;
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
}

.sync-status {
  margin-bottom: 1rem;
}

.status-row {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
}

.type-label {
  font-weight: bold;
  width: 80px;
}

.count {
  color: #fff;
  min-width: 100px;
}

.last-sync {
  color: #999;
  font-size: 0.85rem;
}

.never-synced {
  color: #666;
  font-style: italic;
  font-size: 0.85rem;
}

.sync-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
}

.sync-button, .clear-button {
  background: #555;
  color: #fff;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background 0.2s;
}

.sync-button:hover {
  background: #8B0000;
}

.sync-button:disabled {
  background: #333;
  cursor: not-allowed;
}

.clear-button {
  background: #444;
}

.clear-button:hover {
  background: #a00;
}

.progress {
  margin-top: 1rem;
}

.progress-bar {
  width: 100%;
  height: 20px;
  background: #333;
  border-radius: 10px;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.progress-fill {
  height: 100%;
  background: #8B0000;
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 0.85rem;
  color: #999;
}

.storage-info {
  background: #2a2a2a;
  border: 1px solid #444;
  border-radius: 8px;
  padding: 1.5rem;
}

.note {
  font-size: 0.9rem;
  color: #999;
  margin: 0.5rem 0;
}

#back-to-app {
  background: #555;
  color: #fff;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  margin-bottom: 2rem;
  transition: background 0.2s;
}

#back-to-app:hover {
  background: #8B0000;
}

.sync-all-container {
  background: #2a2a2a;
  border: 1px solid #444;
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  text-align: center;
}

.sync-all-button {
  background: #8B0000;
  color: #fff;
  border: none;
  padding: 0.75rem 2rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1.1rem;
  font-weight: bold;
  transition: background 0.2s;
}

.sync-all-button:hover {
  background: #a00;
}

.sync-all-button:disabled {
  background: #555;
  cursor: not-allowed;
}

.sync-all-progress {
  margin-top: 1rem;
  color: #ccc;
  font-size: 0.9rem;
}
</style>