import { ref, computed } from 'vue'

// Global state for Soon & Near settings
const isEnabled = ref(false)
const radius = ref(200) // Default radius in feet

// Load saved settings from localStorage
const savedEnabled = localStorage.getItem('soonAndNearEnabled')
if (savedEnabled !== null) {
  isEnabled.value = savedEnabled === 'true'
}

const savedRadius = localStorage.getItem('soonAndNearRadius')
if (savedRadius !== null) {
  radius.value = parseInt(savedRadius, 10)
}

export function useSoonAndNear() {
  const toggleEnabled = () => {
    isEnabled.value = !isEnabled.value
    localStorage.setItem('soonAndNearEnabled', isEnabled.value.toString())
  }
  
  const setRadius = (newRadius) => {
    radius.value = newRadius
    localStorage.setItem('soonAndNearRadius', newRadius.toString())
  }
  
  const setEnabled = (enabled) => {
    isEnabled.value = enabled
    localStorage.setItem('soonAndNearEnabled', enabled.toString())
  }
  
  return {
    isEnabled: computed(() => isEnabled.value),
    radius: computed(() => radius.value),
    toggleEnabled,
    setRadius,
    setEnabled
  }
}