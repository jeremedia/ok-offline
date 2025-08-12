/**
 * BRC-Specific Geometry Utilities
 * 
 * Mathematical foundation for Black Rock City's unique polar coordinate system.
 * Handles clock positions, sector calculations, and BRC-specific optimizations.
 */

import { haversineDistance, calculateBearing, BRC_CENTER } from './geoUtils.js'

// BRC geometric constants
export const BRC_GEOMETRY = {
  // Center point coordinates (Golden Spike)
  CENTER: BRC_CENTER,
  
  // City layout parameters (in meters)
  INNER_PLAYA_RADIUS: 305,    // ~1000ft - inner circle around Man
  ESPLANADE_RADIUS: 762,      // ~2500ft - approximate Esplanade distance
  OUTER_CITY_RADIUS: 1219,    // ~4000ft - typical outer city boundary
  DEEP_PLAYA_RADIUS: 2438,    // ~8000ft - deep playa limit
  
  // Angular parameters  
  CITY_ANGULAR_SPAN: 150,     // City spans ~150 degrees (2:00 to 10:00)
  CITY_START_BEARING: 60,     // 2:00 position bearing
  CITY_END_BEARING: 330,      // 10:00 position bearing
  TEMPLE_BEARING: 0,          // 12:00 position (due north)
  
  // Street parameters
  RADIAL_STREETS: 33,         // Number of radial (clock) streets
  ARC_STREETS: 12,            // Number of arc (lettered) streets
  STREET_SPACING: 15,         // 15 minutes between radials
}

/**
 * Convert geographic coordinates to BRC clock system
 * @param {[number, number]} coords [longitude, latitude]
 * @returns {Object} BRC clock representation
 */
export function coordsToClockSystem(coords) {
  const [lon, lat] = coords
  const bearing = calculateBearing(BRC_CENTER, coords)
  const distance = haversineDistance(BRC_CENTER, coords)
  
  // Convert bearing to clock position
  const clockMinutes = bearingToClockMinutes(bearing)
  const hours = Math.floor(clockMinutes / 60) % 12 || 12
  const minutes = clockMinutes % 60
  
  // Determine radial street (rounded to nearest 15-minute interval)
  const radialMinutes = Math.round(clockMinutes / 15) * 15
  const radialHours = Math.floor(radialMinutes / 60) % 12 || 12
  const radialMins = radialMinutes % 60
  
  return {
    bearing,
    distance,
    clockHours: hours,
    clockMinutes: minutes,
    clockString: formatClockTime(hours, minutes),
    radialStreet: formatClockTime(radialHours, radialMins),
    distanceFromCenter: distance * 3.28084, // Convert to feet
    sector: Math.floor(clockMinutes / 60) // 0-11 sector
  }
}

/**
 * Convert BRC clock position back to geographic coordinates
 * @param {string} clockPos Clock position like "4:30"
 * @param {number} distance Distance from center in meters
 * @returns {[number, number]} [longitude, latitude]
 */
export function clockSystemToCoords(clockPos, distance) {
  const clockMinutes = parseClockPosition(clockPos)
  const bearing = clockMinutesToBearing(clockMinutes)
  
  // Calculate destination point from center
  return calculateDestinationPoint(BRC_CENTER, bearing, distance)
}

/**
 * Calculate optimal urban boundary for a given sector
 * Different sectors have different camp densities
 * @param {number} sector Sector number (0-11)
 * @returns {Object} Boundary information
 */
