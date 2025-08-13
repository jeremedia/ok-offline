/**
 * BRC Pathfinding Engine
 * 
 * A* pathfinding algorithm optimized for Black Rock City's unique street layout.
 * Handles radial and arc street patterns with BRC-specific heuristics.
 */

import { PriorityQueue } from './utils/graphUtils.js'
import { haversineDistance, calculateBearing, distanceFromCenter, getClockSector, BRC_CENTER } from './utils/geoUtils.js'

export class BRCPathfinder {
  constructor(streetNetwork) {
    this.network = streetNetwork
    
    // Pathfinding parameters
    this.intersectionDelay = 5 // seconds added for each intersection
    this.turnPenalty = 3       // seconds added for each turn
    this.heuristicWeight = 1.5 // A* heuristic weighting - increased for BRC radial-first routing
  }

  /**
   * Find optimal route between two points using A* algorithm
   * @param {[number, number]} startCoords [latitude, longitude]
   * @param {[number, number]} endCoords [latitude, longitude]
   * @param {string} travelMode 'walking' or 'biking'
   * @param {Object} options Additional pathfinding options
   * @returns {Object|null} Complete route with path and directions
   */
  async findRoute(startCoords, endCoords, travelMode = 'walking', options = {}) {
    if (!this.network.isBuilt) {
      throw new Error('Street network not built yet')
    }

    console.log(`🔍 Finding ${travelMode} route from ${startCoords} to ${endCoords}`)

    try {
      // Step 1: Find nearest nodes to start and end points
      console.log(`🔍 Step 1: Finding nearest nodes...`)
      const startNode = this.network.findNearestNode(startCoords, options.maxStartDistance || 200)
      console.log(`   Start node search result:`, startNode ? `Found node ${startNode.id}` : 'NOT FOUND')
      
      // 🎯 ENHANCED: Use avenue-aware search for end node (handles mid-block destinations)
      let endNode = null
      const detectedAvenue = this.network.detectAvenueFromCoordinates(endCoords)
      
      if (detectedAvenue) {
        console.log(`🏠 Mid-block destination detected on ${detectedAvenue} avenue`)
        endNode = this.network.findNearestNodeOnAvenue(endCoords, options.maxEndDistance || 200, detectedAvenue)
      } else {
        endNode = this.network.findNearestNode(endCoords, options.maxEndDistance || 200)
      }
      
      console.log(`   End node search result:`, endNode ? `Found node ${endNode.id}` : 'NOT FOUND')

      if (!startNode) {
        console.warn('⚠️  No start node found within range - expanding search radius')
        const startNodeExpanded = this.network.findNearestNode(startCoords, 500)
        console.warn(`   Expanded search result:`, startNodeExpanded ? `Found at ${500}m: ${startNodeExpanded.id}` : 'Still not found')
        return null
      }

      if (!endNode) {
        console.warn('⚠️  No end node found within range - expanding search radius')  
        let endNodeExpanded = null
        
        // Try avenue-aware search with expanded radius first
        if (detectedAvenue) {
          endNodeExpanded = this.network.findNearestNodeOnAvenue(endCoords, 500, detectedAvenue)
          console.warn(`   Expanded avenue search result:`, endNodeExpanded ? `Found at 500m on ${detectedAvenue}: ${endNodeExpanded.id}` : 'Not found on avenue')
        }
        
        // Fall back to normal expanded search if avenue search failed
        if (!endNodeExpanded) {
          endNodeExpanded = this.network.findNearestNode(endCoords, 500)
          console.warn(`   Expanded general search result:`, endNodeExpanded ? `Found at 500m: ${endNodeExpanded.id}` : 'Still not found')
        }
        
        if (!endNodeExpanded) {
          return null
        }
        
        endNode = endNodeExpanded
      }

      if (startNode.id === endNode.id) {
        // Start and end are at same intersection
        return this._createDirectRoute(startCoords, endCoords, travelMode)
      }

      // Step 2: Run A* pathfinding
      console.log(`🔍 Step 2: Running A* pathfinding between ${startNode.id} and ${endNode.id}...`)
      const nodePath = this._aStarSearch(startNode, endNode, travelMode, options)
      console.log(`   A* search result:`, nodePath ? `Found path with ${nodePath.length} nodes` : 'NO PATH FOUND')
      
      if (!nodePath || nodePath.length === 0) {
        console.warn('⚠️  No route found between nodes - checking network connectivity')
        console.warn(`   Start node ${startNode.id} edges: ${this.network.getNodeEdges(startNode.id)?.length || 0}`)
        console.warn(`   End node ${endNode.id} edges: ${this.network.getNodeEdges(endNode.id)?.length || 0}`)
        return null
      }

      // Step 3: Convert node path to coordinate path and directions
      const route = this._buildRouteFromPath(nodePath, startCoords, endCoords, travelMode)
      
      console.log(`✅ Route found: ${route.distance}ft, ${Math.round(route.duration / 60)}min, ${route.segments.length} segments`)
      
      return route
      
    } catch (error) {
      console.error('❌ Pathfinding failed:', error)
      return null
    }
  }

