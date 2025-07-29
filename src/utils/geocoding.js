/**
 * Geocoding utilities for Black Rock City addresses
 * Converts BRC addresses (e.g., "7:30 & E") to lat/lon coordinates
 */

import { BRC_CENTER, APP_DEBUG } from '../config'
import { getStreetLines, getGISYear } from '../services/gisData'
import { getAvenueNameFromLetter, getAvenueLetterFromName, getAvenueDistance } from './avenueMapping'

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
 * Parse a BRC address string into components
 * @param {string} address - e.g., "7:30 & E", "Esplanade & 3:00", "3:30 & Atwood"
 * @returns {object} { clock: '7:30', avenue: 'E' }
 */
export function parseBRCAddress(address) {
  if (!address || typeof address !== 'string') return null
  
  // Split by common separators
  const parts = address.split(/\s*[&,]\s*/).map(p => p.trim())
  
  if (parts.length !== 2) return null
  
  // Identify which part is clock and which is avenue
  let clock = null
  let avenue = null
  
  for (const part of parts) {
    if (/^\d{1,2}:\d{2}$/.test(part)) {
      clock = part
    } else {
      // Could be avenue letter, theme name, or "Esplanade"
      avenue = part
    }
  }
  
  if (!clock || !avenue) return null
  
  return { clock, avenue }
}

/**
 * Find the intersection of two streets using GIS data
 * @param {string} street1 - First street name (e.g., "7:30")
 * @param {string} street2 - Second street name (e.g., "E")
 * @returns {array|null} [latitude, longitude] or null if not found
 */
function findStreetIntersectionFromGIS(street1, street2) {
  debugLog('🔍 Looking for GIS intersection:', street1, '&', street2)
  const year = getGISYear()
  const streetData = getStreetLines(year)
  if (!streetData || !streetData.features) {
    debugLog('🔍 No street data available for year:', year)
    return null
  }
  
  // Convert avenue letters to theme names for the current year
  const street1Name = isAvenueLetter(street1) ? getAvenueNameFromLetter(street1, year) : street1
  const street2Name = isAvenueLetter(street2) ? getAvenueNameFromLetter(street2, year) : street2
  
  debugLog('🔍 Converted names:', street1, '->', street1Name, ',', street2, '->', street2Name)
  
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
    
    if (normalizedName === normalizedStreet1) {
      features1.push(feature)
    } else if (normalizedName === normalizedStreet2) {
      features2.push(feature)
    }
  })
  
  debugLog('🔍 Found features:', features1.length, 'for', street1Name, ',', features2.length, 'for', street2Name)
  
  if (features1.length === 0 || features2.length === 0) {
    debugLog(`Street intersection not found: ${street1Name} (${street1}) & ${street2Name} (${street2})`)
    return null
  }
  
  debugLog('🔍 Looking for intersection between', features1.length, 'segments of', street1Name, 'and', features2.length, 'segments of', street2Name)
  
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
  
  debugLog('🔍 All intersections found:', allIntersections.length)
  allIntersections.forEach((int, i) => {
    debugLog(`  ${i}: ${int.coords} - ${int.distance}ft from center`)
  })
  
  // For radial & avenue intersections, we should validate the distance
  // The intersection should be approximately at the avenue's distance from center
  const isRadialAvenue = /^\d{1,2}:\d{2}$/.test(street1) && isAvenueLetter(street2)
  const isAvenueRadial = isAvenueLetter(street1) && /^\d{1,2}:\d{2}$/.test(street2)
  
  if (isRadialAvenue || isAvenueRadial) {
    const avenueLetter = isRadialAvenue ? street2 : street1
    const expectedDistance = getAvenueDistance(avenueLetter, getGISYear())
    
    if (expectedDistance) {
      debugLog('🔍 Looking for intersection at expected distance:', expectedDistance, 'feet for avenue', avenueLetter)
      
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
        debugLog('🔍 Selected intersection at expected distance:', bestIntersection, 'Error:', minDistanceError, 'ft')
        return bestIntersection
      } else if (bestIntersection) {
        debugLog('🔍 Best intersection found but outside tolerance:', bestIntersection, 'Error:', minDistanceError, 'ft')
      }
    }
  }
  
  debugLog('🔍 Selected closest intersection:', closestIntersection)
  
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
 * Convert a BRC address to lat/lon coordinates
 * @param {string} address - e.g., "7:30 & E"
 * @returns {array|null} [latitude, longitude] or null if invalid
 */
