<template>
  <div class="welcome-overlay">
    <div class="welcome-content">
      <header class="welcome-header">
        <h1>🔥 Welcome to OK-OFFLINE</h1>
        <p class="tagline">Your offline-first guide to Burning Man</p>
        <p class="disclaimer">This app is not affiliated, endorsed, or verified by Burning Man Project.</p>
      </header>

      <div class="step-container">
        <div v-show="currentStep === 1" class="step-content">
          <div class="feature-intro">
            <h2>Built for the Playa</h2>
            <p>OK-OFFLINE works completely offline once this year's data is synced. Perfect for Black Rock City's limited connectivity.</p>
            
            <div class="features-grid">
              <div class="feature-card">
                <span class="feature-icon">🏠</span>
                <h3>Camps</h3>
                <p>Find theme camps by location, name, or what you're looking for</p>
              </div>
              <div class="feature-card">
                <span class="feature-icon">🎨</span>
                <h3>Art</h3>
                <p>Discover art installations across the playa with interactive maps</p>
              </div>
              <div class="feature-card">
                <span class="feature-icon">🎉</span>
                <h3>Events</h3>
                <p>Browse events and build your personal burn schedule</p>
              </div>
              <div class="feature-card">
                <span class="feature-icon">⭐</span>
                <h3>Favorites</h3>
                <p>Star camps, art, and events to create your personal guide</p>
              </div>
              <div class="feature-card">
                <span class="feature-icon">🔒</span>
                <h3>Privacy First</h3>
                <p>No login required, no tracking, your data stays on your device</p>
              </div>
              <div class="feature-card">
                <span class="feature-icon">🗺️</span>
                <h3>Offline Maps</h3>
                <p>Full Black Rock City map tiles cached for zero-connectivity use</p>
              </div>
            </div>
          </div>
        </div>

        <div v-show="currentStep === 2" class="step-content">
          <ProgressiveLoader
            :title="syncStarted ? '📥 Downloading Burning Man Data' : '🌐 Sync Your Burning Man Data'"
            :message="syncStarted ? syncStatusText : `We'll download the official ${CURRENT_YEAR} snapshot and map for offline use. Historical seasons remain available from the year selector.`"
            loading-type="sync"
            :show-progress="syncStarted"
            :progress="syncProgress"
            :steps="syncStarted ? syncSteps : previewSteps"
            :tips="syncStarted ? syncTips : previewTips"
            :show-actions="true"
            :allow-cancel="false"
            :allow-skip="false"
            :full-screen="false"
          >
          </ProgressiveLoader>
        </div>

        <div v-show="currentStep === 3" class="step-content">
          <div class="completion">
            <div class="success-icon">✅</div>
            <h2>You're All Set!</h2>
            <p>{{ syncResultMessage }}</p>
            
            <div v-if="!canShowLocations(CURRENT_YEAR, 'camp') || !canShowLocations(CURRENT_YEAR, 'art')" class="location-notice">
              <p>📍 2026 camp placements publish August 23; art placements publish August 30.</p>
            </div>
            
            <div class="next-steps">
              <h3>🎯 Quick Start Guide</h3>
              <div class="quick-actions">
                <button @click="goToMap" class="action-card">
                  <span class="action-icon">🗺️</span>
                  <div>
                    <strong>Explore the Map</strong>
                    <p>See camps, art, and events on an interactive Black Rock City map</p>
                  </div>
                </button>
                <button @click="goToSearch" class="action-card">
                  <span class="action-icon">🔍</span>
                  <div>
                    <strong>Search Everything</strong>
                    <p>Find exactly what you're looking for across all data</p>
                  </div>
                </button>
                <button @click="goToSettings" class="action-card">
                  <span class="action-icon">⚙️</span>
                  <div>
                    <strong>Customize Settings</strong>
                    <p>Set up emergency contacts and app preferences</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="welcome-footer">
        <div v-show="currentStep === 1" class="step-actions">
          <button @click="currentStep = 2" class="primary-button">
            Start Data Sync →
          </button>
        </div>
        
        <div v-show="currentStep === 2" class="step-actions">
          <button @click="currentStep = 1" class="secondary-button" :disabled="syncing">
            ← Back
          </button>
          <button @click="goToCompletion" class="primary-button" :disabled="!syncCompleted">
            {{ syncCompleted ? 'Continue →' : syncStarted ? 'Downloading...' : 'Starting...' }}
          </button>
        </div>
        
        <div v-show="currentStep === 3" class="final-actions">
          <label class="show-tour-option">
            <input type="checkbox" v-model="showTour">
            Show me a quick tour of the interface
          </label>
          <button @click="completeOnboarding" class="primary-button">
            {{ showTour ? 'Start Tour' : 'Start Exploring' }} 🔥
          </button>
        </div>
      </div>
      
      <div class="step-indicator">
        <div 
          v-for="step in 3" 
          :key="step"
          :class="['step-dot', { active: currentStep === step, completed: currentStep > step }]"
        ></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { progressiveSync } from '../services/progressiveSync'
