import { ref } from 'vue'
import { brcAddressToLatLon } from '../utils/geocoding'
import { useDateOverride } from './useDateOverride'

// Location simulation state (kept separate from date override)
const isSimulating = ref(false)

// OKNOTOK camp location at 3:30 & A - actual camp placement for 2025
// This is where Jeremy and the crew are based during Burning Man
// Use the geocoding system to get accurate coordinates
const OKNOTOK_LOCATION = brcAddressToLatLon("3:30 & A") || [40.785200, -119.208100]

export function useSimulation() {
  // Use the global date override system
  const { getCurrentTime: getOverrideTime } = useDateOverride()
  
  const toggleSimulation = () => {
    isSimulating.value = !isSimulating.value
    console.log(`🎭 Location Simulation ${isSimulating.value ? 'ENABLED' : 'DISABLED'}`)
    if (isSimulating.value) {
      console.log(`📍 Simulated location: 3:30 & A (OKNOTOK camp)`)
    }
  }
  
  const getSimulatedLocation = () => {
    return isSimulating.value ? OKNOTOK_LOCATION : null
  }
  
  const getCurrentTime = () => {
    // Use the global date override system instead of simulation time
    return getOverrideTime()
  }
  
  return {
    isSimulating,
    toggleSimulation,
    getSimulatedLocation,
    getCurrentTime
  }
}