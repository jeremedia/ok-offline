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
 * @param {Array} userLocation - [lat, lng] of user
 * @param {Object} item - Item with location data
 * @param {Function} getItemLocation - Function to extract location from item
 * @returns {Object|null} Route object or null if no location available
 */
export function calculateRouteToItem(userLocation, item, getItemLocation) {
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
 * Create route waypoints for smooth line drawing on map
 * Future: This could be enhanced to follow BRC streets
 * @param {Object} route - Route object
 * @returns {Array} Array of [lat, lng] coordinates
 */
export function getRouteWaypoints(route) {
  if (!route || !route.geometry) {
    return []
  }

  // For straight-line routes, just return the start and end points
  return route.geometry
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
    color: '#ff6b00', // Orange for walking
    weight: 4
  }
}

// Future enhancement: Street-following route calculation
// This would use the existing GIS street data to create more realistic routes
export function calculateStreetRoute(from, to) {
  // TODO: Implement street-following route calculation
  // This would:
  // 1. Find nearest streets to start/end points
  // 2. Calculate route following radial and circumferential streets
  // 3. Account for BRC's unique circular layout
  // 4. Return multi-segment route with turn-by-turn directions
  
  // For now, fall back to straight-line
  return createStraightLineRoute(from, to)
}