  /**
   * A* pathfinding algorithm with BRC-specific optimizations
   */
  _aStarSearch(startNode, endNode, travelMode, options) {
    const openSet = new PriorityQueue()
    const closedSet = new Set()
    const gScore = new Map() // Cost from start
    const fScore = new Map() // gScore + heuristic
    const cameFrom = new Map() // Path reconstruction
    
    // Initialize with start node
    gScore.set(startNode.id, 0)
    fScore.set(startNode.id, this._calculateHeuristic(startNode, endNode, travelMode))
    openSet.enqueue(startNode, fScore.get(startNode.id))
    
    let nodesExplored = 0
    const maxNodes = options.maxNodes || 1000
    
    while (!openSet.isEmpty() && nodesExplored < maxNodes) {
      const current = openSet.dequeue()
      nodesExplored++
      
      if (current.id === endNode.id) {
        // Found the destination!
        const path = this._reconstructPath(cameFrom, current)
        console.log(`🎯 Path found after exploring ${nodesExplored} nodes`)
        return path
      }
      
      closedSet.add(current.id)
      
      // Explore neighbors
      for (const edgeId of current.connectedEdges) {
        const edge = this.network.getEdge(edgeId)
        if (!edge || edge.isRestricted(travelMode)) {
          continue
        }
        
        const neighborId = edge.getOtherNodeId(current.id)
        const neighbor = this.network.getNode(neighborId)
        
        if (!neighbor || closedSet.has(neighborId)) {
          continue
        }
        
        // Calculate cost to move to this neighbor
        const moveCost = this._calculateMoveCost(current, edge, neighbor, travelMode, cameFrom)
        const tentativeGScore = gScore.get(current.id) + moveCost
        
        // Check if this is a better path to the neighbor
        if (!gScore.has(neighborId) || tentativeGScore < gScore.get(neighborId)) {
          cameFrom.set(neighborId, current)
          gScore.set(neighborId, tentativeGScore)
          
          const heuristic = this._calculateHeuristic(neighbor, endNode, travelMode)
          const f = tentativeGScore + heuristic * this.heuristicWeight
          fScore.set(neighborId, f)
          
          // DEBUG: Log actual A* decisions for critical nodes
          if (current.id === '3:30&A' && (neighborId === '4:00&A' || neighborId === '3:30&B')) {
            console.log(`🚨 A* DECISION: ${current.id} → ${neighborId}`)
            console.log(`   moveCost: ${moveCost.toFixed(1)}`)
            console.log(`   heuristic: ${heuristic.toFixed(1)}`)
            console.log(`   heuristicWeight: ${this.heuristicWeight}`)
            console.log(`   weighted heuristic: ${(heuristic * this.heuristicWeight).toFixed(1)}`)
            console.log(`   f-score: ${f.toFixed(1)}`)
          }
          
          if (!openSet.contains(neighbor)) {
            openSet.enqueue(neighbor, f)
          } else {
            openSet.updatePriority(neighbor, f)
          }
        }
      }
    }
    
    console.warn(`⚠️  No path found after exploring ${nodesExplored} nodes`)
    return null
  }

  /**
   * Calculate movement cost between two connected nodes
   */
  _calculateMoveCost(fromNode, edge, toNode, travelMode, pathHistory) {
    // Base travel time for the edge
    let cost = travelMode === 'biking' ? edge.bikeTime : edge.walkTime
    
    // Add intersection delay
    cost += this.intersectionDelay
    
    // Add turn penalty if we're changing street direction
    const prevNode = pathHistory.get(fromNode.id)
    if (prevNode) {
      const turnPenalty = this._calculateTurnPenalty(prevNode, fromNode, toNode)
      cost += turnPenalty
    }
    
    // BRC-specific penalties/bonuses
    cost *= this._getBRCSpeedModifier(edge, travelMode)
    
    return cost
  }

