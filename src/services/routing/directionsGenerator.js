/**
 * BRC Turn-by-Turn Directions Generator
 * 
 * Generates human-readable navigation instructions for Black Rock City routes.
 * Includes BRC-specific context, landmarks, and orientation guidance.
 */

import { 
  calculateBearing, 
  distanceFromCenter, 
  getClockAddress, 
  getClockSector,
  getCardinalDirection,
  BRC_CENTER 
} from './utils/geoUtils.js'

export class BRCDirectionsGenerator {
  constructor() {
    // BRC-specific landmarks and reference points
    this.landmarks = {
      center: BRC_CENTER,
      centerCampRadius: 500,  // meters
      esplanadeRadius: 2400,  // approximate Esplanade distance
      templeRadius: 1800,     // approximate Temple distance
      
      // Notable locations by clock position
      clockLandmarks: {
        '12:00': 'Temple area',
        '6:00': 'Center Camp area',
        '3:00': 'eastern city',
        '9:00': 'western city'
      }
    }
  }

  /**
   * Generate complete turn-by-turn directions from route
   * @param {Object} route Route object from pathfinder
   * @param {string} travelMode 'walking' or 'biking'
   * @param {Object} options Direction generation options
   * @returns {Object} Complete directions with steps and overview
   */
  generateDirections(route, travelMode = 'walking', options = {}) {
    if (!route || !route.segments) {
      return null
    }

    console.log('📋 Generating turn-by-turn directions...')

    const steps = []
    let cumulativeDistance = 0
    let cumulativeTime = 0

    // Generate step for each segment
    for (let i = 0; i < route.segments.length; i++) {
      const segment = route.segments[i]
      const isFirst = i === 0
      const isLast = i === route.segments.length - 1
      const nextSegment = isLast ? null : route.segments[i + 1]
      
      const step = this._generateStepInstruction(
        segment, 
        nextSegment, 
        isFirst, 
        isLast, 
        travelMode,
        cumulativeDistance,
        cumulativeTime
      )
      
      if (step) {
        steps.push(step)
        cumulativeDistance += segment.distance * 3.28084 // Convert to feet
        cumulativeTime += segment.duration
      }
    }

    // Generate overview
    const overview = this._generateRouteOverview(route, steps, travelMode)

    return {
      steps,
      overview,
      summary: {
        totalSteps: steps.length,
        totalDistance: Math.round(cumulativeDistance),
        totalTime: Math.round(cumulativeTime / 60), // Convert to minutes
        estimatedDuration: this._formatDuration(cumulativeTime),
        routeType: route.summary?.routeType || 'Street navigation'
      }
    }
  }

  /**
   * Generate instruction for a single route segment
   */
  _generateStepInstruction(segment, nextSegment, isFirst, isLast, travelMode, cumulativeDistance, cumulativeTime) {
    const distance = Math.round(segment.distance * 3.28084) // Convert to feet
    const duration = Math.round(segment.duration / 60) // Convert to minutes
    
    let instruction = ''
    let maneuver = 'continue'
    let streetName = segment.streetName
    
    // Determine instruction based on segment type
    switch (segment.type) {
      case 'approach_walking':
        instruction = this._generateApproachInstruction(segment)
        maneuver = 'depart'
        break
        
      case 'final_walking':
        instruction = this._generateFinalInstruction(segment)
        maneuver = 'arrive'
        break
        
      case 'street_following':
        instruction = this._generateStreetInstruction(segment, nextSegment, isFirst, isLast)
        maneuver = this._determineManeuver(segment, nextSegment)
        break
        
      case 'same_intersection':
        instruction = 'Your destination is at the same intersection'
        maneuver = 'arrive'
        break
        
      default:
        instruction = segment.instruction || 'Continue on route'
        break
    }

    // Add BRC-specific context
    const context = this._addBRCContext(segment, nextSegment)
    if (context) {
      instruction += ` ${context}`
    }

    // Add distance/time information
    let distanceText = ''
    if (distance > 0) {
      distanceText = distance < 1000 ? `${distance}ft` : `${(distance / 5280).toFixed(1)}mi`
    }

    return {
      instruction,
      maneuver,
      distance: distance,
      distanceText,
      duration: duration,
      durationText: duration > 0 ? `${duration} min` : 'Less than 1 min',
      streetName,
      streetType: segment.streetType,
      coordinates: segment.coordinates,
      cumulativeDistance: Math.round(cumulativeDistance + distance),
      cumulativeTime: Math.round((cumulativeTime + segment.duration) / 60),
      
      // BRC-specific data
      fromAddress: segment.fromAddress,
      toAddress: segment.toAddress,
      context: context
    }
  }

