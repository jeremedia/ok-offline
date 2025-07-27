<template>
  <div class="welcome-overlay">
    <div class="welcome-content">
      <header class="welcome-header">
        <h1>🔥 Welcome to OK-OFFLINE</h1>
        <p class="tagline">Your offline-first guide to Burning Man</p>
      </header>

      <div v-if="currentStep === 1" class="step-content">
        <div class="feature-intro">
          <h2>Built for the Playa</h2>
          <p>OK-OFFLINE works completely offline once your data is synced. Perfect for Black Rock City's limited connectivity.</p>
          
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
          </div>
        </div>

        <div class="step-actions">
          <button @click="currentStep = 2" class="primary-button">
            Get Started →
          </button>
        </div>
      </div>

      <div v-if="currentStep === 2" class="step-content">
        <ProgressiveLoader
          :title="syncStarted ? '📥 Downloading Burning Man Data' : '🌐 Sync Your Burning Man Data'"
          :message="syncStarted ? syncStatusText : `We'll download all Burning Man data (2023-2025) for offline use. This happens once, then you're set for your entire burn!`"
          loading-type="sync"
          :show-progress="syncStarted"
          :progress="syncProgress"
          :steps="syncStarted ? syncSteps : previewSteps"
          :tips="syncStarted ? syncTips : previewTips"
          :show-actions="true"
          :allow-cancel="false"
          :allow-skip="false"
          full-screen="false"
        >
        </ProgressiveLoader>

        <div class="step-actions">
          <button @click="currentStep = 1" class="secondary-button" :disabled="syncing">
            ← Back
          </button>
          <button @click="goToCompletion" class="primary-button" :disabled="!syncCompleted">
            {{ syncCompleted ? 'Continue →' : syncStarted ? 'Downloading...' : 'Starting...' }}
          </button>
        </div>
      </div>

      <div v-if="currentStep === 3" class="step-content">
        <div class="completion">
          <div class="success-icon">✅</div>
          <h2>You're All Set!</h2>
          <p>{{ syncResultMessage }}</p>
          
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

          <div class="final-actions">
            <label class="show-tour-option">
              <input type="checkbox" v-model="showTour">
              Show me a quick tour of the interface
            </label>
            <button @click="completeOnboarding" class="primary-button">
              {{ showTour ? 'Start Tour' : 'Start Exploring' }} 🔥
            </button>
          </div>
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
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { progressiveSync } from '../services/progressiveSync'
import { useToast } from '../composables/useToast'
import ProgressiveLoader from './ProgressiveLoader.vue'
import { preCacheData, optimizeForCurrentYear } from '../services/serviceWorkerManager'

const emit = defineEmits(['complete'])
const router = useRouter()
const { showSuccess, showError } = useToast()

const currentStep = ref(1)
const selectedYear = ref('2025') // Default year for navigation after onboarding
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
  'Use keyboard shortcuts for faster navigation'
]

const previewSteps = ref([
  { title: '2025 Data', description: 'Latest camps, art, and events', status: 'pending', count: '~2800+', countLabel: 'items' },
  { title: '2024 Data', description: 'Complete previous year', status: 'pending', count: '~2800+', countLabel: 'items' },
  { title: '2023 Data', description: 'Historical reference', status: 'pending', count: '~2800+', countLabel: 'items' },
  { title: 'Data Enhancement', description: 'Processing relationships and locations', status: 'pending' },
  { title: 'Optimization', description: 'Preparing for offline use', status: 'pending' },
])

const previewTips = [
  'Downloads complete data from all years (2023, 2024, 2025)',
  'All data works without internet connectivity',
  'Only ~10-15MB total - includes everything!',
  'Reference past years and plan for future events',  
  'Creates your comprehensive offline Burning Man guide',
  'Over 8,400 camps, art pieces, and events total'
]