  /**
   * Calculate turn penalty based on change in direction
   */
  _calculateTurnPenalty(prevNode, currentNode, nextNode) {
    // Calculate bearing change to determine turn severity
    const incomingBearing = calculateBearing(prevNode.coordinates, currentNode.coordinates)
    const outgoingBearing = calculateBearing(currentNode.coordinates, nextNode.coordinates)
    
    let bearingChange = Math.abs(outgoingBearing - incomingBearing)
    if (bearingChange > 180) {
      bearingChange = 360 - bearingChange
    }
    
    // More severe turns = higher penalty
    if (bearingChange < 30) return 0          // Straight through
    if (bearingChange < 60) return this.turnPenalty * 0.5  // Slight turn
    if (bearingChange < 120) return this.turnPenalty       // Regular turn  
    return this.turnPenalty * 1.5             // Sharp turn/U-turn
  }

  /**
   * DISTANCE-ONLY routing: No business logic, only mathematical distance
   * ARCHITECTURAL PRINCIPLE: Route selection based ONLY on shortest distance
   */
  _getBRCSpeedModifier(edge, travelMode) {
    // REMOVED ALL BUSINESS LOGIC per user requirement:
    // "The only criteria of route selection is distance: there should be no other route criteria. 
    // Nothing to do with 'business' or 'crowds'. The shortest mathematical distance."
    return 1.0  // No speed modifiers - pure distance-based routing
  }

  /**
   * Calculate A* heuristic (estimated cost to goal)
   * Uses BRC-aware routing distance, converted to time to match edge costs
   */
  _calculateHeuristic(node, goalNode, travelMode) {
    const baseSpeed = travelMode === 'biking' ? 12 : 4 // ft/sec (same as original)
    
    // Parse BRC addresses to calculate optimal routing distance
    const nodeAddress = this._parseBRCAddress(node.brcAddress || node.id)
    const goalAddress = this._parseBRCAddress(goalNode.brcAddress || goalNode.id)
    
    if (nodeAddress && goalAddress) {
      // Calculate BRC optimal routing distance in meters
      const brcDistanceMeters = this._calculateBRCRoutingDistance(nodeAddress, goalAddress)
      // Convert to time to match edge cost units (edge costs are in seconds)
      return (brcDistanceMeters * 3.28084) / baseSpeed // Convert m→ft→seconds
    }
    
    // Fallback to straight-line distance for non-BRC addresses  
    const straightLineDistance = haversineDistance(node.coordinates, goalNode.coordinates)
    return (straightLineDistance * 3.28084) / baseSpeed
  }
  
  /**
   * Calculate optimal routing distance in BRC polar coordinate system
   * Strategy: radial-first movement, then avenue movement at destination
   */
  _calculateBRCRoutingDistance(fromAddress, toAddress) {
    const fromAvenueNum = this._getAvenueNumber(fromAddress.avenue)
    const toAvenueNum = this._getAvenueNumber(toAddress.avenue)
    const fromClock = this._parseClockTime(fromAddress.clock)
    const toClock = this._parseClockTime(toAddress.clock)
    
    // Step 1: Radial distance (avenue-to-avenue movement)
    const avenueSteps = Math.abs(toAvenueNum - fromAvenueNum)
    const radialDistance = avenueSteps * 85 // ~85m per avenue step (from test data)
    
    // Step 2: Avenue arc distance (clock position movement)
    // Calculate shortest arc around the destination avenue
    const clockDifference = Math.abs(toClock - fromClock)
    const shortestArc = Math.min(clockDifference, 12 - clockDifference) // Shortest way around
    
    // Avenue circumference increases with distance from center
    const destAvenueRadius = 200 + (toAvenueNum * 150) // Estimated radius
    const destAvenueCircumference = 2 * Math.PI * destAvenueRadius
    const avenueArcDistance = (shortestArc / 12) * destAvenueCircumference
    
    // ENHANCED: Smart avenue movement strategy for BRC geometry
    let adjustedAvenueDistance = avenueArcDistance
    
    // For cross-sector routes (large clock differences), prefer Esplanade routing
    const isCrossSector = shortestArc >= 2.0 // 2+ hours difference
    const isEsplanadeRoute = (fromAddress.avenue === 'Esplanade' || toAddress.avenue === 'Esplanade')
    
    if (fromAvenueNum !== toAvenueNum) {
      if (isCrossSector && isEsplanadeRoute) {
        // Cross-sector + Esplanade: minimal penalty (Esplanade is fastest for cross-sector)
        adjustedAvenueDistance *= 0.7 // 30% penalty (much better than 90%)
      } else {
        // Regular cross-avenue routing: heavily penalize avenue movement (favor radial-first)
        adjustedAvenueDistance *= 0.1 // 90% penalty for non-Esplanade cross-avenue movement
      }
    }
    
    return radialDistance + adjustedAvenueDistance // Total distance in meters
  }
  
