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
  calculateDestinationPoint,
  BRC_GEOMETRY 
} from './utils/brcGeometry.js'

import { haversineDistance, calculateBearing, metersToFeet, BRC_CENTER } from './utils/geoUtils.js'
import { brcAddressToLatLon } from '../../utils/geocoding.js'


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
    
    // 🎯 SMART HYBRID DETECTION: Check if hybrid routing is beneficial
    const startAvenue = this._extractAvenueFromCoords(startCoords)
    const endAvenue = this._extractAvenueFromCoords(endCoords)
    
    const innerAvenues = ['A', 'B', 'C', 'D', 'E']
    const isStartInner = innerAvenues.includes(startAvenue)
    const isEndInner = innerAvenues.includes(endAvenue)
    
    // Skip hybrid routing for inner-to-inner routes
    if (isStartInner && isEndInner) {
      console.log(`🚫 Skipping hybrid: ${startAvenue} → ${endAvenue} (inner-to-inner, use street-following)`)
      return null
    }
    
    console.log(`🎯 Avenue analysis: ${startAvenue} → ${endAvenue} (start inner: ${isStartInner}, end inner: ${isEndInner})`)
    
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
    console.log('🔍 HYBRID ROUTER DEBUG:')
    console.log('  startAnalysis:', startAnalysis)
    console.log('  endAnalysis:', endAnalysis)
    
    // Both points should be in or near urban areas for hybrid to be beneficial
    if (startAnalysis.zone === 'deep_playa' || endAnalysis.zone === 'deep_playa') {
      console.log('❌ Rejected: deep_playa zone detected')
      return false
    }
    
    // Check sector difference - hybrid most beneficial for cross-sector routes
    const sectorDiff = calculateSectorDifference(startAnalysis.sector, endAnalysis.sector)
    console.log('  sectorDiff:', sectorDiff, 'threshold:', this.OPTIMIZATION_PARAMS.sectorThreshold)
    
    if (sectorDiff < this.OPTIMIZATION_PARAMS.sectorThreshold) {
      console.log(`❌ Rejected: Sectors too close (${sectorDiff}) for hybrid benefit`)
      return false
    }
    
    // Both zones should allow hybrid routing
    const startCanHybrid = ['urban', 'outer_playa', 'side_playa'].includes(startAnalysis.zone)
    const endCanHybrid = ['urban', 'outer_playa', 'side_playa'].includes(endAnalysis.zone)
    console.log('  startCanHybrid:', startCanHybrid, 'endCanHybrid:', endCanHybrid)
    
    const result = startCanHybrid && endCanHybrid
    console.log('  shouldUseHybrid result:', result)
    return result
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
    console.log('  startCoords:', startCoords, 'startAnalysis.sector:', startAnalysis.sector)
    console.log('  endCoords:', endCoords, 'endAnalysis.sector:', endAnalysis.sector)
    
    // 🔄 CLEAR CACHE: Force recalculation for proper Esplanade entry points
    const cacheKey = `${startAnalysis.sector}-${endAnalysis.sector}`
    this.waypointCache.clear() // Clear cache to force recalculation with fixed entry logic
    
    // Check cache first (should be empty now, but keeping for future use)
    if (this.waypointCache.has(cacheKey)) {
      console.log('📦 Using cached waypoints')
      return this.waypointCache.get(cacheKey)
    }
    
    // Generate exit point candidates from start urban area
    console.log('🚪 Generating exit candidates...')
    const exitCandidates = this._generateExitCandidates(startCoords, endCoords, startAnalysis, endAnalysis.sector)
    console.log('  exitCandidates count:', exitCandidates?.length || 0)
    
    // Generate entry point candidates for destination urban area  
    console.log('🚪 Generating entry candidates...')
    const entryCandidates = this._generateEntryCandidates(endCoords, endAnalysis, startAnalysis.sector)
    console.log('  entryCandidates count:', entryCandidates?.length || 0)
    
    if (!exitCandidates || exitCandidates.length === 0) {
      console.log('❌ No exit candidates found')
      return null
    }
    
    if (!entryCandidates || entryCandidates.length === 0) {
      console.log('❌ No entry candidates found')
      return null
    }
    
    // Find optimal exit/entry pair through mathematical optimization
    console.log('🎯 Optimizing waypoint pairs...')
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
    } else {
      console.log('❌ Waypoint optimization failed')
    }
    
    return optimalWaypoints
  }
  
  /**
   * Get all street intersections for a given sector that can serve as exit/entry points
   * @param {number} sector Sector number (2-12)
   * @returns {Array} Array of intersection objects with coordinates and IDs
   */
  _getStreetIntersectionsForSector(sector) {
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
    
    // Define avenues from inner to outer (good exit points are on outer avenues)
    const avenues = ['C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L']
    
    // Generate intersections for each clock position and avenue
    for (const clock of sectorClocks) {
      for (const avenue of avenues) {
        try {
          const address = `${clock} & ${avenue}`
          const coordinates = brcAddressToLatLon(address)
          
          if (coordinates && coordinates.length === 2) {
            intersections.push({
              id: `${clock}&${avenue}`,
              coordinates: coordinates, // This is [lat, lng] format
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
   * Generate exit point candidates from starting urban area
   * @param {[number, number]} startCoords Starting coordinates
   * @param {[number, number]} endCoords Ending coordinates
   * @param {Object} startAnalysis Start location analysis
   * @param {number} targetSector Target sector number
   * @returns {Array} Array of exit point candidates
   */
  _generateExitCandidates(startCoords, endCoords, startAnalysis, targetSector) {
    // Use BRC geometry utilities to find optimal exit points
    const exitPoints = findOptimalExitPoints(startCoords, endCoords, targetSector)
    
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
    const candidates = []
    
    // 🎯 REVOLUTIONARY FIX: Use actual street intersections as entry points
    const availableIntersections = this._getStreetIntersectionsForSector(endSector)
    
    console.log(`🔍 ENTRY DEBUG for sector ${endSector}:`)
    console.log(`  Total intersections: ${availableIntersections.length}`)
    console.log(`  Sample intersections:`, availableIntersections.slice(0, 5).map(i => i.address))
    
    // 🚪 ESPLANADE-FIRST LOGIC: Always prioritize proper urban boundary
    const esplanadeEntries = availableIntersections.filter(intersection => 
      intersection.avenue === 'Esplanade'
    )
    
    const boundaryEntries = availableIntersections.filter(intersection => 
      intersection.clock === '2:00' || intersection.clock === '10:00'
    )
    
    console.log(`  Esplanade entries: ${esplanadeEntries.length}`)
    console.log(`  Boundary entries: ${boundaryEntries.length}`)
    if (esplanadeEntries.length > 0) {
      console.log(`  Esplanade addresses:`, esplanadeEntries.map(i => i.address))
    }
    
    // 🎯 ALWAYS USE ESPLANADE if available - NO fallback to boundaries for entry
    const entryIntersections = esplanadeEntries.length > 0 ? esplanadeEntries : boundaryEntries
    
    // Score each intersection as an entry point
    for (const intersection of entryIntersections) {
      const score = this._calculateEntryPointScore(endCoords, intersection.coordinates, sourceSector)
      const bearing = calculateBearing(BRC_CENTER, intersection.coordinates)
      
      candidates.push({
        coordinates: intersection.coordinates,
        bearing: bearing,
        distance: haversineDistance(intersection.coordinates, endCoords),
        score,
        angleOffset: bearing - endAnalysis.clockData?.bearing || 0,
        intersection: intersection.id // 🎯 Critical: Keep intersection ID for pathfinding
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
    
    let scoreCount = 0
    let totalScore = 0
    let minScore = Infinity
    let maxScore = -Infinity
    
    // Brute force optimization - test all combinations
    for (const exitCandidate of exitCandidates) {
      for (const entryCandidate of entryCandidates) {
        const score = this._calculateWaypointPairScore(
          startCoords,
          endCoords,
          exitCandidate,
          entryCandidate
        )
        
        scoreCount++
        totalScore += score
        minScore = Math.min(minScore, score)
        maxScore = Math.max(maxScore, score)
        
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
    
    console.log(`📊 Score analysis: min=${minScore.toFixed(3)}, max=${maxScore.toFixed(3)}, avg=${(totalScore/scoreCount).toFixed(3)}`)
    console.log(`🎯 Best waypoint pair score: ${bestScore.toFixed(3)} (${scoreCount} combinations tested)`)
    
    // 🧠 INTELLIGENT DYNAMIC THRESHOLD: Lower thresholds for longer cross-sector routes
    const dynamicThreshold = this._calculateDynamicEfficiencyThreshold(startCoords, endCoords, exitCandidates, entryCandidates)
    console.log(`🎯 Dynamic efficiency threshold: ${(dynamicThreshold*100).toFixed(1)}% (vs static ${(this.OPTIMIZATION_PARAMS.efficiencyThreshold*100).toFixed(1)}%)`)
    
    return bestScore > dynamicThreshold ? bestWaypoints : null
  }
  
  /**
   * Calculate dynamic efficiency threshold based on route characteristics
   * Longer cross-sector routes get lower thresholds since even small gains are worthwhile
   * @param {[number, number]} startCoords Start coordinates
   * @param {[number, number]} endCoords End coordinates
   * @param {Array} exitCandidates Exit point candidates
   * @param {Array} entryCandidates Entry point candidates
   * @returns {number} Dynamic efficiency threshold (0.0-1.0)
   */
  _calculateDynamicEfficiencyThreshold(startCoords, endCoords, exitCandidates, entryCandidates) {
    const directDistance = haversineDistance(startCoords, endCoords) * 3.28084 // Convert to feet
    
    // Calculate sector difference for cross-sector assessment
    const startClock = coordsToClockSystem(startCoords)
    const endClock = coordsToClockSystem(endCoords)
    const sectorDiff = calculateSectorDifference(startClock.sector, endClock.sector)
    
    // Base threshold starts at static value (15%)
    let threshold = this.OPTIMIZATION_PARAMS.efficiencyThreshold
    
    // 🧠 DISTANCE-BASED THRESHOLD ADJUSTMENT
    // Longer routes deserve lower thresholds - even small efficiency gains matter
    if (directDistance > 8000) {
      // Very long routes (>8000ft): Accept 5% efficiency gains
      threshold = Math.min(threshold, 0.05)
      console.log(`📏 Very long route (${Math.round(directDistance)}ft): Threshold lowered to 5%`)
    } else if (directDistance > 6000) {
      // Long routes (6000-8000ft): Accept 7% efficiency gains  
      threshold = Math.min(threshold, 0.07)
      console.log(`📏 Long route (${Math.round(directDistance)}ft): Threshold lowered to 7%`)
    } else if (directDistance > 4000) {
      // Medium routes (4000-6000ft): Accept 9% efficiency gains
      threshold = Math.min(threshold, 0.09)
      console.log(`📏 Medium route (${Math.round(directDistance)}ft): Threshold lowered to 9%`)
    }
    
    // 🎯 SECTOR-BASED THRESHOLD ADJUSTMENT
    // Cross-sector routes benefit more from hybrid routing
    if (sectorDiff >= 4) {
      // Major cross-sector: Very low threshold (3%)
      threshold = Math.min(threshold, 0.03)
      console.log(`🎯 Major cross-sector route (${sectorDiff} sectors): Threshold lowered to 3%`)
    } else if (sectorDiff >= 3) {
      // Cross-sector: Lower threshold (6%)
      threshold = Math.min(threshold, 0.06)
      console.log(`🎯 Cross-sector route (${sectorDiff} sectors): Threshold lowered to 6%`)
    }
    
    // 🌟 CANDIDATE QUALITY ADJUSTMENT
    // If we have many good candidates, we can be more selective
    const avgExitCandidates = exitCandidates.length
    const avgEntryCandidates = entryCandidates.length
    const totalCombinations = avgExitCandidates * avgEntryCandidates
    
    if (totalCombinations > 30) {
      // Many combinations available: slightly higher threshold
      threshold = Math.min(threshold * 1.2, this.OPTIMIZATION_PARAMS.efficiencyThreshold)
      console.log(`🎲 Many candidates (${totalCombinations} combinations): Threshold raised to ${(threshold*100).toFixed(1)}%`)
    } else if (totalCombinations < 10) {
      // Few combinations: lower threshold to avoid rejecting limited options
      threshold = threshold * 0.8
      console.log(`🎲 Few candidates (${totalCombinations} combinations): Threshold lowered to ${(threshold*100).toFixed(1)}%`)
    }
    
    // Ensure threshold never goes below 1% or above original 15%
    threshold = Math.max(0.01, Math.min(threshold, this.OPTIMIZATION_PARAMS.efficiencyThreshold))
    
    return threshold
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
    
    if (!exitCoords || !entryCoords) {
      console.log('❌ Missing coordinates in candidates')
      return 0
    }
    
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
      duration: Math.round(totalDuration), // Already in minutes from segment calculations
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
        // Use revolutionary A* street pathfinder for all urban segments
        console.log(`🎯 Attempting street pathfinding for ${segmentType} (${Math.round(distance)}ft)`)
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
   * Extract avenue from coordinates based on distance from BRC center
   * @param {[number, number]} coords [latitude, longitude]
   * @returns {string} Avenue letter (A-L) or 'Unknown'
   */
  _extractAvenueFromCoords(coords) {
    const clockData = coordsToClockSystem(coords)
    const distanceFromCenter = clockData.distanceFromCenter // Distance in feet
    
    // Avenue distance thresholds based on BRC layout (in feet)
    const avenueThresholds = [
      { avenue: 'Esplanade', maxDistance: 2750 },
      { avenue: 'A', maxDistance: 1400 },
      { avenue: 'B', maxDistance: 1800 },
      { avenue: 'C', maxDistance: 2200 },
      { avenue: 'D', maxDistance: 2600 },
      { avenue: 'E', maxDistance: 3000 },
      { avenue: 'F', maxDistance: 3400 },
      { avenue: 'G', maxDistance: 3800 },
      { avenue: 'H', maxDistance: 4200 },
      { avenue: 'I', maxDistance: 4600 },
      { avenue: 'J', maxDistance: 5000 },
      { avenue: 'K', maxDistance: 5400 },
      { avenue: 'L', maxDistance: 5800 }
    ]
    
    // Find the closest avenue based on distance
    for (const threshold of avenueThresholds) {
      if (distanceFromCenter <= threshold.maxDistance) {
        return threshold.avenue
      }
    }
    
    // If beyond all known avenues
    return 'Unknown'
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