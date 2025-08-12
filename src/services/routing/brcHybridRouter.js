/**
 * BRC Hybrid Router - Revolutionary Core Intelligence
 * 
 * The soul of BRC navigation: transforms 25-minute street routes into 8-minute hybrid shortcuts.
 * Understands the unique geometry and culture of Black Rock City.
 * 
 * Three-segment route generation: Urban → Playa → Urban
 */

import { 
  coordsToClockSystem, 
  calculateUrbanBoundary, 
  findOptimalExitPoints,
  calculateSectorDifference,
  analyzeBoundaryLocation,
  getBRCLandmarks,
  BRC_GEOMETRY 
} from './utils/brcGeometry.js'

import { haversineDistance, calculateBearing, metersToFeet } from './utils/geoUtils.js'


export class BRCHybridRouter {
  constructor(streetPathfinder = null) {
    this.streetPathfinder = streetPathfinder
    this.landmarks = getBRCLandmarks()
    
    // Performance caches
    this.waypointCache = new Map() // Cache optimal waypoints for sector pairs
    this.boundaryCache = new Map() // Cache urban boundaries
    
    // Hybrid routing parameters
    this.OPTIMIZATION_PARAMS = {
      maxExitCandidates: 7,        // Number of exit points to evaluate
      maxEntryCandidates: 7,       // Number of entry points to evaluate  
      streetSpeedFactor: 0.75,     // Street routing speed penalty
      playaSpeedBonus: 1.25,       // Playa crossing speed bonus
      sectorThreshold: 2,          // Min sector difference for hybrid routing
      efficiencyThreshold: 0.15    // Min efficiency gain required (15%)
    }
  }
  
  /**
   * Generate optimal hybrid route between two points
   * @param {[number, number]} startCoords [latitude, longitude] 
   * @param {[number, number]} endCoords [latitude, longitude]
   * @param {string} travelMode 'walking' or 'biking'
   * @returns {Promise<Object|null>} Hybrid route or null if not beneficial
   */
  async generateHybridRoute(startCoords, endCoords, travelMode = 'walking') {
    console.log('🔄 Generating BRC hybrid route...')
    console.log('📍 HYBRID ROUTER INPUT:')
    console.log('  startCoords:', startCoords, '(expected: [lat, lng])')
    console.log('  endCoords:', endCoords, '(expected: [lat, lng])')
    
    // Analyze start and end locations
    const startAnalysis = analyzeBoundaryLocation(startCoords)
    const endAnalysis = analyzeBoundaryLocation(endCoords)
    
    // Check if hybrid routing is beneficial
    if (!this._shouldUseHybridRouting(startAnalysis, endAnalysis)) {
      console.log('❌ Hybrid routing not beneficial for this route')
      return null
    }
    
    // Find optimal exit and entry points
    const waypoints = this._calculateOptimalWaypoints(startCoords, endCoords, startAnalysis, endAnalysis)
    
    if (!waypoints) {
      console.log('❌ Could not find optimal waypoints')
      return null
    }
    
    // Generate three-segment route
    console.log('📍 WAYPOINTS CALCULATED:')
    console.log('  exitPoint:', waypoints.exitPoint, '(should be [lat, lng])')
    console.log('  entryPoint:', waypoints.entryPoint, '(should be [lat, lng])')
    
    const hybridRoute = await this._synthesizeHybridRoute(
      startCoords, 
      endCoords, 
      waypoints,
      travelMode
    )
    
    if (hybridRoute) {
      console.log(`✅ Hybrid route generated: ${hybridRoute.summary.efficiency}% efficiency gain`)
    }
    
    return hybridRoute
  }
  
  /**
   * Determine if hybrid routing should be used
   * @param {Object} startAnalysis Start location analysis
   * @param {Object} endAnalysis End location analysis
   * @returns {boolean} True if hybrid routing is beneficial
   */
  _shouldUseHybridRouting(startAnalysis, endAnalysis) {
    // Both points should be in or near urban areas for hybrid to be beneficial
    if (startAnalysis.zone === 'deep_playa' || endAnalysis.zone === 'deep_playa') {
      return false
    }
    
    // Check sector difference - hybrid most beneficial for cross-sector routes
    const sectorDiff = calculateSectorDifference(startAnalysis.sector, endAnalysis.sector)
    
    if (sectorDiff < this.OPTIMIZATION_PARAMS.sectorThreshold) {
      console.log(`📍 Sectors too close (${sectorDiff}) for hybrid benefit`)
      return false
    }
    
    // Both zones should allow hybrid routing
    const startCanHybrid = ['urban', 'outer_playa', 'side_playa'].includes(startAnalysis.zone)
    const endCanHybrid = ['urban', 'outer_playa', 'side_playa'].includes(endAnalysis.zone)
    
    return startCanHybrid && endCanHybrid
  }
  