const syncResultMessage = computed(() => {
  if (!syncResults.value) return ''
  
  const totalCount = Object.values(syncResults.value)
    .filter(r => r.success)
    .reduce((sum, r) => sum + r.count, 0)
  
  return `Downloaded ${totalCount} items from all years (2023-2025) and cached for offline use. You're ready to explore Burning Man with complete historical data!`
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
  
  // Initialize sync steps
  syncSteps.value = [
    { title: `2025 Camps`, description: 'Latest year camps', status: 'pending', count: 0, countLabel: 'camps' },
    { title: `2025 Art & Events`, description: 'Latest installations and activities', status: 'pending', count: 0, countLabel: 'items' },
    { title: `2024 Data`, description: 'Complete previous year', status: 'pending', count: 0, countLabel: 'items' },
    { title: `2023 Data`, description: 'Historical reference', status: 'pending', count: 0, countLabel: 'items' },
    { title: 'Enhancement', description: 'Processing relationships', status: 'pending' },
    { title: 'Optimization', description: 'Preparing for offline use', status: 'pending' }
  ]
  
  try {
    // Set up progressive sync callbacks
    progressiveSync.setCallbacks({
      onProgress: (progress) => {
        syncProgress.value = progress.percentage
        syncStatusText.value = progress.details
      },
      
      onStageChange: (stage, message) => {
        if (stage === 'camps_ready') {
          syncStatusText.value = '🏠 ' + message
          syncSteps.value[0].status = 'completed'
          syncSteps.value[1].status = 'active'
        } else if (stage === 'art_complete') {
          syncStatusText.value = '🎨 2025 art installations ready'
        } else if (stage === 'event_complete') {
          syncSteps.value[1].status = 'completed'
          syncStatusText.value = '🎉 2025 data complete'
          // Start working on historical data
          syncSteps.value[2].status = 'active'
          syncStatusText.value = '📚 Downloading 2024 data...'
        }
      },
      
      onComplete: async (results) => {
        syncResults.value = results
        syncProgress.value = 100
        syncStatusText.value = 'All data synced and ready for offline use!'
        
        // Mark all steps as completed and update counts
        syncSteps.value.forEach((step, index) => {
          step.status = 'completed'
        })
        
        // Calculate total counts from all years
        let total2025Camps = 0, total2025Other = 0, total2024 = 0, total2023 = 0
        
        Object.entries(results).forEach(([key, result]) => {
          if (result.success && result.count) {
            if (key.includes('camp_2025')) {
              total2025Camps += result.count
            } else if (key.includes('2025')) {
              total2025Other += result.count
            } else if (key.includes('2024')) {
              total2024 += result.count
            } else if (key.includes('2023')) {
              total2023 += result.count
            }
          }
        })
        
        // Update step counts
        if (syncSteps.value[0]) syncSteps.value[0].count = total2025Camps
        if (syncSteps.value[1]) syncSteps.value[1].count = total2025Other
        if (syncSteps.value[2]) syncSteps.value[2].count = total2024
        if (syncSteps.value[3]) syncSteps.value[3].count = total2023
        
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
    
    // Mark first step as active
    syncSteps.value[0].status = 'active'
    
    // Start progressive sync with 2025 as priority year
    await progressiveSync.syncWithPriority('2025')
    
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
</script>

<style scoped>
.welcome-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.95);
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.welcome-content {
  background: #1a1a1a;
  border: 2px solid #8B0000;
  border-radius: 8px;
  padding: 2rem;
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
}

.welcome-header {
  text-align: center;
  margin-bottom: 2rem;
}

.welcome-header h1 {
  color: #FFD700;
  margin: 0 0 0.5rem 0;
  font-size: 2rem;
}

.tagline {
  color: #ccc;
  margin: 0;
  font-size: 1.1rem;
}

.step-content {
  margin-bottom: 2rem;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
  margin: 1.5rem 0;
}

.feature-card {
  background: #2a2a2a;
  border: 1px solid #444;
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
  color: #FFD700;
  margin: 0.5rem 0;
}

.feature-card p {
  color: #ccc;
  font-size: 0.9rem;
  margin: 0;
}


.sync-details {
  margin: 1.5rem 0;
}

.sync-item {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  margin: 1rem 0;
  padding: 1rem;
  background: #2a2a2a;
  border-radius: 6px;
}

.sync-icon {
  font-size: 1.5rem;
  flex-shrink: 0;
}

.sync-item strong {
  color: #FFD700;
}

.sync-item ul {
  margin: 0.5rem 0;
  padding-left: 1rem;
  color: #ccc;
}

.sync-item p {
  margin: 0.5rem 0 0 0;
  color: #ccc;
}

.sync-page {
  max-width: 100%;
}

.sync-header {
  text-align: center;
  margin-bottom: 2rem;
}

.sync-header h2 {
  color: #FFD700;
  margin-bottom: 0.5rem;
  transition: all 0.3s ease;
}

.sync-header p {
  color: #ccc;
  margin-bottom: 1.5rem;
}

.sync-preview {
  margin-bottom: 2rem;
}

.preview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.preview-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: #2a2a2a;
  border: 1px solid #444;
  border-radius: 6px;
  transition: border-color 0.3s ease;
}

.preview-item:hover {
  border-color: #8B0000;
}

.preview-icon {
  font-size: 2rem;
  flex-shrink: 0;
}

.preview-content h4 {
  color: #FFD700;
  margin: 0 0 0.25rem 0;
  font-size: 1rem;
}

.preview-content p {
  color: #ccc;
  margin: 0;
  font-size: 0.9rem;
}

.sync-stats {
  display: flex;
  justify-content: center;
  gap: 2rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #ccc;
  font-size: 0.9rem;
}

.stat-icon {
  font-size: 1.1rem;
}

.countdown-notice {
  text-align: center;
  padding: 1rem;
  background: rgba(255, 215, 0, 0.1);
  border: 1px solid rgba(255, 215, 0, 0.3);
  border-radius: 6px;
  animation: pulse-glow 2s ease-in-out infinite;
}

.countdown-notice p {
  margin: 0;
  color: #FFD700;
  font-size: 1rem;
}

@keyframes pulse-glow {
  0%, 100% { 
    background: rgba(255, 215, 0, 0.1);
    border-color: rgba(255, 215, 0, 0.3);
  }
  50% { 
    background: rgba(255, 215, 0, 0.2);
    border-color: rgba(255, 215, 0, 0.5);
  }
}

.sync-progress {
  margin: 1rem 0;
  min-height: 300px;
}


.completion {
  text-align: center;
}

.success-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.completion h2 {
  color: #FFD700;
  margin-bottom: 1rem;
}

.quick-actions {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin: 1.5rem 0;
}

.action-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: #2a2a2a;
  border: 1px solid #444;
  border-radius: 6px;
  color: #fff;
  text-align: left;
  cursor: pointer;
  transition: background-color 0.2s;
}

.action-card:hover {
  background: #333;
  border-color: #8B0000;
}

.action-icon {
  font-size: 1.5rem;
  flex-shrink: 0;
}

.action-card strong {
  color: #FFD700;
  display: block;
  margin-bottom: 0.25rem;
}

.action-card p {
  color: #ccc;
  margin: 0;
  font-size: 0.9rem;
}

.show-tour-option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 1.5rem 0;
  color: #ccc;
  cursor: pointer;
}

.show-tour-option input {
  margin: 0;
}

.step-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 2rem;
}

.primary-button {
  background: #8B0000;
  color: #fff;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  transition: background-color 0.2s;
}

.primary-button:hover:not(:disabled) {
  background: #a00;
}

.primary-button:disabled {
  background: #555;
  cursor: not-allowed;
}

.secondary-button {
  background: transparent;
  color: #ccc;
  border: 1px solid #444;
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  transition: border-color 0.2s;
}

.secondary-button:hover {
  border-color: #8B0000;
  color: #fff;
}

.step-indicator {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 2rem;
}

.step-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #444;
  transition: background-color 0.2s;
}

.step-dot.active {
  background: #8B0000;
}

.step-dot.completed {
  background: #FFD700;
}

@media (max-width: 768px) {
  .welcome-content {
    padding: 1rem;
    margin: 0.5rem;
  }
  
  .features-grid {
    grid-template-columns: 1fr;
  }
  
  .preview-grid {
    grid-template-columns: 1fr;
  }
  
  .sync-stats {
    flex-direction: column;
    gap: 1rem;
    align-items: center;
  }
  
  .step-actions {
    flex-direction: column;
  }
  
  .welcome-header h1 {
    font-size: 1.5rem;
  }
}
</style>