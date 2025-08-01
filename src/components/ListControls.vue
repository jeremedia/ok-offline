<template>
  <div class="list-controls-container">
    <!-- Search Input - Primary Control -->
    <div class="search-section">
      <div class="search-input-wrapper">
        <span class="search-icon">🔍</span>
        <input 
          type="text" 
          :value="searchQuery"
          @input="$emit('update:searchQuery', $event.target.value)"
          :placeholder="`Search ${type}s...`"
          class="search-input"
        />
        <BaseButton 
          v-if="searchQuery"
          @click="$emit('update:searchQuery', '')"
          variant="ghost"
          icon="×"
          size="sm"
          :uppercase="false"
          aria-label="Clear search"
          class="clear-search-btn"
        />
      </div>
    </div>

    <!-- Control Bar - Secondary Controls -->
    <div class="control-bar" :class="{ 'has-clear-btn': hasActiveFilters }">
      <!-- Sort Dropdown - Compact Mobile Layout -->
      <div class="sort-group">
        <select 
          id="sort-selector" 
          :value="sortBy"
          @change="$emit('update:sortBy', $event.target.value)"
          class="sort-select"
        >
          <option value="name">Sort: Name</option>
          <option value="location">Sort: Location/Sector</option>
          <option value="sector">Sort: Sector (Clock Position)</option>
          <option value="avenue">Sort: Avenue (A-L)</option>
          <option value="distance" v-if="userLocation">Sort: Distance</option>
          <option value="date" v-if="type === 'event'">Sort: Date/Time</option>
        </select>
      </div>

      <!-- Filters Toggle -->
      <div class="filters-group">
        <BaseButton 
          @click="toggleFilters"
          variant="secondary"
          :active="!filtersCollapsed"
          :uppercase="false"
          class="filters-btn"
        >
          Filters
          <span v-if="activeFilterCount > 0" class="filter-count">({{ activeFilterCount }})</span>
          <span class="dropdown-arrow">{{ filtersCollapsed ? '▼' : '▲' }}</span>
        </BaseButton>
      </div>

      <!-- Clear All Button -->
      <div class="clear-group" v-if="hasActiveFilters">
        <BaseButton 
          @click="clearAllFilters"
          variant="ghost"
          icon="×"
          size="sm"
          :uppercase="false"
          aria-label="Clear all filters"
          class="clear-btn"
        />
      </div>
    </div>

    <!-- Results Count -->
    <div class="results-count" v-if="!loading && !error && totalItems > 0">
      Showing {{ visibleItems }} of {{ totalItems }} {{ type }}s
    </div>

    <!-- Collapsible Filters Content -->
    <div class="filters-content" v-if="!filtersCollapsed">
      <!-- Sector Filters for Camps/Art -->
      <div class="filter-section" v-if="type === 'camp' || type === 'art'">
        <div class="filter-section-header">
          <span class="filter-section-title">Sector</span>
          <div class="button-group">
            <BaseButton 
              @click="$emit('selectAllSectors')" 
              variant="ghost"
              size="sm"
              :uppercase="false"
              :disabled="allSectorsSelected"
              class="filter-btn filter-btn-left"
            >
              All
            </BaseButton>
            <BaseButton 
              @click="$emit('clearAllSectors')" 
              variant="ghost"
              size="sm"
              :uppercase="false"
              :disabled="noSectorsSelected"
              class="filter-btn filter-btn-right"
            >
              None
            </BaseButton>
          </div>
        </div>
        <div class="sector-checkboxes">
          <label v-for="sector in availableSectors" :key="sector" class="sector-checkbox">
            <input 
              type="checkbox" 
              :value="sector"
              :checked="selectedSectors.includes(sector)"
              @change="$emit('toggleSector', sector)"
            />
            {{ sector }}
          </label>
        </div>
      </div>

      <!-- Event Type Filters -->
      <div class="filter-section" v-if="type === 'event'">
        <div class="filter-section-header">
          <span class="filter-section-title">Event Type</span>
          <div class="button-group">
            <BaseButton 
              @click="$emit('selectAllEventTypes')" 
              variant="ghost"
              size="sm"
              :uppercase="false"
              :disabled="allEventTypesSelected"
              class="filter-btn filter-btn-left"
            >
              All
            </BaseButton>
            <BaseButton 
              @click="$emit('clearAllEventTypes')" 
              variant="ghost"
              size="sm"
              :uppercase="false"
              :disabled="noEventTypesSelected"
              class="filter-btn filter-btn-right"
            >
              None
            </BaseButton>
          </div>
        </div>
        <div class="event-type-checkboxes">
          <label v-for="eventType in availableEventTypes" :key="eventType.value" class="event-type-checkbox">
            <input 
              type="checkbox" 
              :value="eventType.value"
              :checked="selectedEventTypes.includes(eventType.value)"
              @change="$emit('toggleEventType', eventType.value)"
            />
            {{ eventType.label }}
          </label>
        </div>
      </div>

      <!-- Additional Controls -->
      <div class="filter-section">
        <div class="additional-controls">
          <BaseButton 
            @click="$emit('toggleFavorites')"
            variant="secondary"
            :active="showFavoritesOnly"
            :uppercase="false"
            class="favorites-toggle"
          >
            ⭐ {{ showFavoritesOnly ? 'Show All' : 'Favorites' }} 
            <span v-if="favoriteCount > 0">({{ favoriteCount }})</span>
          </BaseButton>
          
          <BaseButton 
            v-if="!userLocation"
            @click="$emit('enableLocation')"
            variant="secondary"
            :disabled="locationLoading"
            :uppercase="false"
            class="location-toggle"
          >
            📍 {{ locationLoading ? 'Getting location...' : 'Enable Location' }}
          </BaseButton>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import BaseButton from './ui/BaseButton.vue'

