<template>
  <div class="map-control-tabs" :class="{ 'mobile-view': isMobile, 'collapsed': isCollapsed }">
    <!-- Control Header (Desktop Only) -->
    <div v-if="!isMobile" class="control-header">
      <h4>{{ year }} Map</h4>
      <button 
        @click="toggleCollapse"
        class="collapse-btn"
        :aria-label="isCollapsed ? 'Expand controls' : 'Collapse controls'"
      >
        {{ isCollapsed ? '◀' : '▶' }}
      </button>
    </div>
    
    <!-- Tab Headers -->
    <div v-show="!isCollapsed" class="tab-header">
      <button 
        v-for="tab in tabs" 
        :key="tab.id"
        @click="activeTab = tab.id"
        class="tab-button"
        :class="{ active: activeTab === tab.id }"
      >
        {{ tab.icon }} {{ tab.label }}
      </button>
    </div>
    
    <!-- Tab Content -->
    <div v-show="!isCollapsed" class="tab-content">
      <!-- Content Tab -->
      <div v-show="activeTab === 'content'" class="tab-panel">
        <!-- Location Data Warning -->
        <div v-if="!locationsAvailable" class="location-warning">
          <div class="warning-title">📍 Location Data Not Yet Released for {{ year }}</div>
          <div v-if="timeUntilRelease" class="warning-countdown">
            Available in {{ timeUntilRelease }}
          </div>
          <div class="warning-note">
            Camp locations visible first Sunday of build week (12:01am)
          </div>
        </div>
        
        <label class="control-item" :class="{ disabled: !locationsAvailable }">
          <input type="checkbox" v-model="controls.showCamps" @change="updateControls" :disabled="!locationsAvailable">
          <span class="control-label">🏠 Camps</span>
        </label>
        <label class="control-item" :class="{ disabled: !locationsAvailable }">
          <input type="checkbox" v-model="controls.showArt" @change="updateControls" :disabled="!locationsAvailable">
          <span class="control-label">🎨 Art</span>
        </label>
        <label class="control-item" :class="{ disabled: !locationsAvailable }">
          <input type="checkbox" v-model="controls.showEvents" @change="updateControls" :disabled="!locationsAvailable">
          <span class="control-label">🎉 Events</span>
        </label>
        <label class="control-item">
          <input type="checkbox" v-model="controls.showFavoritesOnly" @change="updateControls">
          <span class="control-label">⭐ Favorites Only</span>
        </label>
        <label class="control-item">
          <input type="checkbox" v-model="controls.showInfrastructure" @change="updateControls">
          <span class="control-label">📍 Infrastructure</span>
        </label>
        
        <!-- Infrastructure Categories (shown when Infrastructure is enabled) -->
        <div v-if="controls.showInfrastructure" class="infra-categories">
          <label class="control-item sub-item">
            <input type="checkbox" v-model="controls.showAirport" @change="updateControls">
            <span class="control-label">✈️ Airport</span>
          </label>
          <label class="control-item sub-item">
            <input type="checkbox" v-model="controls.showArctica" @change="updateControls">
            <span class="control-label">🧊 Arctica</span>
          </label>
          <label class="control-item sub-item">
            <input type="checkbox" v-model="controls.showCenterCamp" @change="updateControls">
            <span class="control-label">⛺ Center Camp</span>
          </label>
          <label class="control-item sub-item">
            <input type="checkbox" v-model="controls.showDMZ" @change="updateControls">
            <span class="control-label">🎵 DMZ</span>
          </label>
          <label class="control-item sub-item">
            <input type="checkbox" v-model="controls.showDPW" @change="updateControls">
            <span class="control-label">🔧 DPW</span>
          </label>
          <label class="control-item sub-item">
            <input type="checkbox" v-model="controls.showHellStation" @change="updateControls">
            <span class="control-label">⛽ Hell Station</span>
          </label>
          <label class="control-item sub-item">
            <input type="checkbox" v-model="controls.showTheMan" @change="updateControls">
            <span class="control-label">🔥 The Man</span>
          </label>
          <label class="control-item sub-item">
            <input type="checkbox" v-model="controls.showMedical" @change="updateControls">
            <span class="control-label">🏥 Medical</span>
          </label>
          <label class="control-item sub-item">
            <input type="checkbox" v-model="controls.showPoints" @change="updateControls">
            <span class="control-label">#️⃣ Points</span>
          </label>
          <label class="control-item sub-item">
            <input type="checkbox" v-model="controls.showRangers" @change="updateControls">
            <span class="control-label">🎯 Rangers</span>
          </label>
          <label class="control-item sub-item">
            <input type="checkbox" v-model="controls.showTemple" @change="updateControls">
            <span class="control-label">🏛 Temple</span>
          </label>
          <label class="control-item sub-item">
            <input type="checkbox" v-model="controls.showToilets" @change="updateControls">
            <span class="control-label">🚻 Portos</span>
          </label>
        </div>
        
        <div class="reset-view-container" v-if="showResetView">
          <button 
            @click="$emit('reset-view')"
            class="reset-view-btn"
          >
            🎯 Reset View
          </button>
        </div>
      </div>
      
      <!-- Layers Tab -->
      <div v-show="activeTab === 'layers'" class="tab-panel">
        <label class="control-item">
          <input type="checkbox" v-model="controls.showStreets" @change="updateControls">
          <span class="control-label">🛣️ Streets</span>
        </label>
        <label class="control-item">
          <input type="checkbox" v-model="controls.showStreetOutlines" @change="updateControls">
          <span class="control-label">🛤️ Street Outlines</span>
        </label>
        <label class="control-item">
          <input type="checkbox" v-model="controls.showTrashFence" @change="updateControls">
          <span class="control-label">🚧 Trash Fence</span>
        </label>
        <label class="control-item">
          <input type="checkbox" v-model="controls.showCityBlocks" @change="updateControls">
          <span class="control-label">🏗️ City Blocks</span>
        </label>
        <label class="control-item">
          <input type="checkbox" v-model="controls.showPlazas" @change="updateControls">
          <span class="control-label">🟪 Plazas</span>
        </label>
        <label class="control-item">
          <input type="checkbox" v-model="controls.showPortals" @change="updateControls">
          <span class="control-label">🅿️ Portals</span>
        </label>
        <label class="control-item" v-show="false">
          <input type="checkbox" v-model="controls.showCPNs" @change="updateControls">
          <span class="control-label">📍 Reference Points</span>
        </label>
        <div v-if="gisLoadingState.isLoading" class="loading-indicator">
          Loading GIS data...
        </div>
        <div v-if="gisLoadingState.error" class="error-indicator">
          Error loading GIS data
        </div>
      </div>
      
      <!-- Display Tab -->
      <div v-show="activeTab === 'display'" class="tab-panel">
        <label class="control-item" :class="{ disabled: year !== '2025' }">
          <input 
            type="checkbox" 
            v-model="controls.showBasemap" 
            @change="updateControls"
            :disabled="year !== '2025'"
          >
          <span class="control-label">🗺️ Base Map {{ year !== '2025' ? '(2025 only)' : '' }}</span>
        </label>
        <label class="control-item">
          <input type="checkbox" v-model="controls.cityAligned" @change="updateControls">
          <span class="control-label">🧭 City Aligned</span>
        </label>
        <div v-if="controls.cityAligned" class="rotation-controls">
          <label class="slider-label">🔄 Rotation: {{ controls.rotationAngle }}°</label>
          <input 
            type="range" 
            v-model="controls.rotationAngle" 
            @input="updateControls"
            min="-180" 
            max="180" 
            step="1"
            class="rotation-slider"
          >
          <div class="rotation-buttons">
            <button @click="setRotation(0)" class="rotation-preset-btn">
              Reset to 0°
            </button>
            <button @click="setRotation(-45)" class="rotation-preset-btn">
              Reset to -45°
            </button>
          </div>
        </div>
        <label class="control-item">
          <input type="checkbox" v-model="controls.showLegend" @change="updateControls">
          <span class="control-label">📊 Show Legend</span>
        </label>
        <label class="control-item">
          <input type="checkbox" v-model="controls.showMapInfo" @change="updateControls">
          <span class="control-label">🔍 Show Map Info</span>
        </label>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch, nextTick, computed } from 'vue'
