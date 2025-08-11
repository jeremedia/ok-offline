<template>
  <div class="map-section">
    <div class="section-card">
      <div class="section-header clickable" @click="toggleCollapse">
        <div class="header-with-arrow">
          <span class="disclosure-arrow" :class="{ rotated: isCollapsed }">▼</span>
          <h3>Camp Map & Layout</h3>
        </div>
        <BaseButton 
          v-show="!isCollapsed"
          variant="secondary" 
          size="sm"
          @click.stop="addNewPlacement"
        >
          + Add Item
        </BaseButton>
      </div>
      
      <div v-show="!isCollapsed" class="map-content">
        <!-- Map Controls -->
        <div class="map-controls">
          <div class="control-group">
            <label>Camp Dimensions:</label>
            <div class="dimension-inputs">
              <input 
                type="number" 
                v-model.number="campDimensions.width"
                placeholder="Width (ft)"
                class="dimension-input"
                min="10"
                max="500"
              />
              <span class="dimension-separator">×</span>
              <input 
                type="number" 
                v-model.number="campDimensions.depth"
                placeholder="Depth (ft)"
                class="dimension-input"
                min="10"
                max="500"
              />
            </div>
          </div>
          
          <div class="control-group">
            <label>View:</label>
            <div class="view-controls">
              <BaseButton 
                :variant="viewMode === '2d' ? 'primary' : 'ghost'"
                size="sm"
                @click="viewMode = '2d'"
              >
                2D Top
              </BaseButton>
              <BaseButton 
                :variant="viewMode === 'grid' ? 'primary' : 'ghost'"
                size="sm"
                @click="viewMode = 'grid'"
              >
                Grid
              </BaseButton>
              <BaseButton 
                variant="ghost"
                size="sm"
                @click="resetView"
              >
                Reset View
              </BaseButton>
            </div>
          </div>
        </div>
        
        <!-- 2D Map Canvas -->
        <div class="map-container">
          <div 
            class="map-canvas"
            :style="canvasStyle"
            @click="handleCanvasClick"
            @mousemove="handleMouseMove"
            ref="mapCanvas"
          >
            <!-- Grid lines -->
            <div v-if="viewMode === 'grid'" class="grid-lines">
              <div 
                v-for="x in gridLinesX" 
                :key="`vline-${x}`"
                class="grid-line vertical"
                :style="{ left: `${(x / campDimensions.width) * 100}%` }"
              ></div>
              <div 
                v-for="y in gridLinesY" 
                :key="`hline-${y}`"
                class="grid-line horizontal"
                :style="{ top: `${(y / campDimensions.depth) * 100}%` }"
              ></div>
            </div>
            
            <!-- Camp boundary -->
            <div class="camp-boundary"></div>
            
            <!-- Map placements -->
            <div 
              v-for="placement in placements"
              :key="placement.id"
              class="map-placement"
              :class="{ 
                selected: selectedPlacementId === placement.id,
                'being-dragged': dragState.isDragging && dragState.placementId === placement.id
              }"
              :style="getPlacementStyle(placement)"
              @click.stop="selectPlacement(placement.id)"
              @mousedown="startDrag($event, placement.id)"
            >
              <div class="placement-content">
                <div class="placement-icon">
                  {{ getPlacementIcon(placement) }}
                </div>
                <div class="placement-label">
                  {{ getPlacementLabel(placement) }}
                </div>
              </div>
              
              <!-- Resize handles -->
              <div 
                v-if="selectedPlacementId === placement.id"
                class="resize-handles"
              >
                <div class="resize-handle se" @mousedown.stop="startResize($event, placement.id, 'se')"></div>
              </div>
            </div>
            
            <!-- Mouse cursor info -->
            <div 
              v-if="mousePosition"
              class="cursor-info"
              :style="{ 
                left: `${mousePosition.x}px`, 
                top: `${mousePosition.y}px` 
              }"
            >
              {{ mousePosition.campX.toFixed(1) }}', {{ mousePosition.campY.toFixed(1) }}'
            </div>
          </div>
          
          <!-- Map legend -->
          <div class="map-legend">
            <div class="legend-title">Legend</div>
            <div class="legend-items">
              <div class="legend-item">
                <span class="legend-icon">🏕️</span>
                <span>Personal Spaces</span>
              </div>
              <div class="legend-item">
                <span class="legend-icon">🏗️</span>
                <span>Structures</span>
              </div>
              <div class="legend-item">
                <span class="legend-icon">🚿</span>
                <span>Amenities</span>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Placement Details Panel -->
        <div v-if="selectedPlacement" class="placement-panel">
          <div class="panel-header">
            <h4>{{ getPlacementLabel(selectedPlacement) }}</h4>
            <BaseButton 
              variant="danger" 
              size="sm"
              @click="deletePlacement(selectedPlacement.id)"
            >
              Delete
            </BaseButton>
          </div>
          
          <div class="panel-content">
            <div class="form-grid">
              <div class="form-field">
                <label>Type</label>
                <select v-model="selectedPlacement.type" class="form-select">
                  <option value="personal_space">Personal Space</option>
                  <option value="kitchen">Kitchen</option>
                  <option value="shade">Shade Structure</option>
                  <option value="storage">Storage</option>
                  <option value="amenity">Amenity</option>
                  <option value="other">Other</option>
                </select>
              </div>
              
              <div class="form-field">
                <label>Label</label>
                <input 
                  type="text" 
                  v-model="selectedPlacement.label"
                  class="form-input"
                  placeholder="Item name..."
                />
              </div>
              
              <div class="form-field">
                <label>Position X (ft)</label>
                <input 
                  type="number" 
                  v-model.number="selectedPlacement.x_position"
                  class="form-input"
                  step="0.5"
                />
              </div>
              
              <div class="form-field">
                <label>Position Y (ft)</label>
                <input 
                  type="number" 
                  v-model.number="selectedPlacement.y_position"
                  class="form-input"
                  step="0.5"
                />
              </div>
              
              <div class="form-field">
                <label>Width (ft)</label>
                <input 
                  type="number" 
                  v-model.number="selectedPlacement.width"
                  class="form-input"
                  min="1"
                  step="0.5"
                />
              </div>
              
              <div class="form-field">
                <label>Depth (ft)</label>
                <input 
                  type="number" 
                  v-model.number="selectedPlacement.depth"
                  class="form-input"
                  min="1"
                  step="0.5"
                />
              </div>
              
              <div class="form-field">
                <label>Rotation (degrees)</label>
                <input 
                  type="number" 
                  v-model.number="selectedPlacement.rotation"
                  class="form-input"
                  min="0"
                  max="360"
                  step="15"
                />
              </div>
              
              <div class="form-field">
                <label>Assigned To</label>
                <select v-model="selectedPlacement.assigned_to_id" class="form-select">
                  <option value="">Not assigned</option>
                  <option 
                    v-for="member in teamMembers"
                    :key="member.id"
                    :value="member.id"
                  >
                    {{ member.first_name }} {{ member.last_name }}
                  </option>
                </select>
              </div>
            </div>
            
            <div class="placement-stats">
              <div class="stat-item">
                <span class="stat-label">Area:</span>
                <span class="stat-value">{{ (selectedPlacement.width * selectedPlacement.depth).toFixed(1) }} sq ft</span>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Placements List -->
        <div class="placements-list">
          <h4>All Placements ({{ placements.length }})</h4>
          <div v-if="placements.length === 0" class="no-placements">
            <p>No items placed yet</p>
            <BaseButton variant="primary" @click="addNewPlacement">Add First Item</BaseButton>
          </div>
          
          <div v-else class="placement-items">
            <div 
              v-for="placement in placements"
              :key="placement.id"
              class="placement-item"
              :class="{ active: selectedPlacementId === placement.id }"
              @click="selectPlacement(placement.id)"
            >
              <div class="placement-item-icon">{{ getPlacementIcon(placement) }}</div>
              <div class="placement-item-info">
                <div class="placement-item-name">{{ getPlacementLabel(placement) }}</div>
                <div class="placement-item-details">
                  {{ placement.width }}'×{{ placement.depth }}' at ({{ placement.x_position }}', {{ placement.y_position }}')
                </div>
              </div>
              <div class="placement-item-actions">
                <BaseButton variant="ghost" size="sm" @click.stop="centerOnPlacement(placement)">
                  📍
                </BaseButton>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import BaseButton from '../ui/BaseButton.vue'

