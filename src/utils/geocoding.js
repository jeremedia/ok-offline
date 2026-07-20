/**
 * Geocoding utilities for Black Rock City addresses
 * Converts BRC addresses (e.g., "7:30 & E") to lat/lon coordinates
 */

import { BRC_CENTER, APP_DEBUG } from '../config'
import { getStreetLines, getGISYear } from '../services/gisData'
import { getAvenueNameFromLetter, getAvenueLetterFromName, getAvenueDistance } from './avenueMapping'
import { resolveBRCAddress } from './brcAddressResolver'
import { parseBRCAddress, calculateDistance } from './brcAddressUtils'
import { lookupIntersection } from './brcIntersectionLookup'
import { getSeason } from '../config/seasons'

/**
 * Conditional console logging - only logs in development or when debug is enabled
 */
function debugLog(...args) {
  if (APP_DEBUG) {
    console.log(...args)
  }
}

// BRC dimensions and layout constants
const BRC_CONFIG = {
  // Golden Spike (Man) location
  center: BRC_CENTER, // [40.786958, -119.202994]
  
  // Distance from center to each avenue in feet
  // NOTE: These are fallback values - use getAvenueDistance() for accurate distances
  avenueDistances: {
    'Esplanade': 2600,
    'A': 3037,
    'B': 3316,
    'C': 3596,
    'D': 3876,
    'E': 4156,
    'F': 4436,
    'G': 4716,
    'H': 4996,
    'I': 5276,
    'J': 5556,
    'K': 5836,
    'L': 6116
  },
  
  // Clock angles (where 12:00 is north)
  // BRC is oriented with 12:00 pointing to true north
  // Streets run from 2:00 to 10:00
  clockAngles: {
    '2:00': 60,
    '2:15': 67.5,
    '2:30': 75,
    '2:45': 82.5,
    '3:00': 90,
    '3:15': 97.5,
    '3:30': 105,
    '3:45': 112.5,
    '4:00': 120,
    '4:15': 127.5,
    '4:30': 135,
    '4:45': 142.5,
    '5:00': 150,
    '5:15': 157.5,
    '5:30': 165,
    '5:45': 172.5,
    '6:00': 180,
    '6:15': 187.5,
    '6:30': 195,
    '6:45': 202.5,
    '7:00': 210,
    '7:15': 217.5,
    '7:30': 225,
    '7:45': 232.5,
    '8:00': 240,
    '8:15': 247.5,
    '8:30': 255,
    '8:45': 262.5,
    '9:00': 270,
    '9:15': 277.5,
    '9:30': 285,
    '9:45': 292.5,
    '10:00': 300
  },
  
  // City bearing offset (degrees from true north)
  // BRC is typically oriented with 12:00 at 45 degrees (northeast)
  cityBearing: 45
}

/**
 * Convert feet to degrees latitude
 */
function feetToDegreesLat(feet) {
  // 1 degree latitude ≈ 364,000 feet
  return feet / 364000
}

/**
 * Convert feet to degrees longitude at a given latitude
 */
function feetToDegreesLon(feet, latitude) {
  // 1 degree longitude varies by latitude
  // At 40.78 degrees (BRC latitude), 1 degree ≈ 277,000 feet
  const feetPerDegree = 277000 * Math.cos(latitude * Math.PI / 180)
  return feet / feetPerDegree
}

/**
 * Check if a string is an avenue letter (A-L)
 */
function isAvenueLetter(str) {
  return /^[A-L]$/.test(str.toUpperCase())
}

/**
 * Check if two street names are clock time variants (e.g., "3:30" vs "03:30")
 * @param {string} gisName - Name from GIS data
 * @param {string} searchName - Name we're searching for
 * @returns {boolean} True if they represent the same clock time
 */
