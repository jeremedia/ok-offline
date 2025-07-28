<template>
  <div 
    class="map-info"
    :class="{ collapsed: isCollapsed, dragging: isDragging }"
    :style="infoStyle"
    ref="infoEl"
  >
    <!-- Info Header -->
    <div 
      class="info-header"
      @mousedown="startDrag"
      @touchstart="startDrag"
    >
      <h4>Map Info</h4>
      <button 
        @click.stop="toggleCollapse"
        class="collapse-btn"
        :aria-label="isCollapsed ? 'Expand info' : 'Collapse info'"
      >
        {{ isCollapsed ? '▲' : '▼' }}
      </button>
    </div>
    
    <!-- Info Content -->
    <div v-show="!isCollapsed" class="info-content">
      <!-- Map State Section -->
      <div class="info-section">
        <h5>Map State</h5>
        <div class="info-item">
          <span class="label">Zoom Level:</span>
          <span class="value">{{ mapState.zoom.toFixed(1) }}</span>
        </div>
        <div class="info-item">
          <span class="label">Center:</span>
          <span class="value">{{ mapState.center.lat.toFixed(5) }}, {{ mapState.center.lng.toFixed(5) }}</span>
        </div>
        <div class="info-item">
          <span class="label">Rotation:</span>
          <span class="value">{{ mapState.bearing }}°</span>
        </div>
        <div class="info-item">
          <span class="label">Bounds:</span>
          <span class="value small">{{ boundsString }}</span>
        </div>
      </div>
      
      <!-- Marker Statistics -->
      <div class="info-section">
        <h5>Markers</h5>
        <div class="info-item">
          <span class="label">Camps:</span>
          <span class="value">{{ markerStats.camps }} {{ markerStats.campsFiltered > 0 ? `(${markerStats.campsFiltered} filtered)` : '' }}</span>
        </div>
        <div class="info-item">
          <span class="label">Art:</span>
          <span class="value">{{ markerStats.art }} {{ markerStats.artFiltered > 0 ? `(${markerStats.artFiltered} filtered)` : '' }}</span>
        </div>
        <div class="info-item">
          <span class="label">Events:</span>
          <span class="value">{{ markerStats.events }} {{ markerStats.eventsFiltered > 0 ? `(${markerStats.eventsFiltered} filtered)` : '' }}</span>
        </div>
        <div class="info-item">
          <span class="label">Total Visible:</span>
          <span class="value">{{ markerStats.totalVisible }}</span>
        </div>
      </div>
      
      <!-- Layer Status -->
      <div class="info-section">
        <h5>Active Layers</h5>
        <div class="info-item">
          <span class="label">Base Map:</span>
          <span class="value">{{ layerStatus.basemap ? 'On' : 'Off' }}</span>
        </div>
        <div class="info-item">
          <span class="label">GIS Layers:</span>
          <span class="value">{{ activeGISLayers }}</span>
        </div>
        <div class="info-item">
          <span class="label">Favorites Filter:</span>
          <span class="value">{{ layerStatus.favoritesOnly ? 'Active' : 'Off' }}</span>
        </div>
      </div>
      
      <!-- Performance Stats -->
      <div class="info-section">
        <h5>Performance</h5>
        <div class="info-item">
          <span class="label">Map Size:</span>
          <span class="value">{{ mapSize.width }}×{{ mapSize.height }}</span>
        </div>
        <div class="info-item">
          <span class="label">Tile Count:</span>
          <span class="value">~{{ estimatedTileCount }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed, watch } from 'vue'

const props = defineProps({
  isMobile: Boolean,
  mapState: {
    type: Object,
    required: true
  },
  markerStats: {
    type: Object,
    required: true
  },
  layerStatus: {
    type: Object,
    required: true
  }
})

const infoEl = ref(null)
const isCollapsed = ref(false)
const isDragging = ref(false)

// Position state - positioned on left side by default
const position = reactive({
  x: 10,
  y: 120  // Below the zoom controls
})

