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
    this.heuristicWeight = 1.1 // A* heuristic weighting (>1 = faster but suboptimal)
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
      const startNode = this.network.findNearestNode(startCoords, options.maxStartDistance || 200)
      const endNode = this.network.findNearestNode(endCoords, options.maxEndDistance || 200)

      if (!startNode) {
        console.warn('⚠️  No start node found within range')
        return null
      }

      if (!endNode) {
        console.warn('⚠️  No end node found within range')
        return null
      }

      if (startNode.id === endNode.id) {
        // Start and end are at same intersection
        return this._createDirectRoute(startCoords, endCoords, travelMode)
      }

      // Step 2: Run A* pathfinding
      const nodePath = this._aStarSearch(startNode, endNode, travelMode, options)
      
      if (!nodePath || nodePath.length === 0) {
        console.warn('⚠️  No route found between nodes')
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
   * BRC-specific speed modifiers for different streets and conditions
   */
  _getBRCSpeedModifier(edge, travelMode) {
    let modifier = 1.0
    
    // Street type modifiers
    if (edge.streetName === 'Esplanade') {
      modifier *= 0.85 // Esplanade is busy and crowded
    } else if (edge.streetType === 'radial' && edge.width >= 40) {
      modifier *= 1.1  // Major radials are faster
    } else if (edge.streetType === 'arc' && ['Kilgore', 'Jemison'].includes(edge.streetName)) {
      modifier *= 1.05 // Major arc streets are slightly faster
    }
    
    // Distance from center affects speed (closer = more crowded)
    const avgCoords = [
      (edge.coordinates[0][0] + edge.coordinates[edge.coordinates.length - 1][0]) / 2,
      (edge.coordinates[0][1] + edge.coordinates[edge.coordinates.length - 1][1]) / 2
    ]
    const centerDistance = distanceFromCenter(avgCoords)
    
    if (centerDistance < 500) {
      modifier *= 0.8  // Very close to center = very crowded
    } else if (centerDistance < 1000) {
      modifier *= 0.9  // Close to center = crowded
    } else if (centerDistance > 2000) {
      modifier *= 1.1  // Outer areas = less crowded
    }
    
    // Biking-specific modifiers
    if (travelMode === 'biking') {
      if (edge.streetType === 'radial') {
        modifier *= 1.1 // Radials better for biking (less cross-traffic)
      }
    }
    
    return modifier
  }

  /**
   * Calculate A* heuristic (estimated cost to goal)
   * Uses BRC-specific knowledge to guide search
   */
  _calculateHeuristic(node, goalNode, travelMode) {
    // Base heuristic: straight-line distance
    const straightLineDistance = haversineDistance(node.coordinates, goalNode.coordinates)
    const baseSpeed = travelMode === 'biking' ? 12 : 4 // ft/sec
    let heuristic = straightLineDistance * 3.28084 / baseSpeed // Convert to seconds
    
    // BRC-specific heuristic adjustments
    const nodeSector = getClockSector(node.coordinates)
    const goalSector = getClockSector(goalNode.coordinates)
    const sectorDifference = Math.abs(nodeSector - goalSector)
    
    // If nodes are in very different sectors, route likely needs to go through center
    if (sectorDifference > 3) {
      const nodeDistance = distanceFromCenter(node.coordinates)
      const goalDistance = distanceFromCenter(goalNode.coordinates)
      
      // If both nodes are in outer areas, routing through center might be faster
      if (nodeDistance > 1000 && goalDistance > 1000) {
        heuristic *= 0.9 // Encourage center routing
      }
    }
    
    // Nodes on same or adjacent radial/arc are generally easier to route
    const sharedStreets = node.streetNames.filter(name => goalNode.streetNames.includes(name))
    if (sharedStreets.length > 0) {
      heuristic *= 0.8 // Encourage direct street connections
    }
    
    return heuristic
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
    
    // Build complete route
    return {
      type: 'street_following',
      coordinates: this._extractRouteCoordinates(segments),
      distance: Math.round(totalDistance * 3.28084), // Convert to feet
      duration: Math.round(totalDuration), // In seconds
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
    const duration = travelMode === 'biking' ? edge.bikeTime : edge.walkTime
    
    return {
      type: 'street_following',
      coordinates: edge.coordinates,
      distance: edge.distance, // meters
      duration: duration + this.intersectionDelay, // Add intersection time
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