function isClockTimeVariant(gisName, searchName) {
  // Only apply to clock time strings
  if (!/^\d{1,2}:\d{2}/.test(gisName) || !/^\d{1,2}:\d{2}/.test(searchName)) {
    return false
  }
  
  // Extract hours and minutes from both
  const gisMatch = gisName.match(/^(\d{1,2}):(\d{2})/)
  const searchMatch = searchName.match(/^(\d{1,2}):(\d{2})/)
  
  if (!gisMatch || !searchMatch) {
    return false
  }
  
  // Compare numerical values (handles "3:30" vs "03:30")
  const gisHour = parseInt(gisMatch[1])
  const gisMinute = parseInt(gisMatch[2])
  const searchHour = parseInt(searchMatch[1])
  const searchMinute = parseInt(searchMatch[2])
  
  return gisHour === searchHour && gisMinute === searchMinute
}

// parseBRCAddress now imported from brcAddressUtils

/**
 * Find the intersection of two streets using GIS data
 * @param {string} street1 - First street name (e.g., "7:30")
 * @param {string} street2 - Second street name (e.g., "E")
 * @param {boolean} debug - Enable detailed debugging logs (default: false)
 * @returns {array|null} [latitude, longitude] or null if not found
 */
export function findStreetIntersectionFromGIS(street1, street2, debug = false) {
  if (debug) {
    console.log('🔍 ===== GIS INTERSECTION LOOKUP DEBUG =====')
    console.log('🔍 Looking for GIS intersection:', street1, '&', street2)
  }
  
  const year = getGISYear()
  // The generated adapter is intentionally retained only for historical 2025.
  const lookupResult = lookupIntersection(street1, street2, year)
  if (lookupResult) {
    if (debug) {
      console.log('🔍 ✅ FAST LOOKUP SUCCESS:', lookupResult)
      console.log('🔍 ===== END GIS INTERSECTION DEBUG =====')
    }
    return lookupResult
  }
  
  if (debug) console.log('🔍 ⚡ Fast lookup failed, falling back to geometric calculation...')
  
  if (debug) console.log('🔍 Using GIS year:', year)
  
  const streetData = getStreetLines(year)
  if (!streetData || !streetData.features) {
    if (debug) console.log('🔍 ❌ No street data available for year:', year)
    return null
  }
  
  if (debug) console.log('🔍 ✅ GIS data loaded. Total features:', streetData.features.length)
  
  // Official 2026 geometry uses A–K and ESP. Older geometry used theme names.
  const gisStreetName = street => {
    if (Number(year) === 2026) return street.toUpperCase() === 'ESPLANADE' ? 'ESP' : street
    return isAvenueLetter(street) ? getAvenueNameFromLetter(street, year) : street
  }
  const street1Name = gisStreetName(street1)
  const street2Name = gisStreetName(street2)
  
  if (debug) {
    console.log('🔍 Name conversion:')
    console.log('  -', street1, '→', street1Name, isAvenueLetter(street1) ? '(converted from avenue letter)' : '(used as-is)')
    console.log('  -', street2, '→', street2Name, isAvenueLetter(street2) ? '(converted from avenue letter)' : '(used as-is)')
    
    // COMPREHENSIVE STREET NAME ANALYSIS
    console.log('🔍 📊 ANALYZING ALL STREET NAMES IN GIS DATA:')
    const allStreetNames = new Set()
    const radialStreets = new Set()
    const avenueStreets = new Set()
    
    streetData.features.forEach((feature, index) => {
      const name = feature.properties?.name
      if (name) {
        allStreetNames.add(name)
        if (/^\d{1,2}:\d{2}/.test(name)) {
          radialStreets.add(name)
        } else {
          avenueStreets.add(name)
        }
      }
    })
    
    console.log('🔍 Total unique street names:', allStreetNames.size)
    console.log('🔍 Radial streets found:', Array.from(radialStreets).sort())
    console.log('🔍 Avenue streets found:', Array.from(avenueStreets).sort())
    
    // Check if our target streets exist
    console.log('🔍 🎯 TARGET STREET SEARCH:')
    const street1Matches = []
    const street2Matches = []
    
    allStreetNames.forEach(name => {
      if (name.includes('7:15') || name === '7:15') {
        street1Matches.push(name)
      }
      if (name.includes('E') || name.includes(street2Name)) {
        street2Matches.push(name)
      }
    })
    
    console.log('🔍 Streets containing "7:15":', street1Matches)
    console.log('🔍 Streets containing "E" or "' + street2Name + '":', street2Matches)
  }
  
  // Find features for both streets
  const features1 = []
  const features2 = []
  
  streetData.features.forEach(feature => {
    const name = feature.properties?.name
    if (!name) return
    
    // Normalize names for comparison
    const normalizedName = name.toUpperCase()
    const normalizedStreet1 = street1Name.toUpperCase()
    const normalizedStreet2 = street2Name.toUpperCase()
    
    // Enhanced matching: exact match OR flexible clock time matching
    const matchesStreet1 = normalizedName === normalizedStreet1 || 
                          (isClockTimeVariant(normalizedName, normalizedStreet1))
    const matchesStreet2 = normalizedName === normalizedStreet2 || 
                          (isClockTimeVariant(normalizedName, normalizedStreet2))
    
    if (matchesStreet1) {
      features1.push(feature)
      if (debug) console.log('🔍 ✅ Found match for street1:', name, normalizedName === normalizedStreet1 ? '(exact)' : '(variant)')
    } else if (matchesStreet2) {
      features2.push(feature)  
      if (debug) console.log('🔍 ✅ Found match for street2:', name, normalizedName === normalizedStreet2 ? '(exact)' : '(variant)')
    }
  })
  
  if (debug) {
    console.log('🔍 📈 MATCHING RESULTS:')
    console.log('  - Features found for', street1Name + ':', features1.length)
    console.log('  - Features found for', street2Name + ':', features2.length)
  }
  
  if (features1.length === 0 || features2.length === 0) {
    if (debug) {
      console.log('🔍 ❌ INTERSECTION SEARCH FAILED:')
      if (features1.length === 0) {
        console.log('  - No features found for street1:', street1Name, '(original:', street1 + ')')
        console.log('  - Suggestion: Check if street name format is different in GIS data')
      }
      if (features2.length === 0) {
        console.log('  - No features found for street2:', street2Name, '(original:', street2 + ')')
        console.log('  - Suggestion: Check avenue conversion or theme name mapping')
      }
      console.log('🔍 ===== END GIS INTERSECTION DEBUG =====')
    }
    return null
  }
  
  if (debug) {
    console.log('🔍 ✅ PROCEEDING TO INTERSECTION CALCULATION')
    console.log('🔍 Looking for intersection between', features1.length, 'segments of', street1Name, 'and', features2.length, 'segments of', street2Name)
  }
  
  // Find intersection points
  let closestIntersection = null
  let minDistance = Infinity
  let allIntersections = []
  
  features1.forEach((f1, f1Index) => {
    const coords1 = f1.geometry.coordinates
    
    features2.forEach((f2, f2Index) => {
      const coords2 = f2.geometry.coordinates
      
      // Check each line segment combination
      for (let i = 0; i < coords1.length - 1; i++) {
        for (let j = 0; j < coords2.length - 1; j++) {
          const intersection = lineSegmentIntersection(
            coords1[i], coords1[i + 1],
            coords2[j], coords2[j + 1]
          )
          
          if (intersection) {
            // Calculate distance from center to find the most likely intersection
            const dist = calculateDistance(
              BRC_CENTER,
              [intersection[1], intersection[0]]
            )
            
            const intersectionLatLon = [intersection[1], intersection[0]]
            allIntersections.push({coords: intersectionLatLon, distance: dist})
            debugLog('🔍 Found intersection at:', intersectionLatLon, 'Distance from center:', dist)
            
            if (dist < minDistance) {
              minDistance = dist
              closestIntersection = intersectionLatLon // Convert to [lat, lon]
            }
          }
        }
      }
    })
  })
  
  if (debug) {
    console.log('🔍 All intersections found:', allIntersections.length)
    allIntersections.forEach((int, i) => {
      console.log(`  ${i + 1}: [${int.coords[0].toFixed(6)}, ${int.coords[1].toFixed(6)}] - ${int.distance.toFixed(0)}ft from center`)
    })
  }
  
  // For radial & avenue intersections, we should validate the distance
  // The intersection should be approximately at the avenue's distance from center
  const isRadialAvenue = /^\d{1,2}:\d{2}$/.test(street1) && isAvenueLetter(street2)
  const isAvenueRadial = isAvenueLetter(street1) && /^\d{1,2}:\d{2}$/.test(street2)
  
  if (isRadialAvenue || isAvenueRadial) {
    const avenueLetter = isRadialAvenue ? street2 : street1
    const expectedDistance = getAvenueDistance(avenueLetter, getGISYear())
    
    if (debug) {
      console.log('🔍 🎯 AVENUE DISTANCE VALIDATION:')
      console.log('  - Avenue letter:', avenueLetter)
      console.log('  - Expected distance:', expectedDistance, 'feet')
    }
    
    if (expectedDistance) {
      // Find intersection closest to expected distance
      let bestIntersection = null
      let minDistanceError = Infinity
      
      allIntersections.forEach(int => {
        const distanceError = Math.abs(int.distance - expectedDistance)
        if (distanceError < minDistanceError) {
          minDistanceError = distanceError
          bestIntersection = int.coords
        }
      })
      
      if (bestIntersection && minDistanceError < 300) { // Allow 300ft tolerance
        if (debug) {
          console.log('🔍 ✅ Selected intersection at expected distance:', bestIntersection, 'Error:', minDistanceError, 'ft')
          console.log('🔍 ===== END GIS INTERSECTION DEBUG =====')
        }
        return bestIntersection
      } else if (bestIntersection) {
        if (debug) console.log('🔍 ❌ Best intersection found but outside 300ft tolerance:', bestIntersection, 'Error:', minDistanceError, 'ft')
      }
    }
  }
  
  if (debug) {
    if (closestIntersection) {
      console.log('🔍 ✅ Selected closest intersection:', closestIntersection)
    } else {
      console.log('🔍 ❌ No intersections found between street segments')
    }
    console.log('🔍 ===== END GIS INTERSECTION DEBUG =====')
  }
  
  return closestIntersection
}

