<template>
  <div class="view-container">
    <section id="settings-section" class="view">
      <div class="content-tabs">
        <div class="tab-buttons">
          <button 
            v-for="tab in getVisibleTabs()" 
            :key="tab"
            @click="setActiveTab(tab)"
            :class="['tab-btn', { active: activeTab === tab }]"
          >
            {{ getTabLabel(tab) }}
          </button>
        </div>

        <div class="tab-content">
          <!-- Tab Components -->
          <AboutSettings v-if="activeTab === 'ABOUT'" :showReleaseNotes="showReleaseNotes" />
          <DataSyncSettings v-if="activeTab === 'DATA SYNC'" />
          <AppearanceSettings v-if="activeTab === 'APPEARANCE'" />
          <FeaturesSettings v-if="activeTab === 'FEATURES'" />
          <MapsSettings v-if="activeTab === 'MAPS'" />
          <ImplementationSettings v-if="activeTab === 'IMPLEMENTATION'" />
          <FeedbackSettings v-if="activeTab === 'FEEDBACK'" />
          <EmergencySettings v-if="activeTab === 'EMERGENCY'" />
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

// Import all settings components
import AboutSettings from '../components/settings/AboutSettings.vue'
import DataSyncSettings from '../components/settings/DataSyncSettings.vue'
import AppearanceSettings from '../components/settings/AppearanceSettings.vue'
import FeaturesSettings from '../components/settings/FeaturesSettings.vue'
import MapsSettings from '../components/settings/MapsSettings.vue'
import ImplementationSettings from '../components/settings/ImplementationSettings.vue'
import FeedbackSettings from '../components/settings/FeedbackSettings.vue'
import EmergencySettings from '../components/settings/EmergencySettings.vue'

// Props
const props = defineProps({
  tab: String,
  showReleaseNotes: Boolean
})

// Router
const route = useRoute()
const router = useRouter()

// Tab management
const tabs = ['ABOUT', 'DATA SYNC', 'APPEARANCE', 'FEATURES', 'MAPS', 'IMPLEMENTATION', 'FEEDBACK', 'EMERGENCY']

// Mobile-friendly tab labels
const mobileTabLabels = {
  'ABOUT': 'ABOUT',
  'DATA SYNC': 'SYNC',
  'FEATURES': 'FEATURES', 
  'MAPS': 'MAPS',
  'IMPLEMENTATION': 'TOOLS',
  'FEEDBACK': 'FEEDBACK',
  'EMERGENCY': 'EMERGENCY'
}

// Tab name mapping for URLs (kebab-case)
const tabUrlMap = {
  'ABOUT': 'about',
  'DATA SYNC': 'data_sync',
  'FEATURES': 'features',
  'MAPS': 'maps',
  'IMPLEMENTATION': 'implementation',
  'FEEDBACK': 'feedback',
  'EMERGENCY': 'emergency'
}

const urlTabMap = Object.fromEntries(
  Object.entries(tabUrlMap).map(([key, value]) => [value, key])
)

// Get initial tab from route or localStorage
const getInitialTab = () => {
  if (props.tab) {
    return urlTabMap[props.tab] || 'ABOUT'
  }
  return localStorage.getItem('settingsTab') || 'ABOUT'
}

const activeTab = ref(getInitialTab())

// Watch for route changes
watch(() => props.tab, (newTab) => {
  if (newTab && urlTabMap[newTab]) {
    activeTab.value = urlTabMap[newTab]
  }
})

// Save tab selection and update URL when tab changes
watch(activeTab, (newTab) => {
  localStorage.setItem('settingsTab', newTab)
  const urlSlug = tabUrlMap[newTab]
  if (urlSlug && route.params.tab !== urlSlug) {
    router.push(`/settings/${urlSlug}`)
  }
})

// Mobile detection
const isMobile = ref(window.innerWidth < 600)
const handleResize = () => {
  isMobile.value = window.innerWidth < 600
}

onMounted(() => {
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})

// Get filtered tabs for current viewport
const getVisibleTabs = () => {
  if (isMobile.value) {
    // Hide IMPLEMENTATION on mobile - not useful for mobile users
    return tabs.filter(tab => tab !== 'IMPLEMENTATION')
  }
  return tabs
}

// Get appropriate tab label for current viewport
const getTabLabel = (tab) => {
  return isMobile.value ? mobileTabLabels[tab] : tab
}

// Set active tab
const setActiveTab = (tab) => {
  activeTab.value = tab
}
</script>

<style>
/* Global tab styles - shared across all components */
.content-tabs {
  background: var(--color-bg-elevated);
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 2rem;
}

.tab-buttons {
  display: flex;
  border-bottom: 1px solid var(--color-border);
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.tab-btn {
  flex: 1;
  padding: 1rem;
  background: none;
  border: none;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  text-transform: uppercase;
  font-size: 0.875rem;
  font-family: 'Berkeley Mono', monospace;
}

.tab-btn:hover {
  background: var(--color-bg-header);
  color: var(--color-text-primary);
}

.tab-btn.active {
  background: var(--color-primary);
  color: var(--color-text-inverse);
}

.tab-content {
  padding: 16px;
  max-width: none;
  animation: fadeIn 0.3s;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Mobile tab adjustments */
@media (max-width: 600px) {
  .tab-content {
    padding: 16px;
  }
  
  .tab-btn {
    padding: 0.75rem 0.5rem;
    font-size: 0.75rem;
    min-height: 44px;
  }
  
  .tab-buttons::-webkit-scrollbar {
    display: none;
  }
  
  .tab-buttons {
    scrollbar-width: none;
    -ms-overflow-style: none;
  }
}

/* Global settings font */
#settings-section {
  font-family: 'Berkeley Mono', monospace;
}
</style>

<style scoped>
.view-container {
  width: 100%;
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
}

#settings-section {
  padding: 1rem;
  max-width: 1000px;
  margin: 0 auto;
  min-height: 100%;
  font-family: 'Berkeley Mono', monospace;
}

/* Ensure tab content has proper width */
:deep(.settings-component) {
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
  box-sizing: border-box;
}

/* Hide h2 headers on mobile - tab context is sufficient */
@media (max-width: 600px) {
  #settings-section {
    padding: 0.5rem;
  }
  
  :deep(.settings-component) {
    max-width: 100%;
  }
  
  :deep(.tab-content h2) {
    display: none;
  }
}
</style>