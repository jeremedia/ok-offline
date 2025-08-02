<template>
  <div class="pull-to-refresh-container" ref="containerRef">
    <div class="pull-to-refresh-indicator" :style="indicatorStyle">
      <div class="spinner" :class="{ spinning: isRefreshing }">
        {{ pullText }}
      </div>
    </div>
    <slot></slot>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

const emit = defineEmits(['refresh'])

const containerRef = ref(null)
const pullDistance = ref(0)
const isRefreshing = ref(false)
const isPulling = ref(false)

const threshold = 70 // pixels to pull before refresh triggers
const maxPull = 100 // maximum pull distance

const indicatorStyle = computed(() => ({
  transform: `translateY(${Math.min(pullDistance.value - 40, maxPull)}px)`,
  opacity: Math.min(pullDistance.value / threshold, 1),
  transition: isPulling.value ? 'none' : 'all 0.3s ease'
}))

const pullText = computed(() => {
  if (isRefreshing.value) return '↻'
  if (pullDistance.value >= threshold) return '↑'
  return '↓'
})

let startY = 0
let currentY = 0

const handleTouchStart = (e) => {
  if (isRefreshing.value) return
  
  const scrollTop = document.documentElement.scrollTop || document.body.scrollTop
  if (scrollTop > 0) return
  
  startY = e.touches[0].clientY
  isPulling.value = true
}

const handleTouchMove = (e) => {
  if (!isPulling.value || isRefreshing.value) return
  
  currentY = e.touches[0].clientY
  const diff = currentY - startY
  
  if (diff > 0) {
    e.preventDefault()
    pullDistance.value = diff
  }
}

const handleTouchEnd = async () => {
  if (!isPulling.value || isRefreshing.value) return
  
  isPulling.value = false
  
  if (pullDistance.value >= threshold) {
    isRefreshing.value = true
    pullDistance.value = threshold
    
    try {
      await emit('refresh')
    } finally {
      isRefreshing.value = false
      pullDistance.value = 0
    }
  } else {
    pullDistance.value = 0
  }
}

onMounted(() => {
  // Only enable on mobile devices
  const isSmallScreen = window.innerWidth < 600
  const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0
  const mobileRegex = /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i
  const isMobileUA = mobileRegex.test(navigator.userAgent)
  
  if (isSmallScreen && hasTouch && isMobileUA) {
    document.addEventListener('touchstart', handleTouchStart, { passive: true })
    document.addEventListener('touchmove', handleTouchMove, { passive: false })
    document.addEventListener('touchend', handleTouchEnd, { passive: true })
  }
})

onUnmounted(() => {
  document.removeEventListener('touchstart', handleTouchStart)
  document.removeEventListener('touchmove', handleTouchMove)
  document.removeEventListener('touchend', handleTouchEnd)
})
</script>

<style scoped>
.pull-to-refresh-container {
  position: relative;
  overflow: hidden;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.pull-to-refresh-indicator {
  position: absolute;
  top: -40px;
  left: 0;
  right: 0;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

.spinner {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: var(--color-bg-header);
  color: var(--color-text-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  box-shadow: var(--shadow-subtle);
}

.spinner.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>