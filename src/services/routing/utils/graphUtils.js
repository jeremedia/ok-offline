/**
 * Graph theory utilities for BRC street network routing
 */

import { haversineDistance } from './geoUtils.js'

/**
 * Priority Queue implementation for A* pathfinding
 */
export class PriorityQueue {
  constructor() {
    this.heap = []
    this.indexOf = new Map() // Track element positions for fast updates
  }

  isEmpty() {
    return this.heap.length === 0
  }

  enqueue(item, priority) {
    const entry = { item, priority, index: this.heap.length }
    this.heap.push(entry)
    this.indexOf.set(item.id || item, this.heap.length - 1)
    this._bubbleUp(this.heap.length - 1)
  }

  dequeue() {
    if (this.isEmpty()) return null

    const root = this.heap[0]
    const end = this.heap.pop()

    if (this.heap.length > 0) {
      this.heap[0] = end
      this.indexOf.set(end.item.id || end.item, 0)
      this._sinkDown(0)
    }

    this.indexOf.delete(root.item.id || root.item)
    return root.item
  }

  contains(item) {
    return this.indexOf.has(item.id || item)
  }

  updatePriority(item, newPriority) {
    const index = this.indexOf.get(item.id || item)
    if (index !== undefined) {
      const oldPriority = this.heap[index].priority
      this.heap[index].priority = newPriority
      
      if (newPriority < oldPriority) {
        this._bubbleUp(index)
      } else {
        this._sinkDown(index)
      }
    }
  }

  _bubbleUp(index) {
    while (index > 0) {
      const parentIndex = Math.floor((index - 1) / 2)
      if (this.heap[parentIndex].priority <= this.heap[index].priority) break
      
      this._swap(parentIndex, index)
      index = parentIndex
    }
  }

  _sinkDown(index) {
    const length = this.heap.length
    
    while (true) {
      let smallest = index
      const leftChild = 2 * index + 1
      const rightChild = 2 * index + 2
      
      if (leftChild < length && this.heap[leftChild].priority < this.heap[smallest].priority) {
        smallest = leftChild
      }
      
      if (rightChild < length && this.heap[rightChild].priority < this.heap[smallest].priority) {
        smallest = rightChild
      }
      
      if (smallest === index) break
      
      this._swap(index, smallest)
      index = smallest
    }
  }

  _swap(i, j) {
    const temp = this.heap[i]
    this.heap[i] = this.heap[j]
    this.heap[j] = temp
    
    // Update position tracking
    this.indexOf.set(this.heap[i].item.id || this.heap[i].item, i)
    this.indexOf.set(this.heap[j].item.id || this.heap[j].item, j)
  }
}

/**
 * Graph data structures for street network
 */
export class NetworkNode {
  constructor(id, coordinates, streetNames = []) {
    this.id = id
    this.coordinates = coordinates // [latitude, longitude] - Leaflet/app format
    this.streetNames = streetNames
    this.connectedEdges = new Set()
    this.nodeType = this._determineNodeType(streetNames)
    this.brcAddress = this._generateBRCAddress(streetNames)
  }

  _determineNodeType(streetNames) {
    if (streetNames.length === 0) return 'isolated'
    if (streetNames.length === 1) return 'endpoint'
    if (streetNames.length === 2) return 'intersection'
    return 'junction' // 3+ streets meeting
  }

  _generateBRCAddress(streetNames) {
    // Generate BRC address like "4:30 & Kilgore"
    const radialStreet = streetNames.find(name => /^\d+:\d+$/.test(name))
    const arcStreet = streetNames.find(name => !/^\d+:\d+$/.test(name))
    
    if (radialStreet && arcStreet) {
      return `${radialStreet} & ${arcStreet}`
    } else if (radialStreet) {
      return radialStreet
    } else if (arcStreet) {
      return arcStreet
    } else {
      return streetNames.join(' & ')
    }
  }

