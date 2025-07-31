<template>
  <div class="unified-search-form">
    <!-- Search input -->
    <div class="search-input-wrapper">
      <input 
        :value="searchQuery"
        @input="$emit('update:searchQuery', $event.target.value)"
        @keydown.enter="$emit('search')"
        @keydown="$emit('keydown', $event)"
        type="text"
        :placeholder="placeholder"
        class="search-input-unified"
        ref="searchInput"
      >
      
      <!-- Search Suggestions -->
      <SearchSuggestions
        :query="searchQuery"
        :isOnline="isOnline"
        :enabled="false"
        @select="$emit('suggestion-select', $event)"
        @keydown="$emit('suggestion-keydown', $event)"
      />
    </div>
    
    <!-- Search/Clear button -->
    <button 
      class="search-action-btn"
      :class="{ disabled: !searchQuery }"
      :disabled="!searchQuery"
      @click="searchQuery ? $emit('clear') : $emit('search')"
      :title="searchQuery ? 'Clear search' : 'Search'"
    >
      {{ searchQuery ? 'Clear' : 'Search' }}
    </button>
  </div>
</template>

<script setup>
import { ref, onMounted, defineProps, defineEmits, defineExpose } from 'vue'
import SearchSuggestions from './SearchSuggestions.vue'

const props = defineProps({
  searchQuery: {
    type: String,
    default: ''
  },
  placeholder: {
    type: String,
    default: 'Search...'
  },
  isOnline: {
    type: Boolean,
    default: true
  },
  autoFocus: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits([
  'update:searchQuery',
  'search',
  'clear',
  'keydown',
  'suggestion-select',
  'suggestion-keydown'
])

const searchInput = ref(null)

// Expose focus method
defineExpose({
  focus: () => {
    if (searchInput.value) {
      searchInput.value.focus()
    }
  }
})

onMounted(() => {
  if (props.autoFocus && searchInput.value) {
    searchInput.value.focus()
  }
})
</script>

<style scoped>
.unified-search-form {
  display: flex;
  align-items: stretch;
  gap: 0;
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border-heavy);
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 0.75rem;
}

.search-input-wrapper {
  flex: 1;
  position: relative;
}

.search-input-unified {
  width: 100%;
  padding: 0.75rem 1rem;
  background: transparent;
  border: none;
  color: var(--color-text-primary);
  font-size: 1rem;
  outline: none;
  height: 100%;
  display: flex;
  align-items: center;
  box-shadow: inset 0 2px 4px var(--color-shadow-light);
  transition: box-shadow 0.2s ease;
}

.search-input-unified::placeholder {
  color: var(--color-text-muted);
}

.search-input-unified:focus {
  box-shadow: inset 0 2px 6px var(--color-shadow-medium);
}

.search-action-btn {
  padding: 0.75rem 1.5rem;
  background: var(--color-primary);
  border: none;
  border-left: 1px solid var(--color-border-heavy);
  color: var(--color-text-primary);
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s ease;
  white-space: nowrap;
  text-transform: uppercase;
}

.search-action-btn:hover:not(.disabled) {
  background: var(--color-primary-dark);
}

.search-action-btn.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>