import { canShowLocations } from '@/stores/globalState'

const props = defineProps({
  isMobile: Boolean,
  year: String,
  gisLoadingState: Object,
  initialControls: Object,
  showResetView: Boolean
})

const emit = defineEmits(['update:controls', 'reset-view'])

// Tab configuration
const tabs = [
  { id: 'content', label: 'Content', icon: '📍' },
  { id: 'layers', label: 'Layers', icon: '🗺️' },
  { id: 'display', label: 'Display', icon: '⚙️' }
]

const activeTab = ref('content')
const isCollapsed = ref(false)

// Control state
const controls = reactive({
  // Content controls
  showCamps: true,
  showArt: true,
  showEvents: true,
  showFavoritesOnly: false,
  showInfrastructure: true,
  // Infrastructure subcategories
  showTheMan: true,
  showCenterCamp: true,
  showTemple: true,
  showAirport: true,
  showMedical: true,
  showRangers: true,
  showDPW: true,
  showArctica: true,
  showPoints: true,
  showDMZ: true,
  showHellStation: true,
  showToilets: true,
  // Layer controls
  showStreets: true,
  showStreetOutlines: false,
  showPortals: false,
  showTrashFence: true,
  showCityBlocks: false,
  showPlazas: true,
  showCPNs: false,
  // Display controls
  showBasemap: props.year === '2025', // Default to true for 2025
  cityAligned: false,
  rotationAngle: 0,
  showLegend: true,
  showMapInfo: false,
  ...props.initialControls
})