  /**
   * Generate approach instruction (walking to street network)
   */
  _generateApproachInstruction(segment) {
    const startCoords = segment.coordinates[0]
    const endCoords = segment.coordinates[segment.coordinates.length - 1]
    
    const direction = this._getRelativeDirection(startCoords, endCoords)
    const streetContext = this._getNearestStreetContext(endCoords)
    
    return `Head ${direction}${streetContext ? ` toward ${streetContext}` : ''}`
  }

  /**
   * Generate final walking instruction
   */
  _generateFinalInstruction(segment) {
    const distance = Math.round(segment.distance * 3.28084)
    const direction = this._getRelativeDirection(
      segment.coordinates[0], 
      segment.coordinates[segment.coordinates.length - 1]
    )
    
    if (distance < 50) {
      return 'You have arrived at your destination'
    }
    
    return `Head ${direction} to your destination`
  }

  /**
   * Generate street following instruction
   */
  _generateStreetInstruction(segment, nextSegment, isFirst, isLast) {
    const streetName = segment.streetName || 'street'
    const streetType = segment.streetType
    
    if (isFirst) {
      const direction = this._getStreetDirection(segment)
      return `Head ${direction} on ${streetName}`
    }
    
    if (isLast) {
      return `Continue on ${streetName} to destination`
    }
    
    // Middle segment - determine if it's a turn or continuation
    if (nextSegment && nextSegment.streetName !== streetName) {
      const turnDirection = this._calculateTurnDirection(segment, nextSegment)
      return `${turnDirection} onto ${nextSegment.streetName}`
    }
    
    return `Continue on ${streetName}`
  }

  /**
   * Determine maneuver type for step
   */
  _determineManeuver(segment, nextSegment) {
    if (!nextSegment) return 'arrive'
    
    if (nextSegment.streetName === segment.streetName) {
      return 'continue'
    }
    
    // Determine turn direction
    const turnAngle = this._calculateTurnAngle(segment, nextSegment)
    
    if (Math.abs(turnAngle) < 30) return 'continue'
    if (turnAngle > 30 && turnAngle < 150) return 'turn-right'
    if (turnAngle < -30 && turnAngle > -150) return 'turn-left'
    if (turnAngle > 150 || turnAngle < -150) return 'uturn'
    
    return 'turn-slight-right' // Default
  }

  /**
   * Calculate turn direction between segments
   */
  _calculateTurnDirection(currentSegment, nextSegment) {
    const turnAngle = this._calculateTurnAngle(currentSegment, nextSegment)
    
    if (Math.abs(turnAngle) < 30) return 'Continue'
    if (turnAngle > 150 || turnAngle < -150) return 'Make a U-turn'
    if (turnAngle > 45) return 'Turn right'
    if (turnAngle > 15) return 'Turn slightly right'
    if (turnAngle < -45) return 'Turn left'
    if (turnAngle < -15) return 'Turn slightly left'
    
    return 'Continue'
  }

  /**
   * Calculate turn angle between two segments
   */
  _calculateTurnAngle(currentSegment, nextSegment) {
    // Get bearings of both segments
    const currentCoords = currentSegment.coordinates
    const nextCoords = nextSegment.coordinates
    
    const currentBearing = calculateBearing(
      currentCoords[currentCoords.length - 2] || currentCoords[0],
      currentCoords[currentCoords.length - 1]
    )
    
    const nextBearing = calculateBearing(
      nextCoords[0],
      nextCoords[1] || nextCoords[0]
    )
    
    // Calculate relative turn angle
    let turnAngle = nextBearing - currentBearing
    
    // Normalize to [-180, 180]
    while (turnAngle > 180) turnAngle -= 360
    while (turnAngle <= -180) turnAngle += 360
    
    return turnAngle
  }

  /**
   * Add BRC-specific context to instructions
   */
  _addBRCContext(segment, nextSegment) {
    const contexts = []
    
    // Street type context
    if (segment.streetType === 'radial') {
      const direction = this._getRadialDirection(segment)
      contexts.push(direction)
    } else if (segment.streetName === 'Esplanade') {
      contexts.push('along the perimeter')
    }
    
    // Clock position context
    const clockContext = this._getClockContext(segment)
    if (clockContext) {
      contexts.push(clockContext)
    }
    
    // Landmark context
    const landmarkContext = this._getLandmarkContext(segment)
    if (landmarkContext) {
      contexts.push(landmarkContext)
    }
    
    return contexts.length > 0 ? `(${contexts.join(', ')})` : ''
  }

  /**
   * Get direction for radial streets (toward/away from center)
   */
  _getRadialDirection(segment) {
    const startCoords = segment.coordinates[0]
    const endCoords = segment.coordinates[segment.coordinates.length - 1]
    
    const startDistance = distanceFromCenter(startCoords)
    const endDistance = distanceFromCenter(endCoords)
    
    if (Math.abs(startDistance - endDistance) < 50) {
      return null // Not really moving toward/away from center
    }
    
    return endDistance < startDistance ? 'toward center' : 'toward perimeter'
  }

