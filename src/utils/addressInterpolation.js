/**
 * Address Interpolation - BRC Convention Address Handler
 * 
 * Handles BRC addressing conventions where ":15" and ":45" times on inner avenues
 * represent locations "halfway between" adjacent hour streets, not physical intersections.
 * 
 * Example: "E & 7:15" means "halfway between 7:00 & E and 7:30 & E"
 */

import { calculateDistance } from './brcAddressUtils'

/**
 * Interpolate the position for a convention address
 * Uses GIS anchor points (known hour intersections) to calculate precise midpoints
 * 
 * @param {string} clockTime - Quarter-hour time (e.g., "7:15")
 * @param {string} avenue - Avenue letter or name
 * @param {function} gisLookupFunction - Function to find GIS intersections
 * @returns {array|null} [latitude, longitude] or null if interpolation fails
 */
export function interpolateAddress(clockTime, avenue, gisLookupFunction) {
  // Parse the clock time
  const [hourStr, minuteStr] = clockTime.split(':')
  const hour = parseInt(hourStr)
  const minute = parseInt(minuteStr)
  
  // Only handle quarter-hour addresses
  if (minute !== 15 && minute !== 45) {
    return null
  }
  
  // Determine anchor points for interpolation
  let anchorTime1, anchorTime2
  
  if (minute === 15) {
    // For :15 addresses, interpolate between :00 and :30
    anchorTime1 = `${hour}:00`
    anchorTime2 = `${hour}:30`
  } else { // minute === 45
    // For :45 addresses, interpolate between :30 and next hour :00
    anchorTime1 = `${hour}:30`
    anchorTime2 = `${hour === 10 ? 2 : hour + 1}:00` // Wrap from 10:00 to 2:00
  }
  
  // Get coordinates for both anchor points
  const coords1 = gisLookupFunction(anchorTime1, avenue)
  const coords2 = gisLookupFunction(anchorTime2, avenue)
  
  if (!coords1 || !coords2) {
    return null
  }
  
  // Calculate and return the midpoint
  return calculateMidpoint(coords1, coords2)
}

/**
 * Calculate the geographic midpoint between two coordinates
 * Uses spherical geometry for accurate interpolation on the Earth's surface
 * 
 * @param {array} coord1 - [latitude, longitude]
 * @param {array} coord2 - [latitude, longitude]
 * @returns {array} [latitude, longitude] of midpoint
 */
export function calculateMidpoint(coord1, coord2) {
  const [lat1, lon1] = coord1
  const [lat2, lon2] = coord2
  
  // Convert to radians
  const lat1Rad = lat1 * Math.PI / 180
  const lat2Rad = lat2 * Math.PI / 180
  const lon1Rad = lon1 * Math.PI / 180
  const lon2Rad = lon2 * Math.PI / 180
  
  // Calculate differences
  const dLon = lon2Rad - lon1Rad
  
  // Calculate midpoint using spherical geometry
  const bx = Math.cos(lat2Rad) * Math.cos(dLon)
  const by = Math.cos(lat2Rad) * Math.sin(dLon)
  
  const midLatRad = Math.atan2(
    Math.sin(lat1Rad) + Math.sin(lat2Rad),
    Math.sqrt((Math.cos(lat1Rad) + bx) * (Math.cos(lat1Rad) + bx) + by * by)
  )
  
  const midLonRad = lon1Rad + Math.atan2(by, Math.cos(lat1Rad) + bx)
  
  // Convert back to degrees
  const midLat = midLatRad * 180 / Math.PI
  const midLon = midLonRad * 180 / Math.PI
  
  return [midLat, midLon]
}

/**
 * Enhanced interpolation with multiple interpolation methods
 * Provides fallback strategies and validation
 * 
 * @param {string} clockTime - Quarter-hour time
 * @param {string} avenue - Avenue letter or name
 * @param {function} gisLookupFunction - Function to find GIS intersections
 * @param {object} options - Interpolation options
 * @returns {object} Detailed interpolation result
 */
