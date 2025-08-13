/**
 * Geographic utility functions for BRC routing system
 */

// BRC-specific constants - using precise Golden Spike coordinates 
export const BRC_CENTER = [40.786958, -119.202994] // Golden Spike (precise center of Black Rock City) [lat, lng]
export const BRC_TEMPLE = [40.791815152314989, -119.19662192527863] // Temple location from 2025 GIS data [lat, lng]
export const DEGREES_TO_RADIANS = Math.PI / 180
export const EARTH_RADIUS_METERS = 6371000
export const FEET_TO_METERS = 0.3048

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {[number, number]} coord1 [latitude, longitude]
 * @param {[number, number]} coord2 [latitude, longitude] 
 * @returns {number} Distance in meters
 */
export function haversineDistance([lat1, lng1], [lat2, lng2]) {
  const dLat = (lat2 - lat1) * DEGREES_TO_RADIANS
  const dLng = (lng2 - lng1) * DEGREES_TO_RADIANS
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * DEGREES_TO_RADIANS) * Math.cos(lat2 * DEGREES_TO_RADIANS) * 
    Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return EARTH_RADIUS_METERS * c
}

/**
 * Calculate bearing from point A to point B
 * @param {[number, number]} coord1 [latitude, longitude]
 * @param {[number, number]} coord2 [latitude, longitude]
 * @returns {number} Bearing in degrees (0-360)
 */
export function calculateBearing([lat1, lng1], [lat2, lng2]) {
  const dLng = (lng2 - lng1) * DEGREES_TO_RADIANS
  const y = Math.sin(dLng) * Math.cos(lat2 * DEGREES_TO_RADIANS)
  const x = Math.cos(lat1 * DEGREES_TO_RADIANS) * Math.sin(lat2 * DEGREES_TO_RADIANS) - 
            Math.sin(lat1 * DEGREES_TO_RADIANS) * Math.cos(lat2 * DEGREES_TO_RADIANS) * Math.cos(dLng)
  let bearing = Math.atan2(y, x) * (180 / Math.PI)
  return (bearing + 360) % 360
}

/**
 * Get clock position from BRC center (12:00 is north)
 * @param {[number, number]} coord [latitude, longitude]
 * @returns {number} Clock position in minutes (0-719, where 0=12:00, 360=6:00)
 */
export function getClockPosition(coord) {
  const bearing = calculateBearing(BRC_CENTER, coord)
  
  // CRITICAL BUG FIX: Account for BRC city orientation
  // BRC is oriented with 12:00 pointing 45° northeast, not true north
  // The bearing gives us angle relative to true north, but BRC clock is rotated 45°
  // 
  // Correction: Subtract 45° city bearing offset to align with BRC clock system
  // Example: 9:45 should be at 292.5° in BRC system
  // If true bearing is ~323°, then BRC angle = 323° - 45° = 278° ≈ 9:15-9:20
  
  const cityBearingOffset = 45 // BRC is oriented 45° from true north
  let brcAngle = (bearing - cityBearingOffset + 360) % 360
  
  // Convert BRC angle to clock minutes (720 minutes in full circle)
  const minutes = Math.round((brcAngle / 360) * 720)
  return minutes
}

/**
 * Get clock sector (hour) from coordinates
 * @param {[number, number]} coord [latitude, longitude] 
 * @returns {number} Clock hour (0-11, where 0=12:00, 6=6:00)
 */
export function getClockSector(coord) {
  const clockMinutes = getClockPosition(coord)
  return Math.floor(clockMinutes / 60) % 12
}

/**
 * Get formatted clock address (e.g., "3:30")
 * @param {[number, number]} coord [latitude, longitude]
 * @returns {string} Clock address like "3:30" or "6:00"
 */
export function getClockAddress(coord) {
  const clockMinutes = getClockPosition(coord)
  const hours = Math.floor(clockMinutes / 60) % 12 || 12
  const minutes = clockMinutes % 60
  const minuteStr = minutes === 0 ? '00' : minutes.toString().padStart(2, '0')
  return `${hours}:${minuteStr}`
}

/**
 * Calculate distance from BRC center
 * @param {[number, number]} coord [latitude, longitude]
 * @returns {number} Distance in meters
 */
export function distanceFromCenter(coord) {
  return haversineDistance(BRC_CENTER, coord)
}

/**
 * Convert meters to feet
 * @param {number} meters 
 * @returns {number} feet
 */
export function metersToFeet(meters) {
  return meters / FEET_TO_METERS
}

/**
 * Convert feet to meters
 * @param {number} feet
 * @returns {number} meters  
 */
export function feetToMeters(feet) {
  return feet * FEET_TO_METERS
}

/**
 * Check if point is inside polygon using ray casting algorithm
 * @param {[number, number]} point [latitude, longitude]
 * @param {Array<[number, number]>} polygon Array of [latitude, longitude] coordinates
 * @returns {boolean} True if point is inside polygon
 */
export function pointInPolygon([lat, lng], polygon) {
  let inside = false
  
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const lati = polygon[i][0], lngi = polygon[i][1]
    const latj = polygon[j][0], lngj = polygon[j][1]
    
    if (((lati > lat) !== (latj > lat)) && (lng < (lngj - lngi) * (lat - lati) / (latj - lati) + lngi)) {
      inside = !inside
    }
  }
  
  return inside
}

/**
 * Check if line segment intersects with polygon
 * @param {[[number, number], [number, number]]} line Start and end coordinates
 * @param {Array<[number, number]>} polygon Array of [latitude, longitude] coordinates
 * @returns {boolean} True if line intersects polygon
 */
export function lineIntersectsPolygon([lineStart, lineEnd], polygon) {
  // Simple implementation: check if either endpoint is inside polygon
  // or if line crosses any polygon edge (more complex intersection detection could be added)
  if (pointInPolygon(lineStart, polygon) || pointInPolygon(lineEnd, polygon)) {
    return true
  }
  
  // Check line-line intersections (simplified)
  for (let i = 0; i < polygon.length - 1; i++) {
    if (linesIntersect(lineStart, lineEnd, polygon[i], polygon[i + 1])) {
      return true
    }
  }
  
  return false
}

/**
 * Check if two line segments intersect
 * @param {[number, number]} line1Start [latitude, longitude]
 * @param {[number, number]} line1End [latitude, longitude]
 * @param {[number, number]} line2Start [latitude, longitude]
 * @param {[number, number]} line2End [latitude, longitude]
 * @returns {boolean} True if lines intersect
 */
export function linesIntersect([lat1, lng1], [lat2, lng2], [lat3, lng3], [lat4, lng4]) {
  const denom = (lng1 - lng2) * (lat3 - lat4) - (lat1 - lat2) * (lng3 - lng4)
  if (denom === 0) return false // Parallel lines
  
  const t = ((lng1 - lng3) * (lat3 - lat4) - (lat1 - lat3) * (lng3 - lng4)) / denom
  const u = -((lng1 - lng2) * (lat1 - lat3) - (lat1 - lat2) * (lng1 - lng3)) / denom
  
  return t >= 0 && t <= 1 && u >= 0 && u <= 1
}

/**
 * Get cardinal direction from bearing
 * @param {number} bearing Bearing in degrees
 * @returns {string} Cardinal direction like "northeast", "south", etc.
 */
export function getCardinalDirection(bearing) {
  const directions = [
    'north', 'northeast', 'east', 'southeast',
    'south', 'southwest', 'west', 'northwest'
  ]
  const index = Math.round(bearing / 45) % 8
  return directions[index]
}