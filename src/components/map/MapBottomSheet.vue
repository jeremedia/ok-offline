<template>
  <div class="map-bottom-sheet" :class="{ open: isOpen }">
    <!-- Drag Handle -->
    <div class="drag-handle" @click="toggleSheet">
      <div class="handle-bar"></div>
    </div>
    
    <!-- Sheet Content -->
    <div class="sheet-content">
      <MapControlTabs
        :isMobile="true"
        :year="year"
        :gisLoadingState="gisLoadingState"
        :initialControls="controls"
        :showResetView="showResetView"
        @update:controls="$emit('update:controls', $event)"
        @reset-view="$emit('reset-view')"
        @close="close"
      />
    </div>
  </div>
  
  <!-- Backdrop -->
  <div 
    v-if="isOpen" 
    class="sheet-backdrop"
    @click="close"
  ></div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import MapControlTabs from './MapControlTabs.vue'
import Hammer from 'hammerjs'

const props = defineProps({
  year: String,
  gisLoadingState: Object,
  controls: Object,
  showResetView: Boolean
})

const emit = defineEmits(['update:controls', 'reset-view'])

const isOpen = ref(false)
let hammer = null

const toggleSheet = () => {
  isOpen.value = !isOpen.value
}

const close = () => {
  isOpen.value = false
}

// Setup swipe gestures
onMounted(() => {
  // Get the sheet element
  const sheetElement = document.querySelector('.map-bottom-sheet')
  if (sheetElement) {
    hammer = new Hammer(sheetElement)
    
    // Configure swipe down gesture
    hammer.get('swipe').set({
      direction: Hammer.DIRECTION_VERTICAL,
      threshold: 10,
      velocity: 0.3
    })
    
    // Handle swipe down to close
    hammer.on('swipedown', () => {
      if (isOpen.value) {
        close()
      }
    })
  }
})

onUnmounted(() => {
  if (hammer) {
    hammer.destroy()
    hammer = null
  }
})

// Expose methods for parent component
defineExpose({
  open: () => { isOpen.value = true },
  close,
  toggle: toggleSheet
})
</script>

<style scoped>
.map-bottom-sheet {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  top: 20px; /* Small margin from top */
  z-index: 1002;
  background: var(--color-background-secondary);
  border-top: 1px solid var(--color-border);
  border-radius: 16px 16px 0 0;
  transform: translateY(100%); /* Fully hidden below viewport */
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  flex-direction: column;
}

.map-bottom-sheet.open {
  transform: translateY(0); /* Slide up into view */
}

/* Drag Handle */
.drag-handle {
  padding: 1rem;
  cursor: grab;
  display: flex;
  justify-content: center;
  align-items: center;
  background: var(--color-background-secondary-alpha-95);
  border-radius: 16px 16px 0 0;
  touch-action: pan-x; /* Allow horizontal panning but capture vertical */
}

.drag-handle:active {
  cursor: grabbing;
}

.handle-bar {
  width: 48px;
  height: 4px;
  background: var(--color-text-secondary);
  border-radius: 2px;
  transition: all 0.2s ease;
}

.drag-handle:hover .handle-bar,
.drag-handle:active .handle-bar {
  background: var(--color-text-primary);
  width: 56px;
}

/* Sheet Content */
.sheet-content {
  flex: 1;
  overflow: hidden; /* Prevent scrolling on the sheet itself */
  padding: 0 1rem 1rem;
  /* Safe area padding for devices with home indicators */
  padding-bottom: calc(1rem + env(safe-area-inset-bottom, 0));
  display: flex;
  flex-direction: column;
}

/* Backdrop */
.sheet-backdrop {
  position: absolute; /* Use absolute within the map container */
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--color-overlay-medium);
  z-index: 1001;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Landscape adjustments */
@media (orientation: landscape) and (max-height: 500px) {
  .map-bottom-sheet {
    max-height: 90vh;
  }
}
</style>