<template>
  <div 
    class="map-legend"
    :class="{ collapsed: isCollapsed, dragging: isDragging }"
    :style="legendStyle"
    ref="legendEl"
  >
    <!-- Legend Header -->
    <div 
      class="legend-header"
      @mousedown="startDrag"
      @touchstart="startDrag"
    >
      <h4>Map Legend</h4>
      <BaseButton 
        @click.stop="toggleCollapse"
        variant="ghost"
        size="sm"
        :icon="isCollapsed ? '▲' : '▼'"
        :aria-label="isCollapsed ? 'Expand legend' : 'Collapse legend'"
        :uppercase="false"
        class="collapse-btn"
      />
    </div>
    
    <!-- Legend Content -->
    <div v-show="!isCollapsed" class="legend-content">
      <!-- Special Locations -->
      <div class="legend-section">
        <div class="legend-item">
          <span class="legend-icon special-location">🔥</span>
          <span>The Man</span>
        </div>
        <div class="legend-item">
          <span class="legend-icon special-location">⛺</span>
          <span>Center Camp</span>
        </div>
        <div class="legend-item">
          <span class="legend-icon special-location">🏛</span>
          <span>Temple</span>
        </div>
        <div class="legend-item">
          <span class="legend-icon special-location">✈️</span>
          <span>Airport</span>
        </div>
      </div>
      
      <hr class="legend-divider">
      
      <!-- Content Markers -->
      <div class="legend-section">
        <div class="legend-item">
          <span class="legend-icon camp">🏠</span>
          <span>Camps</span>
        </div>
        <div class="legend-item">
          <span class="legend-icon art">🎨</span>
          <span>Art</span>
        </div>
        <div class="legend-item">
          <span class="legend-icon event">🎉</span>
          <span>Events</span>
        </div>
      </div>
      
      <hr class="legend-divider">
      
      <!-- GIS Layers -->
      <div class="legend-section">
        <div class="legend-item">
          <span class="legend-line street"></span>
          <span>Streets</span>
        </div>
        <div class="legend-item">
          <span class="legend-line trash-fence"></span>
          <span>Trash Fence</span>
        </div>
        <div class="legend-item">
          <span class="legend-area city-block"></span>
          <span>City Blocks</span>
        </div>
        <div class="legend-item">
          <span class="legend-area plaza"></span>
          <span>Plazas</span>
        </div>
        <div class="legend-item">
          <span class="legend-icon cpn">📍</span>
          <span>CPN Locations</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import BaseButton from '../ui/BaseButton.vue'

const props = defineProps({
  isMobile: Boolean
})

const legendEl = ref(null)
const isCollapsed = ref(false)
const isDragging = ref(false)

// Position state
const position = reactive({
  x: 10,
  y: 200 // Will be adjusted on mount based on container size
})

// Drag state
const dragStart = reactive({
  x: 0,
  y: 0,
  offsetX: 0,
  offsetY: 0
})

const legendStyle = computed(() => {
  if (props.isMobile) {
    // Mobile positioning
    return {
      left: '10px',
      bottom: isCollapsed.value ? '20px' : '20px',
      top: 'auto'
    }
  }
  
  // Desktop draggable positioning
  if (isCollapsed.value) {
    // When collapsed, snap to bottom
    return {
      left: `${position.x}px`,
      bottom: '20px',
      top: 'auto'
    }
  }
  
  // Normal expanded state
  return {
    left: `${position.x}px`,
    top: `${position.y}px`
  }
})

// Load saved state
onMounted(() => {
  // Load collapsed state
  const savedCollapsed = localStorage.getItem('mapLegendCollapsed')
  if (savedCollapsed !== null) {
    isCollapsed.value = savedCollapsed === 'true'
  }
  
  // Load position (desktop only)
  if (!props.isMobile) {
    const savedPosition = localStorage.getItem('mapLegendPosition')
    if (savedPosition) {
      try {
        const parsed = JSON.parse(savedPosition)
        position.x = parsed.x
        position.y = parsed.y
      } catch (e) {
        console.error('Failed to load legend position:', e)
      }
    } else {
      // Set initial position based on container size
      const mapContainer = legendEl.value?.closest('#map-section')
      if (mapContainer) {
        const mapRect = mapContainer.getBoundingClientRect()
        position.y = mapRect.height - 400 // Position near bottom
      }
    }
    
    // Ensure legend stays in viewport after position is set
    setTimeout(() => {
      constrainToViewport()
    }, 100)
  }
})

