<template>
  <div class="base-select" ref="selectRef">
    <button
      class="select-trigger"
      :class="{ 'is-open': isOpen }"
      @click="toggleDropdown"
      type="button"
    >
      <span class="select-value">{{ selectedLabel }}</span>
      <svg class="select-arrow" width="12" height="12" viewBox="0 0 12 12">
        <path d="M2 4l4 4 4-4" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </button>
    
    <Transition name="dropdown">
      <div v-if="isOpen" class="select-dropdown" :style="dropdownStyle">
        <button
          v-for="option in options"
          :key="option.value"
          class="select-option"
          :class="{ 'is-selected': option.value === modelValue }"
          @click="selectOption(option)"
          type="button"
        >
          {{ option.label }}
        </button>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'

const props = defineProps({
  modelValue: {
    type: String,
    required: true
  },
  options: {
    type: Array,
    required: true,
    validator: (options) => {
      return options.every(opt => 
        typeof opt === 'object' && 
        'value' in opt && 
        'label' in opt
      )
    }
  }
})

const emit = defineEmits(['update:modelValue'])

const selectRef = ref(null)
const isOpen = ref(false)
const dropdownStyle = ref({})

const selectedLabel = computed(() => {
  const selected = props.options.find(opt => opt.value === props.modelValue)
  return selected ? selected.label : ''
})

const toggleDropdown = () => {
  isOpen.value = !isOpen.value
  if (isOpen.value) {
    nextTick(() => {
      positionDropdown()
    })
  }
}

const selectOption = (option) => {
  emit('update:modelValue', option.value)
  isOpen.value = false
}

const positionDropdown = () => {
  if (!selectRef.value) return
  
  const trigger = selectRef.value.querySelector('.select-trigger')
  const rect = trigger.getBoundingClientRect()
  const viewportHeight = window.innerHeight
  
  // Check if there's enough space below
  const spaceBelow = viewportHeight - rect.bottom
  const dropdownHeight = props.options.length * 40 + 8 // Approximate height
  
  if (spaceBelow < dropdownHeight && rect.top > dropdownHeight) {
    // Position above
    dropdownStyle.value = {
      bottom: '100%',
      marginBottom: '4px'
    }
  } else {
    // Position below (default)
    dropdownStyle.value = {
      top: '100%',
      marginTop: '4px'
    }
  }
}

const handleClickOutside = (event) => {
  if (selectRef.value && !selectRef.value.contains(event.target)) {
    isOpen.value = false
  }
}

const handleEscape = (event) => {
  if (event.key === 'Escape' && isOpen.value) {
    isOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  document.addEventListener('keydown', handleEscape)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  document.removeEventListener('keydown', handleEscape)
})
</script>

<style scoped>
.base-select {
  position: relative;
  display: inline-block;
  width: 100%;
}

.select-trigger {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: var(--color-bg-input);
  color: var(--color-text-secondary);
  border: 1px solid var(--color-border-medium);
  border-radius: 4px;
  font-size: 0.875rem;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
}

.select-trigger:hover {
  background: var(--color-bg-active);
  border-color: var(--color-primary);
}

.select-trigger:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px var(--color-primary-alpha-20);
}

.select-trigger.is-open {
  border-color: var(--color-primary);
}

.select-value {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.select-arrow {
  flex-shrink: 0;
  transition: transform 0.2s;
}

.select-trigger.is-open .select-arrow {
  transform: rotate(180deg);
}

.select-dropdown {
  position: absolute;
  left: 0;
  right: 0;
  z-index: 1000;
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border-medium);
  border-radius: 4px;
  box-shadow: 0 4px 12px var(--color-shadow-medium);
  max-height: 200px;
  overflow-y: auto;
  padding: 4px;
}

.select-option {
  width: 100%;
  display: block;
  padding: 0.5rem 0.75rem;
  background: transparent;
  color: var(--color-text-secondary);
  border: none;
  border-radius: 3px;
  font-size: 0.875rem;
  font-family: inherit;
  text-align: left;
  cursor: pointer;
  transition: all 0.15s;
}

.select-option:hover {
  background: var(--color-bg-hover);
  color: var(--color-text-primary);
}

.select-option.is-selected {
  background: var(--color-primary);
  color: var(--color-text-inverse);
}

/* Dropdown animation */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: opacity 0.15s, transform 0.15s;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

/* Scrollbar styling */
.select-dropdown::-webkit-scrollbar {
  width: 8px;
}

.select-dropdown::-webkit-scrollbar-track {
  background: var(--color-bg-base);
  border-radius: 4px;
}

.select-dropdown::-webkit-scrollbar-thumb {
  background: var(--color-border-medium);
  border-radius: 4px;
}

.select-dropdown::-webkit-scrollbar-thumb:hover {
  background: var(--color-border-heavy);
}
</style>