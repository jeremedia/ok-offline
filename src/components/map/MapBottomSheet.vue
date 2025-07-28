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
import { ref } from 'vue'
import MapControlTabs from './MapControlTabs.vue'

const props = defineProps({
  year: String,
  gisLoadingState: Object,
  controls: Object,
  showResetView: Boolean
})

const emit = defineEmits(['update:controls', 'reset-view'])

const isOpen = ref(false)

const toggleSheet = () => {
  isOpen.value = !isOpen.value
}

const close = () => {
  isOpen.value = false
}

// Expose methods for parent component
defineExpose({
  open: () => { isOpen.value = true },
  close,
  toggle: toggleSheet
})
</script>

<style scoped>
.map-bottom-sheet {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 1002;
  background: #1a1a1a;
  border-top: 1px solid #444;
  border-radius: 16px 16px 0 0;
  transform: translateY(calc(100% - 60px));
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  max-height: 80vh;
  display: flex;
  flex-direction: column;
}

.map-bottom-sheet.open {
  transform: translateY(0);
}

/* Drag Handle */
.drag-handle {
  padding: 1rem;
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  background: rgba(26, 26, 26, 0.95);
  border-radius: 16px 16px 0 0;
}

.handle-bar {
  width: 48px;
  height: 4px;
  background: #666;
  border-radius: 2px;
  transition: background 0.2s ease;
}

.drag-handle:active .handle-bar {
  background: #999;
}

/* Sheet Content */
.sheet-content {
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding: 0 1rem 1rem;
  padding-bottom: env(safe-area-inset-bottom, 1rem);
}

/* Backdrop */
.sheet-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
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