// Toggle collapse state
const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value
  localStorage.setItem('mapLegendCollapsed', isCollapsed.value)
  
  // If expanding on desktop, restore to saved position
  if (!isCollapsed.value && !props.isMobile) {
    const savedPosition = localStorage.getItem('mapLegendPosition')
    if (savedPosition) {
      try {
        const parsed = JSON.parse(savedPosition)
        position.x = parsed.x
        position.y = parsed.y
        constrainToViewport()
      } catch (e) {
        // If no saved position, place it at a default spot
        const mapContainer = legendEl.value?.closest('#map-section')
        if (mapContainer) {
          const mapRect = mapContainer.getBoundingClientRect()
          position.y = mapRect.height - 400
        }
      }
    }
  }
}

// Drag functionality (desktop only)
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

let animationFrameId = null

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
  localStorage.setItem('mapLegendPosition', JSON.stringify({
    x: position.x,
    y: position.y
  }))
  
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', endDrag)
  document.removeEventListener('touchmove', onDrag)
  document.removeEventListener('touchend', endDrag)
}

// Ensure legend stays within viewport
const constrainToViewport = () => {
  if (!legendEl.value) return
  
  const rect = legendEl.value.getBoundingClientRect()
  // Get the parent map container bounds
  const mapContainer = legendEl.value.closest('#map-section')
  if (!mapContainer) return
  
  const mapRect = mapContainer.getBoundingClientRect()
  const maxX = mapRect.width - rect.width - 10
  const maxY = mapRect.height - rect.height - 10
  
  position.x = Math.max(10, Math.min(position.x, maxX))
  position.y = Math.max(10, Math.min(position.y, maxY))
}

// Update position on window resize
window.addEventListener('resize', constrainToViewport)
</script>

<style scoped>
.map-legend {
  position: absolute;
  z-index: 1000;
  background: var(--color-background-secondary-alpha-95);
  padding: 0;
  border-radius: 8px;
  border: 1px solid var(--color-border);
  min-width: 200px;
  max-width: 250px;
  transition: opacity 0.2s ease, min-width 0.3s ease, max-width 0.3s ease;
  user-select: none;
}

.map-legend.dragging {
  opacity: 0.9;
  cursor: move;
  transition: opacity 0.2s ease; /* Only transition opacity when dragging */
}

.map-legend.collapsed {
  min-width: auto;
  max-width: fit-content;
}

/* Legend Header */
.legend-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 0.75rem;
  background: var(--color-overlay-light);
  border-radius: 8px 8px 0 0;
  cursor: move;
}

.collapsed .legend-header {
  cursor: default;
  border-radius: 8px;
}

.legend-header h4 {
  margin: 0;
  color: var(--color-accent);
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.collapse-btn {
  margin-left: 0.5rem;
}

/* Legend Content */
.legend-content {
  padding: 1rem;
}

.legend-section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: var(--color-text-disabled);
  font-size: 0.75rem;
}

.legend-divider {
  margin: 0.75rem 0;
  border: none;
  border-top: 1px solid var(--color-border);
}

/* Legend Icons */
.legend-icon {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-size: 12px;
  flex-shrink: 0;
}

.legend-icon.special-location {
  background: var(--color-primary-alpha-90);
  border: 2px solid var(--color-accent);
}

.legend-icon.camp {
  background: var(--color-success-alpha-90);
  border: 2px solid var(--color-text-primary);
}

.legend-icon.art {
  background: var(--color-purple-alpha-90);
  border: 2px solid var(--color-text-primary);
}

.legend-icon.event {
  background: var(--color-warning-alpha-90);
  border: 2px solid var(--color-text-primary);
}

.legend-icon.cpn {
  background: var(--color-purple-alpha-90);
  border: 2px solid var(--color-text-primary);
}

/* Legend Lines */
.legend-line {
  width: 20px;
  height: 2px;
  flex-shrink: 0;
}

.legend-line.street {
  background: var(--color-text-secondary);
}

.legend-line.trash-fence {
  background: var(--color-danger);
  border-top: 2px dashed var(--color-danger);
  height: 0;
}

/* Legend Areas */
.legend-area {
  width: 20px;
  height: 14px;
  border: 1px solid;
  flex-shrink: 0;
}

.legend-area.city-block {
  border-color: var(--color-border);
  background: var(--color-overlay-lighter);
}

.legend-area.plaza {
  border-color: var(--color-purple);
  background: var(--color-purple-alpha-30);
}

/* Mobile styles */
@media (max-width: 600px) {
  .map-legend {
    position: absolute;
    left: 10px !important;
    bottom: 20px !important;
    top: auto !important;
  }
  
  .legend-header {
    cursor: default;
  }
}
</style>