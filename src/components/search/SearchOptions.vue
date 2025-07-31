<template>
  <div class="search-options-container" :class="{ collapsed: isCollapsed }">
    <div class="options-header" @click="toggleCollapse">
      <button 
        class="collapse-btn"
        :aria-label="isCollapsed ? 'Expand search options' : 'Collapse search options'"
      >
        {{ isCollapsed ? '▶' : '▼' }}
      </button>
      <h4>Options</h4>
    </div>
    
    <transition name="slide-down">
      <div v-show="!isCollapsed" class="options-content">
      <!-- Combined horizontal button group -->
      <div class="options-button-group">
        <!-- Search Mode Buttons -->
        <div class="mode-buttons">
          <button
            v-for="mode in searchModes"
            :key="mode.value"
            @click="$emit('update:searchMode', mode.value); $emit('modeChanged', { mode: mode.value })"
            :class="['mode-btn', { active: searchMode === mode.value, disabled: mode.disabled }]"
            :disabled="mode.disabled"
            :title="mode.tooltip"
          >
            <span class="mode-icon">{{ mode.icon }}</span>
            <span class="mode-label">{{ mode.label }}</span>
          </button>
        </div>
        
        <!-- Filter Buttons -->
        <div class="filter-button-group">
          <button
            class="filter-btn"
            :class="{ active: everythingSelected }"
            @click="$emit('toggleEverything')"
          >
            <span class="desktop-label">Search Everything</span>
            <span class="mobile-label">ALL</span>
          </button>
          <button
            v-for="type in filterTypes"
            :key="type.key"
            class="filter-btn"
            :class="{ active: includeTypes[type.key] }"
            @click="$emit('toggleFilter', type.key)"
            :title="type.label"
          >
            <span class="desktop-label">{{ type.icon }} {{ type.label }}</span>
            <span class="mobile-label">{{ type.icon }}</span>
          </button>
        </div>
      </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, defineProps, defineEmits } from 'vue'

const props = defineProps({
  searchMode: {
    type: String,
    required: true
  },
  includeTypes: {
    type: Object,
    required: true
  },
  isOnline: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits([
  'update:searchMode',
  'modeChanged',
  'toggleEverything',
  'toggleFilter'
])

// Local state
const isCollapsed = ref(false)

// Search modes configuration
const searchModes = computed(() => [
  {
    value: 'keyword',
    label: 'Keyword',
    icon: '🔍',
    tooltip: 'Traditional keyword search (always available)',
    disabled: false
  },
  {
    value: 'semantic',
    label: 'Semantic',
    icon: '🧠',
    tooltip: 'Find results by meaning, not just keywords (requires internet)',
    disabled: !props.isOnline
  },
  {
    value: 'smart',
    label: 'Smart',
    icon: '🚀',
    tooltip: 'Hybrid search for best results (requires internet)',
    disabled: !props.isOnline
  }
])

// Filter types configuration
const filterTypes = [
  { key: 'camps', label: 'Camps', icon: '🏠' },
  { key: 'art', label: 'Art', icon: '🎨' },
  { key: 'events', label: 'Events', icon: '🎉' },
  { key: 'infrastructure', label: 'Infra', icon: '🏛️' },
  { key: 'notes', label: 'Notes', icon: '📝' }
]

// Computed
const everythingSelected = computed(() => {
  return filterTypes.every(type => props.includeTypes[type.key])
})

// Methods
const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value
  localStorage.setItem('searchOptionsCollapsed', isCollapsed.value.toString())
}

// Load collapsed state on mount
onMounted(() => {
  const savedCollapsed = localStorage.getItem('searchOptionsCollapsed')
  if (savedCollapsed !== null) {
    isCollapsed.value = savedCollapsed === 'true'
  }
})
</script>

<style scoped>
/* Collapsible container matching infrastructure-intro style */
.search-options-container {
  margin: 1rem auto;
  background: var(--color-black-alpha-30);
  border-radius: 8px;
  border: 1px solid var(--color-border-subtle);
  max-width: 100%;
  overflow: hidden;
}

.search-options-container.collapsed .options-header {
  border-radius: 8px;
  border-bottom: none;
}

.options-header {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  padding: 0.75rem 1rem;
  background: var(--color-bg-elevated);
  border-bottom: 1px solid var(--color-border-subtle);
  cursor: pointer;
  transition: background 0.2s ease;
}

.options-header:hover {
  background: var(--color-bg-header);
}

.options-header h4 {
  margin: 0;
  color: var(--color-text);
  font-size: 0.8rem;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 0.02em;
  line-height: 1.3;
}

.options-header .collapse-btn {
  background: none;
  border: none;
  color: var(--color-text-secondary);
  font-size: 0.875rem;
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  margin-right: 0.5rem;
  border-radius: 4px;
  transition: all 0.2s ease;
  transform-origin: center;
}

.options-header .collapse-btn:hover {
  background: var(--color-white-alpha-10);
  color: var(--color-text);
}

/* Slide down transition */
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}

