import { reactive, computed } from 'vue'

// Global state for the application
export const globalState = reactive({
  // Location data availability per year
  location_data_available: {
    2023: true,  // Historical data always has locations
    2024: true,  // Historical data always has locations
    2025: false  // Current year - detected from data
  },
  
  // Whether we should show location data per year (based on policy)
  show_location_data: {
    2023: true,  // Historical data always shown
    2024: true,  // Historical data always shown
    2025: false  // Current year - follows policy
  },
  
  // Last check timestamp
  lastLocationCheck: null
})

// Computed property to determine if we can show locations for a specific year
export const canShowLocations = (year) => {
  // If location data isn't available, we can't show it
  if (!globalState.location_data_available[year]) {
    return false
  }
  
  // Check if we're allowed to show it based on the policy
  return globalState.show_location_data[year]
}

// Function to update location data availability for a specific year
export function updateLocationDataAvailability(year, hasLocations) {
  globalState.location_data_available[year] = hasLocations
  globalState.lastLocationCheck = new Date().toISOString()
  
  // Update show flag based on current date and policy
  updateShowLocationFlag(year)
  
  // Save state
  saveLocationState()
}

// Function to check if we should show location data based on policy
export function updateShowLocationFlag(year = null) {
  // If year is specified, only update that year
  const yearsToUpdate = year ? [year] : ['2023', '2024', '2025']
  
  yearsToUpdate.forEach(yr => {
    // Historical years (2023, 2024) always show location data
    if (yr === '2023' || yr === '2024') {
      globalState.show_location_data[yr] = true
      return
    }
    
    // For 2025, apply the policy
    if (yr === '2025') {
      // In development, always show location data if available
      if (import.meta.env.DEV) {
        globalState.show_location_data['2025'] = globalState.location_data_available['2025']
        return
      }
      
      // In production, follow the Burning Man API policy
      const now = new Date()
      
      // Burning Man 2025 dates (typically late August/early September)
      // Gates typically open on Sunday before the event
      // For 2025, let's assume event starts Aug 24 (Sunday) 
      const eventStartDate = new Date(2025, 7, 24) // August 24, 2025
      const gatesOpenDate = new Date(2025, 7, 24) // Gates open same day
      const buildWeekSunday = new Date(2025, 7, 17) // Sunday of build week (week before)
      const threeWeeksBefore = new Date(eventStartDate)
      threeWeeksBefore.setDate(threeWeeksBefore.getDate() - 21)
      
      // According to policy:
      // - Location data available to developers 3 weeks before event
      // - Art locations hidden until gates open
      // - Camp locations hidden until first Sunday of build week (12:01am)
      
      if (now >= threeWeeksBefore && globalState.location_data_available['2025']) {
        // We have the data, but can we show it?
        if (now >= buildWeekSunday) {
          // Can show camp locations after first Sunday of build week
          globalState.show_location_data['2025'] = true
        } else {
          // Have data but must hide it from users
          globalState.show_location_data['2025'] = false
        }
      } else {
        // Data not yet available from API or we haven't detected it
        globalState.show_location_data['2025'] = false
      }
    }
  })
}

// Initialize on load
updateShowLocationFlag()

// Persist to localStorage
export function saveLocationState() {
  localStorage.setItem('location_data_state', JSON.stringify({
    location_data_available: globalState.location_data_available,
    lastLocationCheck: globalState.lastLocationCheck
  }))
}

// Load from localStorage
export function loadLocationState() {
  const saved = localStorage.getItem('location_data_state')
  if (saved) {
    try {
      const data = JSON.parse(saved)
      if (data.location_data_available) {
        // Merge with defaults to ensure all years are present
        globalState.location_data_available = {
          ...globalState.location_data_available,
          ...data.location_data_available
        }
      }
      globalState.lastLocationCheck = data.lastLocationCheck
      updateShowLocationFlag()
    } catch (e) {
      console.error('Failed to load location state:', e)
    }
  }
}

// Load on startup
loadLocationState()

// Helper function to check if location should be displayed for a specific item
export function shouldShowLocation(item) {
  if (!item || !item.year) return true // Default to showing if no year info
  
  const year = item.year.toString()
  return canShowLocations(year)
}

// Debug function to log current state (dev only)
export function debugLocationState() {
  if (import.meta.env.DEV) {
    console.log('🌍 Location Data State:', {
      available: globalState.location_data_available,
      showable: globalState.show_location_data,
      lastCheck: globalState.lastLocationCheck
    })
  }
}

// Export the global state for direct access if needed
export default globalState