<template>
  <section id="settings-section" class="view">
    <div class="settings-tabs">
      <button 
        v-for="tab in getVisibleTabs()" 
        :key="tab"
        @click="setActiveTab(tab)"
        :class="['tab-button', { active: activeTab === tab }]"
      >
        {{ getTabLabel(tab) }}
      </button>
    </div>

    <!-- Tab Components -->
    <AboutSettings v-if="activeTab === 'ABOUT'" :showReleaseNotes="showReleaseNotes" />
    <DataSyncSettings v-if="activeTab === 'DATA SYNC'" />
    <AppearanceSettings v-if="activeTab === 'APPEARANCE'" />
    <FeaturesSettings v-if="activeTab === 'FEATURES'" />
    <MapsSettings v-if="activeTab === 'MAPS'" />
    <ImplementationSettings v-if="activeTab === 'IMPLEMENTATION'" />
    <FeedbackSettings v-if="activeTab === 'FEEDBACK'" />
    <EmergencySettings v-if="activeTab === 'EMERGENCY'" />
  </section>
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
/* Global settings font */
#settings-section {
  font-family: 'Berkeley Mono', monospace;
}
</style>

<style scoped>
#settings-section {
  padding: 1rem;
  max-width: 1000px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: calc(100vh - 120px); /* Account for header and tab nav */
}

.settings-tabs {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  border-bottom: 2px solid var(--color-border);
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  /* Safari fixes - force container height */
  min-height: 44px;
  height: auto;
  flex-shrink: 0;
  overflow-y: hidden;
}

.tab-button {
  background: none;
  border: none;
  color: var(--color-text-muted);
  cursor: pointer;
  padding: 1rem 1.5rem;
  font-size: 1rem;
  font-family: 'Berkeley Mono', monospace;
  white-space: nowrap;
  transition: all 0.2s;
  position: relative;
  border-bottom: 3px solid transparent;
  margin-bottom: -2px;
  text-transform: uppercase;
}

.tab-button:hover {
  color: var(--color-text-secondary);
}

.tab-button.active {
  color: var(--color-text-primary);
  border-bottom-color: var(--color-primary);
}

/* Base tab content styles */
:deep(.tab-content) {
  animation: fadeIn 0.3s;
  font-family: 'Berkeley Mono', monospace;
}

:deep(.tab-content h2) {
  color: var(--color-text-primary);
  margin: 0 0 1.5rem 0;
}

:deep(.tab-content h3) {
  color: var(--color-text-primary);
  margin-bottom: 1rem;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Mobile responsive */
@media (max-width: 768px) {
  #settings-section {
    padding: 0.5rem;
  }
}

/* Mobile optimized horizontal tabs */
@media (max-width: 600px) {
  #settings-section {
    padding: 0 1rem; /* Content padding only */
    max-width: 100vw; /* Ensure container doesn't exceed viewport */
    overflow-x: hidden; /* Prevent horizontal scroll */
    box-sizing: border-box;
  }
  
  .settings-tabs {
    gap: 0.25rem;
    margin-bottom: 1.5rem;
    padding: 0 1rem;
    min-height: 44px;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    /* Hide scrollbar but keep functionality */
    scrollbar-width: none;
    -ms-overflow-style: none;
    /* Ensure tabs align left and scroll properly */
    justify-content: flex-start;
    width: 100%;
  }
  
  /* Ensure all tab content respects mobile boundaries */
  :deep(.tab-content) {
    max-width: 100%;
    box-sizing: border-box;
    overflow-x: hidden;
  }
  
  /* Hide h2 headers on mobile - tab context is sufficient */
  :deep(.tab-content h2) {
    display: none;
  }
  
  /* Remove top margin from first paragraph in about section */
  :deep(.about-section p:first-child) {
    margin-top: 0;
  }
  
  /* Remove bottom margin from last ul in about section */
  :deep(.about-section ul:last-child) {
    margin-bottom: 0;
  }
  
  .settings-tabs::-webkit-scrollbar {
    display: none;
  }
  
  .tab-button {
    padding: 0.75rem 0.75rem;
    font-size: 0.8rem;
    min-height: 44px;
    min-width: max-content; /* Ensure buttons don't shrink */
    white-space: nowrap;
    flex-shrink: 0; /* Prevent shrinking */
    flex-grow: 0; /* Prevent growing */
  }
}
</style>