// Drag state
const dragStart = reactive({
  x: 0,
  y: 0,
  offsetX: 0,
  offsetY: 0
})

const infoStyle = computed(() => {
  if (props.isMobile) {
    // Mobile positioning - fixed at bottom right
    return {
      right: '10px',
      bottom: isCollapsed.value ? '20px' : '20px',
      left: 'auto',
      top: 'auto'
    }
  }
  
  // Desktop draggable positioning
  if (isCollapsed.value) {
    // When collapsed, snap to bottom left
    return {
      left: `${position.x}px`,
      bottom: '20px',
      right: 'auto',
      top: 'auto'
    }
  }
  
  // Normal expanded state
  return {
    left: `${position.x}px`,
    top: `${position.y}px`
  }
})

// Computed properties for display
const boundsString = computed(() => {
  if (!props.mapState.bounds) return 'N/A'
  const { _northEast: ne, _southWest: sw } = props.mapState.bounds
  return `NE: ${ne.lat.toFixed(3)}, ${ne.lng.toFixed(3)}\nSW: ${sw.lat.toFixed(3)}, ${sw.lng.toFixed(3)}`
})

const activeGISLayers = computed(() => {
  const layers = []
  if (props.layerStatus.streets) layers.push('Streets')
  if (props.layerStatus.trashFence) layers.push('Fence')
  if (props.layerStatus.cityBlocks) layers.push('Blocks')
  if (props.layerStatus.plazas) layers.push('Plazas')
  return layers.length > 0 ? layers.join(', ') : 'None'
})

const mapSize = computed(() => {
  return props.mapState.size || { width: 0, height: 0 }
})

const estimatedTileCount = computed(() => {
  // Estimate visible tiles based on zoom level and viewport
  const tilesPerRow = Math.ceil(mapSize.value.width / 256) + 2
  const tilesPerCol = Math.ceil(mapSize.value.height / 256) + 2
  return tilesPerRow * tilesPerCol
})

// Load saved state
onMounted(() => {
  // Load collapsed state
  const savedCollapsed = localStorage.getItem('mapInfoCollapsed')
  if (savedCollapsed !== null) {
    isCollapsed.value = savedCollapsed === 'true'
  }
  
  // Load position (desktop only)
  if (!props.isMobile) {
    const savedPosition = localStorage.getItem('mapInfoPosition')
    if (savedPosition) {
      try {
        const parsed = JSON.parse(savedPosition)
        position.x = parsed.x
        position.y = parsed.y
        
        // Ensure info panel stays in viewport
        constrainToViewport()
      } catch (e) {
        console.error('Failed to load info position:', e)
      }
    }
  }
})

// Toggle collapse state
const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value
  localStorage.setItem('mapInfoCollapsed', isCollapsed.value)
  
  // If expanding on desktop, restore to saved position
  if (!isCollapsed.value && !props.isMobile) {
    const savedPosition = localStorage.getItem('mapInfoPosition')
    if (savedPosition) {
      try {
        const parsed = JSON.parse(savedPosition)
        position.x = parsed.x
        position.y = parsed.y
        constrainToViewport()
      } catch (e) {
        // If no saved position, use default
        position.x = 10
        position.y = 120
      }
    }
  }
}

// Drag functionality (desktop only) - optimized for performance
let animationFrameId = null

const startDrag = (e) => {
  if (props.isMobile || isCollapsed.value) return
  
  isDragging.value = true
  
  const event = e.type.includes('touch') ? e.touches[0] : e
  dragStart.x = event.clientX
  dragStart.y = event.clientY
  dragStart.offsetX = position.x
  dragStart.offsetY = position.y
  
  document.addEventListener('mousemove', onDrag)
  document.addEventListener('mouseup', endDrag)
  document.addEventListener('touchmove', onDrag)
  document.addEventListener('touchend', endDrag)
  
  e.preventDefault()
}