/**
 * Calculate intersection of two line segments
 * @returns {array|null} [lon, lat] or null if no intersection
 */
function lineSegmentIntersection(p1, p2, p3, p4) {
  const x1 = p1[0], y1 = p1[1]
  const x2 = p2[0], y2 = p2[1]
  const x3 = p3[0], y3 = p3[1]
  const x4 = p4[0], y4 = p4[1]
  
  const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4)
  if (Math.abs(denom) < 1e-10) return null // Lines are parallel
  
  const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom
  const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denom
  
  if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
    const x = x1 + t * (x2 - x1)
    const y = y1 + t * (y2 - y1)
    return [x, y]
  }
  
  return null
}

/**
 * Convert a BRC address to lat/lon coordinates using smart address resolution
 * @param {string} address - e.g., "7:30 & E"
 * @returns {array|null} [latitude, longitude] or null if invalid
 */
export function brcAddressToLatLon(address) {
  // Use the new BRC Address Resolver for intelligent address handling
  try {
    // Use the resolver with the existing GIS lookup function  
    const result = resolveBRCAddress(address, findStreetIntersectionFromGIS)
    
    if (result.success) {
      // Only log in debug mode
      if (APP_DEBUG) {
        debugLog(`✅ BRC Address resolved via ${result.method}: ${address} → [${result.coordinates[0].toFixed(6)}, ${result.coordinates[1].toFixed(6)}]`)
      }
      return result.coordinates
    } else {
      if (APP_DEBUG) {
        debugLog(`❌ BRC Address resolution failed: ${address} - ${result.error}`)
      }
    }
  } catch (error) {
    if (APP_DEBUG) {
      debugLog(`⚠️ BRC Address resolver error: ${error.message}, falling back to legacy method`)
    }
  }
  
  // Legacy fallback for backward compatibility
  return brcAddressToLatLonLegacy(address)
}