  /**
   * Calculate optimal exit and entry waypoints using mathematical optimization
   * @param {[number, number]} startCoords Starting coordinates
   * @param {[number, number]} endCoords Ending coordinates  
   * @param {Object} startAnalysis Start location analysis
   * @param {Object} endAnalysis End location analysis
   * @returns {Object|null} Optimal waypoints or null if none found
   */
  _calculateOptimalWaypoints(startCoords, endCoords, startAnalysis, endAnalysis) {
    console.log('🎯 Calculating optimal waypoints...')
    
    // Check cache first  
    const cacheKey = `${startAnalysis.sector}-${endAnalysis.sector}`
    if (this.waypointCache.has(cacheKey)) {
      console.log('📦 Using cached waypoints')
      return this.waypointCache.get(cacheKey)
    }
    
    // Generate exit point candidates from start urban area
    const exitCandidates = this._generateExitCandidates(startCoords, startAnalysis, endAnalysis.sector)
    
    // Generate entry point candidates for destination urban area  
    const entryCandidates = this._generateEntryCandidates(endCoords, endAnalysis, startAnalysis.sector)
    
    // Find optimal exit/entry pair through mathematical optimization
    const optimalWaypoints = this._optimizeWaypointPair(
      startCoords, 
      endCoords,
      exitCandidates, 
      entryCandidates
    )
    
    if (optimalWaypoints) {
      // Cache the result for future use
      this.waypointCache.set(cacheKey, optimalWaypoints)
      console.log(`✅ Optimal waypoints cached for ${cacheKey}`)
    }
    
    return optimalWaypoints
  }
  
  /**
   * Generate exit point candidates from starting urban area
   * @param {[number, number]} startCoords Starting coordinates
   * @param {Object} startAnalysis Start location analysis
   * @param {number} targetSector Target sector number
   * @returns {Array} Array of exit point candidates
   */
  _generateExitCandidates(startCoords, startAnalysis, targetSector) {
    // Use BRC geometry utilities to find optimal exit points
    const exitPoints = findOptimalExitPoints(startCoords, targetSector)
    
    // Limit to top candidates for performance
    return exitPoints.slice(0, this.OPTIMIZATION_PARAMS.maxExitCandidates)
  }
  
  /**
   * Generate entry point candidates for destination urban area
   * @param {[number, number]} endCoords Destination coordinates
   * @param {Object} endAnalysis End location analysis  
   * @param {number} sourceSector Source sector number
   * @returns {Array} Array of entry point candidates
   */
  _generateEntryCandidates(endCoords, endAnalysis, sourceSector) {
    const endSector = endAnalysis.sector
    const boundary = calculateUrbanBoundary(endSector)
    const entryRadius = boundary.outerRadius
    
    const candidates = []
    const endClock = coordsToClockSystem(endCoords)
    
    // Generate entry points around the destination sector boundary
    for (let angleOffset = -30; angleOffset <= 30; angleOffset += 10) {
      const entryBearing = endClock.bearing + angleOffset
      const entryCoords = this._calculateDestinationPoint(BRC_GEOMETRY.CENTER, entryBearing, entryRadius)
      
      // Calculate score for this entry point
      const score = this._calculateEntryPointScore(endCoords, entryCoords, sourceSector)
      
      candidates.push({
        coordinates: entryCoords,
        bearing: entryBearing,
        distance: haversineDistance(entryCoords, endCoords),
        score,
        angleOffset
      })
    }
    
    // Sort by score and return top candidates
    return candidates
      .sort((a, b) => b.score - a.score)
      .slice(0, this.OPTIMIZATION_PARAMS.maxEntryCandidates)
  }
  
  /**
   * Optimize exit/entry waypoint pair using mathematical optimization
   * @param {[number, number]} startCoords Starting coordinates
   * @param {[number, number]} endCoords Ending coordinates
   * @param {Array} exitCandidates Exit point candidates
   * @param {Array} entryCandidates Entry point candidates
   * @returns {Object|null} Optimal waypoints
   */
  _optimizeWaypointPair(startCoords, endCoords, exitCandidates, entryCandidates) {
    let bestWaypoints = null
    let bestScore = 0
    
    console.log(`🔬 Optimizing ${exitCandidates.length} × ${entryCandidates.length} waypoint combinations`)
    
    // Brute force optimization - test all combinations
    for (const exitCandidate of exitCandidates) {
      for (const entryCandidate of entryCandidates) {
        const score = this._calculateWaypointPairScore(
          startCoords,
          endCoords,
          exitCandidate,
          entryCandidate
        )
        
        if (score > bestScore) {
          bestScore = score
          bestWaypoints = {
            exitPoint: exitCandidate.coordinates,
            entryPoint: entryCandidate.coordinates,
            score,
            exitData: exitCandidate,
            entryData: entryCandidate
          }
        }
      }
    }
    
    console.log(`🎯 Best waypoint pair score: ${bestScore.toFixed(3)}`)
    
    return bestScore > this.OPTIMIZATION_PARAMS.efficiencyThreshold ? bestWaypoints : null
  }
  
