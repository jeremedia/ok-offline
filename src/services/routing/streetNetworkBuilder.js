/**
 * BRC Street Network Builder
 * 
 * Parses GIS LineString data into a routable graph structure with nodes and edges.
 * Handles BRC's unique polar coordinate street system (radials and arcs).
 */

import { NetworkNode, NetworkEdge, BRCStreetNetwork } from './utils/graphUtils.js'
import { haversineDistance, getClockAddress } from './utils/geoUtils.js'

export class StreetNetworkBuilder {
  constructor() {
    this.network = new BRCStreetNetwork()
    this.intersectionThreshold = 5 // meters - how close points need to be to be considered same intersection
    this.nodeIdCounter = 0
    this.edgeIdCounter = 0
    
    // Temporary storage during building
    this.rawEdges = [] // Store edges before connecting to nodes
    this.intersectionCandidates = new Map() // Store potential intersection points
  }

  /**
   * Build complete street network from GIS data
   * @param {Object} gisData - GIS data containing streetLines
   * @returns {BRCStreetNetwork} Complete street network graph
   */
  async buildNetworkFromGIS(gisData) {
    console.log('🚧 Building BRC street network from GIS data...')
    
    if (!gisData?.streetLines?.features) {
      throw new Error('Invalid GIS data: missing streetLines.features')
    }

    const startTime = performance.now()
    
    try {
      // Step 1: Parse street segments from GIS LineStrings
      this._parseStreetSegments(gisData.streetLines.features)
      console.log(`📏 Parsed ${this.rawEdges.length} street segments`)
      
      // Step 2: Find intersection points  
      this._findIntersections()
      console.log(`🔄 Found ${this.intersectionCandidates.size} intersection candidates`)
      
      // Step 3: Create intersection nodes
      this._createIntersectionNodes()
      console.log(`📍 Created ${this.network.nodes.size} intersection nodes`)
      
      // Step 4: Create street edges connecting nodes
      this._createNetworkEdges()
      console.log(`🛣️  Created ${this.network.edges.size} street edges`)
      
      // Step 5: Validate and optimize network
      this._validateNetwork()
      console.log(`✅ Network validation complete`)
      
      const buildTime = performance.now() - startTime
      console.log(`🎯 Street network built in ${Math.round(buildTime)}ms`)
      
      this.network.markAsBuilt()
      return this.network
      
    } catch (error) {
      console.error('❌ Failed to build street network:', error)
      throw error
    }
  }

  /**
   * Parse street segments from GIS LineString features
   */
  _parseStreetSegments(features) {
    for (const feature of features) {
      if (!feature.geometry?.coordinates || feature.geometry.type !== 'LineString') {
        continue
      }

      const properties = feature.properties || {}
      const coordinates = feature.geometry.coordinates
      const streetName = properties.name || 'Unknown'
      const streetType = properties.type || 'unknown'
      const width = properties.width || '20'

      // Create raw edge (not yet connected to nodes)
      const rawEdge = {
        coordinates,
        streetName,
        streetType,
        width,
        startPoint: coordinates[0],
        endPoint: coordinates[coordinates.length - 1],
        originalFeature: feature
      }

      this.rawEdges.push(rawEdge)
    }
  }

  /**
   * Find intersection points where street segments meet
   */
  _findIntersections() {
    // Clear existing candidates
    this.intersectionCandidates.clear()
    
    for (const edge of this.rawEdges) {
      this._addPointToIntersectionCandidates(edge.startPoint, edge)
      this._addPointToIntersectionCandidates(edge.endPoint, edge)
    }

    // Filter to keep only actual intersections (2+ edges)
    const validIntersections = new Map()
    for (const [pointKey, candidate] of this.intersectionCandidates.entries()) {
      if (candidate.connectedEdges.length >= 2) {
        validIntersections.set(pointKey, candidate)
      }
    }
    
    this.intersectionCandidates = validIntersections
  }

  /**
   * Add a point to intersection candidates, grouping nearby points
   */
  _addPointToIntersectionCandidates(point, edge) {
    const [lon, lat] = point
    
    // Look for nearby existing points
    let foundGroup = null
    let minDistance = this.intersectionThreshold
    
    for (const [existingKey, candidate] of this.intersectionCandidates.entries()) {
      const distance = haversineDistance(point, candidate.coordinates)
      
      if (distance < minDistance) {
        minDistance = distance
        foundGroup = existingKey
      }
    }

    if (foundGroup) {
      // Add to existing group
      const candidate = this.intersectionCandidates.get(foundGroup)
      candidate.connectedEdges.push(edge)
      
      // Update street names set
      if (!candidate.streetNames.includes(edge.streetName)) {
        candidate.streetNames.push(edge.streetName)
      }
    } else {
      // Create new group
      const pointKey = `${lon.toFixed(6)},${lat.toFixed(6)}`
      this.intersectionCandidates.set(pointKey, {
        coordinates: [lat, lon], // Convert from GeoJSON [lng, lat] to app [lat, lng] format
        streetNames: [edge.streetName],
        connectedEdges: [edge]
      })
    }
  }

