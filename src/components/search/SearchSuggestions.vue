<template>
  <div v-if="showSuggestions" class="search-suggestions">
    <div class="suggestions-list">
      <div
        v-for="(suggestion, index) in suggestions"
        :key="suggestion"
        class="suggestion-item"
        :class="{ active: selectedIndex === index }"
        @click="selectSuggestion(suggestion)"
        @mouseenter="selectedIndex = index"
      >
        <span class="suggestion-icon">🔍</span>
        <span class="suggestion-text">{{ suggestion }}</span>
        <span class="suggestion-action">Search</span>
      </div>
    </div>
    
    <div v-if="suggestions.length === 0 && loading" class="suggestions-loading">
      <span>Finding suggestions...</span>
    </div>
    
    <div v-if="suggestions.length === 0 && !loading && query.length >= 2" class="no-suggestions">
      <span>No suggestions found</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, defineProps, defineEmits } from 'vue'
import { getSearchSuggestions } from '../../services/vectorSearchService.js'

const props = defineProps({
  query: {
    type: String,
    default: ''
  },
  isOnline: {
    type: Boolean,
    default: true
  },
  enabled: {
    type: Boolean,
    default: true
  },
  maxSuggestions: {
    type: Number,
    default: 5
  }
})

const emit = defineEmits(['select', 'keydown'])

const suggestions = ref([])
const loading = ref(false)
const selectedIndex = ref(-1)
const debounceTimer = ref(null)

const showSuggestions = computed(() => {
  return props.enabled && 
         props.query.length >= 2 && 
         (suggestions.value.length > 0 || loading.value)
})

// Watch for query changes and fetch suggestions
watch(() => props.query, (newQuery) => {
  if (!props.enabled || !props.isOnline) {
    suggestions.value = []
    return
  }
  
  // Clear previous timer
  if (debounceTimer.value) {
    clearTimeout(debounceTimer.value)
  }
  
  // Reset selection
  selectedIndex.value = -1
  
  if (newQuery.length < 2) {
    suggestions.value = []
    loading.value = false
    return
  }
  
  // Debounce the search
  debounceTimer.value = setTimeout(async () => {
    await fetchSuggestions(newQuery)
  }, 300)
})

const fetchSuggestions = async (query) => {
  if (!props.isOnline) return
  
  loading.value = true
  
  try {
    const result = await getSearchSuggestions(query)
    suggestions.value = result.suggestions?.slice(0, props.maxSuggestions) || []
  } catch (error) {
    console.warn('Failed to fetch suggestions:', error)
    suggestions.value = []
  } finally {
    loading.value = false
  }
}

const selectSuggestion = (suggestion) => {
  emit('select', suggestion)
  suggestions.value = []
  selectedIndex.value = -1
}

// Keyboard navigation
const handleKeyDown = (event) => {
  if (!showSuggestions.value) return
  
  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault()
      selectedIndex.value = Math.min(selectedIndex.value + 1, suggestions.value.length - 1)
      break
    case 'ArrowUp':
      event.preventDefault()
      selectedIndex.value = Math.max(selectedIndex.value - 1, -1)
      break
    case 'Enter':
      event.preventDefault()
      if (selectedIndex.value >= 0 && suggestions.value[selectedIndex.value]) {
        selectSuggestion(suggestions.value[selectedIndex.value])
      }
      break
    case 'Escape':
      suggestions.value = []
      selectedIndex.value = -1
      break
  }
  
  emit('keydown', event)
}

// Expose handleKeyDown for parent component
defineExpose({
  handleKeyDown
})
</script>

<style scoped>
.search-suggestions {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: #2a2a2a;
  border: 1px solid #444;
  border-top: none;
  border-radius: 0 0 8px 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  z-index: 1000;
  min-height: 50px;
  max-height: 300px;
  overflow-y: auto;
  margin-top: 2px;
}

.suggestions-list {
  padding: 4px 0;
}

.suggestion-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  border-bottom: 1px solid #333;
}

.suggestion-item:last-child {
  border-bottom: none;
}

.suggestion-item:hover,
.suggestion-item.active {
  background: rgba(139, 0, 0, 0.2);
  border-color: #8B0000;
}

.suggestion-icon {
  color: #ccc;
  font-size: 16px;
  flex-shrink: 0;
}

.suggestion-text {
  flex: 1;
  font-size: 14px;
  color: #fff;
}

.suggestion-action {
  font-size: 12px;
  color: #8B0000;
  font-weight: 500;
  opacity: 0.7;
  transition: opacity 0.2s ease;
}

.suggestion-item:hover .suggestion-action,
.suggestion-item.active .suggestion-action {
  opacity: 1;
}

.suggestions-loading,
.no-suggestions {
  padding: 16px;
  text-align: center;
  color: #999;
  font-size: 13px;
  font-style: italic;
}

.suggestions-loading {
  color: #8B0000;
}

/* Mobile optimizations */
@media (max-width: 600px) {
  .search-suggestions {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  }
  
  .suggestion-item {
    padding: 12px;
    min-height: 44px; /* Touch target */
  }
  
  .suggestion-text {
    font-size: 15px; /* Better readability on mobile */
  }
  
  .suggestion-action {
    opacity: 1; /* Always show on mobile since no hover */
  }
}

/* Scrollbar styling */
.search-suggestions::-webkit-scrollbar {
  width: 6px;
}

.search-suggestions::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.search-suggestions::-webkit-scrollbar-thumb {
  background: #ccc;
  border-radius: 3px;
}

.search-suggestions::-webkit-scrollbar-thumb:hover {
  background: #999;
}
</style>