// Props
const props = defineProps({
  campMap: {
    type: Object,
    default: () => ({ map_placements: [] })
  },
  teamMembers: {
    type: Array,
    default: () => []
  }
})

// Emits
const emit = defineEmits(['update:campMap', 'update:mapPlacements'])

// Local state
const isCollapsed = ref(true)
const storageKey = 'campEditorMapCollapsed'
const viewMode = ref('2d') // '2d' or 'grid'
const selectedPlacementId = ref(null)
const mapCanvas = ref(null)
const mousePosition = ref(null)

// Camp dimensions (defaults)
const campDimensions = ref({
  width: props.campMap?.total_width || 150,
  depth: props.campMap?.total_depth || 100
})

// Placements data
const placements = ref(props.campMap?.map_placements || [])

// Drag state
const dragState = ref({
  isDragging: false,
  isResizing: false,
  placementId: null,
  startX: 0,
  startY: 0,
  startPlacementX: 0,
  startPlacementY: 0,
  resizeDirection: null
})

// Computed
const selectedPlacement = computed(() => {
  return placements.value.find(p => p.id === selectedPlacementId.value)
})

const canvasStyle = computed(() => ({
  width: '100%',
  height: '400px',
  aspectRatio: `${campDimensions.value.width} / ${campDimensions.value.depth}`,
  maxHeight: '400px',
  background: viewMode.value === 'grid' ? '#f8f9fa' : '#e8f4fd'
}))