export function enhancedInterpolation(clockTime, avenue, gisLookupFunction, options = {}) {
  const result = {
    success: false,
    coordinates: null,
    method: null,
    anchorPoints: {},
    validation: {},
    errors: []
  }
  
  try {
    // Basic interpolation
    const coords = interpolateAddress(clockTime, avenue, gisLookupFunction)
    
    if (coords) {
      result.success = true
      result.coordinates = coords
      result.method = 'spherical_midpoint'
      
      // Add validation data if requested
      if (options.includeValidation) {
        const [hourStr, minuteStr] = clockTime.split(':')
        const hour = parseInt(hourStr)
        const minute = parseInt(minuteStr)
        
        const anchorTime1 = minute === 15 ? `${hour}:00` : `${hour}:30`
        const anchorTime2 = minute === 15 ? `${hour}:30` : `${hour === 10 ? 2 : hour + 1}:00`
        
        const coords1 = gisLookupFunction(anchorTime1, avenue)
        const coords2 = gisLookupFunction(anchorTime2, avenue)
        
        result.anchorPoints = {
          [anchorTime1]: coords1,
          [anchorTime2]: coords2
        }
        
        if (coords1 && coords2) {
          result.validation = {
            distanceToAnchor1: calculateDistance(coords, coords1),
            distanceToAnchor2: calculateDistance(coords, coords2),
            anchorDistance: calculateDistance(coords1, coords2),
            midpointAccuracy: Math.abs(
              calculateDistance(coords, coords1) - calculateDistance(coords, coords2)
            )
          }
        }
      }
    } else {
      result.errors.push('Interpolation failed - could not find anchor coordinates')
    }
    
  } catch (error) {
    result.errors.push(`Interpolation error: ${error.message}`)
  }
  
  return result
}

/**
 * Batch interpolation for multiple addresses
 * Useful for processing camp data during sync
 * 
 * @param {array} addresses - Array of {clockTime, avenue} objects
 * @param {function} gisLookupFunction - Function to find GIS intersections
 * @returns {array} Array of interpolation results
 */
export function batchInterpolation(addresses, gisLookupFunction) {
  const results = []
  
  addresses.forEach(({ clockTime, avenue, id }) => {
    const result = enhancedInterpolation(clockTime, avenue, gisLookupFunction, {
      includeValidation: false
    })
    
    results.push({
      id,
      clockTime,
      avenue,
      ...result
    })
  })
  
  return results
}

/**
 * Get interpolation statistics for debugging
 * @param {array} interpolationResults - Results from batch interpolation
 * @returns {object} Statistics summary
 */
export function getInterpolationStats(interpolationResults) {
  const total = interpolationResults.length
  const successful = interpolationResults.filter(r => r.success).length
  const failed = total - successful
  
  const errorTypes = {}
  interpolationResults.forEach(result => {
    if (!result.success) {
      result.errors.forEach(error => {
        errorTypes[error] = (errorTypes[error] || 0) + 1
      })
    }
  })
  
  return {
    total,
    successful,
    failed,
    successRate: (successful / total * 100).toFixed(1) + '%',
    errorTypes,
    methods: interpolationResults.reduce((acc, result) => {
      if (result.method) {
        acc[result.method] = (acc[result.method] || 0) + 1
      }
      return acc
    }, {})
  }
}

/**
 * Debug helper for testing interpolation
 * @param {string} clockTime - Quarter-hour time
 * @param {string} avenue - Avenue letter
 * @param {function} gisLookupFunction - GIS lookup function
 */
export function debugInterpolation(clockTime, avenue, gisLookupFunction) {
  console.log(`🔬 Debug Interpolation: ${clockTime} & ${avenue}`)
  
  const result = enhancedInterpolation(clockTime, avenue, gisLookupFunction, {
    includeValidation: true
  })
  
  console.log('Interpolation Result:', result)
  
  if (result.success) {
    console.log(`✅ Success! Coordinates: [${result.coordinates[0].toFixed(6)}, ${result.coordinates[1].toFixed(6)}]`)
    if (result.validation) {
      console.log(`📏 Validation: ${result.validation.midpointAccuracy.toFixed(1)}ft accuracy`)
    }
  } else {
    console.log(`❌ Failed:`, result.errors)
  }
  
  return result
}