  /**
   * Get clock position context
   */
  _getClockContext(segment) {
    if (!segment.coordinates || segment.coordinates.length === 0) return null
    
    const midCoords = segment.coordinates[Math.floor(segment.coordinates.length / 2)]
    const clockAddress = getClockAddress(midCoords)
    const clockSector = getClockSector(midCoords)
    
    // Special clock positions
    const specialSectors = {
      0: 'Temple area',    // 12:00
      6: 'Center Camp area', // 6:00
      3: 'eastern city',   // 3:00
      9: 'western city'    // 9:00
    }
    
    if (specialSectors[clockSector]) {
      return `near ${specialSectors[clockSector]}`
    }
    
    return `${clockAddress} area`
  }

  /**
   * Get landmark context based on location
   */
  _getLandmarkContext(segment) {
    const contexts = []
    
    if (segment.coordinates && segment.coordinates.length > 0) {
      const avgCoords = this._getAverageCoordinate(segment.coordinates)
      const centerDistance = distanceFromCenter(avgCoords)
      
      if (centerDistance < this.landmarks.centerCampRadius) {
        contexts.push('in Center Camp area')
      } else if (centerDistance > this.landmarks.esplanadeRadius) {
        contexts.push('beyond the city')
      }
    }
    
    return contexts.length > 0 ? contexts[0] : null
  }

  /**
   * Generate route overview
   */
  _generateRouteOverview(route, steps, travelMode) {
    const totalDistance = Math.round(route.distance)
    const totalDuration = Math.round(route.duration / 60)
    
    const streetsSummary = route.summary?.streets || []
    const majorStreets = streetsSummary.slice(0, 3) // First 3 streets
    
    let overview = `${travelMode === 'biking' ? '🚴' : '🚶'} ${this._formatDistance(totalDistance)} • ${totalDuration} min`
    
    if (majorStreets.length > 0) {
      overview += ` via ${majorStreets.join(', ')}`
    }
    
    // Add route characteristics
    const characteristics = []
    if (route.summary?.intersections > 5) {
      characteristics.push('multiple turns')
    }
    if (streetsSummary.some(street => /^\d+:\d+$/.test(street))) {
      characteristics.push('radial streets')
    }
    if (streetsSummary.some(street => !/^\d+:\d+$/.test(street))) {
      characteristics.push('arc streets')
    }
    
    if (characteristics.length > 0) {
      overview += ` • ${characteristics.join(' and ')}`
    }
    
    return overview
  }

  /**
   * Get relative direction between two points
   */
  _getRelativeDirection(fromCoords, toCoords) {
    const bearing = calculateBearing(fromCoords, toCoords)
    return getCardinalDirection(bearing)
  }

  /**
   * Get street direction context
   */
  _getStreetDirection(segment) {
    const startCoords = segment.coordinates[0]
    const endCoords = segment.coordinates[segment.coordinates.length - 1]
    return this._getRelativeDirection(startCoords, endCoords)
  }

  /**
   * Get nearest street context for location
   */
  _getNearestStreetContext(coords) {
    const clockAddress = getClockAddress(coords)
    const centerDistance = distanceFromCenter(coords)
    
    if (centerDistance < 500) {
      return 'center area'
    } else if (centerDistance > 2000) {
      return 'outer city'
    }
    
    return `${clockAddress} area`
  }

  /**
   * Get average coordinate from array
   */
  _getAverageCoordinate(coordinates) {
    const avgLon = coordinates.reduce((sum, coord) => sum + coord[0], 0) / coordinates.length
    const avgLat = coordinates.reduce((sum, coord) => sum + coord[1], 0) / coordinates.length
    return [avgLon, avgLat]
  }

  /**
   * Format distance for display
   */
  _formatDistance(feet) {
    if (feet < 1000) {
      return `${feet}ft`
    }
    return `${(feet / 5280).toFixed(1)}mi`
  }

  /**
   * Format duration for display
   */
  _formatDuration(seconds) {
    const minutes = Math.round(seconds / 60)
    if (minutes < 60) {
      return `${minutes} min`
    }
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return `${hours}h${remainingMinutes > 0 ? ` ${remainingMinutes}m` : ''}`
  }

  /**
   * Get generator status for debugging
   */
  getStatus() {
    return {
      landmarks: Object.keys(this.landmarks).length,
      clockLandmarks: Object.keys(this.landmarks.clockLandmarks).length,
      features: [
        'Turn-by-turn directions',
        'BRC street names and addresses',
        'Clock position context',
        'Landmark references',
        'Distance and time estimates'
      ]
    }
  }
}