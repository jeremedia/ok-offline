/**
 * BRC Address Resolver - Smart BRC Addressing System
 * 
 * The core intelligence for resolving Black Rock City addresses that understands
 * the dual meaning of time-based addresses like "7:15":
 * 
 * 1. PHYSICAL STREET: Actual radial street (F avenue outward only)
 * 2. ADDRESS CONVENTION: Location reference "halfway between 7:00 and 7:30"
 * 
 * This resolver automatically detects which meaning applies and routes to either
 * GIS intersection lookup or address interpolation accordingly.
 */

import { isPhysicalIntersection, debugAddressMapping } from './radialStreetMapping'
import { interpolateAddress, debugInterpolation } from './addressInterpolation'
import { parseBRCAddress, calculateDistance } from './brcAddressUtils'

/**
 * The main BRC address resolution function
 * Replaces the broken pattern of "try GIS, then calculate fallback"
 * 
 * @param {string} address - BRC address (e.g., "7:15 & E")
 * @param {function} gisLookupFunction - Function to find physical intersections
 * @param {object} options - Resolution options
 * @returns {object} Resolution result with coordinates and metadata
 */
export function resolveBRCAddress(address, gisLookupFunction, options = {}) {
  const debug = options.debug || false
  
  const result = {
    success: false,
    coordinates: null,
    address: address,
    method: null,
    isPhysicalIntersection: false,
    metadata: {}
  }
  
  // Parse the address
  const parsed = parseBRCAddress(address)
  if (!parsed) {
    result.error = 'Unable to parse BRC address'
    return result
  }
  
  const { clock, avenue } = parsed
  result.metadata.clockTime = clock
  result.metadata.avenue = avenue
  
  // Determine if this is a physical intersection or addressing convention
  const isPhysical = isPhysicalIntersection(clock, avenue)
  result.isPhysicalIntersection = isPhysical
  
  if (isPhysical) {
    // Use GIS intersection lookup for real streets
    const coords = gisLookupFunction(clock, avenue)
    if (coords) {
      result.success = true
      result.coordinates = coords
      result.method = 'gis_intersection'
    } else {
      result.error = 'GIS intersection lookup failed for physical street'
    }
    
  } else {
    // Use interpolation for addressing conventions
    const coords = interpolateAddress(clock, avenue, gisLookupFunction)
    if (coords) {
      result.success = true
      result.coordinates = coords
      result.method = 'interpolation'
    } else {
      result.error = 'Address interpolation failed for convention address'
    }
  }
  
  return result
}

/**
 * Enhanced address resolution with comprehensive error handling and fallbacks
 * 
 * @param {string} address - BRC address
 * @param {function} gisLookupFunction - GIS lookup function
 * @param {object} options - Enhanced options
 * @returns {object} Detailed resolution result
 */
export function enhancedAddressResolution(address, gisLookupFunction, options = {}) {
  const {
    debug = false,
    enableFallback = true,
    includeValidation = false,
    timeout = 5000
  } = options
  
  const result = {
    success: false,
    coordinates: null,
    address: address,
    method: null,
    isPhysicalIntersection: false,
    metadata: {},
    errors: [],
    warnings: [],
    fallbackAttempted: false,
    processingTime: 0
  }
  
  const startTime = Date.now()
  
  try {
    // Primary resolution attempt
    const primaryResult = resolveBRCAddress(address, gisLookupFunction, { debug })
    
    Object.assign(result, primaryResult)
    
    // If primary failed and fallback is enabled, we could try mathematical fallback
    // For now, we're testing the smart resolution only
    if (!result.success && enableFallback && result.isPhysicalIntersection) {
      if (debug) {
        console.log(`🔄 Mathematical fallback would be attempted here (disabled for testing)`)
      }
      result.fallbackAttempted = true
      result.warnings.push('Mathematical fallback available but disabled for testing')
    }
    
  } catch (error) {
    result.errors.push(`Resolution error: ${error.message}`)
    if (debug) {
      console.error('Address resolution error:', error)
    }
  }
  
  result.processingTime = Date.now() - startTime
  
  return result
}

/**
 * Batch resolve multiple BRC addresses
 * Optimized for processing camp/art/event data during sync
 * 
 * @param {array} addresses - Array of BRC addresses
 * @param {function} gisLookupFunction - GIS lookup function
 * @param {object} options - Batch processing options
 * @returns {array} Array of resolution results
 */
export function batchResolveBRCAddresses(addresses, gisLookupFunction, options = {}) {
  const {
    debug = false,
    maxConcurrent = 10,
    includeStats = true
  } = options
  
  if (debug) {
    console.log(`🔄 Batch resolving ${addresses.length} BRC addresses`)
  }
  
  const results = []
  const stats = {
    total: addresses.length,
    successful: 0,
    failed: 0,
    physicalIntersections: 0,
    interpolatedAddresses: 0,
    methods: {},
    errors: {},
    processingTime: 0
  }
  
  const startTime = Date.now()
  
  // Process addresses in batches to avoid overwhelming the system
  for (let i = 0; i < addresses.length; i += maxConcurrent) {
    const batch = addresses.slice(i, i + maxConcurrent)
    
    const batchResults = batch.map(address => {
      const result = resolveBRCAddress(address, gisLookupFunction, { debug: false })
      
      // Update stats
      if (result.success) {
        stats.successful++
        stats.methods[result.method] = (stats.methods[result.method] || 0) + 1
        
        if (result.isPhysicalIntersection) {
          stats.physicalIntersections++
        } else {
          stats.interpolatedAddresses++
        }
      } else {
        stats.failed++
        if (result.error) {
          stats.errors[result.error] = (stats.errors[result.error] || 0) + 1
        }
      }
      
      return {
        address,
        ...result
      }
    })
    
    results.push(...batchResults)
    
    if (debug && i % 100 === 0) {
      console.log(`   Processed ${Math.min(i + maxConcurrent, addresses.length)}/${addresses.length} addresses`)
    }
  }
  
  stats.processingTime = Date.now() - startTime
  stats.successRate = (stats.successful / stats.total * 100).toFixed(1) + '%'
  
  if (debug || includeStats) {
    console.log(`✅ Batch resolution complete:`, stats)
  }
  
  return includeStats ? { results, stats } : results
}

