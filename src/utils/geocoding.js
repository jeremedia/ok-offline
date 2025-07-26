/**
 * Geocoding utilities for Black Rock City addresses
 * Converts BRC addresses (e.g., "7:30 & E") to lat/lon coordinates
 */

import { BRC_CENTER } from '../config'

// BRC dimensions and layout constants
const BRC_CONFIG = {
  // Golden Spike (Man) location
  center: BRC_CENTER, // [40.786958, -119.202994]
  
  // Distance from center to each avenue in feet
  avenueDistances: {
    'Esplanade': 2500,
    'A': 2940,
    'B': 3180,
    'C': 3420,
    'D': 3660,
    'E': 3900,
    'F': 4140,
    'G': 4380,
    'H': 4620,
    'I': 4860,
    'J': 5100,
    'K': 5340,
    'L': 5580
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
 * Parse a BRC address string into components
 * @param {string} address - e.g., "7:30 & E", "Esplanade & 3:00"
 * @returns {object} { clock: '7:30', avenue: 'E' }
 */
export function parseBRCAddress(address) {
  if (!address || typeof address !== 'string') return null
  
  // Normalize the address
  const normalized = address.trim().toUpperCase()
  
  // Match patterns like "7:30 & E" or "E & 7:30" or "Esplanade & 3:00"
  const patterns = [
    /(\d{1,2}:\d{2})\s*&\s*([A-L]|ESPLANADE)/i,
    /([A-L]|ESPLANADE)\s*&\s*(\d{1,2}:\d{2})/i
  ]
  
  for (const pattern of patterns) {
    const match = normalized.match(pattern)
    if (match) {
      // Determine which capture group has the clock time
      const isClockFirst = /^\d/.test(match[1])
      return {
        clock: isClockFirst ? match[1] : match[2],
        avenue: isClockFirst ? match[2] : match[1]
      }
    }
  }
  
  return null
}

/**
 * Convert a BRC address to lat/lon coordinates
 * @param {string} address - e.g., "7:30 & E"
 * @returns {array|null} [latitude, longitude] or null if invalid
 */
export function brcAddressToLatLon(address) {
  const parsed = parseBRCAddress(address)
  if (!parsed) return null
  
  const { clock, avenue } = parsed
  
  // Get the angle from center (in degrees from north)
  const clockAngle = BRC_CONFIG.clockAngles[clock]
  if (clockAngle === undefined) return null
  
  // Get the distance from center (in feet)
  const distance = BRC_CONFIG.avenueDistances[avenue]
  if (distance === undefined) return null
  
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
 * Get coordinates for special locations
 */
export function getSpecialLocationCoords(name) {
  const specialLocations = {
    'CENTER CAMP': brcAddressToLatLon('6:00 & D'),
    'THE MAN': BRC_CONFIG.center,
    'GOLDEN SPIKE': BRC_CONFIG.center,
    'TEMPLE': brcAddressToLatLon('12:00 & K'), // Temple location varies by year
    'AIRPORT': [40.804, -119.217], // Approximate airport location
    'DPOW': brcAddressToLatLon('5:30 & H'), // DPW location
    'MEDICAL': brcAddressToLatLon('5:30 & ESPLANADE'), // Medical station
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