  /**
   * Create intersection nodes from intersection candidates
   */
  _createIntersectionNodes() {
    for (const [pointKey, candidate] of this.intersectionCandidates.entries()) {
      const nodeId = this._generateNodeId()
      const streetNames = candidate.streetNames
      
      const node = new NetworkNode(nodeId, candidate.coordinates, streetNames)
      this.network.addNode(node)
      
      // Store reference for edge creation
      candidate.nodeId = nodeId
    }
  }

  /**
   * Create network edges connecting intersection nodes
   */
  _createNetworkEdges() {
    for (const rawEdge of this.rawEdges) {
      // Find nodes for start and end points
      const startNode = this._findNodeForPoint(rawEdge.startPoint)
      const endNode = this._findNodeForPoint(rawEdge.endPoint)

      if (!startNode || !endNode) {
        console.warn(`⚠️  Orphaned edge: ${rawEdge.streetName} (missing nodes)`)
        continue
      }

      // Create network edge
      const edgeId = this._generateEdgeId()
      // Convert coordinates from GeoJSON [lng, lat] to app [lat, lng] format
      const convertedCoords = rawEdge.coordinates.map(([lng, lat]) => [lat, lng])
      const networkEdge = new NetworkEdge(
        edgeId,
        startNode.nodeId,
        endNode.nodeId,
        convertedCoords,
        rawEdge.streetName,
        rawEdge.streetType,
        rawEdge.width
      )

      this.network.addEdge(networkEdge)
    }
  }

  /**
   * Find the intersection node closest to a given point
   */
  _findNodeForPoint(point) {
    let closestCandidate = null
    let minDistance = this.intersectionThreshold

    for (const [pointKey, candidate] of this.intersectionCandidates.entries()) {
      const distance = haversineDistance(point, candidate.coordinates)
      if (distance < minDistance) {
        minDistance = distance
        closestCandidate = candidate
      }
    }

    return closestCandidate
  }

  /**
   * Validate network connectivity and structure
   */
  _validateNetwork() {
    const stats = this.network.getNetworkStats()
    
    // Check for orphaned nodes
    const orphanedNodes = Array.from(this.network.nodes.values())
      .filter(node => node.connectedEdges.size === 0)
    
    if (orphanedNodes.length > 0) {
      console.warn(`⚠️  Found ${orphanedNodes.length} orphaned nodes`)
    }

    // Check for disconnected components
    const visited = new Set()
    const components = []
    
    for (const [nodeId] of this.network.nodes) {
      if (!visited.has(nodeId)) {
        const component = this._exploreComponent(nodeId, visited)
        components.push(component)
      }
    }

    if (components.length > 1) {
      console.warn(`⚠️  Network has ${components.length} disconnected components`)
      components.forEach((comp, i) => {
        console.log(`   Component ${i + 1}: ${comp.size} nodes`)
      })
    }

    // Validate BRC-specific patterns
    this._validateBRCPatterns(stats)
  }

  /**
   * Validate BRC-specific street patterns
   */
  _validateBRCPatterns(stats) {
    // Check for expected BRC street patterns
    const expectedRadials = ['2:00', '2:15', '2:30', '2:45', '3:00', '3:15', '3:30', '3:45',
                            '4:00', '4:15', '4:30', '4:45', '5:00', '5:15', '5:30', '5:45',
                            '6:00', '6:15', '6:30', '6:45', '7:00', '7:15', '7:30', '7:45',
                            '8:00', '8:15', '8:30', '8:45', '9:00', '9:15', '9:30', '9:45',
                            '10:00']

    const expectedArcs = ['Esplanade', 'Kilgore', 'Jemison', 'Ishiguro', 'Herbert', 'Gibson', 'Farmer',
                         'Atwood', 'Bradbury', 'Cherryh', 'Dick', 'Ellison']

    const foundRadials = Array.from(this.network.streetIndex.keys())
      .filter(name => /^\d+:\d+$/.test(name))
    
    const foundArcs = Array.from(this.network.streetIndex.keys())
      .filter(name => !/^\d+:\d+$/.test(name))

    console.log(`📊 BRC Street Pattern Analysis:`)
    console.log(`   Radial streets: ${foundRadials.length}/${expectedRadials.length}`)
    console.log(`   Arc streets: ${foundArcs.length}/${expectedArcs.length}`)
    
    // Check for major missing streets
    const missingRadials = expectedRadials.filter(name => !foundRadials.includes(name))
    const missingArcs = expectedArcs.filter(name => !foundArcs.includes(name))
    
    if (missingRadials.length > 0) {
      console.log(`   Missing radials: ${missingRadials.slice(0, 5).join(', ')}${missingRadials.length > 5 ? '...' : ''}`)
    }
    
    if (missingArcs.length > 0) {
      console.log(`   Missing arcs: ${missingArcs.slice(0, 5).join(', ')}${missingArcs.length > 5 ? '...' : ''}`)
    }
  }