/**
 * Legacy BRC address resolution (kept for fallback)
 * @param {string} address - e.g., "7:30 & E"  
 * @returns {array|null} [latitude, longitude] or null if invalid
 */
function brcAddressToLatLonLegacy(address) {
  const parsed = parseBRCAddress(address)
  if (!parsed) {
    return null
  }
  const { clock, avenue } = parsed
  
  
  // First try to find intersection using GIS data
  const gisIntersection = findStreetIntersectionFromGIS(clock, avenue)
  if (gisIntersection) {
    return gisIntersection
  }
  
  // Fall back to calculated method
  const clockAngle = BRC_CONFIG.clockAngles[clock]
  if (clockAngle === undefined) {
    return null
  }
  
  // Get the distance from center (in feet)
  const year = getGISYear()
  let distance = getAvenueDistance(avenue, year)
  
  // Fall back to hardcoded values if avenue mapping not available
  if (distance === null) {
    distance = BRC_CONFIG.avenueDistances[avenue]
  }
  
  if (distance === undefined || distance === null) {
    return null
  }
  
  // Calculate the actual bearing including city orientation
  const bearing = (clockAngle + BRC_CONFIG.cityBearing) % 360
  
  // Convert bearing to radians
  const bearingRad = bearing * Math.PI / 180
  
  // Calculate offset in feet
  const northOffset = distance * Math.cos(bearingRad)
  const eastOffset = distance * Math.sin(bearingRad)
  
  // Convert to degrees
  const latOffset = feetToDegreesLat(northOffset)
  const lonOffset = feetToDegreesLon(eastOffset, BRC_CONFIG.center[0])
  
  // Calculate final coordinates
  const lat = BRC_CONFIG.center[0] + latOffset
  const lon = BRC_CONFIG.center[1] + lonOffset
  
  return [lat, lon]
}