export function brcAddressToLatLon(address) {
  debugLog('🎯 brcAddressToLatLon called with:', address)
  
  const parsed = parseBRCAddress(address)
  if (!parsed) {
    debugLog('🎯 Failed to parse address')
    return null
  }
  
  debugLog('🎯 Parsed address:', parsed)
  const { clock, avenue } = parsed
  
  // First try to find intersection using GIS data
  const gisIntersection = findStreetIntersectionFromGIS(clock, avenue)
  if (gisIntersection) {
    debugLog('🎯 Found GIS intersection:', gisIntersection)
    return gisIntersection
  }
  
  debugLog('🎯 No GIS intersection found, falling back to calculation')
  
  // Fall back to calculated method
  // Get the angle from center (in degrees from north)
  const clockAngle = BRC_CONFIG.clockAngles[clock]
  if (clockAngle === undefined) {
    debugLog('🎯 Invalid clock angle for:', clock)
    return null
  }
  
  // Get the distance from center (in feet)
  const year = getGISYear()
  debugLog('🎯 Using year:', year)
  let distance = getAvenueDistance(avenue, year)
  debugLog('🎯 Avenue distance from mapping:', distance, 'for avenue:', avenue)
  
  // Fall back to hardcoded values if avenue mapping not available
  if (distance === null) {
    distance = BRC_CONFIG.avenueDistances[avenue]
    debugLog('🎯 Falling back to hardcoded distance:', distance)
  }
  
  if (distance === undefined || distance === null) {
    debugLog('🎯 No distance found for avenue:', avenue)
    return null
  }
  
  // Calculate the actual bearing including city orientation
  const bearing = (clockAngle + BRC_CONFIG.cityBearing) % 360
  debugLog('🎯 Clock angle:', clockAngle, 'City bearing:', BRC_CONFIG.cityBearing, 'Final bearing:', bearing)
  
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
  
  debugLog('🎯 Final coordinates:', [lat, lon])
  
  return [lat, lon]
}

/**
 * Get coordinates for special locations
 */
export function getSpecialLocationCoords(name) {
  const specialLocations = {
    'CENTER CAMP': brcAddressToLatLon('6:00 & D'),
    'THE MAN': BRC_CONFIG.center,
    'GOLDEN SPIKE': BRC_CONFIG.center,
    'TEMPLE': [40.791815152314989, -119.19662192527863], // Temple location from 2025 GIS data
    'AIRPORT': [40.764261391285487, -119.205226911], // Airport from GIS data
    'DPOW': brcAddressToLatLon('5:30 & H'), // DPW location
    'MEDICAL': brcAddressToLatLon('5:30 & ESPLANADE'), // Legacy medical location
    'RAMPART': [40.780065841922166, -119.20676566604881], // Rampart field hospital from GIS data
    'RANGER HQ': brcAddressToLatLon('5:45 & ESPLANADE'), // Ranger HQ
    'ARCTICA': brcAddressToLatLon('3:00 & C'), // Ice sales
  }
  
  return specialLocations[name.toUpperCase()] || null
}

/**
 * Calculate distance between two lat/lon points (in feet)
 */
export function calculateDistance(coord1, coord2) {
  const [lat1, lon1] = coord1
  const [lat2, lon2] = coord2
  
  // Haversine formula
  const R = 20925524.9 // Earth radius in feet
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2)
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  const distance = R * c
  
  return Math.round(distance)
}

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