const gridLinesX = computed(() => {
  const lines = []
  const spacing = 10 // 10 foot grid
  for (let x = spacing; x < campDimensions.value.width; x += spacing) {
    lines.push(x)
  }
  return lines
})

const gridLinesY = computed(() => {
  const lines = []
  const spacing = 10
  for (let y = spacing; y < campDimensions.value.depth; y += spacing) {
    lines.push(y)
  }
  return lines
})

// Methods
const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value
  localStorage.setItem(storageKey, isCollapsed.value.toString())
}

const getPlacementStyle = (placement) => {
  const canvas = mapCanvas.value
  if (!canvas) return {}
  
  const canvasRect = canvas.getBoundingClientRect()
  const scaleX = canvasRect.width / campDimensions.value.width
  const scaleY = canvasRect.height / campDimensions.value.depth
  
  return {
    position: 'absolute',
    left: `${(placement.x_position / campDimensions.value.width) * 100}%`,
    top: `${(placement.y_position / campDimensions.value.depth) * 100}%`,
    width: `${(placement.width / campDimensions.value.width) * 100}%`,
    height: `${(placement.depth / campDimensions.value.depth) * 100}%`,
    transform: placement.rotation ? `rotate(${placement.rotation}deg)` : 'none',
    transformOrigin: 'center'
  }
}

const getPlacementIcon = (placement) => {
  const icons = {
    personal_space: '🏕️',
    kitchen: '🍳',
    shade: '⛱️',
    storage: '📦',
    amenity: '🚿',
    other: '📍'
  }
  return icons[placement.type] || '📍'
}

const getPlacementLabel = (placement) => {
  if (placement.label) return placement.label
  
  const defaults = {
    personal_space: 'Personal Space',
    kitchen: 'Kitchen',
    shade: 'Shade Structure',
    storage: 'Storage',
    amenity: 'Amenity',
    other: 'Item'
  }
  
  const baseName = defaults[placement.type] || 'Item'
  const assignedMember = props.teamMembers.find(m => m.id === placement.assigned_to_id)
  
  if (assignedMember) {
    return `${baseName} (${assignedMember.first_name})`
  }
  
  return baseName
}

const addNewPlacement = () => {
  const newPlacement = {
    id: `new_${Date.now()}`,
    type: 'personal_space',
    label: '',
    x_position: Math.round(campDimensions.value.width * 0.2),
    y_position: Math.round(campDimensions.value.depth * 0.2),
    width: 10,
    depth: 10,
    height: 8,
    rotation: 0,
    is_confirmed: false,
    assigned_to_id: null
  }
  
  placements.value.push(newPlacement)
  selectedPlacementId.value = newPlacement.id
  
  emit('update:mapPlacements', [...placements.value])
}

const selectPlacement = (placementId) => {
  selectedPlacementId.value = placementId
}

const deletePlacement = (placementId) => {
  const placement = placements.value.find(p => p.id === placementId)
  const confirmed = confirm(`Delete ${getPlacementLabel(placement)}?`)
  
  if (confirmed) {
    placements.value = placements.value.filter(p => p.id !== placementId)
    selectedPlacementId.value = null
    emit('update:mapPlacements', [...placements.value])
  }
}

const handleCanvasClick = (event) => {
  if (selectedPlacementId.value && event.target === mapCanvas.value) {
    // Clicked empty space, deselect
    selectedPlacementId.value = null
  }
}