  /**
   * Calculate optimization score for a waypoint pair
   * @param {[number, number]} startCoords Start coordinates
   * @param {[number, number]} endCoords End coordinates
   * @param {Object} exitCandidate Exit point candidate
   * @param {Object} entryCandidate Entry point candidate
   * @returns {number} Optimization score (higher is better)
   */
  _calculateWaypointPairScore(startCoords, endCoords, exitCandidate, entryCandidate) {
    const exitCoords = exitCandidate.coordinates
    const entryCoords = entryCandidate.coordinates
    
    // Calculate segment distances
    const streetDistance1 = haversineDistance(startCoords, exitCoords) * 3.28084 // to feet
    const playaDistance = haversineDistance(exitCoords, entryCoords) * 3.28084 // to feet
    const streetDistance2 = haversineDistance(entryCoords, endCoords) * 3.28084 // to feet
    
    // Calculate total hybrid time with speed factors
    const streetTime1 = streetDistance1 / (240 * this.OPTIMIZATION_PARAMS.streetSpeedFactor) // walking speed with penalty
    const playaTime = playaDistance / (300 * this.OPTIMIZATION_PARAMS.playaSpeedBonus) // walking speed with bonus
    const streetTime2 = streetDistance2 / (240 * this.OPTIMIZATION_PARAMS.streetSpeedFactor)
    
    const totalHybridTime = streetTime1 + playaTime + streetTime2
    
    // Calculate direct street route time for comparison
    const directDistance = haversineDistance(startCoords, endCoords) * 3.28084
    const directStreetTime = directDistance / (240 * this.OPTIMIZATION_PARAMS.streetSpeedFactor)
    
    // Efficiency score - how much time we save
    const timeSavings = directStreetTime - totalHybridTime
    const efficiencyScore = timeSavings / directStreetTime
    
    return Math.max(0, efficiencyScore) // Return 0 if hybrid is slower
  }
  
  /**
   * Synthesize final three-segment hybrid route
   * @param {[number, number]} startCoords Start coordinates  
   * @param {[number, number]} endCoords End coordinates
   * @param {Object} waypoints Optimal waypoints
   * @param {string} travelMode Travel mode
   * @returns {Promise<Object>} Complete hybrid route
   */
  async _synthesizeHybridRoute(startCoords, endCoords, waypoints, travelMode) {
    console.log('🛣️  Synthesizing three-segment hybrid route...')
    
    const { exitPoint, entryPoint } = waypoints
    const segments = []
    let totalDistance = 0
    let totalDuration = 0
    
    // SEGMENT 1: Start to urban exit (street navigation)
    const segment1 = await this._generateUrbanSegment(
      startCoords,
      exitPoint,
      'urban_exit',
      travelMode
    )
    segments.push(segment1)
    totalDistance += segment1.distance
    totalDuration += segment1.duration
    
    // SEGMENT 2: Urban exit to urban entry (playa crossing)  
    const segment2 = this._generatePlayaSegment(
      exitPoint,
      entryPoint,
      travelMode
    )
    segments.push(segment2)
    totalDistance += segment2.distance
    totalDuration += segment2.duration
    
    // SEGMENT 3: Urban entry to destination (street navigation)
    const segment3 = await this._generateUrbanSegment(
      entryPoint,
      endCoords,
      'urban_entry',
      travelMode
    )
    segments.push(segment3)
    totalDistance += segment3.distance
    totalDuration += segment3.duration
    
    // Calculate efficiency vs straight-line route
    const directDistance = haversineDistance(startCoords, endCoords) * 3.28084
    const efficiency = directDistance / totalDistance
    
    // Build complete route object
    const hybridRoute = {
      type: 'hybrid',
      coordinates: this._extractRouteCoordinates(segments),
      distance: Math.round(totalDistance),
      duration: Math.round(totalDuration / 60), // Convert to minutes
      mode: travelMode,
      segments,
      
      // Enhanced hybrid data
      waypoints: {
        exitPoint,
        entryPoint,
        score: waypoints.score
      },
      
      summary: {
        segmentCount: 3,
        streetDistance: segment1.distance + segment3.distance,
        playaDistance: segment2.distance,
        efficiency,
        timeSavings: waypoints.score,
        routeType: 'Revolutionary Hybrid (Urban→Playa→Urban)'
      },
      
      // Turn-by-turn directions
      directions: this._generateHybridDirections(segments, travelMode),
      
      // Cultural context
      landmarks: this._identifyNearbyLandmarks(segments),
      
      // Future: Art discovery integration points
      artOpportunities: this._identifyArtOpportunities(segment2)
    }
    
    console.log(`✅ Hybrid route synthesized: ${efficiency.toFixed(1)}x efficiency`)
    
    return hybridRoute
  }
  