import { useToast } from '../composables/useToast'
import ProgressiveLoader from './ProgressiveLoader.vue'
import { preCacheData, optimizeForCurrentYear } from '../services/serviceWorkerManager'
import { globalState, debugLocationState } from '../stores/globalState'
import { canShowLocations } from '../stores/globalState'
import { CURRENT_YEAR } from '../config/seasons'

const emit = defineEmits(['complete'])
const router = useRouter()
const { showError } = useToast()

const currentStep = ref(1)
const selectedYear = ref(CURRENT_YEAR)
const syncing = ref(false)
const syncProgress = ref(0)
const syncStatusText = ref('')
const syncResults = ref(null)
const showTour = ref(false)
const syncSteps = ref([])
const syncStarted = ref(false)
const syncCompleted = ref(false)

const syncTips = [
  'Use the search feature to find specific camps or events',
  'Build your schedule and get conflict notifications',  
  'Enable location services for distance-based sorting',
  'Star your favorites to create a personal burn guide',
  'The app works completely offline once data is synced',
  'Map tiles ensure navigation works without connectivity',
  'First sync downloads everything needed for the playa'
]

const previewSteps = computed(() => [
  { 
    title: `${CURRENT_YEAR} Data`,
    description: canShowLocations(CURRENT_YEAR, 'camp')
      ? 'Official camps, art, and events'
      : 'Official content snapshot (placements follow the release schedule)',
    status: 'pending', 
    count: '~3700+',
    countLabel: 'items' 
  },
  { title: 'Snapshot Validation', description: 'Verifying metadata and release phase', status: 'pending' },
  { title: 'Official 2026 GIS', description: 'Eight pinned city layers', status: 'pending' },
  { title: 'Enhancement', description: 'Processing relationships', status: 'pending' },
  { title: 'Optimization', description: 'Preparing for offline use', status: 'pending' },
  { title: 'Offline Map Tiles', description: 'Map tiles for zero-connectivity', status: 'pending', count: '~640', countLabel: 'tiles' },
])

const previewTips = [
  `Downloads the selected ${CURRENT_YEAR} season during onboarding`,
  'All data works without internet connectivity',
  'Only ~10-15MB for data + ~20MB for map tiles',
  'Historical seasons remain available on demand',
  'Creates your comprehensive offline Burning Man guide',
  'Official camps, art pieces, events, and GIS layers',
  'Interactive maps work completely offline'
]

const syncResultMessage = computed(() => {
  if (!syncResults.value) return ''
  
  const totalCount = Object.values(syncResults.value)
    .filter(r => r.success)
    .reduce((sum, r) => sum + r.count, 0)
  
  return `Downloaded ${totalCount} official ${CURRENT_YEAR} items and cached the selected season for offline use.`
})

// Watch for step changes to auto-start sync
watch(currentStep, (newStep) => {
  if (newStep === 2 && !syncStarted.value) {
    // Start sync automatically after a brief delay to show the intro
    setTimeout(() => {
      startDataSync()
    }, 2000)
  }
})

