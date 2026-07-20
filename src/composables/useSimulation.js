import { ref } from 'vue'
import { useDateOverride } from './useDateOverride'
import { CURRENT_YEAR, getSeasonCenter } from '../config/seasons'

// Location simulation state (kept separate from date override)
const isSimulating = ref(false)

// Current-season simulation uses the official city center. It must not imply a
// 2026 OKNOTOK placement before an authoritative camp record exists.
const SIMULATED_LOCATION = getSeasonCenter(CURRENT_YEAR)

export function useSimulation() {
  // Use the global date override system
  const { getCurrentTime: getOverrideTime } = useDateOverride()
  
  const toggleSimulation = () => {
    isSimulating.value = !isSimulating.value
    console.log(`🎭 Location Simulation ${isSimulating.value ? 'ENABLED' : 'DISABLED'}`)
    if (isSimulating.value) {
      console.log(`📍 Simulated location: ${CURRENT_YEAR} city center`)
    }
  }
  
  const getSimulatedLocation = () => {
    return isSimulating.value ? SIMULATED_LOCATION : null
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