// Check if locations are available for the current year
const locationsAvailable = computed(() => {
  return canShowLocations(props.year)
})

// Calculate time until location data is released
const timeUntilRelease = computed(() => {
  if (props.year !== '2025' || locationsAvailable.value) {
    return null
  }
  
  const now = new Date()
  const buildWeekSunday = new Date(2025, 7, 17, 0, 1) // Aug 17, 2025 at 12:01am
  
  if (now >= buildWeekSunday) {
    return null
  }
  
  const diff = buildWeekSunday - now
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  
  if (days > 0) {
    return `${days} day${days !== 1 ? 's' : ''} ${hours} hour${hours !== 1 ? 's' : ''}`
  } else if (hours > 0) {
    return `${hours} hour${hours !== 1 ? 's' : ''}`
  } else {
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`
  }
})

// Watch for location availability changes
watch(locationsAvailable, (available) => {
  if (!available) {
    // Disable location-based controls when locations aren't available
    controls.showCamps = false
    controls.showArt = false
    controls.showEvents = false
    updateControls()
  }
})

// Watch for year changes to update location-based controls
watch(() => props.year, (newYear) => {
  // Handle location-based controls
  if (!canShowLocations(newYear)) {
    controls.showCamps = false
    controls.showArt = false
    controls.showEvents = false
  }
  
  // Handle basemap control (only available for 2025)
  if (newYear !== '2025' && controls.showBasemap) {
    controls.showBasemap = false
  }
  
  updateControls()
})

// Load saved state from localStorage
onMounted(() => {
  const savedState = localStorage.getItem('mapControlState')
  if (savedState) {
    try {
      const parsed = JSON.parse(savedState)
      Object.assign(controls, parsed)
      
      // Check location availability and disable controls if needed
      if (!canShowLocations(props.year)) {
        controls.showCamps = false
        controls.showArt = false
        controls.showEvents = false
      }
      
      // Disable basemap for non-2025 years
      if (props.year !== '2025' && controls.showBasemap) {
        controls.showBasemap = false
      }
      
      // Emit the loaded state to parent
      emit('update:controls', { ...controls })
    } catch (e) {
      console.error('Failed to load map control state:', e)
    }
  }
  
  // Load active tab preference
  const savedTab = localStorage.getItem('mapActiveTab')
  if (savedTab && tabs.some(t => t.id === savedTab)) {
    activeTab.value = savedTab
  }
  
  // Load collapsed state (desktop only)
  if (!props.isMobile) {
    const savedCollapsed = localStorage.getItem('mapControlsCollapsed')
    if (savedCollapsed !== null) {
      isCollapsed.value = savedCollapsed === 'true'
    }
  }
})

// Save state changes
const updateControls = () => {
  // Save to localStorage
  localStorage.setItem('mapControlState', JSON.stringify(controls))
  
  // Emit changes to parent
  emit('update:controls', { ...controls })
}

// Save active tab preference
watch(activeTab, (newTab) => {
  localStorage.setItem('mapActiveTab', newTab)
})

// Set rotation to a specific angle
const setRotation = (angle) => {
  // Update the local control value
  controls.rotationAngle = angle
  
  // Save to localStorage
  localStorage.setItem('mapControlState', JSON.stringify(controls))
  
  // Emit ONLY the rotationAngle change to avoid triggering toggleRotation
  emit('update:controls', { rotationAngle: angle })
}

// Toggle collapse state
const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value
  localStorage.setItem('mapControlsCollapsed', isCollapsed.value)
}
</script>

<style scoped>
.map-control-tabs {
  background: var(--color-background-secondary-alpha-90);
  border-radius: 8px;
  border: 1px solid var(--color-border);
  overflow: hidden;
  max-width: 320px;
  transition: all 0.3s ease;
}

.map-control-tabs.collapsed {
  max-width: fit-content;
}

/* Control Header (matching legend header style) */
.control-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 0.75rem;
  background: var(--color-overlay-light);
  border-radius: 8px 8px 0 0;
  border-bottom: 1px solid var(--color-border);
}

.collapsed .control-header {
  border-radius: 8px;
  border-bottom: none;
}

.control-header h4 {
  margin: 0;
  color: var(--color-accent);
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  white-space: nowrap;
}

.control-header .collapse-btn {
  background: none;
  border: none;
  color: var(--color-text-disabled);
  font-size: 0.75rem;
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  margin-left: 0.5rem;
  border-radius: 4px;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
}

.control-header .collapse-btn:hover {
  background: var(--color-white-alpha-10);
  color: var(--color-text-primary);
}

/* Tab Header */
.tab-header {
  display: flex;
  background: var(--color-overlay-light);
  border-bottom: 1px solid var(--color-border);
}

.tab-button {
  flex: 1;
  padding: 0.75rem;
  background: none;
  border: none;
  color: var(--color-text-muted);
  font-size: 0.875rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s ease;
  border-right: 1px solid var(--color-border-dark);
  white-space: nowrap;
  text-transform: uppercase;
}

.tab-button:last-child {
  border-right: none;
}

.tab-button:hover {
  background: var(--color-primary-alpha-30);
  color: var(--color-text-primary);
}

.tab-button.active {
  background: var(--color-primary);
  color: var(--color-text-primary);
  font-weight: bold;
}

/* Tab Content */
.tab-content {
  padding: 1rem;
}

.tab-panel {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

/* Control Items */
.control-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--color-text-disabled);
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.control-item:hover {
  background: var(--color-white-alpha-05);
  color: var(--color-text-primary);
}

.control-item.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.control-item.disabled:hover {
  background: none;
  color: var(--color-text-disabled);
}

.control-label {
  flex: 1;
  user-select: none;
}

/* Infrastructure Categories */
.infra-categories {
  background: var(--color-overlay-lighter);
  border-radius: 4px;
  padding: 0.5rem;
  margin-bottom: 0.5rem;
  border-left: 3px solid var(--color-accent);
}

.control-item.sub-item {
  padding: 0.375rem 0.5rem;
  font-size: 0.813rem;
}

.control-item.sub-item .control-label {
  margin-left: 0.25rem;
}

/* Checkbox styling */
.control-item input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

/* Rotation Controls */
.rotation-controls {
  background: var(--color-overlay-light);
  padding: 0.75rem;
  border-radius: 4px;
  margin-top: 0.5rem;
}

.slider-label {
  display: block;
  font-size: 0.75rem;
  color: var(--color-accent);
  margin-bottom: 0.5rem;
}

.rotation-slider {
  width: 100%;
  height: 4px;
  border-radius: 2px;
  background: var(--color-border);
  outline: none;
  cursor: pointer;
}

.rotation-slider::-webkit-slider-thumb {
  appearance: none;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: var(--color-accent);
  cursor: pointer;
}

.rotation-slider::-moz-range-thumb {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: var(--color-accent);
  cursor: pointer;
  border: none;
}

.rotation-buttons {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.rotation-preset-btn {
  flex: 1;
  padding: 0.375rem 0.5rem;
  background: var(--color-white-alpha-10);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  color: var(--color-text-disabled);
  font-size: 0.625rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.rotation-preset-btn:hover {
  background: var(--color-white-alpha-20);
  color: var(--color-text-primary);
  border-color: var(--color-text-secondary);
}

.rotation-preset-btn:active {
  transform: scale(0.95);
}

/* Loading/Error States */
.loading-indicator,
.error-indicator,
.location-warning {
  padding: 0.5rem;
  text-align: center;
  font-size: 0.75rem;
  border-radius: 4px;
}

.loading-indicator {
  background: var(--color-accent-alpha-10);
  color: var(--color-accent);
}

.error-indicator {
  background: var(--color-error-alpha-10);
  color: var(--color-error);
}

.location-warning {
  background: var(--color-primary-alpha-20);
  color: var(--color-error-light);
  border: 1px solid var(--color-primary-alpha-30);
  padding: 0.75rem;
}

.location-warning .warning-title {
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.location-warning .warning-countdown {
  color: var(--color-accent);
  font-weight: 500;
  font-size: 0.875rem;
  margin-bottom: 0.25rem;
}

.location-warning .warning-note {
  font-size: 0.688rem;
  opacity: 0.9;
}

/* Reset View Button */
.reset-view-container {
  border-top: 1px solid var(--color-border-dark);
  padding: 0 0.5rem 0.5rem 0.5rem;
}

.reset-view-btn {
  width: 100%;
  padding: 0.75rem;
  background: var(--color-primary);
  border: none;
  border-radius: 4px;
  color: var(--color-text-primary);
  font-size: 0.875rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.reset-view-btn:hover {
  background: var(--color-primary-hover);
  transform: translateY(-1px);
  box-shadow: 0 2px 4px var(--color-overlay-light);
}

.reset-view-btn:active {
  transform: translateY(0);
  box-shadow: none;
}

/* Mobile Adjustments */
.mobile-view {
  max-width: none;
  border-radius: 0;
}

.mobile-view .tab-button {
  font-size: 0.75rem;
  padding: 0.625rem 0.5rem;
}

.mobile-view .control-item {
  padding: 0.625rem;
}
</style>