const startDataSync = async () => {
  syncStarted.value = true
  syncing.value = true
  syncProgress.value = 0
  syncStatusText.value = 'Starting sync...'
  
  // Initialize sync steps with 6 steps as requested
  syncSteps.value = [
    { title: `${CURRENT_YEAR} Data`, description: 'Loading camps, art & events', status: 'pending', count: 0, countLabel: 'items' },
    { title: 'Snapshot Validation', description: 'Checking release metadata', status: 'pending' },
    { title: 'Official 2026 GIS', description: 'Caching eight pinned layers', status: 'pending' },
    { title: 'Enhancement', description: 'Processing relationships', status: 'pending' },
    { title: 'Optimization', description: 'Preparing for offline use', status: 'pending' },
    { title: 'Offline Map Tiles', description: 'Downloading map tiles', status: 'pending', count: 0, countLabel: 'tiles' }
  ]
  
  try {
    // Set up progressive sync callbacks
    progressiveSync.setCallbacks({
      onProgress: (progress) => {
        syncProgress.value = progress.percentage
        syncStatusText.value = progress.details
        
        // Update tile count if downloading tiles
        if (progress.details && progress.details.includes('Downloading map tiles:')) {
          const match = progress.details.match(/(\d+)\/(\d+)/)
          if (match && syncSteps.value[5]) {
            syncSteps.value[5].count = parseInt(match[2])
          }
        }
      },
      
      onCountUpdate: (year, totalCount, type, typeCount) => {
        // Update the appropriate step count based on the year
        if (year === CURRENT_YEAR && syncSteps.value[0]) {
          syncSteps.value[0].count = totalCount
          // Update description to show what's being loaded
          if (type && typeCount !== undefined) {
            syncSteps.value[0].description = `${typeCount} ${type}s loaded`
          }
        }
      },
      
      onStageChange: (stage, message) => {
        // Handle year start events
        if (stage === `${CURRENT_YEAR}_start`) {
          syncSteps.value[0].status = 'active'
          syncSteps.value[1].status = 'active'
          syncStatusText.value = `📥 Downloading ${CURRENT_YEAR} data...`
        }
        
        // Handle year completion events
        else if (stage === `${CURRENT_YEAR}_complete`) {
          syncSteps.value[0].status = 'completed'
          syncSteps.value[1].status = 'completed'
          syncSteps.value[2].status = 'active'
          // We'll update the description in onComplete when we know if locations exist
          syncSteps.value[0].description = 'Latest year camps, art & events'
          syncStatusText.value = `✅ ${CURRENT_YEAR} data complete`
        }
        
        // Handle enrichment and optimization stages
        else if (stage === 'enrichment_start') {
          syncSteps.value[2].status = 'completed'
          syncSteps.value[3].status = 'active'
          syncStatusText.value = '🔄 ' + message
        } else if (stage === 'optimization_start') {
          syncSteps.value[3].status = 'completed'
          syncSteps.value[4].status = 'active'
          syncStatusText.value = '⚡ ' + message
        } else if (stage === 'tiles_downloading') {
          syncSteps.value[4].status = 'completed'
          syncSteps.value[5].status = 'active'
          syncStatusText.value = '🗺️ ' + message
        } else if (stage === 'tiles_ready') {
          syncSteps.value[5].status = 'completed'
          syncStatusText.value = '✅ ' + message
        } else if (stage === 'tiles_error') {
          syncSteps.value[5].status = 'error'
          syncStatusText.value = '⚠️ ' + message
        }
        
        // Handle individual type completions for status messages
        else if (stage.includes('_complete')) {
          const parts = stage.split('_')
          if (parts.length === 3) {
            const [type, year, complete] = parts
            
            // Update status messages based on type
            if (type === 'camp') {
              syncStatusText.value = `🏠 ${year} camps ready`
            } else if (type === 'art') {
              syncStatusText.value = `🎨 ${year} art ready`
            } else if (type === 'event') {
              syncStatusText.value = `🎉 ${year} events ready`
            }
          }
        }
        
        // Handle special message for camps ready
        else if (stage === 'camps_ready') {
          syncStatusText.value = '🏠 ' + message
        }
      },
      
      onComplete: async (results) => {
        syncResults.value = results
        syncProgress.value = 100
        syncStatusText.value = 'All data synced and ready for offline use!'
        
        // Mark all steps as completed and update counts
        syncSteps.value.forEach((step) => {
          step.status = 'completed'
        })
        
        let currentYearTotal = 0
        Object.entries(results).forEach(([key, result]) => {
          if (result.success && result.count && key.includes(CURRENT_YEAR)) currentYearTotal += result.count
        })
        
        // Update step counts
        if (syncSteps.value[0]) {
          syncSteps.value[0].count = currentYearTotal
          if (!canShowLocations(CURRENT_YEAR, 'camp')) {
            syncSteps.value[0].description = 'Official content; placements follow release schedule'
          } else {
            syncSteps.value[0].description = 'Latest year camps, art & events'
          }
        }
        
        // Optimize service worker caches for better performance
        try {
          await preCacheData(selectedYear.value)
          await optimizeForCurrentYear(selectedYear.value)
          console.log('Service worker caches optimized')
        } catch (error) {
          console.warn('Service worker optimization failed:', error)
        }
        
        // Mark sync as completed
        syncCompleted.value = true
        
        // Move to completion step after a brief delay
        setTimeout(() => {
          currentStep.value = 3
        }, 1000)
      },
      
      onError: (error) => {
        showError(`Sync failed: ${error.message}`)
        syncStatusText.value = 'Sync failed - you can try again from Settings'
        
        // Mark current step as error
        const activeStep = syncSteps.value.find(s => s.status === 'active')
        if (activeStep) {
          activeStep.status = 'error'
        }
        
        // Allow user to continue even if sync failed
        syncCompleted.value = true
        setTimeout(() => {
          currentStep.value = 3
          syncResults.value = { error: error.message }
        }, 2000)
      }
    })
    
    // Cache only the selected season during onboarding.
    // The stage handlers will manage step activation
    await progressiveSync.syncWithPriority(CURRENT_YEAR)
    
  } catch (error) {
    showError(`Sync failed: ${error.message}`)
    syncStatusText.value = 'Sync failed - you can try again from Settings'
    
    // Allow user to continue even if sync failed
    syncCompleted.value = true
    setTimeout(() => {
      currentStep.value = 3
      syncResults.value = { error: error.message }
    }, 2000)
  } finally {
    syncing.value = false
  }
}