  addConnectedEdge(edgeId) {
    this.connectedEdges.add(edgeId)
  }

  removeConnectedEdge(edgeId) {
    this.connectedEdges.delete(edgeId)
  }
}

export class NetworkEdge {
  constructor(id, fromNodeId, toNodeId, coordinates, streetName, streetType, width = 20) {
    this.id = id
    this.fromNodeId = fromNodeId
    this.toNodeId = toNodeId
    this.coordinates = coordinates // Array of [latitude, longitude] points - Leaflet/app format
    this.streetName = streetName
    this.streetType = streetType // 'radial' or 'arc'
    this.width = parseInt(width) // Street width in feet
    
    // Calculate derived properties in correct order
    this.distance = this._calculateDistance()
    this.speedMultiplier = this._getSpeedMultiplier() // MUST be before time calculations
    this.walkTime = this._calculateWalkTime()
    this.bikeTime = this._calculateBikeTime()
    
    // Routing properties
    this.restrictions = new Set()
  }

  _calculateDistance() {
    let distance = 0
    for (let i = 0; i < this.coordinates.length - 1; i++) {
      distance += haversineDistance(this.coordinates[i], this.coordinates[i + 1])
    }
    return distance // in meters
  }

  _calculateWalkTime() {
    // Walking speed: ~4 ft/sec on streets (slower than open playa due to intersections)
    const walkingSpeedFeetPerSecond = 4 * this.speedMultiplier
    const distanceInFeet = this.distance * 3.28084
    return distanceInFeet / walkingSpeedFeetPerSecond // in seconds
  }

  _calculateBikeTime() {
    // Biking speed: ~10 ft/sec on streets (accounting for intersections and crowds)
    const bikingSpeedFeetPerSecond = 10 * this.speedMultiplier
    const distanceInFeet = this.distance * 3.28084
    return distanceInFeet / bikingSpeedFeetPerSecond // in seconds
  }

  _getSpeedMultiplier() {
    // Speed multipliers based on street characteristics
    if (this.streetType === 'radial') {
      // Radial streets are generally faster (fewer cross-traffic)
      if (this.width >= 40) return 1.1 // Major radials
      return 1.0
    } else if (this.streetType === 'arc') {
      // Arc streets may have more cross-traffic and camps
      if (this.streetName === 'Esplanade') return 0.9 // Busy perimeter
      if (this.width >= 50) return 1.0 // Major arc streets
      return 0.95 // Minor arc streets
    }
    
    return 1.0 // Default
  }

  getOtherNodeId(nodeId) {
    return nodeId === this.fromNodeId ? this.toNodeId : this.fromNodeId
  }

  addRestriction(restriction) {
    this.restrictions.add(restriction)
  }

  removeRestriction(restriction) {
    this.restrictions.delete(restriction)
  }

  isRestricted(mode = 'walking') {
    // Check for mode-specific restrictions
    if (mode === 'biking' && this.restrictions.has('no_bikes')) return true
    if (this.restrictions.has('closed')) return true
    if (this.restrictions.has('emergency_only')) return true
    
    return false
  }
}

/**
 * BRC Street Network graph container
 */
export class BRCStreetNetwork {
  constructor() {
    this.nodes = new Map() // nodeId -> NetworkNode
    this.edges = new Map() // edgeId -> NetworkEdge
    this.streetIndex = new Map() // streetName -> Set<edgeId>
    this.spatialIndex = new Map() // For quick spatial lookups
    this.isBuilt = false
  }

  addNode(node) {
    this.nodes.set(node.id, node)
    
    // Add to spatial index for quick lookups
    const spatialKey = this._getSpatialKey(node.coordinates)
    if (!this.spatialIndex.has(spatialKey)) {
      this.spatialIndex.set(spatialKey, new Set())
    }
    this.spatialIndex.get(spatialKey).add(node.id)
  }

