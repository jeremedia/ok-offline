<template>
  <section id="settings-section" class="view">
    <div class="settings-tabs">
      <button 
        v-for="tab in tabs" 
        :key="tab"
        @click="setActiveTab(tab)"
        :class="['tab-button', { active: activeTab === tab }]"
      >
        {{ tab }}
      </button>
    </div>

    <!-- Tab Components -->
    <AboutSettings v-if="activeTab === 'ABOUT'" />
    <DataSyncSettings v-if="activeTab === 'DATA SYNC'" />
    <FeaturesSettings v-if="activeTab === 'FEATURES'" />
    <MapsSettings v-if="activeTab === 'MAPS'" />
    <ImplementationSettings v-if="activeTab === 'IMPLEMENTATION'" />
    <FeedbackSettings v-if="activeTab === 'FEEDBACK'" />
    <EmergencySettings v-if="activeTab === 'EMERGENCY'" />
  </section>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

// Import all settings components
import AboutSettings from '../components/settings/AboutSettings.vue'
import DataSyncSettings from '../components/settings/DataSyncSettings.vue'
import FeaturesSettings from '../components/settings/FeaturesSettings.vue'
import MapsSettings from '../components/settings/MapsSettings.vue'
import ImplementationSettings from '../components/settings/ImplementationSettings.vue'
import FeedbackSettings from '../components/settings/FeedbackSettings.vue'
import EmergencySettings from '../components/settings/EmergencySettings.vue'

// Props
const props = defineProps({
  tab: String
})

// Router
const route = useRoute()
const router = useRouter()

// Tab management
const tabs = ['ABOUT', 'DATA SYNC', 'FEATURES', 'MAPS', 'IMPLEMENTATION', 'FEEDBACK', 'EMERGENCY']

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
}

.settings-tabs {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  border-bottom: 2px solid #444;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.tab-button {
  background: none;
  border: none;
  color: #999;
  cursor: pointer;
  padding: 1rem 1.5rem;
  font-size: 1rem;
  font-family: 'Berkeley Mono', monospace;
  white-space: nowrap;
  transition: all 0.2s;
  position: relative;
  border-bottom: 3px solid transparent;
  margin-bottom: -2px;
}

.tab-button:hover {
  color: #ccc;
}

.tab-button.active {
  color: #fff;
  border-bottom-color: #8B0000;
}

/* Base tab content styles */
:deep(.tab-content) {
  animation: fadeIn 0.3s;
  font-family: 'Berkeley Mono', monospace;
}

:deep(.tab-content h2) {
  color: #fff;
  margin-bottom: 1.5rem;
}

:deep(.tab-content h3) {
  color: #fff;
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
  
  .settings-tabs {
    gap: 0.5rem;
  }
  
  .tab-button {
    padding: 0.75rem 1rem;
    font-size: 0.9rem;
  }
}

@media (max-width: 600px) {
  .settings-tabs {
    gap: 0.25rem;
  }
  
  .tab-button {
    padding: 0.75rem 0.75rem;
    font-size: 0.8rem;
  }
}
</style>