const goToCompletion = () => {
  if (syncCompleted.value) {
    currentStep.value = 3
  }
}

const goToMap = () => {
  completeOnboarding()
  router.push(`/${selectedYear.value}/map`)
}

const goToSearch = () => {
  completeOnboarding()
  router.push(`/${selectedYear.value}/search`)
}

const goToSettings = () => {
  completeOnboarding()
  router.push('/settings')
}

const completeOnboarding = () => {
  // Mark onboarding as complete
  localStorage.setItem('onboarding_completed', 'true')
  localStorage.setItem('selectedYear', selectedYear.value)
  
  emit('complete', { showTour: showTour.value, selectedYear: selectedYear.value })
}

// Debug on mount
onMounted(() => {
  console.log('WelcomeScreen mounted, location state:', {
    available: globalState.location_data_available,
    show: globalState.show_location_data
  })
  debugLocationState()
})
</script>

<style scoped>
.welcome-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--color-overlay-dark);
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.welcome-content {
  background: var(--color-bg-base);
  border: 2px solid var(--color-primary);
  border-radius: 8px;
  max-width: 600px;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
}

.welcome-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 16px;
  flex-shrink: 0;
  border-bottom: 1px solid var(--color-bg-header);
  background: var(--color-bg-base);
}

.welcome-header h1 {
  color: var(--color-accent);
  margin: 0;
  font-size: 2rem;
}

.tagline {
  display: none;
  color: var(--color-text-secondary);
  margin: 0.5rem 0 0 0;
  font-size: 1.1rem;
}