export function calculateUrbanBoundary(sector) {
  // Sector-specific density factors based on typical BRC layout
  const densityFactors = {
    0: 0.7,   // 12:00 - Temple area, less dense
    1: 0.8,   // 1:00 - Moderate density
    2: 0.95,  // 2:00 - High density
    3: 1.0,   // 3:00 - Peak density (OKNOTOK area)
    4: 0.9,   // 4:00 - High density
    5: 0.8,   // 5:00 - Moderate density  
    6: 1.1,   // 6:00 - Center Camp area, extended boundary
    7: 0.8,   // 7:00 - Moderate density
    8: 0.9,   // 8:00 - High density
    9: 0.95,  // 9:00 - High density
    10: 0.8,  // 10:00 - Moderate density
    11: 0.7   // 11:00 - Lower density
  }
  
  const baseBoundary = BRC_GEOMETRY.ESPLANADE_RADIUS
  const densityFactor = densityFactors[sector] || 0.8
  const sectorBoundary = baseBoundary * densityFactor
  
  return {
    sector,
    innerRadius: BRC_GEOMETRY.INNER_PLAYA_RADIUS,
    outerRadius: sectorBoundary,
    densityFactor,
    averageCampDepth: sectorBoundary - BRC_GEOMETRY.INNER_PLAYA_RADIUS
  }
}

/**
 * Find optimal exit points from urban area for hybrid routing
 * @param {[number, number]} startCoords Starting coordinates in urban area
 * @param {number} targetSector Target sector number
 * @returns {Array} Array of potential exit points with scores
 */
export function findOptimalExitPoints(startCoords, targetSector) {
  const startClock = coordsToClockSystem(startCoords)
  const startSector = startClock.sector
  const boundary = calculateUrbanBoundary(startSector)
  
  // Generate candidate exit points around the urban boundary
  const candidates = []
  const exitRadius = boundary.outerRadius
  
  // Consider multiple exit angles around the sector
  for (let angleOffset = -30; angleOffset <= 30; angleOffset += 10) {
    const exitBearing = startClock.bearing + angleOffset
    const exitCoords = calculateDestinationPoint(BRC_CENTER, exitBearing, exitRadius)
    
    // Calculate efficiency score for this exit point
    const score = calculateExitPointScore(startCoords, exitCoords, targetSector)
    
    candidates.push({
      coordinates: exitCoords,
      bearing: exitBearing,
      distance: haversineDistance(startCoords, exitCoords),
      score,
      angleOffset
    })
  }
  
  // Sort by score (higher is better)
  return candidates.sort((a, b) => b.score - a.score)
}

/**
 * Calculate efficiency score for an exit point
 * @param {[number, number]} startCoords Starting coordinates
 * @param {[number, number]} exitCoords Exit point coordinates  
 * @param {number} targetSector Target sector number
 * @returns {number} Efficiency score (0-1, higher is better)
 */
function calculateExitPointScore(startCoords, exitCoords, targetSector) {
  // Distance from start to exit (lower is better)
  const exitDistance = haversineDistance(startCoords, exitCoords)
  
  // Distance from exit to target sector center (lower is better)
  const targetBearing = (targetSector + 0.5) * 30 // Middle of target sector
  const targetCoords = calculateDestinationPoint(BRC_CENTER, targetBearing, BRC_GEOMETRY.ESPLANADE_RADIUS)
  const playaDistance = haversineDistance(exitCoords, targetCoords)
  
  // Weighted score - balance exit effort vs playa efficiency
  const exitCost = exitDistance / 500 // Normalize to 500m scale
  const playaCost = playaDistance / 2000 // Normalize to 2km scale
  
  return 1 / (1 + exitCost * 0.3 + playaCost * 0.7) // Favor shorter playa crossing
}

/**
 * Calculate sector angular difference (handles wraparound)
 * @param {number} sector1 First sector (0-11)
 * @param {number} sector2 Second sector (0-11) 
 * @returns {number} Angular difference in sectors (0-6)
 */
export function calculateSectorDifference(sector1, sector2) {
  const diff = Math.abs(sector1 - sector2)
  return Math.min(diff, 12 - diff) // Handle wraparound
}

/**
 * Check if coordinates are within BRC city boundaries
 * @param {[number, number]} coords [longitude, latitude]
 * @returns {Object} Boundary analysis
 */
