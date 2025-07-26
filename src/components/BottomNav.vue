<template>
  <nav class="bottom-nav" v-if="isMobile">
    <button 
      v-for="item in navItems" 
      :key="item.route"
      @click="navigate(item.route)"
      :class="{ active: isActive(item.route) }"
      class="nav-item"
    >
      <span class="nav-icon">{{ item.icon }}</span>
      <span class="nav-label">{{ item.label }}</span>
    </button>
  </nav>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const props = defineProps({
  year: {
    type: String,
    required: true
  }
})

const route = useRoute()
const router = useRouter()

// Check if device is truly mobile (phone, not tablet)
const checkIfMobile = () => {
  const isSmallScreen = window.innerWidth < 600
  const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0
  const mobileRegex = /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini|Mobile/i
  const isMobileUA = mobileRegex.test(navigator.userAgent)
  
  // For development: use screen width only
  if (isSmallScreen) return true
  
  // Production mobile detection
  return isSmallScreen && (hasTouch || isMobileUA)
}

const isMobile = ref(checkIfMobile())

const handleResize = () => {
  isMobile.value = checkIfMobile()
}

onMounted(() => {
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})

// Navigation items for bottom nav
const navItems = [
  { route: 'map', icon: '🗺️', label: 'Map' },
  { route: 'camps', icon: '⛺', label: 'Camps' },
  { route: 'art', icon: '🎨', label: 'Art' },
  { route: 'events', icon: '🎉', label: 'Events' },
  { route: 'schedule', icon: '📅', label: 'Schedule' }
]

const navigate = (view) => {
  router.push(`/${props.year}/${view}`)
}

const isActive = (view) => {
  return route.name === view
}
</script>

<style scoped>
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #1a1a1a;
  border-top: 1px solid #333;
  display: flex;
  justify-content: space-around;
  align-items: center;
  padding: 0;
  z-index: 2000;
  height: 60px;
  
  /* Safe area for modern phones */
  padding-bottom: env(safe-area-inset-bottom, 0);
}

.nav-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 8px 4px;
  background: none;
  border: none;
  color: #999;
  cursor: pointer;
  min-height: 44px;
  transition: all 0.2s ease;
  position: relative;
  font-family: 'Berkeley Mono', monospace;
}

.nav-item:active {
  transform: scale(0.95);
}

.nav-item.active {
  color: #fff;
  background: none;
}

.nav-item.active::before {
  content: '';
  position: absolute;
  top: 0;
  left: 10%;
  right: 10%;
  height: 2px;
  background: #8B0000;
}

.nav-icon {
  font-size: 20px;
  line-height: 1;
}

.nav-label {
  font-size: 11px;
  font-weight: 500;
}

/* Haptic feedback on supported devices */
@supports (padding: max(0px)) {
  .nav-item:active {
    /* Trigger haptic feedback on iOS */
    -webkit-tap-highlight-color: transparent;
  }
}
</style>