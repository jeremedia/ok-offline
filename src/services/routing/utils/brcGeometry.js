/**
 * BRC-Specific Geometry Utilities
 * 
 * Mathematical foundation for Black Rock City's unique polar coordinate system.
 * Handles clock positions, sector calculations, and BRC-specific optimizations.
 */

import { haversineDistance, calculateBearing, BRC_CENTER } from './geoUtils.js'
import { brcAddressToLatLon } from '../../../utils/geocoding.js'

// BRC geometric constants
export const BRC_GEOMETRY = {
  // Center point coordinates (Golden Spike)
  CENTER: BRC_CENTER,
  
  // City layout parameters (in meters) - UPDATED to match zone classifier boundaries
  INNER_PLAYA_RADIUS: 305,    // ~1000ft - inner circle around Man
  ESPLANADE_RADIUS: 762,      // ~2500ft - approximate Esplanade distance  
  URBAN_BOUNDARY_RADIUS: 1768, // ~5800ft - updated to include all avenues A-L (matches zone classifier)
  OUTER_CITY_RADIUS: 1219,    // ~4000ft - typical outer city boundary (DEPRECATED - use URBAN_BOUNDARY_RADIUS)
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
  
  // CRITICAL FIX: Apply same 45° BRC city orientation offset as main zone classifier
  // BRC is oriented with 12:00 pointing 45° northeast, not true north
  const rawBearing = calculateBearing(BRC_CENTER, coords)
  const cityBearingOffset = 45 // BRC is oriented 45° from true north
  const bearing = (rawBearing - cityBearingOffset + 360) % 360
  
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
 * Get all street intersections for a given sector that can serve as exit/entry points
 * @param {number} sector Sector number (2-12)
 * @returns {Array} Array of intersection objects with coordinates and IDs
 */
function getStreetIntersectionsForSector(sector) {
  const intersections = []
  
  // Define the clock positions for this sector (hour and quarter-hour streets)
  const sectorClocks = []
  
  // Add hour streets for this sector
  if (sector <= 10) {
    sectorClocks.push(`${sector}:00`)
    sectorClocks.push(`${sector + 1}:00`)
  } else if (sector === 11) {
    sectorClocks.push('11:00')
    sectorClocks.push('12:00')
  } else if (sector === 12) {
    sectorClocks.push('12:00')
    sectorClocks.push('1:00')
  }
  
  // Add quarter-hour streets for this sector
  if (sector <= 10) {
    sectorClocks.push(`${sector}:15`)
    sectorClocks.push(`${sector}:30`)
    sectorClocks.push(`${sector}:45`)
  } else if (sector === 11) {
    sectorClocks.push('11:15')
    sectorClocks.push('11:30')
    sectorClocks.push('11:45')
  } else if (sector === 12) {
    sectorClocks.push('12:15')
    sectorClocks.push('12:30')
    sectorClocks.push('12:45')
  }
  
  // Define avenues from inner to outer (Esplanade is the primary urban boundary exit)
  const avenues = ['Esplanade', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L']
  
  // Generate intersections for each clock position and avenue
  for (const clock of sectorClocks) {
    for (const avenue of avenues) {
      try {
        const address = `${clock} & ${avenue}`
        const coordinates = brcAddressToLatLon(address)
        
        if (coordinates && coordinates.length === 2) {
          intersections.push({
            id: `${clock}&${avenue}`,
            coordinates: coordinates,
            clock: clock,
            avenue: avenue,
            address: address
          })
        }
      } catch (error) {
        // Skip invalid addresses silently
        console.debug(`Could not resolve intersection: ${clock} & ${avenue}`)
      }
    }
  }
  
  return intersections
}

/**
 * Find optimal exit points from urban area for hybrid routing
 * @param {[number, number]} startCoords Starting coordinates in urban area
 * @param {[number, number]} endCoords Ending coordinates in urban area
 * @param {number} targetSector Target sector number
 * @returns {Array} Array of potential exit points with scores
 */
export function findOptimalExitPoints(startCoords, endCoords, targetSector) {
  const startClock = coordsToClockSystem(startCoords)
  const startSector = startClock.sector
  const boundary = calculateUrbanBoundary(startSector)
  
  // 🎯 REVOLUTIONARY FIX: Use actual street intersections as exit points
  const candidates = []
  
  // Get all street intersections in the start sector that can serve as exit points
  const availableIntersections = getStreetIntersectionsForSector(startSector)
  
  // 🚪 CRITICAL ARCHITECTURAL FIX: Implement proper BRC exit point system
  // Black Rock City has THREE types of exits from urban grid to playa:
  
  const directDistance = haversineDistance(startCoords, endCoords) * 3.28084 // Convert to feet
  const targetBearing = calculateBearing(startCoords, endCoords)
  
  console.log(`🚪 BRC Exit Point Analysis for route: ${Math.round(directDistance)}ft`)
  console.log(`   Start sector: ${startSector}, Target bearing: ${targetBearing.toFixed(1)}°`)
  
  // 🎯 OPTION 1: Esplanade Exits (shortest street navigation to urban boundary)
  const esplanadeExits = availableIntersections.filter(intersection => 
    intersection.avenue === 'Esplanade'
  )
  
  // 🎯 OPTION 2: Left Boundary Exits (2:00 side - for Temple/left-side destinations)  
  const leftBoundaryExits = availableIntersections.filter(intersection => 
    intersection.clock === '2:00'
  )
  
  // 🎯 OPTION 3: Right Boundary Exits (10:00 side - for right-side destinations)
  const rightBoundaryExits = availableIntersections.filter(intersection => 
    intersection.clock === '10:00'
  )
  
  // 🧠 INTELLIGENT EXIT SELECTION: Choose exit type based on destination direction
  let candidateExits = esplanadeExits // Default: use Esplanade (shortest street navigation)
  let exitStrategy = 'Esplanade (direct radial exit)'
  
  // For Temple direction (bearings 315°-45°), consider left boundary exits
  if ((targetBearing >= 315 || targetBearing <= 45) && leftBoundaryExits.length > 0) {
    candidateExits = [...esplanadeExits, ...leftBoundaryExits]
    exitStrategy = 'Esplanade + Left Boundary (Temple direction optimization)'
  }
  
  // For right-side destinations (bearings 315°-45°), consider right boundary exits  
  if (targetBearing >= 315 && rightBoundaryExits.length > 0) {
    candidateExits = [...esplanadeExits, ...rightBoundaryExits]
    exitStrategy = 'Esplanade + Right Boundary (right-side optimization)'
  }
  
  console.log(`   Exit strategy: ${exitStrategy}`)
  console.log(`   Candidate exits: ${candidateExits.length} (Esplanade: ${esplanadeExits.length}, Left: ${leftBoundaryExits.length}, Right: ${rightBoundaryExits.length})`)
  
  // Use the intelligently selected candidate exits (proper boundary exits only)
  const exitIntersections = candidateExits
  
  // Score each intersection as an exit point
  for (const intersection of exitIntersections) {
    const score = calculateExitPointScore(startCoords, intersection.coordinates, targetSector)
    const bearing = calculateBearing(BRC_CENTER, intersection.coordinates)
    
    candidates.push({
      coordinates: intersection.coordinates,
      bearing: bearing,
      distance: haversineDistance(startCoords, intersection.coordinates),
      score,
      angleOffset: bearing - startClock.bearing,
      intersection: intersection.id // 🎯 Critical: Keep intersection ID for pathfinding
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
  // 🎯 FIXED SCORING: Properly prioritize Esplanade exits for minimal street navigation
  
  // Distance from start to exit (lower is better) - this is the PRIMARY factor
  const exitDistance = haversineDistance(startCoords, exitCoords)
  
  // 🚪 ESPLANADE BONUS: Heavily favor Esplanade exits as they're the proper urban boundary
  const isEsplanadeExit = calculateBearing(BRC_CENTER, exitCoords) // Check if this is roughly at Esplanade distance
  const distanceFromCenter = haversineDistance(BRC_CENTER, exitCoords)
  const isAtEsplanade = Math.abs(distanceFromCenter - BRC_GEOMETRY.ESPLANADE_RADIUS) < 100 // Within 100m of Esplanade
  
  let bonusMultiplier = 1.0
  if (isAtEsplanade) {
    bonusMultiplier = 3.0 // 3x bonus for Esplanade exits (proper urban boundary)
    console.log(`🎯 Esplanade exit bonus applied: ${exitCoords} (distance from center: ${distanceFromCenter.toFixed(0)}m vs Esplanade: ${BRC_GEOMETRY.ESPLANADE_RADIUS}m)`)
  }
  
  // Simple scoring: minimize street navigation distance with Esplanade bonus
  const baseScore = 1 / (1 + exitDistance / 300) // Normalize to 300m scale
  const finalScore = baseScore * bonusMultiplier
  
  return finalScore
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
  } else if (distance < BRC_GEOMETRY.URBAN_BOUNDARY_RADIUS) {
    // Check if within city angular bounds  
    const bearing = clockData.bearing
    if (isWithinCityBounds(bearing)) {
      zone = 'urban'
      allowStraightLine = false
    } else {
      zone = 'side_playa'  
      allowStraightLine = true
    }
  } else {
    zone = 'outer_playa'
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

export function calculateDestinationPoint(origin, bearing, distance) {
  // Calculate destination point from origin at given bearing and distance
  // FIXED: origin is [lat, lng] format to match BRC_CENTER and rest of codebase
  const [originLat, originLon] = origin
  const R = 6371000 // Earth's radius in meters
  
  const lat1 = originLat * Math.PI / 180
  const lon1 = originLon * Math.PI / 180
  const brng = bearing * Math.PI / 180
  
  const lat2 = Math.asin(Math.sin(lat1) * Math.cos(distance / R) +
                        Math.cos(lat1) * Math.sin(distance / R) * Math.cos(brng))
  
  const lon2 = lon1 + Math.atan2(Math.sin(brng) * Math.sin(distance / R) * Math.cos(lat1),
                                Math.cos(distance / R) - Math.sin(lat1) * Math.sin(lat2))
  
  // Return in [lat, lng] format to match rest of codebase
  return [lat2 * 180 / Math.PI, lon2 * 180 / Math.PI]
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
  calculateDestinationPoint,
  BRC_GEOMETRY
}