  /**
   * Parse clock time string to decimal hours
   */
  _parseClockTime(clockStr) {
    const [hours, minutes] = clockStr.split(':').map(Number)
    return hours + (minutes / 60)
  }
  
  /**
   * Parse BRC address string into components
   * Made public for debugging
   */
  _parseBRCAddress(address) {
    if (!address || typeof address !== 'string') return null
    
    const match = address.match(/^(\d{1,2}:\d{2})\s*&\s*([A-L])$/)
    if (!match) return null
    
    return {
      clock: match[1],
      avenue: match[2]
    }
  }
  
  /**
   * Get numeric value for avenue (A=1, B=2, etc.)
   */
  _getAvenueNumber(avenue) {
    return avenue.charCodeAt(0) - 'A'.charCodeAt(0) + 1
  }

  /**
   * Reconstruct path from A* search results
   */
  _reconstructPath(cameFrom, endNode) {
    const path = [endNode]
    let current = endNode
    
    while (cameFrom.has(current.id)) {
      current = cameFrom.get(current.id)
      path.unshift(current)
    }
    
    return path
  }

  /**
   * Build complete route object from node path
   */
  _buildRouteFromPath(nodePath, startCoords, endCoords, travelMode) {
    const segments = []
    let totalDistance = 0
    let totalDuration = 0
    
    // Add walking segment from start to first node if needed
    const firstNode = nodePath[0]
    const startToFirstDistance = haversineDistance(startCoords, firstNode.coordinates)
    
    if (startToFirstDistance > 10) { // More than 10 meters
      const walkingSegment = this._createWalkingSegment(startCoords, firstNode.coordinates, travelMode, 'approach')
      segments.push(walkingSegment)
      totalDistance += walkingSegment.distance
      totalDuration += walkingSegment.duration
    }
    
    // Add street segments between nodes
    for (let i = 0; i < nodePath.length - 1; i++) {
      const fromNode = nodePath[i]
      const toNode = nodePath[i + 1]
      
      // Find the edge between these nodes
      const edges = this.network.findEdgesBetweenNodes(fromNode.id, toNode.id)
      if (edges.length === 0) {
        console.warn(`⚠️  No edge found between ${fromNode.id} and ${toNode.id}`)
        continue
      }
      
      // Use the best edge if multiple options
      const edge = edges[0] // Could add logic to choose best edge
      
      const streetSegment = this._createStreetSegment(fromNode, toNode, edge, travelMode)
      segments.push(streetSegment)
      totalDistance += streetSegment.distance
      totalDuration += streetSegment.duration
    }
    
    // Add walking segment from last node to destination if needed
    const lastNode = nodePath[nodePath.length - 1]
    const lastToEndDistance = haversineDistance(lastNode.coordinates, endCoords)
    
    if (lastToEndDistance > 10) { // More than 10 meters
      const walkingSegment = this._createWalkingSegment(lastNode.coordinates, endCoords, travelMode, 'final')
      segments.push(walkingSegment)
      totalDistance += walkingSegment.distance
      totalDuration += walkingSegment.duration
    }
    
    // Debug logging for total route duration
    const durationMinutes = Math.round((totalDuration || 0) / 60)
    const distanceFeet = Math.round(totalDistance * 3.28084)
    
    console.log(`🔍 Route duration debug: ${segments.length} segments, ${totalDuration.toFixed(1)}sec → ${durationMinutes}min (${distanceFeet}ft)`)
    
    // Build complete route
    return {
      type: 'street_following',
      coordinates: this._extractRouteCoordinates(segments),
      distance: distanceFeet, // feet
      duration: durationMinutes, // minutes
      segments,
      nodePath: nodePath.map(node => ({
        id: node.id,
        coordinates: node.coordinates,
        brcAddress: node.brcAddress,
        streetNames: node.streetNames
      })),
      summary: {
        nodes: nodePath.length,
        streets: [...new Set(segments.map(s => s.streetName).filter(Boolean))],
        intersections: nodePath.length - 1,
        routeType: 'Street-following navigation'
      }
    }
  }

