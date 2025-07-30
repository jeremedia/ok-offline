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
  background: #2a2a2a;
  color: #fff;
  border: 1px solid #444;
  border-radius: 8px;
  transition: all 0.2s ease;
  box-sizing: border-box;
  max-width: 100%;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.3);
}

.search-input:focus {
  outline: none;
  border-color: #680000 !important;
  box-shadow: inset 0 2px 6px rgba(0, 0, 0, 0.4), 0 0 0 2px rgba(104, 0, 0, 0.2);
}

.search-input::placeholder {
  color: #999;
}

/* Desktop unified input */
.search-input-unified {
  width: 100%;
  padding: 0.75rem 1rem;
  background: transparent;
  border: none;
  color: #fff;
  font-size: 1rem;
  outline: none;
  height: 100%;
  display: flex;
  align-items: center;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.2);
  transition: box-shadow 0.2s ease;
}

.search-input-unified::placeholder {
  color: #999;
}

.search-input-unified:focus {
  box-shadow: inset 0 2px 6px rgba(0, 0, 0, 0.3);
}
</style>