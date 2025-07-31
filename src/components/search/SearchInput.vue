<template>
  <div class="search-input-wrapper">
    <input 
      :value="modelValue"
      @input="$emit('update:modelValue', $event.target.value)"
      @keydown.enter="$emit('search')"
      @keydown="$emit('keydown', $event)"
      type="text"
      :placeholder="placeholder"
      :class="inputClass"
      ref="searchInput"
    >
    
    <!-- Search Suggestions -->
    <SearchSuggestions
      v-if="showSuggestions"
      :query="modelValue"
      :isOnline="isOnline"
      :enabled="false"
      @select="$emit('suggestion-select', $event)"
      @keydown="$emit('suggestion-keydown', $event)"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, defineProps, defineEmits, defineExpose } from 'vue'
import SearchSuggestions from './SearchSuggestions.vue'

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  placeholder: {
    type: String,
    default: 'Search...'
  },
  inputClass: {
    type: String,
    default: 'search-input'
  },
  isOnline: {
    type: Boolean,
    default: true
  },
  showSuggestions: {
    type: Boolean,
    default: true
  },
  autoFocus: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits([
  'update:modelValue',
  'search',
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
.search-input-wrapper {
  position: relative;
  width: 100%;
}

.search-input {
  width: 100%;
  padding: 0.75rem;
  font-size: 1.1rem;
  background: var(--color-bg-elevated);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border-medium);
  border-radius: 8px;
  transition: all 0.2s ease;
  box-sizing: border-box;
  max-width: 100%;
  box-shadow: inset 0 2px 4px var(--color-shadow-medium);
}

.search-input:focus {
  outline: none;
  border-color: var(--color-primary-dark) !important;
  box-shadow: inset 0 2px 6px var(--color-shadow-medium), 0 0 0 2px var(--color-primary-alpha-20);
}

.search-input::placeholder {
  color: var(--color-text-muted);
}

/* Desktop unified input */
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
</style>