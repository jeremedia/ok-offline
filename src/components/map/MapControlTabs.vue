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
        <label class="control-item">
          <input type="checkbox" v-model="controls.showCamps" @change="updateControls">
          <span class="control-label">🏠 Camps</span>
        </label>
        <label class="control-item">
          <input type="checkbox" v-model="controls.showArt" @change="updateControls">
          <span class="control-label">🎨 Art</span>
        </label>
        <label class="control-item">
          <input type="checkbox" v-model="controls.showEvents" @change="updateControls">
          <span class="control-label">🎉 Events</span>
        </label>
        <label class="control-item">
          <input type="checkbox" v-model="controls.showFavoritesOnly" @change="updateControls">
          <span class="control-label">⭐ Favorites Only</span>
        </label>
        
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
          <input type="checkbox" v-model="controls.showTrashFence" @change="updateControls">
          <span class="control-label">🚧 Trash Fence</span>
        </label>
        <label class="control-item">
          <input type="checkbox" v-model="controls.showCityBlocks" @change="updateControls">
          <span class="control-label">🏗️ City Blocks</span>
        </label>
        <label class="control-item">
          <input type="checkbox" v-model="controls.showPlazas" @change="updateControls">
          <span class="control-label">📍 Plazas & CPNs</span>
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
import { ref, reactive, onMounted, watch, nextTick } from 'vue'

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
  // Layer controls
  showStreets: true,
  showTrashFence: true,
  showCityBlocks: false,
  showPlazas: true,
  // Display controls
  showBasemap: false,
  cityAligned: false,
  rotationAngle: 0,
  showLegend: true,
  showMapInfo: false,
  ...props.initialControls
})

// Load saved state from localStorage
onMounted(() => {
  const savedState = localStorage.getItem('mapControlState')
  if (savedState) {
    try {
      const parsed = JSON.parse(savedState)
      Object.assign(controls, parsed)
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
  background: rgba(26, 26, 26, 0.9);
  border-radius: 8px;
  border: 1px solid #444;
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
  background: rgba(0, 0, 0, 0.3);
  border-radius: 8px 8px 0 0;
  border-bottom: 1px solid #444;
}

.collapsed .control-header {
  border-radius: 8px;
  border-bottom: none;
}

.control-header h4 {
  margin: 0;
  color: #FFD700;
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  white-space: nowrap;
}

.control-header .collapse-btn {
  background: none;
  border: none;
  color: #ccc;
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
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

/* Tab Header */
.tab-header {
  display: flex;
  background: rgba(0, 0, 0, 0.3);
  border-bottom: 1px solid #444;
}

.tab-button {
  flex: 1;
  padding: 0.75rem;
  background: none;
  border: none;
  color: #999;
  font-size: 0.875rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s ease;
  border-right: 1px solid #333;
  white-space: nowrap;
  text-transform: uppercase;
}

.tab-button:last-child {
  border-right: none;
}

.tab-button:hover {
  background: rgba(139, 0, 0, 0.3);
  color: #fff;
}

.tab-button.active {
  background: #8B0000;
  color: #fff;
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
  color: #ccc;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.control-item:hover {
  background: rgba(255, 255, 255, 0.05);
  color: #fff;
}

.control-item.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.control-item.disabled:hover {
  background: none;
  color: #ccc;
}

.control-label {
  flex: 1;
  user-select: none;
}

/* Checkbox styling */
.control-item input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

/* Rotation Controls */
.rotation-controls {
  background: rgba(0, 0, 0, 0.3);
  padding: 0.75rem;
  border-radius: 4px;
  margin-top: 0.5rem;
}

.slider-label {
  display: block;
  font-size: 0.75rem;
  color: #FFD700;
  margin-bottom: 0.5rem;
}

.rotation-slider {
  width: 100%;
  height: 4px;
  border-radius: 2px;
  background: #444;
  outline: none;
  cursor: pointer;
}

.rotation-slider::-webkit-slider-thumb {
  appearance: none;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #FFD700;
  cursor: pointer;
}

.rotation-slider::-moz-range-thumb {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #FFD700;
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
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid #444;
  border-radius: 4px;
  color: #ccc;
  font-size: 0.625rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.rotation-preset-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
  border-color: #666;
}

.rotation-preset-btn:active {
  transform: scale(0.95);
}

/* Loading/Error States */
.loading-indicator,
.error-indicator {
  padding: 0.5rem;
  text-align: center;
  font-size: 0.75rem;
  border-radius: 4px;
}

.loading-indicator {
  background: rgba(255, 215, 0, 0.1);
  color: #FFD700;
}

.error-indicator {
  background: rgba(255, 107, 107, 0.1);
  color: #ff6b6b;
}

/* Reset View Button */
.reset-view-container {
  border-top: 1px solid #333;
  padding: 0 0.5rem 0.5rem 0.5rem;
}

.reset-view-btn {
  width: 100%;
  padding: 0.75rem;
  background: #8B0000;
  border: none;
  border-radius: 4px;
  color: #fff;
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
  background: #a00000;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
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