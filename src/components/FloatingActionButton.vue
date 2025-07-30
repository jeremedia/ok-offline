<template>
  <button 
    class="fab"
    :class="{ 'fab-hidden': hidden }"
    @click="$emit('click')"
    :aria-label="label"
  >
    <span class="fab-icon">{{ icon }}</span>
  </button>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  icon: {
    type: String,
    default: '+'
  },
  label: {
    type: String,
    default: 'Add'
  }
})

const hidden = ref(false)
let lastScrollY = window.scrollY
let scrollTimeout = null

// Hide FAB on scroll down, show on scroll up
const handleScroll = () => {
  const currentScrollY = window.scrollY
  
  if (scrollTimeout) {
    clearTimeout(scrollTimeout)
  }
  
  // Hide when scrolling down
  if (currentScrollY > lastScrollY && currentScrollY > 100) {
    hidden.value = true
  } else {
    hidden.value = false
  }
  
  lastScrollY = currentScrollY
  
  // Show after scroll stops
  scrollTimeout = setTimeout(() => {
    hidden.value = false
  }, 1000)
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll, { passive: true })
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
  if (scrollTimeout) {
    clearTimeout(scrollTimeout)
  }
})
</script>

<style scoped>
.fab {
  position: fixed;
  bottom: calc(70px + env(safe-area-inset-bottom)); /* Above bottom nav */
  right: 16px;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background-color: #8B0000;
  color: white;
  border: none;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
  cursor: pointer;
  z-index: 100;
  transition: all 0.3s ease;
  font-size: 24px;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
}

.fab:hover {
  background-color: #a00000;
  transform: scale(1.05);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.4);
}

.fab:active {
  transform: scale(0.95);
}

.fab-hidden {
  transform: translateY(100px);
  opacity: 0;
}

.fab-icon {
  font-size: 28px;
  line-height: 1;
}

/* Tablet and desktop adjustments */
@media (min-width: 768px) {
  .fab {
    bottom: 24px;
    right: 24px;
  }
}

/* Accessibility */
@media (prefers-reduced-motion: reduce) {
  .fab {
    transition: none;
  }
}
</style>