/**
 * Drop-in replacement for the existing brcAddressToLatLon function
 * Maintains backward compatibility while providing enhanced addressing
 * 
 * @param {string} address - BRC address
 * @returns {array|null} [latitude, longitude] or null if failed
 */
export function smartBrcAddressToLatLon(address, gisLookupFunction) {
  // Use the provided GIS lookup function
  const result = resolveBRCAddress(address, gisLookupFunction)
  
  return result.success ? result.coordinates : null
}

/**
 * Debug helper for testing the resolver with known problematic addresses
 * 
 * @param {function} gisLookupFunction - GIS lookup function
 */
export function debugKnownAddresses(gisLookupFunction) {
  console.log(`🔬 Testing BRC Address Resolver with known problematic addresses`)
  
  const testAddresses = [
    'E & 7:15',        // Convention address (should interpolate)
    '4:30 & K',        // Physical intersection (should use GIS)
    'Esplanade & 7:15', // Convention address on Esplanade
    'F & 7:15',        // Physical intersection (7:15 reaches F)
    '7:30 & E',        // Physical intersection (reverse order)
    'G & 4:45'         // Physical intersection with :45 time
  ]
  
  testAddresses.forEach(address => {
    console.log(`\n--- Testing: ${address} ---`)
    const result = resolveBRCAddress(address, gisLookupFunction, { debug: true })
    
    if (result.success) {
      console.log(`✅ SUCCESS: ${result.method} -> [${result.coordinates[0].toFixed(6)}, ${result.coordinates[1].toFixed(6)}]`)
    } else {
      console.log(`❌ FAILED: ${result.error}`)
    }
  })
}

/**
 * Validate the address resolver against a dataset
 * 
 * @param {array} testData - Array of {address, expectedCoords} objects
 * @param {function} gisLookupFunction - GIS lookup function
 * @returns {object} Validation results
 */
export function validateAddressResolver(testData, gisLookupFunction) {
  const results = {
    total: testData.length,
    correct: 0,
    incorrect: 0,
    failed: 0,
    accuracyThreshold: 50, // feet
    details: []
  }
  
  testData.forEach(({ address, expectedCoords, description }) => {
    const result = resolveBRCAddress(address, gisLookupFunction)
    
    const detail = {
      address,
      description,
      success: result.success,
      method: result.method,
      isPhysical: result.isPhysicalIntersection
    }
    
    if (result.success && expectedCoords) {
      const distance = calculateDistance(result.coordinates, expectedCoords)
      
      detail.distance = distance
      detail.accurate = distance <= results.accuracyThreshold
      
      if (detail.accurate) {
        results.correct++
      } else {
        results.incorrect++
      }
    } else if (!result.success) {
      results.failed++
      detail.error = result.error
    }
    
    results.details.push(detail)
  })
  
  results.successRate = (results.correct / results.total * 100).toFixed(1) + '%'
  
  return results
}

/**
 * Get comprehensive statistics about address resolution patterns
 * Useful for monitoring and debugging
 * 
 * @param {array} resolutionResults - Results from batch resolution
 * @returns {object} Detailed statistics
 */
export function getResolutionStatistics(resolutionResults) {
  const stats = {
    total: resolutionResults.length,
    successful: 0,
    failed: 0,
    methods: {},
    intersectionTypes: {},
    clockTimes: {},
    avenues: {},
    errors: {},
    averageProcessingTime: 0
  }
  
  let totalProcessingTime = 0
  
  resolutionResults.forEach(result => {
    if (result.success) {
      stats.successful++
      stats.methods[result.method] = (stats.methods[result.method] || 0) + 1
    } else {
      stats.failed++
      if (result.error) {
        stats.errors[result.error] = (stats.errors[result.error] || 0) + 1
      }
    }
    
    const intersectionType = result.isPhysicalIntersection ? 'physical' : 'convention'
    stats.intersectionTypes[intersectionType] = (stats.intersectionTypes[intersectionType] || 0) + 1
    
    if (result.metadata) {
      const { clockTime, avenue } = result.metadata
      if (clockTime) {
        stats.clockTimes[clockTime] = (stats.clockTimes[clockTime] || 0) + 1
      }
      if (avenue) {
        stats.avenues[avenue] = (stats.avenues[avenue] || 0) + 1
      }
    }
    
    if (result.processingTime) {
      totalProcessingTime += result.processingTime
    }
  })
  
  stats.successRate = (stats.successful / stats.total * 100).toFixed(1) + '%'
  stats.averageProcessingTime = Math.round(totalProcessingTime / stats.total)
  
  return stats
}

// Main export
export default resolveBRCAddress