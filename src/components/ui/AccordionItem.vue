<template>
  <div class="accordion-item">
    <div class="accordion-header" @click="toggle">
      <h3>{{ title }}</h3>
      <span class="accordion-chevron" :class="{ rotated: !isOpen }">▼</span>
    </div>
    <transition name="accordion">
      <div v-show="isOpen" class="accordion-content">
        <slot />
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, watch, inject, computed, onMounted } from 'vue'

const props = defineProps({
  title: {
    type: String,
    required: true
  },
  defaultOpen: {
    type: Boolean,
    default: true
  },
  storageKey: {
    type: String,
    default: null
  },
  id: {
    type: String,
    default: null
  }
})

const emit = defineEmits(['toggle'])

// Check if we're inside an Accordion component
const accordion = inject('accordion', null)

// Determine the ID to use
const itemId = computed(() => props.id || props.storageKey || props.title)

// State management
const localIsOpen = ref(props.defaultOpen)

// If inside accordion, register this item
if (accordion) {
  accordion.registerItem(itemId.value, props.storageKey, props.defaultOpen)
} else {
  // Only handle localStorage if not inside accordion
  if (props.storageKey) {
    const saved = localStorage.getItem(`accordion_${props.storageKey}`)
    if (saved !== null) {
      localIsOpen.value = saved === 'true'
    }
  }
}

// Compute actual open state
const isOpen = computed(() => {
  if (accordion) {
    return accordion.isOpen(itemId.value)
  }
  return localIsOpen.value
})

// Save state when it changes
watch(isOpen, (newVal) => {
  if (props.storageKey && !accordion) {
    localStorage.setItem(`accordion_${props.storageKey}`, newVal.toString())
  }
})

const toggle = () => {
  if (accordion) {
    accordion.toggle(itemId.value)
  } else {
    localIsOpen.value = !localIsOpen.value
    if (props.storageKey) {
      localStorage.setItem(`accordion_${props.storageKey}`, localIsOpen.value.toString())
    }
  }
  emit('toggle', isOpen.value)
}
</script>

<style scoped>
.accordion-item {
  background: var(--color-bg-base);
  border: 1px solid var(--color-border-medium);
  border-bottom: 0;
  overflow: hidden;
  margin: 0;
}

/* Last item gets bottom border */
.accordion-item:last-child {
  border-bottom: 1px solid var(--color-border-medium);
}

/* First item gets top corners rounded */
.accordion-item:first-child {
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
}

/* Last item gets bottom corners rounded */
.accordion-item:last-child {
  border-bottom-left-radius: 8px;
  border-bottom-right-radius: 8px;
}

/* Single item gets all corners rounded */
.accordion-item:only-child {
  border-radius: 8px;
}

.accordion-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  cursor: pointer;
  user-select: none;
  background: var(--color-bg-header);
  transition: background-color 0.2s ease;
  border-bottom: 1px solid var(--color-border-medium);
}

.accordion-header:hover {
  background: var(--color-bg-elevated);
}

.accordion-header h3 {
  margin: 0;
  color: var(--color-text-primary);
  font-size: 1rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.accordion-chevron {
  font-size: 0.9rem;
  color: var(--color-text-secondary);
  transition: transform 0.3s ease;
}

.accordion-chevron.rotated {
  transform: rotate(-180deg);
}

.accordion-content {
  padding: 0;
  background: var(--color-bg-base);
}

/* Smooth expand/collapse animation */
.accordion-enter-active,
.accordion-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}

.accordion-enter-from,
.accordion-leave-to {
  max-height: 0;
  opacity: 0;
}

/* Mobile adjustments */
body.mobile-device .accordion-header {
  padding: 0.75rem 1rem;
}

body.mobile-device .accordion-header h3 {
  font-size: 0.9rem;
}

body.mobile-device .accordion-chevron {
  font-size: 0.8rem;
}
</style>