const handleMouseMove = (event) => {
  const canvas = mapCanvas.value
  if (!canvas) return
  
  const rect = canvas.getBoundingClientRect()
  const x = event.clientX - rect.left
  const y = event.clientY - rect.top
  
  // Convert to camp coordinates
  const campX = (x / rect.width) * campDimensions.value.width
  const campY = (y / rect.height) * campDimensions.value.depth
  
  mousePosition.value = { x, y, campX, campY }
  
  // Handle dragging
  if (dragState.value.isDragging) {
    const deltaX = (event.clientX - dragState.value.startX) / rect.width * campDimensions.value.width
    const deltaY = (event.clientY - dragState.value.startY) / rect.height * campDimensions.value.depth
    
    const placement = placements.value.find(p => p.id === dragState.value.placementId)
    if (placement) {
      placement.x_position = Math.max(0, Math.min(
        campDimensions.value.width - placement.width,
        dragState.value.startPlacementX + deltaX
      ))
      placement.y_position = Math.max(0, Math.min(
        campDimensions.value.depth - placement.depth,
        dragState.value.startPlacementY + deltaY
      ))
    }
  }
}

const startDrag = (event, placementId) => {
  const placement = placements.value.find(p => p.id === placementId)
  if (!placement) return
  
  dragState.value = {
    isDragging: true,
    isResizing: false,
    placementId,
    startX: event.clientX,
    startY: event.clientY,
    startPlacementX: placement.x_position,
    startPlacementY: placement.y_position
  }
  
  selectedPlacementId.value = placementId
}

const startResize = (event, placementId, direction) => {
  dragState.value = {
    isDragging: false,
    isResizing: true,
    placementId,
    startX: event.clientX,
    startY: event.clientY,
    resizeDirection: direction
  }
}

const resetView = () => {
  selectedPlacementId.value = null
  mousePosition.value = null
}

const centerOnPlacement = (placement) => {
  selectedPlacementId.value = placement.id
  // In a real implementation, you might scroll/pan to center the placement
}

// Event handlers for mouse up (stop dragging)
const handleMouseUp = () => {
  if (dragState.value.isDragging || dragState.value.isResizing) {
    dragState.value = {
      isDragging: false,
      isResizing: false,
      placementId: null,
      startX: 0,
      startY: 0,
      startPlacementX: 0,
      startPlacementY: 0,
      resizeDirection: null
    }
    
    // Emit changes
    emit('update:mapPlacements', [...placements.value])
  }
}

// Load collapse state on mount
onMounted(() => {
  const saved = localStorage.getItem(storageKey)
  if (saved !== null) {
    isCollapsed.value = saved === 'true'
  }
  
  // Add global mouse up listener
  document.addEventListener('mouseup', handleMouseUp)
  document.addEventListener('mouseleave', handleMouseUp)
})

// Cleanup on unmount
onUnmounted(() => {
  document.removeEventListener('mouseup', handleMouseUp)
  document.removeEventListener('mouseleave', handleMouseUp)
})
</script>

<style scoped>
/* Base section styles */
.section-card {
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border-medium);
  border-radius: 6px;
  padding: 1.5rem;
  height: fit-content;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  min-height: 2.5rem;
}

.section-header.clickable {
  cursor: pointer;
  margin-bottom: 0;
}

.section-header.clickable:hover h3 {
  color: var(--color-primary);
}

.header-with-arrow {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.disclosure-arrow {
  font-size: 0.8rem;
  color: var(--color-text-secondary);
  transition: transform 0.2s ease;
  user-select: none;
}

.disclosure-arrow.rotated {
  transform: rotate(-90deg);
}

.section-card h3 {
  color: var(--color-accent);
  margin: 0;
  font-size: 1.1rem;
  transition: color 0.2s ease;
}

.map-content {
  margin-top: 1.5rem;
}

/* Map controls */
.map-controls {
  display: flex;
  gap: 2rem;
  margin-bottom: 1rem;
  padding: 1rem;
  background: var(--color-bg-base);
  border: 1px solid var(--color-border-light);
  border-radius: 4px;
}

.control-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.control-group label {
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--color-text-secondary);
  white-space: nowrap;
}

