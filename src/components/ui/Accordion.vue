<template>
  <div class="accordion">
    <slot />
  </div>
</template>

<script setup>
import { provide, reactive, onMounted } from 'vue'

const props = defineProps({
  multiple: {
    type: Boolean,
    default: true
  }
})

// Track open items
const openItems = reactive(new Set())

// Provide methods to child AccordionItems
const accordionApi = {
  isOpen: (id) => openItems.has(id),
  toggle: (id) => {
    if (openItems.has(id)) {
      openItems.delete(id)
    } else {
      if (!props.multiple) {
        openItems.clear()
      }
      openItems.add(id)
    }
    // Save state when toggled
    if (id.includes('weather_')) {
      localStorage.setItem(`accordion_${id}`, accordionApi.isOpen(id).toString())
    }
  },
  registerItem: (id, storageKey, defaultOpen) => {
    // Load saved state or use default
    if (storageKey) {
      const saved = localStorage.getItem(`accordion_${storageKey}`)
      if (saved !== null) {
        if (saved === 'true') {
          openItems.add(id)
        }
      } else if (defaultOpen) {
        openItems.add(id)
      }
    } else if (defaultOpen) {
      openItems.add(id)
    }
  }
}

provide('accordion', accordionApi)
</script>

<style scoped>
.accordion {
  display: flex;
  flex-direction: column;
}
</style>