/**
 * Debug version of brcAddressToLatLon with enhanced GIS debugging
 * @param {string} address - e.g., "7:30 & E"
 * @returns {array|null} [latitude, longitude] or null if invalid
 */
export function brcAddressToLatLonDebug(address) {
  // Use the new BRC Address Resolver - keep this function for manual debugging
  // but don't auto-log unless explicitly debugging
  const result = resolveBRCAddress(address, findStreetIntersectionFromGIS)
  return result.success ? result.coordinates : null
}

/**
 * Convert lat/lon coordinates back to BRC address (for verification)
 * @param {Array} coordinates - [latitude, longitude]
 * @returns {string|null} BRC address or null if conversion fails
 */
export function latLonToBRCAddress(coordinates) {
  if (!coordinates || coordinates.length !== 2) {
    return null
  }
  
  const [lat, lon] = coordinates
  
  // Calculate distance and bearing from BRC center
  const centerLat = BRC_CONFIG.center[0]
  const centerLon = BRC_CONFIG.center[1]
  
  // Calculate distance in feet
  const distance = calculateDistance([centerLat, centerLon], [lat, lon])
  
  // Calculate bearing (angle from center)
  const deltaLat = lat - centerLat
  const deltaLon = lon - centerLon
  
  let bearing = Math.atan2(deltaLon, deltaLat) * 180 / Math.PI
  if (bearing < 0) bearing += 360
  
  // Adjust for city orientation
  let clockBearing = (bearing - BRC_CONFIG.cityBearing + 360) % 360
  
  // Find closest clock position
  let closestClock = null
  let minAngleDiff = Infinity
  
  Object.entries(BRC_CONFIG.clockAngles).forEach(([clockTime, angle]) => {
    const angleDiff = Math.min(
      Math.abs(clockBearing - angle),
      Math.abs(clockBearing - angle + 360),
      Math.abs(clockBearing - angle - 360)
    )
    if (angleDiff < minAngleDiff) {
      minAngleDiff = angleDiff
      closestClock = clockTime
    }
  })
  
  // Find closest avenue
  let closestAvenue = null
  let minDistDiff = Infinity
  
  Object.entries(BRC_CONFIG.avenueDistances).forEach(([avenueName, avenueDistance]) => {
    const distDiff = Math.abs(distance - avenueDistance)
    if (distDiff < minDistDiff) {
      minDistDiff = distDiff
      closestAvenue = avenueName
    }
  })
  
  const result = closestClock && closestAvenue ? `${closestClock} & ${closestAvenue}` : null
  return result
}