  addEdge(edge) {
    this.edges.set(edge.id, edge)
    
    // Update street index
    if (!this.streetIndex.has(edge.streetName)) {
      this.streetIndex.set(edge.streetName, new Set())
    }
    this.streetIndex.get(edge.streetName).add(edge.id)
    
    // Connect to nodes
    const fromNode = this.nodes.get(edge.fromNodeId)
    const toNode = this.nodes.get(edge.toNodeId)
    
    if (fromNode) fromNode.addConnectedEdge(edge.id)
    if (toNode) toNode.addConnectedEdge(edge.id)
  }

  getNode(nodeId) {
    return this.nodes.get(nodeId)
  }

  getEdge(edgeId) {
    return this.edges.get(edgeId)
  }

  getStreetEdges(streetName) {
    const edgeIds = this.streetIndex.get(streetName)
    return edgeIds ? Array.from(edgeIds).map(id => this.edges.get(id)) : []
  }

  findNearestNode(coordinates, maxDistance = 100) {
    // Find nearest node within maxDistance meters
    let nearestNode = null
    let minDistance = maxDistance

    // Use spatial index for efficiency
    const spatialKeys = this._getNearbySpacialKeys(coordinates)
    
    for (const key of spatialKeys) {
      const nodeIds = this.spatialIndex.get(key) || new Set()
      
      for (const nodeId of nodeIds) {
        const node = this.nodes.get(nodeId)
        if (node) {
          const distance = haversineDistance(coordinates, node.coordinates)
          if (distance < minDistance) {
            minDistance = distance
            nearestNode = node
          }
        }
      }
    }

    return nearestNode
  }

  findEdgesBetweenNodes(nodeId1, nodeId2) {
    const node1 = this.nodes.get(nodeId1)
    if (!node1) return []

    const connectedEdges = []
    for (const edgeId of node1.connectedEdges) {
      const edge = this.edges.get(edgeId)
      if (edge && (edge.getOtherNodeId(nodeId1) === nodeId2)) {
        connectedEdges.push(edge)
      }
    }

    return connectedEdges
  }

  _getSpatialKey(coordinates, precision = 0.001) {
    // Create spatial grid key for efficient spatial indexing
    const [lon, lat] = coordinates
    const lonKey = Math.floor(lon / precision)
    const latKey = Math.floor(lat / precision)
    return `${lonKey},${latKey}`
  }

  _getNearbySpacialKeys(coordinates, radius = 2) {
    // Get surrounding spatial grid keys
    const centerKey = this._getSpatialKey(coordinates)
    const [centerLon, centerLat] = centerKey.split(',').map(Number)
    
    const keys = []
    for (let lonOffset = -radius; lonOffset <= radius; lonOffset++) {
      for (let latOffset = -radius; latOffset <= radius; latOffset++) {
        keys.push(`${centerLon + lonOffset},${centerLat + latOffset}`)
      }
    }
    
    return keys
  }

  /**
   * Get edges connected to a specific node (required by pathfinder)
   */
  getNodeEdges(nodeId) {
    const node = this.nodes.get(nodeId)
    if (!node) return []
    
    return Array.from(node.connectedEdges).map(edgeId => this.edges.get(edgeId)).filter(Boolean)
  }

  getNetworkStats() {
    return {
      nodes: this.nodes.size,
      edges: this.edges.size,
      streets: this.streetIndex.size,
      intersections: Array.from(this.nodes.values()).filter(n => n.nodeType === 'intersection').length,
      radialStreets: Array.from(this.streetIndex.keys()).filter(name => /^\d+:\d+$/.test(name)).length,
      arcStreets: Array.from(this.streetIndex.keys()).filter(name => !/^\d+:\d+$/.test(name)).length,
      totalDistance: Array.from(this.edges.values()).reduce((sum, edge) => sum + edge.distance, 0),
      isBuilt: this.isBuilt
    }
  }

  markAsBuilt() {
    this.isBuilt = true
    console.log('✅ BRC Street Network built:', this.getNetworkStats())
  }
}