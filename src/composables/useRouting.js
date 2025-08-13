import { ref, computed } from 'vue'
import { calculateRouteToItem, formatRouteInfo, getRouteWaypoints, getRouteStyle, getSegmentStyle, getWaypointStyle } from '../services/routingService'

// Global route state
const currentRoute = ref(null)
const routeMode = ref('walking') // 'walking' or 'biking'
const routeTarget = ref(null) // Store the target item for reference
const isInRouteMode = ref(false) // Track if we're in focused route mode vs browse mode
const savedMapState = ref(null) // Store map state before entering route mode

// Load saved route mode from localStorage
const savedRouteMode = localStorage.getItem('routeMode')
if (savedRouteMode && ['walking', 'biking'].includes(savedRouteMode)) {
  routeMode.value = savedRouteMode
}

export function useRouting() {
  /**
   * Create a route from user location to an item (enhanced with intelligent routing)
   * @param {Array} userLocation - [lat, lng] of user
   * @param {Object} item - Target item (camp, art, event)
   * @param {Function} getItemLocation - Function to extract location from item
   * @param {Object} mapControls - Current map control state to save
   * @returns {Promise<Object>|null} Route object or null if route cannot be created
   */
  const createRoute = async (userLocation, item, getItemLocation, mapControls = null) => {
    try {
      // Use enhanced routing with current travel mode
      const route = await calculateRouteToItem(userLocation, item, getItemLocation, routeMode.value)
      
      if (route) {
        // Save current map state before entering route mode
        if (mapControls && !isInRouteMode.value) {
          savedMapState.value = { ...mapControls }
          console.log('💾 Saved map state for route mode:', savedMapState.value)
        }
        
        currentRoute.value = route
        routeTarget.value = {
          uid: item.uid,
          name: item.name || item.title,
          type: item.event_type ? 'event' : (item.artist ? 'art' : 'camp'),
          item: item
        }
        
        // Enter route mode
        isInRouteMode.value = true
        
        // Enhanced logging for intelligent routes
        if (route.isIntelligentRoute) {
          console.log(`🧠 Enhanced route to ${routeTarget.value.name}: ${route.routingMethod}`)
          console.log(`🗺️ Route distance: ${route.distanceText} • Time: ${route.travelTimes[routeMode.value].formatted}`)
          
          if (route.enhancedRoute?.segments) {
            console.log(`📋 Route segments: ${route.enhancedRoute.segments.length}`)
            route.enhancedRoute.segments.forEach((segment, i) => {
              console.log(`   ${i + 1}. ${segment.type}: ${segment.distance}ft, ${segment.duration}min`)
            })
          }
        } else {
          console.log(`🗺️ Route created to ${routeTarget.value.name}:`, route.distanceText)
        }
        
        console.log('🎯 Entering Route Mode - minimizing distractions')
      }
      
      return route
      
    } catch (error) {
      console.error('Failed to create enhanced route:', error)
      return null
    }
  }

  /**
   * Clear the current route and return to browse mode
   * @returns {Object|null} Saved map state to restore, or null if none saved
   */
  const clearRoute = () => {
    const stateToRestore = savedMapState.value
    
    currentRoute.value = null
    routeTarget.value = null
    isInRouteMode.value = false
    savedMapState.value = null
    
    console.log('🗺️ Route cleared')
    console.log('🌍 Exiting Route Mode - returning to Browse Mode')
    
    return stateToRestore
  }

  /**
   * Set the travel mode (walking or biking)
   * @param {string} mode - 'walking' or 'biking'
   */
  const setRouteMode = (mode) => {
    if (['walking', 'biking'].includes(mode)) {
      routeMode.value = mode
      localStorage.setItem('routeMode', mode)
    }
  }

  /**
   * Toggle between walking and biking modes
   */
  const toggleRouteMode = () => {
    setRouteMode(routeMode.value === 'walking' ? 'biking' : 'walking')
  }

  /**
   * Check if a route to a specific item already exists
   * @param {Object} item - Item to check
   * @returns {boolean} True if route exists to this item
   */
  const hasRouteToItem = (item) => {
    return currentRoute.value && 
           routeTarget.value && 
           routeTarget.value.uid === item.uid
  }

  /**
   * Get formatted route information for display
   * @returns {Object|null} Formatted route info or null
   */
  const routeInfo = computed(() => {
    return currentRoute.value ? formatRouteInfo(currentRoute.value) : null
  })

  /**
   * Get route waypoints for map visualization
   * @returns {Array} Array of [lat, lng] coordinates
   */
  const routeWaypoints = computed(() => {
    return currentRoute.value ? getRouteWaypoints(currentRoute.value) : []
  })

  /**
   * Get route style for current mode
   * @returns {Object} Leaflet polyline style options
   */
  const routeStyle = computed(() => {
    return getRouteStyle(routeMode.value)
  })

  /**
   * Get route mode display info
   * @returns {Object} Mode display information
   */
  const routeModeInfo = computed(() => {
    const modes = {
      walking: { icon: '🚶', label: 'Walking', color: '#ff6b00' },
      biking: { icon: '🚴', label: 'Biking', color: '#00ff00' }
    }
    return modes[routeMode.value] || modes.walking
  })

  /**
   * Get route summary for display
   * @returns {string|null} Route summary text
   */
  const routeSummary = computed(() => {
    if (!currentRoute.value || !routeTarget.value) return null
    
    const mode = routeModeInfo.value
    const time = routeMode.value === 'walking' 
      ? currentRoute.value.travelTimes.walking.formatted
      : currentRoute.value.travelTimes.biking.formatted
    
    return `${mode.icon} ${time} to ${routeTarget.value.name}`
  })

  /**
   * Get route details for info panel
   * @returns {Object|null} Detailed route information
   */
  const routeDetails = computed(() => {
    if (!currentRoute.value || !routeTarget.value) return null
    
    return {
      target: routeTarget.value,
      distance: currentRoute.value.distanceText,
      walkingTime: currentRoute.value.walkingText,
      bikingTime: currentRoute.value.bikingText,
      currentMode: routeModeInfo.value,
      currentTime: routeMode.value === 'walking' 
        ? currentRoute.value.travelTimes.walking.formatted
        : currentRoute.value.travelTimes.biking.formatted
    }
  })

  /**
   * Check if routing is available (user has location)
   * @param {Array} userLocation - [lat, lng] of user
   * @returns {boolean} True if routing is possible
   */
  const canRoute = (userLocation) => {
    return Boolean(userLocation && userLocation.length === 2)
  }

  return {
    // State
    currentRoute: computed(() => currentRoute.value),
    routeTarget: computed(() => routeTarget.value),
    routeMode: computed(() => routeMode.value),
    
    // Computed properties
    routeInfo,
    routeWaypoints,
    routeStyle,
    routeModeInfo,
    routeSummary,
    routeDetails,
    
    // Methods
    createRoute,
    clearRoute,
    setRouteMode,
    toggleRouteMode,
    hasRouteToItem,
    canRoute,
    
    // Enhanced visualization functions
    getSegmentStyle,
    getWaypointStyle,
    
    // Helper computed
    hasActiveRoute: computed(() => Boolean(currentRoute.value)),
    isWalkingMode: computed(() => routeMode.value === 'walking'),
    isBikingMode: computed(() => routeMode.value === 'biking'),
    
    // Route mode state
    isInRouteMode: computed(() => isInRouteMode.value),
    isInBrowseMode: computed(() => !isInRouteMode.value)
  }
}