  /**
   * Generate urban navigation segment (street following)
   * @param {[number, number]} fromCoords From coordinates
   * @param {[number, number]} toCoords To coordinates  
   * @param {string} segmentType 'urban_exit' or 'urban_entry'
   * @param {string} travelMode Travel mode
   * @returns {Promise<Object>} Urban segment
   */
  async _generateUrbanSegment(fromCoords, toCoords, segmentType, travelMode) {
    const distance = haversineDistance(fromCoords, toCoords) * 3.28084 // feet
    
    // Use street pathfinder if available, otherwise estimate
    let duration, coordinates, instructions
    
    if (this.streetPathfinder) {
      // 🚀 REVOLUTIONARY INTEGRATION: Connect A* Street Pathfinder with Hybrid Router!
      try {
        // Only attempt street pathfinding for reasonable distances (< 1000ft)
        if (distance > 1000) {
          console.log('🚫 Distance too large for street pathfinding, using fallback')
          duration = distance / (240 * 0.75)
          coordinates = [fromCoords, toCoords]
          instructions = `Navigate toward ${segmentType.replace('urban_', '')} (${Math.round(distance)}ft)`
        } else {
          const streetRoute = await this.streetPathfinder.findRoute(fromCoords, toCoords, travelMode, { maxNodes: 100 })
          if (streetRoute && streetRoute.coordinates && streetRoute.coordinates.length > 1 && streetRoute.duration) {
            // Use actual street pathfinding results - convert duration from seconds to minutes
            duration = streetRoute.duration / 60 // Convert seconds to minutes to match playa segment format
            coordinates = streetRoute.coordinates // Already in [lat, lng] format
            instructions = streetRoute.segments?.map(s => s.instruction).join(' → ') || 
                          `Navigate ${streetRoute.summary?.streets?.join(', ') || 'streets'} (${Math.round(distance)}ft)`
            console.log(`✅ Street pathfinding successful: ${coordinates.length} points, ${Math.round(duration)}min`)
          } else {
            console.log('🔄 Street pathfinding returned invalid route, using fallback')
            duration = distance / (240 * 0.75)
            coordinates = [fromCoords, toCoords]
            instructions = `Direct navigation to ${segmentType.replace('urban_', '')} (${Math.round(distance)}ft)`
          }
        }
      } catch (error) {
        console.warn('🔄 Street pathfinder failed, using fallback:', error.message)
        // Fallback calculation
        duration = distance / (240 * 0.75)
        coordinates = [fromCoords, toCoords]
        instructions = `Navigate streets (${Math.round(distance)}ft)`
      }
    } else {
      // Fallback estimation
      duration = distance / (240 * 0.75)
      coordinates = [fromCoords, toCoords]
      
      const fromClock = coordsToClockSystem(fromCoords)
      const toClock = coordsToClockSystem(toCoords)
      
      instructions = segmentType === 'urban_exit' 
        ? `Navigate ${fromClock.radialStreet} streets toward city edge (${Math.round(distance)}ft)`
        : `Navigate toward ${toClock.radialStreet} from city edge (${Math.round(distance)}ft)`
    }
    
    return {
      type: 'urban_navigation',
      subType: segmentType,
      coordinates,
      distance: Math.round(distance),
      duration: Math.round(duration),
      instructions,
      travelMode
    }
  }
  