/**
 * Get coordinates for special locations
 */
export function getSpecialLocationCoords(name) {
  const season = getSeason(getGISYear())
  const specialLocations = {
    'CENTER CAMP': season.map.centerCamp || [40.78108859485657, -119.210735421],
    'THE MAN': season.map.center,
    'GOLDEN SPIKE': season.map.center,
    'TEMPLE': season.map.temple || [40.791815152314989, -119.19662192527863],
    'AIRPORT': [40.764261391285487, -119.205226911], // Airport from GIS data
    'DPOW': brcAddressToLatLon('5:30 & H'), // DPW location
    'MEDICAL': [40.780065841922166, -119.20676566604881], // Legacy medical location (same as Rampart)
    'RAMPART': [40.780065841922166, -119.20676566604881], // Rampart field hospital from GIS data
    'RANGER HQ': [40.783641284089448, -119.21150356651343], // Ranger HQ from GIS data
    // Note: ARCTICA removed - use specific locations (Ice Nine, Arctica Center Camp, Ice Cubed)
  }
  
  return specialLocations[name.toUpperCase()] || null
}

// Re-export shared utilities for backward compatibility
export { parseBRCAddress, calculateDistance } from './brcAddressUtils'

/**
 * Format distance for display
 */
export function formatDistance(feet) {
  if (feet < 1000) {
    return `${feet} ft`
  } else {
    const miles = (feet / 5280).toFixed(1)
    return `${miles} mi`
  }
}

/**
 * Calculate the exact rotation angle for city alignment
 * This aligns Black Rock City with gate at bottom, Man in center, Temple at top
 */
export function calculateCityAlignmentAngle() {
  // Based on geometric analysis of Black Rock City's actual orientation:
  // - The city's gate faces southwest (approximately 225°)
  // - To align gate at bottom of screen (180°), we need to rotate -45°
  // - This places: Gate→bottom, Man→center, Temple→top
  
  const rotationAngle = -45
  
  debugLog('🔥 BRC Alignment: -45° rotation aligns gate to bottom, temple to top')
  
  return rotationAngle
}

/**
 * Analyze Black Rock City's geometric properties
 * Returns interesting facts about BRC's layout and orientation
 */
export function analyzeCityGeometry(trashFenceData = null) {
  try {
    const year = getGISYear()
    const manCoords = BRC_CONFIG.center
    const templeDistance = getAvenueDistance('K', year) || BRC_CONFIG.avenueDistances.K
    const templeCoords = calculateCoordinatesFromManCenter(0, templeDistance)
    const templeBearing = calculateBearing(manCoords, templeCoords)
    
    // Calculate basic geometric facts
    const analysis = {
      success: true,
      rotationAngle: -45, // Empirically determined correct angle
      geometry: {
        manCoordinates: manCoords,
        templeCoordinates: templeCoords,
        templeBearing: Math.round(templeBearing * 10) / 10,
        manToTempleDistance: Math.round(templeDistance * 0.3048), // convert feet to meters
        cityRadius: Math.round((getAvenueDistance('L', year) || BRC_CONFIG.avenueDistances.L) * 0.3048), // L Avenue as outer radius
      },
      facts: {
        templeDirection: `Temple is ${bearingToCompass(templeBearing)} of The Man`,
        rotationExplanation: 'Rotating -45° aligns gate to bottom, temple to top of screen',
        cityShape: 'Partial circle (arc) opening toward default world',
        coordinateSystem: 'WGS84 (standard GPS coordinates)',
        cityDiameter: `${Math.round((getAvenueDistance('L', year) || BRC_CONFIG.avenueDistances.L) * 2 * 0.3048 / 1000 * 10) / 10} km`,
        streetLayout: 'Radial streets from 2:00 to 10:00, concentric avenues Esplanade to L',
        manLocation: 'Golden Spike at the center of the partial circle',
        gateOrientation: 'Southwest opening for participant entry/exit'
      }
    }
    
    // If trash fence data is provided, add more detailed analysis
    if (trashFenceData && trashFenceData.features && trashFenceData.features[0]) {
      const fenceCoords = trashFenceData.features[0].geometry.coordinates[0]
      
      // Find the gate opening (largest gap between consecutive points)
      let maxGap = 0
      let gateStart = null
      let gateEnd = null
      
      for (let i = 0; i < fenceCoords.length - 1; i++) {
        const p1 = fenceCoords[i]
        const p2 = fenceCoords[i + 1]
        const distance = calculateDistanceKm([p1[1], p1[0]], [p2[1], p2[0]])
        
        if (distance > maxGap) {
          maxGap = distance
          gateStart = [p1[1], p1[0]]
          gateEnd = [p2[1], p2[0]]
        }
      }
      
      if (gateStart && gateEnd) {
        const gateCenter = [(gateStart[0] + gateEnd[0]) / 2, (gateStart[1] + gateEnd[1]) / 2]
        const gateBearing = calculateBearing(manCoords, gateCenter)
        
        analysis.geometry.gateCenter = gateCenter
        analysis.geometry.gateBearing = Math.round(gateBearing * 10) / 10
        analysis.geometry.gateWidth = Math.round(calculateDistanceKm(gateStart, gateEnd) * 1000)
        analysis.facts.gateDirection = `Gate faces ${bearingToCompass(gateBearing)}`
        analysis.facts.mathematicalRotation = `${Math.round(180 - gateBearing)}° calculated from gate bearing`
      }
    }
    
    return analysis
    
  } catch (error) {
    return { success: false, error: error.message }
  }
}