export function analyzeBoundaryLocation(coords) {
  const clockData = coordsToClockSystem(coords)
  const distance = clockData.distanceFromCenter * 0.3048 // Convert feet to meters
  
  let zone = 'unknown'
  let allowStraightLine = false
  
  if (distance < BRC_GEOMETRY.INNER_PLAYA_RADIUS) {
    zone = 'inner_playa'
    allowStraightLine = true
  } else if (distance < BRC_GEOMETRY.ESPLANADE_RADIUS) {
    // Check if within city angular bounds
    const bearing = clockData.bearing
    if (isWithinCityBounds(bearing)) {
      zone = 'urban'
      allowStraightLine = false
    } else {
      zone = 'side_playa'  
      allowStraightLine = true
    }
  } else if (distance < BRC_GEOMETRY.OUTER_CITY_RADIUS) {
    zone = 'outer_playa'
    allowStraightLine = true
  } else {
    zone = 'deep_playa'
    allowStraightLine = true
  }
  
  return {
    zone,
    allowStraightLine,
    distance,
    clockData,
    sector: clockData.sector
  }
}

/**
 * Check if bearing is within city angular bounds (2:00 to 10:00)
 * @param {number} bearing Bearing in degrees
 * @returns {boolean} True if within city bounds
 */
function isWithinCityBounds(bearing) {
  // Normalize bearing to 0-360
  bearing = ((bearing % 360) + 360) % 360
  
  // BRC city spans from 2:00 (60°) to 10:00 (300°)
  return bearing >= BRC_GEOMETRY.CITY_START_BEARING && bearing <= BRC_GEOMETRY.CITY_END_BEARING
}

// Helper functions

function bearingToClockMinutes(bearing) {
  // Convert bearing to clock minutes (12:00 = 0 minutes)
  // BRC uses 12:00 as north, so 0° bearing = 12:00
  let clockMinutes = bearing * 2 // 2 minutes per degree
  if (clockMinutes < 0) clockMinutes += 720 // Handle negative bearings
  return Math.round(clockMinutes) % 720
}

function clockMinutesToBearing(clockMinutes) {
  return (clockMinutes / 2) % 360 // Convert back to degrees
}

function parseClockPosition(clockPos) {
  const [hours, minutes] = clockPos.split(':').map(Number)
  return ((hours % 12) * 60) + (minutes || 0)
}

function formatClockTime(hours, minutes) {
  const h = hours || 12
  const m = minutes.toString().padStart(2, '0')
  return `${h}:${m}`
}

function calculateDestinationPoint(origin, bearing, distance) {
  // Calculate destination point from origin at given bearing and distance
  const [originLon, originLat] = origin
  const R = 6371000 // Earth's radius in meters
  
  const lat1 = originLat * Math.PI / 180
  const lon1 = originLon * Math.PI / 180
  const brng = bearing * Math.PI / 180
  
  const lat2 = Math.asin(Math.sin(lat1) * Math.cos(distance / R) +
                        Math.cos(lat1) * Math.sin(distance / R) * Math.cos(brng))
  
  const lon2 = lon1 + Math.atan2(Math.sin(brng) * Math.sin(distance / R) * Math.cos(lat1),
                                Math.cos(distance / R) - Math.sin(lat1) * Math.sin(lat2))
  
  return [lon2 * 180 / Math.PI, lat2 * 180 / Math.PI]
}

/**
 * Get major landmarks for navigation context
 * @returns {Object} Landmark coordinates and information
 */
export function getBRCLandmarks() {
  return {
    man: {
      coordinates: BRC_CENTER,
      clockPosition: '6:00',
      description: 'The Man'
    },
    temple: {
      coordinates: calculateDestinationPoint(BRC_CENTER, BRC_GEOMETRY.TEMPLE_BEARING, 1100),
      clockPosition: '12:00', 
      description: 'Temple'
    },
    centerCamp: {
      coordinates: calculateDestinationPoint(BRC_CENTER, 180, 400), // South of Man
      clockPosition: '6:00',
      description: 'Center Camp'
    },
    // Add more landmarks as needed for cultural routing
  }
}

export default {
  coordsToClockSystem,
  clockSystemToCoords,
  calculateUrbanBoundary,
  findOptimalExitPoints,
  calculateSectorDifference,
  analyzeBoundaryLocation,
  getBRCLandmarks,
  BRC_GEOMETRY
}