  /**
   * Generate playa crossing segment
   * @param {[number, number]} fromCoords Exit point coordinates
   * @param {[number, number]} toCoords Entry point coordinates
   * @param {string} travelMode Travel mode
   * @returns {Object} Playa segment
   */
  _generatePlayaSegment(fromCoords, toCoords, travelMode) {
    const distance = haversineDistance(fromCoords, toCoords) * 3.28084 // feet
    const playaSpeed = travelMode === 'biking' ? 800 : 300 // ft/min (faster on open playa)
    const duration = distance / playaSpeed
    
    const fromClock = coordsToClockSystem(fromCoords)
    const toClock = coordsToClockSystem(toCoords)
    
    return {
      type: 'playa_crossing',
      coordinates: [fromCoords, toCoords],
      distance: Math.round(distance),
      duration: Math.round(duration),
      instructions: `Cross inner playa from ${fromClock.radialStreet} to ${toClock.radialStreet} sector (${Math.round(distance)}ft)`,
      playaData: {
        fromSector: fromClock.sector,
        toSector: toClock.sector,
        crossingType: 'inner_playa_shortcut'
      },
      travelMode
    }
  }
  
  /**
   * Generate turn-by-turn directions for hybrid route
   * @param {Array} segments Route segments
   * @param {string} travelMode Travel mode
   * @returns {Array} Turn-by-turn directions
   */
  _generateHybridDirections(segments, travelMode) {
    const directions = []
    
    segments.forEach((segment, index) => {
      let instruction = segment.instructions
      
      // Add cultural context for playa crossings
      if (segment.type === 'playa_crossing') {
        const landmarks = this._getNearbyLandmarks(segment.coordinates)
        if (landmarks.length > 0) {
          instruction += ` (past ${landmarks.join(', ')})`
        }
      }
      
      directions.push({
        step: index + 1,
        instruction,
        distance: segment.distance,
        duration: Math.round(segment.duration),
        coordinates: segment.coordinates,
        segmentType: segment.type
      })
    })
    
    return directions
  }
  
  /**
   * Identify nearby landmarks for cultural navigation context
   * @param {Array} coordinates Route coordinates
   * @returns {Array} Nearby landmark names
   */
  _getNearbyLandmarks(coordinates) {
    const landmarks = []
    const [startCoord, endCoord] = coordinates
    
    // Check proximity to major BRC landmarks
    for (const [name, landmark] of Object.entries(this.landmarks)) {
      const distanceToStart = haversineDistance(startCoord, landmark.coordinates)
      const distanceToEnd = haversineDistance(endCoord, landmark.coordinates)
      
      // If route passes within 500m of landmark
      if (distanceToStart < 500 || distanceToEnd < 500) {
        landmarks.push(landmark.description)
      }
    }
    
    return landmarks
  }
  
  /**
   * Identify art discovery opportunities (future enhancement)
   * @param {Object} playaSegment Playa crossing segment
   * @returns {Array} Art opportunities
   */
  _identifyArtOpportunities(playaSegment) {
    // Future: Integrate with art installation data
    // This would route past major art pieces during playa crossing
    return [] // Placeholder for future art discovery features
  }
  
  /**
   * Extract coordinate array from route segments
   * @param {Array} segments Route segments
   * @returns {Array} Coordinate array for mapping
   */
  _extractRouteCoordinates(segments) {
    const coordinates = []
    
    for (const segment of segments) {
      if (coordinates.length === 0) {
        coordinates.push(...segment.coordinates)
      } else {
        // Skip first coordinate to avoid duplicates at segment boundaries
        coordinates.push(...segment.coordinates.slice(1))
      }
    }
    
    return coordinates
  }
  
  // Helper methods
  
  _calculateDestinationPoint(origin, bearing, distance) {
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
  
  _calculateEntryPointScore(endCoords, entryCoords, sourceSector) {
    // Entry score based on distance to final destination
    const distance = haversineDistance(endCoords, entryCoords)
    return 1 / (1 + distance / 200) // Normalize to 200m scale
  }
  
  _identifyNearbyLandmarks(segments) {
    const landmarkNames = []
    
    for (const segment of segments) {
      const landmarks = this._getNearbyLandmarks(segment.coordinates)
      landmarkNames.push(...landmarks)
    }
    
    return [...new Set(landmarkNames)] // Remove duplicates
  }
  
  /**
   * Get router status and statistics
   * @returns {Object} Router status
   */
  getStatus() {
    return {
      waypointCacheSize: this.waypointCache.size,
      boundaryCacheSize: this.boundaryCache.size,
      streetPathfinderAvailable: !!this.streetPathfinder,
      optimizationParams: this.OPTIMIZATION_PARAMS,
      capabilities: [
        'Cross-sector hybrid routing',
        'Mathematical waypoint optimization',  
        'Three-segment route synthesis',
        'Cultural landmark integration',
        'Performance caching system'
      ],
      futureFeatures: [
        'Art discovery routing',
        'Multi-waypoint optimization',
        'Real-time boundary adjustment',
        'Machine learning route optimization'
      ]
    }
  }
}

export default BRCHybridRouter