  /**
   * Create walking/approach segment
   */
  _createWalkingSegment(startCoords, endCoords, travelMode, type) {
    const distance = haversineDistance(startCoords, endCoords)
    const speed = travelMode === 'biking' ? 3 : 1.2 // m/s (slower for approach/final)
    const duration = distance / speed
    
    return {
      type: type === 'approach' ? 'approach_walking' : 'final_walking',
      coordinates: [startCoords, endCoords],
      distance: distance, // meters
      duration: duration, // seconds
      streetName: null,
      instruction: type === 'approach' 
        ? `Head to ${getClockSector(endCoords)} street network`
        : `Walk to final destination`
    }
  }

  /**
   * Create street segment between two connected nodes
   */
  _createStreetSegment(fromNode, toNode, edge, travelMode) {
    const baseTime = travelMode === 'biking' ? edge.bikeTime : edge.walkTime
    const totalDuration = baseTime + this.intersectionDelay
    
    // Debug logging for duration calculation issues
    if (edge.distance > 100 && totalDuration < 10) { // Long edge with short time - suspicious
      console.warn(`⚠️  Duration calculation issue: ${edge.streetName || 'unnamed'} ${Math.round(edge.distance)}m → ${totalDuration.toFixed(1)}sec`)
      console.warn(`   Base time: ${baseTime.toFixed(1)}sec, Intersection delay: ${this.intersectionDelay}sec`)
    }
    
    return {
      type: 'street_following',
      coordinates: edge.coordinates,
      distance: edge.distance, // meters
      duration: totalDuration, // seconds
      streetName: edge.streetName,
      streetType: edge.streetType,
      fromAddress: fromNode.brcAddress,
      toAddress: toNode.brcAddress,
      instruction: this._generateSegmentInstruction(fromNode, toNode, edge)
    }
  }

  /**
   * Generate turn-by-turn instruction for a segment
   */
  _generateSegmentInstruction(fromNode, toNode, edge) {
    const streetType = edge.streetType === 'radial' ? 'radial' : 'arc'
    const direction = this._getDirectionDescription(fromNode.coordinates, toNode.coordinates)
    
    return `Continue ${direction} on ${edge.streetName} (${streetType}) to ${toNode.brcAddress}`
  }

  /**
   * Get direction description for instruction
   */
  _getDirectionDescription(fromCoords, toCoords) {
    const bearing = calculateBearing(fromCoords, toCoords)
    
    if (bearing < 22.5 || bearing >= 337.5) return 'north'
    if (bearing < 67.5) return 'northeast'
    if (bearing < 112.5) return 'east'
    if (bearing < 157.5) return 'southeast'
    if (bearing < 202.5) return 'south'
    if (bearing < 247.5) return 'southwest'
    if (bearing < 292.5) return 'west'
    return 'northwest'
  }

  /**
   * Extract all coordinates from route segments
   */
  _extractRouteCoordinates(segments) {
    const coordinates = []
    
    for (const segment of segments) {
      if (segment.coordinates) {
        // Add all coordinates, avoiding duplicates at segment boundaries
        if (coordinates.length === 0) {
          coordinates.push(...segment.coordinates)
        } else {
          // Skip first coordinate if it duplicates the last one
          const lastCoord = coordinates[coordinates.length - 1]
          const firstCoord = segment.coordinates[0]
          
          if (haversineDistance(lastCoord, firstCoord) > 1) { // Not the same point
            coordinates.push(...segment.coordinates)
          } else {
            coordinates.push(...segment.coordinates.slice(1))
          }
        }
      }
    }
    
    return coordinates
  }
  

  /**
   * Create simple direct route when start and end are at same intersection
   */
  _createDirectRoute(startCoords, endCoords, travelMode) {
    const distance = haversineDistance(startCoords, endCoords)
    const speed = travelMode === 'biking' ? 8 : 3 // ft/sec
    const duration = (distance * 3.28084) / speed
    
    return {
      type: 'street_following',
      coordinates: [startCoords, endCoords],
      distance: Math.round(distance * 3.28084),
      duration: Math.round(duration),
      segments: [{
        type: 'same_intersection',
        coordinates: [startCoords, endCoords],
        distance: distance,
        duration: duration,
        instruction: 'Destination is at same intersection'
      }],
      summary: {
        nodes: 1,
        streets: [],
        intersections: 0,
        routeType: 'Same intersection'
      }
    }
  }

  /**
   * Get pathfinder status for debugging
   */
  getStatus() {
    return {
      networkReady: this.network?.isBuilt || false,
      networkStats: this.network?.getNetworkStats() || {},
      pathfindingParams: {
        intersectionDelay: this.intersectionDelay,
        turnPenalty: this.turnPenalty,
        heuristicWeight: this.heuristicWeight
      }
    }
  }
}