const onDrag = (e) => {
  if (!isDragging.value) return
  
  e.preventDefault()
  
  // Cancel any pending animation frame
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId)
  }
  
  // Use requestAnimationFrame for smooth updates
  animationFrameId = requestAnimationFrame(() => {
    const event = e.type.includes('touch') ? e.touches[0] : e
    const deltaX = event.clientX - dragStart.x
    const deltaY = event.clientY - dragStart.y
    
    position.x = dragStart.offsetX + deltaX
    position.y = dragStart.offsetY + deltaY
    
    constrainToViewport()
  })
}

const endDrag = () => {
  if (!isDragging.value) return
  
  isDragging.value = false
  
  // Cancel any pending animation frame
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId)
    animationFrameId = null
  }
  
  // Save position
  localStorage.setItem('mapInfoPosition', JSON.stringify({
    x: position.x,
    y: position.y
  }))
  
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', endDrag)
  document.removeEventListener('touchmove', onDrag)
  document.removeEventListener('touchend', endDrag)
}

// Ensure info panel stays within viewport
const constrainToViewport = () => {
  if (!infoEl.value) return
  
  const rect = infoEl.value.getBoundingClientRect()
  const maxX = window.innerWidth - rect.width - 10
  const maxY = window.innerHeight - rect.height - 10
  
  position.x = Math.max(10, Math.min(position.x, maxX))
  position.y = Math.max(10, Math.min(position.y, maxY))
}

// Update position on window resize
window.addEventListener('resize', constrainToViewport)
</script>

<style scoped>
.map-info {
  position: fixed;
  z-index: 999; /* Slightly lower than legend */
  background: rgba(26, 26, 26, 0.95);
  padding: 0;
  border-radius: 8px;
  border: 1px solid #444;
  min-width: 250px;
  max-width: 300px;
  transition: opacity 0.2s ease, min-width 0.3s ease, max-width 0.3s ease;
  user-select: none;
  font-size: 0.75rem;
}

.map-info.dragging {
  opacity: 0.9;
  cursor: move;
  transition: opacity 0.2s ease; /* Only transition opacity when dragging */
}

.map-info.collapsed {
  min-width: auto;
  max-width: fit-content;
}

/* Info Header */
.info-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 0.75rem;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 8px 8px 0 0;
  cursor: move;
}

.collapsed .info-header {
  cursor: default;
  border-radius: 8px;
}

.info-header h4 {
  margin: 0;
  color: #00ff88;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.collapse-btn {
  background: none;
  border: none;
  color: #ccc;
  font-size: 0.625rem;
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  margin-left: 0.5rem;
  border-radius: 4px;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
}

.collapse-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

/* Info Content */
.info-content {
  padding: 0.75rem;
  max-height: 400px;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.info-section {
  margin-bottom: 0.75rem;
}

.info-section:last-child {
  margin-bottom: 0;
}

.info-section h5 {
  margin: 0 0 0.5rem 0;
  color: #FFD700;
  font-size: 0.625rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  opacity: 0.8;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.25rem;
  color: #ccc;
}

.info-item:last-child {
  margin-bottom: 0;
}

.info-item .label {
  color: #999;
  margin-right: 0.5rem;
  flex-shrink: 0;
}

.info-item .value {
  color: #fff;
  text-align: right;
  word-break: break-word;
  font-family: 'Berkeley Mono', monospace;
}

.info-item .value.small {
  font-size: 0.625rem;
  white-space: pre-line;
}

/* Scrollbar styling */
.info-content::-webkit-scrollbar {
  width: 4px;
}

.info-content::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
}

.info-content::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 2px;
}

.info-content::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.5);
}

/* Mobile styles */
@media (max-width: 600px) {
  .map-info {
    position: fixed;
    right: 10px !important;
    bottom: 20px !important;
    left: auto !important;
    top: auto !important;
    max-width: 250px;
  }
  
  .info-header {
    cursor: default;
  }
  
  .info-content {
    max-height: 300px;
  }
}
</style>