.step-container {
  flex: 1;
  min-height: 0; /* Important for Firefox */
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.step-content {
  flex: 1;
  overflow-y: auto;
  padding: 2rem;
  -webkit-overflow-scrolling: touch;
  scrollbar-gutter: stable;
}

.feature-intro h2 {
  margin: 0 0 1rem 0;
}

.feature-intro > p {
  margin: 0 0 1.5rem 0;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
  margin: 0;
}

.feature-card {
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  padding: 1rem;
  text-align: center;
}

.feature-icon {
  font-size: 2rem;
  display: block;
  margin-bottom: 0.5rem;
}

.feature-card h3 {
  color: var(--color-accent);
  margin: 0.5rem 0;
}

.feature-card p {
  color: var(--color-text-secondary);
  font-size: 0.9rem;
  margin: 0;
}



/* Removed unused styles for cleaner code */


.completion {
  text-align: center;
}

.success-icon {
  font-size: 3rem;
  margin: 0 0 1rem 0;
}

.completion h2 {
  color: var(--color-accent);
  margin: 0 0 1rem 0;
}

.completion > p {
  margin: 0 0 1.5rem 0;
}

.location-notice {
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  padding: 1rem;
  margin: 0 0 1.5rem 0;
}

.location-notice p {
  color: var(--color-accent);
  margin: 0;
  font-size: 0.95rem;
}

.next-steps h3 {
  margin: 0 0 1rem 0;
}

.quick-actions {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin: 0;
}

.action-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  color: var(--color-text-primary);
  text-align: left;
  cursor: pointer;
  transition: background-color 0.2s;
}

.action-card:hover {
  background: var(--color-bg-header);
  border-color: var(--color-primary);
}

.action-icon {
  font-size: 1.5rem;
  flex-shrink: 0;
}

.action-card strong {
  color: var(--color-accent);
  display: block;
  margin-bottom: 0.25rem;
}

.action-card p {
  color: var(--color-text-secondary);
  margin: 0;
  font-size: 0.9rem;
}

.show-tour-option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0 0 1rem 0;
  color: var(--color-text-secondary);
  cursor: pointer;
}

.show-tour-option input {
  margin: 0;
}

.welcome-footer {
  flex-shrink: 0;
  padding: 16px 16px 48px 16px; /* Extra bottom padding for step indicator */
  background: var(--color-bg-base);
  border-top: 1px solid var(--color-bg-header);
  display: flex;
  align-items: center;
  justify-content: center;
}

.step-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  width: 100%;
}

.primary-button {
  background: var(--color-primary);
  color: var(--color-text-primary);
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  transition: background-color 0.2s;
}

.primary-button:hover:not(:disabled) {
  background: var(--color-primary-hover);
}

.primary-button:disabled {
  background: var(--color-bg-input);
  cursor: not-allowed;
}

.secondary-button {
  background: transparent;
  color: var(--color-text-secondary);
  border: 1px solid var(--color-border);
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  transition: border-color 0.2s;
}

.secondary-button:hover {
  border-color: var(--color-primary);
  color: var(--color-text-primary);
}

.step-indicator {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: var(--color-overlay-dark);
  border-top: 1px solid var(--color-bg-header);
  backdrop-filter: blur(5px);
}

.step-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--color-border);
  transition: background-color 0.2s;
}

.step-dot.active {
  background: var(--color-primary);
}

.step-dot.completed {
  background: var(--color-accent);
}

@media (max-width: 768px) {
  .welcome-overlay {
    padding: 16px;
  }
  
  .welcome-content {
    border-radius: 8px;
  }
  
  .welcome-header {
    padding: 16px;
  }
  
  .step-content {
    padding: 16px;
  }
  
  .welcome-footer {
    padding: 16px 16px 40px 16px;
  }
  
  .step-indicator {
    padding: 0.5rem;
  }
  
  .features-grid {
    grid-template-columns: 1fr;
  }
  
  
  
  .step-actions {
    flex-direction: column;
  }
  
  .welcome-header h1 {
    font-size: 1.5rem;
  }
}

/* Scrollbar styling for step content */
.step-content::-webkit-scrollbar {
  width: 8px;
}

.step-content::-webkit-scrollbar-track {
  background: var(--color-bg-elevated);
}

.step-content::-webkit-scrollbar-thumb {
  background: var(--color-text-disabled);
  border-radius: 4px;
}

.step-content::-webkit-scrollbar-thumb:hover {
  background: var(--color-text-muted);
}

.final-actions {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  width: 100%;
}

/* Hidden step content doesn't affect layout */
.step-content[style*="display: none"] {
  display: none !important;
}
</style>
