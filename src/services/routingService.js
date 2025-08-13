import { brcAddressToLatLon } from '../utils/geocoding'

/**
 * Routing Service for Black Rock City
 * Calculates routes, distances, and travel times between locations
 */

// Travel speeds in mph
const TRAVEL_SPEEDS = {
  walking: 3,     // 3 mph average walking speed on playa
  biking: 8       // 8 mph average biking speed (accounting for playa conditions)
}

/**
 * Calculate straight-line distance between two points using Haversine formula
 * @param {Array} from - [lat, lng] of starting point
 * @param {Array} to - [lat, lng] of destination
 * @returns {Object} Distance in feet and miles
 */
export function calculateDistance(from, to) {
  if (!from || !to || from.length !== 2 || to.length !== 2) {
    return { feet: 0, miles: 0 }
  }

  const [lat1, lon1] = from
  const [lat2, lon2] = to
  
  const R = 3959 // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  const distanceInMiles = R * c

  return {
    miles: distanceInMiles,
    feet: distanceInMiles * 5280
  }
}

/**
 * Calculate travel time for a given distance and mode
 * @param {number} distanceInMiles - Distance in miles
 * @param {string} mode - 'walking' or 'biking'
 * @returns {Object} Time in minutes and formatted string
 */
export function calculateTravelTime(distanceInMiles, mode = 'walking') {
  const speed = TRAVEL_SPEEDS[mode] || TRAVEL_SPEEDS.walking
  const timeInHours = distanceInMiles / speed
  const timeInMinutes = Math.round(timeInHours * 60)
  
  // Format time string
  let timeString = ''
  if (timeInMinutes < 60) {
    timeString = `${timeInMinutes} min`
  } else {
    const hours = Math.floor(timeInMinutes / 60)
    const minutes = timeInMinutes % 60
    timeString = minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`
  }
  
  return {
    minutes: timeInMinutes,
    formatted: timeString
  }
}

/**
 * Create a simple straight-line route between two points
 * @param {Array} from - [lat, lng] of starting point  
 * @param {Array} to - [lat, lng] of destination
 * @returns {Object} Route object with geometry and travel info
 */
export function createStraightLineRoute(from, to) {
  if (!from || !to) {
    return null
  }

  const distance = calculateDistance(from, to)
  const walkingTime = calculateTravelTime(distance.miles, 'walking')
  const bikingTime = calculateTravelTime(distance.miles, 'biking')

  return {
    type: 'straight-line',
    from,
    to,
    geometry: [from, to], // Simple line coordinates for Leaflet
    distance,
    travelTimes: {
      walking: walkingTime,
      biking: bikingTime
    },
    // Formatted display strings
    distanceText: distance.feet < 1000 
      ? `${Math.round(distance.feet)} ft`
      : `${distance.miles.toFixed(1)} mi`,
    walkingText: `🚶 ${walkingTime.formatted}`,
    bikingText: `🚴 ${bikingTime.formatted}`
  }
}

/**
 * Calculate route from user location to any item (camp, art, event)
 * Enhanced with intelligent routing that automatically chooses the best route type
 * @param {Array} userLocation - [lat, lng] of user
 * @param {Object} item - Item with location data
 * @param {Function} getItemLocation - Function to extract location from item
 * @param {string} mode - 'walking' or 'biking' (optional, defaults to 'walking')
 * @returns {Promise<Object>|Object|null} Enhanced route object or null if no location available
 */
export async function calculateRouteToItem(userLocation, item, getItemLocation, mode = 'walking') {
  if (!userLocation) {
    return null
  }

  // Get destination coordinates
  const locationString = getItemLocation(item)
  if (!locationString) {
    return null
  }

  // Convert BRC address to coordinates
  const destinationCoords = brcAddressToLatLon(locationString)
  if (!destinationCoords) {
    return null
  }

  // Try enhanced routing first, fall back to straight-line
  try {
    const enhancedRoute = await calculateStreetRoute(userLocation, destinationCoords, mode)
    
    // Add item context to enhanced route
    if (enhancedRoute?.isIntelligentRoute) {
      enhancedRoute.itemContext = {
        name: item.name || item.title,
        type: item.event_type ? 'event' : (item.artist ? 'art' : 'camp'),
        location: locationString,
        uid: item.uid
      }
      
      console.log(`🧠 Enhanced route to ${enhancedRoute.itemContext.name}: ${enhancedRoute.routingMethod}`)
    }
    
    return enhancedRoute
    
  } catch (error) {
    console.warn('Enhanced routing failed for item, using straight-line fallback:', error)
    return createStraightLineRoute(userLocation, destinationCoords)
  }
}

/**
 * Synchronous version for backward compatibility
 * @deprecated Use calculateRouteToItem (async) for enhanced routing
 */
export function calculateRouteToItemSync(userLocation, item, getItemLocation) {
  if (!userLocation) {
    return null
  }

  const locationString = getItemLocation(item)
  if (!locationString) {
    return null
  }

  const destinationCoords = brcAddressToLatLon(locationString)
  if (!destinationCoords) {
    return null
  }

  return createStraightLineRoute(userLocation, destinationCoords)
}

/**
 * Format route information for display
 * @param {Object} route - Route object
 * @returns {Object} Formatted route info for UI
 */
export function formatRouteInfo(route) {
  if (!route) {
    return null
  }

  return {
    distance: route.distanceText,
    walking: route.walkingText,
    biking: route.bikingText,
    summary: `${route.distanceText} • ${route.walkingText} • ${route.bikingText}`
  }
}

/**
 * Create route waypoints for enhanced map visualization
 * Handles three-segment hybrid routes with proper segmentation
 * @param {Object} route - Route object
 * @returns {Array} Array of route segments with coordinates and metadata
 */
export function getRouteWaypoints(route) {
  if (!route) {
    return []
  }

  // Enhanced hybrid routes with segments
  if (route.enhancedRoute?.segments && route.enhancedRoute.segments.length > 1) {
    console.log('🎨 Generating enhanced route visualization with', route.enhancedRoute.segments.length, 'segments')
    
    return route.enhancedRoute.segments.map((segment, index) => {
      // DEBUG: Check segment coordinates format
      console.log(`🔍 SEGMENT ${index} WAYPOINT DEBUG:`)
      console.log('  - segment.coordinates:', segment.coordinates)
      
      return {
        id: `segment-${index}`,
        type: segment.type,
        subType: segment.subType || segment.type,
        coordinates: segment.coordinates, // Already in [lat, lng] format from route generation
        distance: segment.distance,
        duration: segment.duration,
        instructions: segment.instructions || segment.instruction,
        style: getSegmentStyle(segment.type, route.mode || 'walking'),
        isWaypoint: index > 0 && index < route.enhancedRoute.segments.length - 1
      }
    })
  }

  // Legacy straight-line routes
  if (route.geometry) {
    // DEBUG: Check legacy route coordinates format
    console.log('🔍 LEGACY ROUTE DEBUG:')
    console.log('  - route.geometry:', route.geometry)
    
    return [{
      id: 'straight-line',
      type: 'straight_line',
      coordinates: route.geometry, // Already in [lat, lng] format
      style: getRouteStyle(route.mode || 'walking'),
      isWaypoint: false
    }]
  }

  return []
}

/**
 * Get route style configuration for map display
 * @param {string} mode - 'walking' or 'biking'
 * @returns {Object} Leaflet polyline style options
 */
export function getRouteStyle(mode = 'walking') {
  const baseStyle = {
    weight: 4,
    opacity: 0.8,
    dashArray: '10, 5',
    lineCap: 'round',
    lineJoin: 'round'
  }

  if (mode === 'biking') {
    return {
      ...baseStyle,
      color: '#00ff00', // Green for biking
      weight: 5
    }
  }

  return {
    ...baseStyle,
    color: '#00FF00', // Bright green for high visibility testing
    weight: 6, // Thicker for better visibility
    opacity: 1.0 // Full opacity for testing
  }
}

/**
 * Get segment-specific style for hybrid routes
 * @param {string} segmentType - 'urban_navigation', 'playa_crossing', etc.
 * @param {string} mode - 'walking' or 'biking'
 * @returns {Object} Leaflet polyline style options
 */
export function getSegmentStyle(segmentType, mode = 'walking') {
  const baseStyle = {
    weight: 4,
    opacity: 0.9,
    lineCap: 'round',
    lineJoin: 'round'
  }

  // Revolutionary hybrid route colors following UI guidelines
  switch (segmentType) {
    case 'urban_navigation':
      // 🎯 CLARITY FIX: Use same thick green as pure urban routes for visual consistency
      return {
        ...baseStyle,
        color: '#00FF00', // Same bright green as pure urban routes
        weight: 6, // Same thick weight as pure urban routes  
        dashArray: null, // Solid line like pure urban routes
        opacity: 1.0 // Same full opacity as pure urban routes
      }
      
    case 'playa_crossing':
      return {
        ...baseStyle,
        color: mode === 'biking' ? '#00BCD4' : '#2196F3', // Cyan/blue for playa freedom
        weight: mode === 'biking' ? 6 : 5, // Thicker for the revolutionary shortcut
        opacity: 0.95, // More prominent
        dashArray: null // Solid line for direct crossing
      }
      
    case 'straight_line':
    default:
      return getRouteStyle(mode) // Fallback to basic style
  }
}

/**
 * Get waypoint marker style for hybrid routes
 * @param {string} waypointType - 'exit', 'entry', 'intermediate'
 * @returns {Object} Leaflet marker style options
 */
export function getWaypointStyle(waypointType) {
  const baseStyle = {
    radius: 8,
    fillOpacity: 0.9,
    weight: 2,
    opacity: 1,
    color: '#fff'
  }

  switch (waypointType) {
    case 'exit':
      return {
        ...baseStyle,
        fillColor: '#FF5722', // Orange-red for urban exit
        radius: 10
      }
      
    case 'entry':
      return {
        ...baseStyle,
        fillColor: '#4CAF50', // Green for urban entry
        radius: 10
      }
      
    case 'intermediate':
    default:
      return {
        ...baseStyle,
        fillColor: '#FFC107', // Yellow for intermediate points
        radius: 6
      }
  }
}

// Enhanced routing with BRC intelligence
import { EnhancedRoutingService } from './routing/enhancedRoutingService.js'

let enhancedRouter = null

/**
 * Get or create enhanced routing service instance
 */
async function getEnhancedRouter() {
  if (!enhancedRouter) {
    enhancedRouter = new EnhancedRoutingService()
    // Ensure it's initialized on first use
    await enhancedRouter.initialize()
  }
  return enhancedRouter
}

/**
 * Enhanced street-following route calculation with hybrid routing
 * Uses intelligent zone detection and hybrid urban/playa routing
 * @param {Array} from - [lat, lng] of starting point
 * @param {Array} to - [lat, lng] of destination 
 * @param {string} mode - 'walking' or 'biking'
 * @returns {Object} Enhanced route object
 */
export async function calculateStreetRoute(from, to, mode = 'walking') {
  try {
    const router = await getEnhancedRouter()
    
    // Use consistent [lat, lng] format throughout the system
    const enhancedRoute = await router.calculateIntelligentRoute(from, to, mode)
    
    // Convert enhanced route to legacy format for compatibility
    return convertToLegacyRoute(enhancedRoute, from, to)
    
  } catch (error) {
    console.error('Enhanced routing failed, falling back to straight-line:', error)
    return createStraightLineRoute(from, to)
  }
}

/**
 * Convert enhanced route format to legacy route format for compatibility
 */
function convertToLegacyRoute(enhancedRoute, originalFrom, originalTo) {
  // Enhanced route coordinates are already in [lat, lng] format
  const convertedGeometry = enhancedRoute.coordinates
  
  // Calculate distance and times using legacy format
  const distance = {
    feet: enhancedRoute.distance,
    miles: enhancedRoute.distance / 5280
  }
  
  // Convert duration (enhanced service uses minutes, legacy uses hours)
  const walkingTime = {
    minutes: enhancedRoute.mode === 'walking' ? enhancedRoute.duration : Math.round(enhancedRoute.duration * 1.5),
    formatted: formatDuration(enhancedRoute.mode === 'walking' ? enhancedRoute.duration : Math.round(enhancedRoute.duration * 1.5))
  }
  
  const bikingTime = {
    minutes: enhancedRoute.mode === 'biking' ? enhancedRoute.duration : Math.round(enhancedRoute.duration * 0.67),
    formatted: formatDuration(enhancedRoute.mode === 'biking' ? enhancedRoute.duration : Math.round(enhancedRoute.duration * 0.67))
  }

  return {
    // Legacy compatibility fields
    type: enhancedRoute.type === 'hybrid' ? 'intelligent-hybrid' : enhancedRoute.type,
    from: originalFrom,
    to: originalTo,
    geometry: convertedGeometry,
    distance,
    travelTimes: {
      walking: walkingTime,
      biking: bikingTime
    },
    distanceText: distance.feet < 1000 
      ? `${Math.round(distance.feet)} ft`
      : `${distance.miles.toFixed(1)} mi`,
    walkingText: `🚶 ${walkingTime.formatted}`,
    bikingText: `🚴 ${bikingTime.formatted}`,
    
    // Enhanced routing fields
    enhancedRoute: {
      routeType: enhancedRoute.type,
      segments: enhancedRoute.segments,
      directions: enhancedRoute.directions,
      summary: enhancedRoute.summary,
      zoneAnalysis: enhancedRoute.zoneAnalysis,
      hybridAnalysis: enhancedRoute.hybridAnalysis
    },
    
    // Routing metadata
    isIntelligentRoute: true,
    routingMethod: enhancedRoute.type === 'hybrid' ? 'Urban→Playa→Urban' : 
                   enhancedRoute.type === 'straight_line' ? 'Direct Playa' : 
                   'Street Following'
  }
}

/**
 * Format duration in minutes to readable string
 */
function formatDuration(minutes) {
  if (minutes < 60) {
    return `${minutes} min`
  } else {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
  }
}

/**
 * Check if enhanced routing is available
 * @returns {boolean} True if enhanced routing is ready
 */
export async function isEnhancedRoutingReady() {
  try {
    const router = await getEnhancedRouter()
    return router.isReady()
  } catch (error) {
    return false
  }
}

/**
 * Get enhanced routing system status for debugging
 * @returns {Object} System status information
 */
export async function getEnhancedRoutingStatus() {
  try {
    const router = await getEnhancedRouter()
    return router.getStatus()
  } catch (error) {
    return { error: error.message }
  }
}