const props = defineProps({
  type: {
    type: String,
    required: true
  },
  searchQuery: {
    type: String,
    default: ''
  },
  sortBy: {
    type: String,
    default: 'name'
  },
  selectedSectors: {
    type: Array,
    default: () => []
  },
  availableSectors: {
    type: Array,
    default: () => []
  },
  selectedEventTypes: {
    type: Array,
    default: () => []
  },
  availableEventTypes: {
    type: Array,
    default: () => []
  },
  showFavoritesOnly: {
    type: Boolean,
    default: false
  },
  favoriteCount: {
    type: Number,
    default: 0
  },
  userLocation: {
    type: Object,
    default: null
  },
  locationLoading: {
    type: Boolean,
    default: false
  },
  filtersCollapsed: {
    type: Boolean,
    default: true
  },
  loading: {
    type: Boolean,
    default: false
  },
  error: {
    type: String,
    default: null
  },
  visibleItems: {
    type: Number,
    default: 0
  },
  totalItems: {
    type: Number,
    default: 0
  }
})

const emit = defineEmits([
  'update:searchQuery',
  'update:sortBy',
  'toggleSector',
  'selectAllSectors',
  'clearAllSectors',
  'toggleEventType',
  'selectAllEventTypes',
  'clearAllEventTypes',
  'toggleFavorites',
  'enableLocation',
  'clearAllFilters',
  'update:filtersCollapsed'
])

// Computed properties for button states
const allSectorsSelected = computed(() => 
  props.selectedSectors.length === props.availableSectors.length
)

const noSectorsSelected = computed(() => 
  props.selectedSectors.length === 0
)

const allEventTypesSelected = computed(() => 
  props.selectedEventTypes.length === props.availableEventTypes.length
)

const noEventTypesSelected = computed(() => 
  props.selectedEventTypes.length === 0
)

const activeFilterCount = computed(() => {
  let count = 0
  
  // Count sector filters
  if ((props.type === 'camp' || props.type === 'art') && 
      props.selectedSectors.length < props.availableSectors.length) {
    count++
  }
  
  // Count event type filters
  if (props.type === 'event' && 
      props.selectedEventTypes.length < props.availableEventTypes.length) {
    count++
  }
  
  // Count favorites filter
  if (props.showFavoritesOnly) {
    count++
  }
  
  return count
})

const hasActiveFilters = computed(() => 
  props.searchQuery || activeFilterCount.value > 0
)

const toggleFilters = () => {
  emit('update:filtersCollapsed', !props.filtersCollapsed)
}

const clearAllFilters = () => {
  emit('clearAllFilters')
}
</script>

<style scoped>
.list-controls-container {
  background: var(--color-bg-elevated);
  border-bottom: 1px solid var(--color-border);
  padding: 1rem;
  margin-bottom: 0;
  font-family: 'Berkeley Mono', monospace;
  position: sticky;
  top: 0;
  z-index: 10;
  /* Prevent horizontal overflow that causes cropping */
  width: 100%;
  box-sizing: border-box;
  overflow: visible;
}