  /**
   * Explore connected component using DFS
   */
  _exploreComponent(startNodeId, visited) {
    const component = new Set()
    const stack = [startNodeId]

    while (stack.length > 0) {
      const nodeId = stack.pop()
      
      if (visited.has(nodeId)) continue
      
      visited.add(nodeId)
      component.add(nodeId)
      
      const node = this.network.getNode(nodeId)
      if (node) {
        // Add connected nodes to stack
        for (const edgeId of node.connectedEdges) {
          const edge = this.network.getEdge(edgeId)
          if (edge) {
            const otherNodeId = edge.getOtherNodeId(nodeId)
            if (!visited.has(otherNodeId)) {
              stack.push(otherNodeId)
            }
          }
        }
      }
    }

    return component
  }

  /**
   * Generate unique node ID
   */
  _generateNodeId() {
    return `node_${++this.nodeIdCounter}`
  }

  /**
   * Generate unique edge ID
   */
  _generateEdgeId() {
    return `edge_${++this.edgeIdCounter}`
  }

  /**
   * Get network building progress for UI feedback
   */
  getProgress() {
    return {
      phase: this.network.isBuilt ? 'complete' : 'building',
      rawEdges: this.rawEdges.length,
      intersections: this.intersectionCandidates.size,
      nodes: this.network.nodes.size,
      edges: this.network.edges.size
    }
  }

  /**
   * Export network for debugging or caching
   */
  exportNetwork() {
    return {
      nodes: Array.from(this.network.nodes.entries()),
      edges: Array.from(this.network.edges.entries()),
      streetIndex: Array.from(this.network.streetIndex.entries()),
      stats: this.network.getNetworkStats(),
      buildTimestamp: new Date().toISOString()
    }
  }

  /**
   * Import previously built network (for caching)
   */
  importNetwork(networkData) {
    // Reconstruct network from exported data
    this.network = new BRCStreetNetwork()
    
    // Import nodes
    for (const [nodeId, nodeData] of networkData.nodes) {
      const node = new NetworkNode(nodeData.id, nodeData.coordinates, nodeData.streetNames)
      
      // Handle corrupted or invalid connectedEdges data
      if (nodeData.connectedEdges && Array.isArray(nodeData.connectedEdges)) {
        node.connectedEdges = new Set(nodeData.connectedEdges)
      } else if (nodeData.connectedEdges && typeof nodeData.connectedEdges[Symbol.iterator] === 'function') {
        node.connectedEdges = new Set(nodeData.connectedEdges)
      } else {
        console.warn(`🚧 Node ${nodeId} has invalid connectedEdges, initializing empty set`)
        node.connectedEdges = new Set()
      }
      
      this.network.addNode(node)
    }
    
    // Import edges
    for (const [edgeId, edgeData] of networkData.edges) {
      const edge = new NetworkEdge(
        edgeData.id,
        edgeData.fromNodeId,
        edgeData.toNodeId,
        edgeData.coordinates,
        edgeData.streetName,
        edgeData.streetType,
        edgeData.width
      )
      this.network.addEdge(edge)
    }
    
    this.network.markAsBuilt()
    const stats = this.network.getStats()
    console.log('✅ Network imported from cache:', networkData.stats)
    console.log('🔍 Actual imported network stats:', stats)
    
    // Validate network health - detect corrupted cache with no connectivity
    if (stats.intersections > 0 && stats.edges === 0) {
      throw new Error(`Imported network has ${stats.intersections} nodes but 0 edges - network is not connected and unusable for routing`)
    }
    
    if (stats.intersections > 50 && stats.edges < stats.intersections * 0.1) {
      throw new Error(`Imported network has very poor connectivity (${stats.edges} edges for ${stats.intersections} nodes) - likely corrupted cache`)
    }
    
    // Count nodes with empty connectedEdges (sign of corruption)
    let emptyNodes = 0
    for (const node of this.network.nodes.values()) {
      if (node.connectedEdges.size === 0) {
        emptyNodes++
      }
    }
    
    if (emptyNodes > stats.intersections * 0.5) {
      throw new Error(`Network severely corrupted: ${emptyNodes}/${stats.intersections} nodes have no connections - rebuilding required`)
    }
    
    return this.network
  }
}