.dimension-inputs {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.dimension-input {
  width: 80px;
  padding: 0.5rem;
  border: 1px solid var(--color-border-medium);
  border-radius: 4px;
  font-size: 0.9rem;
}

.dimension-separator {
  color: var(--color-text-secondary);
}

.view-controls {
  display: flex;
  gap: 0.5rem;
}

/* Map canvas */
.map-container {
  position: relative;
  display: flex;
  gap: 1rem;
}

.map-canvas {
  position: relative;
  border: 2px solid var(--color-border-medium);
  border-radius: 4px;
  overflow: hidden;
  cursor: crosshair;
  flex: 1;
}

.camp-boundary {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border: 2px dashed var(--color-primary);
  pointer-events: none;
}

.grid-lines {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
}

.grid-line {
  position: absolute;
  background: rgba(0, 0, 0, 0.1);
}

.grid-line.vertical {
  width: 1px;
  height: 100%;
}

.grid-line.horizontal {
  height: 1px;
  width: 100%;
}

/* Map placements */
.map-placement {
  position: absolute;
  border: 2px solid var(--color-primary);
  border-radius: 4px;
  background: var(--color-primary-alpha-20);
  cursor: move;
  transition: all 0.2s ease;
  min-width: 20px;
  min-height: 20px;
}

.map-placement:hover {
  border-color: var(--color-primary-darker);
  background: var(--color-primary-alpha-30);
}

.map-placement.selected {
  border-color: var(--color-accent);
  background: var(--color-accent-alpha-20);
  box-shadow: 0 0 0 2px var(--color-accent-alpha-30);
}

.map-placement.being-dragged {
  opacity: 0.8;
  z-index: 10;
}

.placement-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 0.25rem;
  text-align: center;
}

.placement-icon {
  font-size: 1.2rem;
  line-height: 1;
}

.placement-label {
  font-size: 0.7rem;
  font-weight: 500;
  color: var(--color-text-primary);
  margin-top: 0.25rem;
  word-break: break-word;
}

/* Resize handles */
.resize-handles {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
}

.resize-handle {
  position: absolute;
  width: 8px;
  height: 8px;
  background: var(--color-accent);
  border: 1px solid white;
  border-radius: 50%;
  pointer-events: auto;
  cursor: se-resize;
}

.resize-handle.se {
  bottom: -4px;
  right: -4px;
}

/* Cursor info */
.cursor-info {
  position: absolute;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 3px;
  font-size: 0.8rem;
  pointer-events: none;
  transform: translate(-50%, -100%);
  margin-top: -5px;
  white-space: nowrap;
  z-index: 20;
}

/* Map legend */
.map-legend {
  width: 150px;
  background: var(--color-bg-base);
  border: 1px solid var(--color-border-light);
  border-radius: 4px;
  padding: 1rem;
  height: fit-content;
}

.legend-title {
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: var(--color-text-primary);
}

.legend-items {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8rem;
  color: var(--color-text-secondary);
}

.legend-icon {
  font-size: 1rem;
}

/* Placement panel */
.placement-panel {
  margin-top: 1rem;
  background: var(--color-bg-base);
  border: 1px solid var(--color-border-light);
  border-radius: 4px;
  padding: 1rem;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.panel-header h4 {
  margin: 0;
  color: var(--color-text-primary);
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
  margin-bottom: 1rem;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-field label {
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--color-text-secondary);
}

.form-input, .form-select {
  padding: 0.5rem;
  border: 1px solid var(--color-border-medium);
  border-radius: 4px;
  font-size: 0.8rem;
}

.placement-stats {
  padding-top: 1rem;
  border-top: 1px solid var(--color-border-light);
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stat-label {
  color: var(--color-text-secondary);
  font-size: 0.8rem;
}

.stat-value {
  color: var(--color-text-primary);
  font-weight: 500;
  font-size: 0.8rem;
}

/* Placements list */
.placements-list {
  margin-top: 1.5rem;
}

.placements-list h4 {
  margin: 0 0 1rem 0;
  color: var(--color-text-primary);
}

.no-placements {
  text-align: center;
  padding: 2rem;
  color: var(--color-text-secondary);
}

.placement-items {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.placement-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: var(--color-bg-base);
  border: 1px solid var(--color-border-light);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.placement-item:hover {
  border-color: var(--color-border-medium);
  background: var(--color-bg-hover);
}

.placement-item.active {
  border-color: var(--color-primary);
  background: var(--color-primary-alpha-10);
}

.placement-item-icon {
  font-size: 1.2rem;
  flex-shrink: 0;
}

.placement-item-info {
  flex: 1;
}

.placement-item-name {
  font-weight: 500;
  color: var(--color-text-primary);
  margin-bottom: 0.25rem;
}

.placement-item-details {
  font-size: 0.8rem;
  color: var(--color-text-secondary);
}

.placement-item-actions {
  flex-shrink: 0;
}

/* Mobile responsiveness */
@media (max-width: 1024px) {
  .map-container {
    flex-direction: column;
  }
  
  .map-legend {
    width: 100%;
  }
  
  .map-controls {
    flex-direction: column;
    gap: 1rem;
  }
}

@media (max-width: 767px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
  
  .map-controls {
    padding: 0.75rem;
  }
}
</style>