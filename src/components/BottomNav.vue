<template>
  <nav class="bottom-nav" :class="{ 'bottom-nav-pwa': isPWA }" v-if="isMobile">
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
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const props = defineProps({
  year: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['toggle-map-controls'])

const route = useRoute()
const router = useRouter()

// Detect if running as PWA
const isPWA = computed(() => {
  // Check if running in standalone mode (PWA)
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches
  // Check iOS specific PWA detection
  const isIOSPWA = window.navigator.standalone === true
  // Check if launched from home screen on Android
  const isAndroidPWA = window.matchMedia('(display-mode: fullscreen)').matches
  
  return isStandalone || isIOSPWA || isAndroidPWA
})

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
  // If already on map view and map is clicked, toggle controls
  if (view === 'map' && route.name === 'map') {
    console.log('BottomNav: Emitting toggle-map-controls')
    emit('toggle-map-controls')
  } else {
    router.push(`/${props.year}/${view}`)
  }
}

const isActive = (view) => {
  return route.name === view
}
</script>

<style scoped>
.bottom-nav {
  background: var(--color-bg-header);
  border-top: 1px solid var(--color-border-medium);
  display: flex;
  justify-content: space-around;
  align-items: center;
  padding: 0;
  padding-bottom: env(safe-area-inset-bottom, 0);
  height: 60px;
  flex-shrink: 0; /* Don't shrink */
  /* Extend background into safe area */
  box-sizing: content-box;
}

/* Additional padding only for PWA */
.bottom-nav-pwa {
  padding-bottom: calc(14px + env(safe-area-inset-bottom, 0));
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
  color: var(--color-text-secondary);
  cursor: pointer;
  min-height: 44px;
  transition: all 0.2s ease;
  position: relative;
  font-family: 'Berkeley Mono', monospace;
  text-transform: uppercase;
}

.nav-item:hover {
  background: var(--color-primary-alpha-20);
  color: var(--color-text-primary);
}

.nav-item:active {
  transform: scale(0.95);
}

.nav-item.active {
  background: var(--color-primary);
  color: var(--color-text-primary);
}

.nav-item.active::before {
  display: none;
}

.nav-icon {
  font-size: 20px;
  line-height: 1;
}

.nav-label {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.05em;
}

/* Haptic feedback on supported devices */
@supports (padding: max(0px)) {
  .nav-item:active {
    /* Trigger haptic feedback on iOS */
    -webkit-tap-highlight-color: transparent;
  }
}
</style>