/**
 * Calculate bearing between two points in degrees
 */
function calculateBearing(point1, point2) {
  const lat1 = point1[0] * Math.PI / 180
  const lat2 = point2[0] * Math.PI / 180
  const deltaLon = (point2[1] - point1[1]) * Math.PI / 180
  
  const y = Math.sin(deltaLon) * Math.cos(lat2)
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(deltaLon)
  
  const bearing = Math.atan2(y, x) * 180 / Math.PI
  return (bearing + 360) % 360
}

/**
 * Calculate distance between two points in kilometers
 */
function calculateDistanceKm(point1, point2) {
  const R = 6371 // Earth's radius in km
  const lat1 = point1[0] * Math.PI / 180
  const lat2 = point2[0] * Math.PI / 180
  const deltaLat = (point2[0] - point1[0]) * Math.PI / 180
  const deltaLon = (point2[1] - point1[1]) * Math.PI / 180
  
  const a = Math.sin(deltaLat/2) * Math.sin(deltaLat/2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon/2) * Math.sin(deltaLon/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  
  return R * c
}

/**
 * Convert bearing to compass direction
 */
function bearingToCompass(bearing) {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW']
  const index = Math.round(bearing / 22.5) % 16
  return directions[index]
}

/**
 * Calculate coordinates from The Man center at a given angle and distance
 * @param {number} angleDegrees - Angle in degrees (0 = north, 90 = east)
 * @param {number} distanceFeet - Distance in feet
 * @returns {array} [latitude, longitude]
 */
function calculateCoordinatesFromManCenter(angleDegrees, distanceFeet) {
  const [manLat, manLon] = BRC_CONFIG.center
  
  // Convert feet to degrees more accurately
  // At BRC latitude (~40.78°), 1 degree lat ≈ 364,000 feet, 1 degree lon ≈ 278,000 feet
  const metersPerFoot = 0.3048
  const distanceMeters = distanceFeet * metersPerFoot
  
  // Convert angle to radians (0° = north, 90° = east)
  const angleRad = angleDegrees * Math.PI / 180
  
  // Calculate deltas using proper spherical geometry
  const deltaLat = (distanceMeters / 111320) * Math.cos(angleRad) // North/South
  const deltaLon = (distanceMeters / (111320 * Math.cos(manLat * Math.PI / 180))) * Math.sin(angleRad) // East/West
  
  return [manLat + deltaLat, manLon + deltaLon]
}