.slide-down-enter-from,
.slide-down-leave-to {
  max-height: 0;
  opacity: 0;
}

.slide-down-enter-to,
.slide-down-leave-from {
  max-height: 200px;
  opacity: 1;
}

.options-content {
  padding: 0;
}

/* Horizontal button group layout */
.options-button-group {
  display: flex;
  gap: 0;
  align-items: center;
  width: 100%;
  flex-wrap: wrap;
  margin: 0;
  padding: 0;
}

.mode-buttons {
  display: flex;
  gap: 0;
  border-bottom: 1px solid var(--color-border);
  overflow: hidden;
  width: 100%;
}

.mode-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.375rem;
  padding: 0.75rem 1rem;
  background: var(--color-bg-elevated);
  border: none;
  border-right: 1px solid var(--color-border);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.875rem;
  min-height: 44px;
  text-transform: uppercase;
  flex: 1;
}

.mode-btn:last-child {
  border-right: none;
}

.mode-btn:hover:not(.active):not(.disabled) {
  background: var(--color-bg-hover);
  color: var(--color-text);
}

.mode-btn.active {
  background: var(--color-primary);
  color: var(--color-text-inverse);
}

.mode-btn.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.mode-icon {
  font-size: 1.1rem;
}

.mode-label {
  font-size: 0.875rem;
}


/* Filter buttons */
.filter-button-group {
  display: flex;
  gap: 0;
  overflow: hidden;
  width: 100%;
}

.filter-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.375rem;
  padding: 0.875rem 1rem;
  background: var(--color-bg-elevated);
  border: none;
  border-right: 1px solid var(--color-border);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  font-size: 0.875rem;
  min-height: 44px;
  flex: 1;
  text-transform: uppercase;
}

.filter-btn:first-child {
  flex: 1.5;
}

.filter-btn:last-child {
  border-right: none;
}

.filter-btn:hover:not(.active) {
  background: var(--color-bg-hover);
  color: var(--color-text);
}

.filter-btn.active {
  background: var(--color-primary);
  color: var(--color-text-inverse);
}

/* Desktop/Mobile label switching */
.desktop-label {
  display: inline;
}

.mobile-label {
  display: none;
}

/* Mobile styles */
@media (max-width: 600px) {
  .search-options-container {
    margin: 0.5rem 0;
  }
  
  .options-header {
    padding: 0.625rem 0.75rem;
  }
  
  .options-header h4 {
    font-size: 0.75rem;
    padding-right: 0.5rem;
  }
  
  .options-header .collapse-btn {
    font-size: 0.75rem;
    padding: 0.125rem 0.25rem;
    flex-shrink: 0;
  }
  
  .options-content {
    padding: 0;
  }
  
  .options-button-group {
    flex-direction: column;
    gap: 0;
  }
  
  .mode-buttons,
  .filter-button-group {
    width: 100%;
  }
  
  
  .mode-btn {
    padding: 0.625rem 0.75rem;
    font-size: 0.8rem;
    gap: 0.25rem; /* Add spacing between icon and text */
  }
  
  .mode-icon {
    font-size: 1rem;
  }
  
  .mode-label {
    font-size: 0.75rem;
  }
  
  .desktop-label {
    display: none;
  }
  
  .mobile-label {
    display: inline;
  }
  
  .filter-btn {
    flex: 1;
    width: auto;
    min-width: 44px;
    padding: 0.75rem; /* Make buttons square with proper padding */
    border-right: 1px solid var(--color-border);
    justify-content: center;
    gap: 0;
  }
  
  .filter-btn:last-child {
    border-right: none;
  }
  
  .filter-btn:first-child {
    flex: 2;
    padding: 0.75rem 1rem;
  }
}
</style>