/* Search Section - Primary */
.search-section {
  margin-bottom: 1rem;
}

.search-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
}

.search-icon {
  position: absolute;
  left: 0.75rem;
  color: var(--color-text-muted);
  z-index: 1;
  pointer-events: none;
}

.search-input {
  width: 100%;
  padding: 0.75rem 0.75rem 0.75rem 2.5rem;
  background: var(--color-bg-base);
  border: 1px solid var(--color-border-heavy);
  border-radius: 4px;
  color: var(--color-text-primary);
  font-family: inherit;
  font-size: 1rem;
  transition: all 0.2s ease;
  box-sizing: border-box;
}

.search-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px var(--color-primary-alpha-20);
}

.clear-search-btn {
  position: absolute;
  right: 0.5rem;
}

/* Control Bar - Secondary */
.control-bar {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 0.75rem;
  align-items: center;
  margin-bottom: 0.5rem;
  width: 100%;
  box-sizing: border-box;
  overflow: visible;
  min-width: 0;
}

.control-bar.has-clear-btn {
  grid-template-columns: 1fr auto auto;
}

.sort-group {
  display: flex;
  align-items: center;
  min-width: 0;
}

.filters-group {
  display: flex;
  align-items: center;
}

.clear-group {
  display: flex;
  align-items: center;
}

.sort-select {
  background: var(--color-bg-input);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border-heavy);
  border-radius: 4px;
  padding: 0.5rem 2rem 0.5rem 0.75rem;
  font-family: inherit;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s ease;
  appearance: none;
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='%23ccc' viewBox='0 0 16 16'%3e%3cpath d='M8 11L3 6h10l-5 5z'/%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right 0.5rem center;
  background-size: 12px;
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
}

.sort-select:hover {
  background-color: var(--color-bg-hover);
  border-color: var(--color-primary);
}

.sort-select:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px var(--color-primary-alpha-20);
}

.filters-btn {
  gap: 0.5rem;
  white-space: nowrap;
}

.filter-count {
  font-size: 0.8rem;
  background: var(--color-white-alpha-20);
  padding: 0.1rem 0.4rem;
  border-radius: 10px;
}

.dropdown-arrow {
  font-size: 0.8rem;
}

.clear-btn {
  width: 32px;
  height: 32px;
}

/* Results Count */
.results-count {
  font-size: 0.85rem;
  color: var(--color-text-muted);
  margin-bottom: 0.5rem;
}

/* Filters Content */
.filters-content {
  border-bottom: 1px solid var(--color-border);
  padding-top: 1rem;
  margin-top: 0.5rem;
}

.filter-section {
  margin-bottom: 1rem;
}

.filter-section:last-child {
  margin-bottom: 0;
}

.filter-section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.filter-section-title {
  font-weight: bold;
  color: var(--color-text-primary);
  font-size: 0.9rem;
}

.button-group {
  display: flex;
}

.filter-btn-left {
  border-radius: 4px 0 0 4px;
  border-right: none;
}

.filter-btn-right {
  border-radius: 0 4px 4px 0;
}

.sector-checkboxes,
.event-type-checkboxes {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 0.5rem;
}

.sector-checkbox,
.event-type-checkbox {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  color: var(--color-text-secondary);
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  transition: background 0.2s ease;
}

.sector-checkbox:hover,
.event-type-checkbox:hover {
  background: var(--color-primary-alpha-10);
}

.additional-controls {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.favorites-toggle,
.location-toggle {
  white-space: nowrap;
}

/* Mobile Responsive */
@media (max-width: 600px) {
  .list-controls-container {
    padding: 0.75rem;
  }

  .control-bar {
    flex-direction: column;
    align-items: stretch;
    gap: 0.75rem;
  }

  .control-group {
    justify-content: space-between;
  }

  .sort-select {
    min-height: 44px;
    font-size: 1rem;
  }

  .sector-checkboxes,
  .event-type-checkboxes {
    grid-template-columns: 1fr 1fr;
  }

  .additional-controls {
    flex-direction: column;
  }

}

/* Desktop enhancements */
@media (min-width: 601px) {
  .control-bar {
    justify-content: flex-start;
  }
  
  .control-group:last-child {
    margin-left: auto;
  }
}
</style>