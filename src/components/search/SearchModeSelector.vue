<template>
  <div class="search-mode-selector">
    <div class="mode-buttons">
      <BaseButton
        v-for="mode in availableModes"
        :key="mode.value"
        @click="selectMode(mode.value)"
        variant="ghost"
        :active="selectedMode === mode.value"
        :disabled="mode.disabled"
        :title="mode.tooltip"
        :uppercase="true"
        class="mode-btn"
      >
        <span class="mode-icon">{{ mode.icon }}</span>
        <span class="mode-label">{{ mode.label }}</span>
        <span v-if="mode.badge" class="mode-badge">{{ mode.badge }}</span>
      </BaseButton>
    </div>
    
    <div v-if="showDescription" class="mode-description">
      <p>{{ currentModeDescription }}</p>
    </div>
  </div>
</template>

<script setup>
import { computed, defineEmits, defineProps } from 'vue'
import BaseButton from '../ui/BaseButton.vue'

const props = defineProps({
  selectedMode: {
    type: String,
    default: 'keyword'
  },
  isOnline: {
    type: Boolean,
    default: true
  },
  showDescription: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:selectedMode', 'modeChanged'])

const searchModes = {
  keyword: {
    value: 'keyword',
    label: 'Keyword',
    icon: '🔍',
    description: 'Fast text matching - works offline',
    tooltip: 'Traditional keyword search (always available)',
    disabled: false
  },
  semantic: {
    value: 'semantic',
    label: 'Semantic',
    icon: '🧠',
    description: 'AI-powered understanding of meaning and context',
    tooltip: 'Find results by meaning, not just keywords (requires internet)',
    disabled: false
  },
  smart: {
    value: 'smart',
    label: 'Smart',
    icon: '🚀',
    description: 'Best of both worlds - combines keyword and semantic search',
    tooltip: 'Hybrid search for best results (requires internet)',
    disabled: false
  }
}

const availableModes = computed(() => {
  return Object.values(searchModes).map(mode => ({
    ...mode,
    disabled: !props.isOnline && mode.value !== 'keyword'
  }))
})

const currentModeDescription = computed(() => {
  return searchModes[props.selectedMode]?.description || ''
})

const selectMode = (mode) => {
  if (searchModes[mode]?.disabled) return
  
  // Don't allow switching to online modes when offline
  if (!props.isOnline && mode !== 'keyword') {
    return
  }
  
  emit('update:selectedMode', mode)
  emit('modeChanged', {
    mode,
    modeInfo: searchModes[mode]
  })
}
</script>

<style scoped>
.search-mode-selector {
  margin-bottom: 1rem;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  overflow-x: hidden;
}

.mode-buttons {
  display: flex;
  gap: 0;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: var(--shadow-subtle);
  background: var(--color-bg-elevated);
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
}

.mode-btn {
  flex: 1;
  gap: 8px;
  border-radius: 0;
  border-right: none;
  position: relative;
  min-height: 44px;
}

.mode-btn:first-child {
  border-radius: 8px 0 0 8px;
}

.mode-btn:last-child {
  border-right: 1px solid var(--color-border);
  border-radius: 0 8px 8px 0;
}

.mode-icon {
  font-size: 18px;
  line-height: 1;
}

.mode-label {
  font-weight: 500;
  font-size: 12px;
  white-space: nowrap;
}

.mode-badge {
  position: absolute;
  top: 2px;
  right: 2px;
  background: var(--color-error);
  color: var(--color-text-inverse);
  font-size: 8px;
  font-weight: bold;
  padding: 1px 4px;
  border-radius: 6px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.mode-btn.active .mode-badge {
  background: var(--color-overlay-light);
  color: var(--color-primary);
}

.mode-description {
  margin-top: 8px;
  padding: 8px 12px;
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  font-size: 13px;
  color: var(--color-text-secondary);
  text-align: center;
}

/* Mobile optimizations */
@media (max-width: 600px) {
  .mode-btn {
    padding: 10px 8px;
    min-height: 44px;
    gap: 6px;
  }
  
  .mode-icon {
    font-size: 18px;
  }
  
  .mode-label {
    font-size: 12px;
  }
  
  .mode-badge {
    font-size: 7px;
    padding: 1px 3px;
  }
}

/* Touch targets for mobile */
@media (max-width: 600px) {
  .mode-btn {
    min-height: 44px; /* Minimum touch target */
  }
}
</style>