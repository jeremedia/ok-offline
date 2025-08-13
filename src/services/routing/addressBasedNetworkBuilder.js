/**
 * Address-Based Street Network Builder
 * 
 * Generates BRC street network using the same coordinate system as camp placement.
 * This solves the fundamental coordinate system mismatch that prevented pathfinding
 * from finding intersections near camps.
 * 
 * Key Innovation: Instead of using raw GIS geometry, this generates all valid BRC
 * intersections using the smart address resolution system and connects them using
 * GIS topology data.
 */

import { NetworkNode, NetworkEdge, BRCStreetNetwork } from './utils/graphUtils.js'
import { brcAddressToLatLon } from '../../utils/geocoding.js'
import { isPhysicalIntersection, RADIAL_STREET_REACH, AVENUE_ORDER } from '../../utils/radialStreetMapping.js'
import { getStreetLines, getGISYear } from '../../services/gisData.js'
import { haversineDistance } from './utils/geoUtils.js'

export class AddressBasedNetworkBuilder {
  constructor() {
    this.network = new BRCStreetNetwork()
    this.nodeIdCounter = 0
    this.edgeIdCounter = 0
    
    // Store mapping between address strings and node IDs
    this.addressToNodeId = new Map()
    this.nodeIdToAddress = new Map()
    
    // Store GIS street data for edge generation
    this.gisStreetData = null
  }

  /**
   * Build complete street network using address-based approach
   * @param {Object} gisData - GIS data containing street lines
   * @returns {BRCStreetNetwork} Complete street network with address-based nodes
   */
  async buildAddressBasedNetwork(gisData) {
    console.log('🚧 Building BRC street network using address-based approach...')
    
    if (!gisData?.streetLines?.features) {
      throw new Error('Invalid GIS data: missing streetLines.features')
    }

    const startTime = performance.now()
    this.gisStreetData = gisData.streetLines
    
    try {
      // Step 1: Generate all valid BRC intersection nodes
      this._generateIntersectionNodes()
      console.log(`📍 Generated ${this.network.nodes.size} intersection nodes using BRC addressing`)
      
      // Step 2: Connect nodes using GIS street topology
      this._connectNodesUsingGISTopology()
      console.log(`🛣️  Created ${this.network.edges.size} street edges using GIS topology`)
      
      // Step 3: Validate network connectivity
      this._validateAddressBasedNetwork()
      console.log(`✅ Network validation complete`)
      
      const buildTime = performance.now() - startTime
      console.log(`🎯 Address-based street network built in ${Math.round(buildTime)}ms`)
      
      this.network.markAsBuilt()
      return this.network
      
    } catch (error) {
      console.error('❌ Failed to build address-based street network:', error)
      throw error
    }
  }

  /**
   * Generate all valid BRC intersection nodes using address resolution
   * This uses the SAME coordinate system as camp placement
   */
  _generateIntersectionNodes() {
    console.log('📍 Generating intersection nodes from valid BRC addresses...')
    
    let successfulNodes = 0
    let failedNodes = 0
    const failedAddresses = []
    
    // Generate nodes for all valid radial/avenue combinations
    Object.keys(RADIAL_STREET_REACH).forEach(clockTime => {
      AVENUE_ORDER.forEach(avenue => {
        // Check if this is a valid physical intersection
        if (isPhysicalIntersection(clockTime, avenue)) {
          const address = `${clockTime} & ${avenue}`
          
          // Use the SAME geocoding function as camp placement
          const coords = brcAddressToLatLon(address)
          
          if (coords) {
            // Create meaningful node ID based on address
            const nodeId = `${clockTime}&${avenue}`
            const streetNames = [clockTime, avenue]
            
            const node = new NetworkNode(nodeId, coords, streetNames)
            this.network.addNode(node)
            
            // Store address mapping for edge generation
            this.addressToNodeId.set(address, nodeId)
            this.nodeIdToAddress.set(nodeId, address)
            
            successfulNodes++
          } else {
            failedNodes++
            failedAddresses.push(address)
          }
        }
      })
    })
    
    console.log(`📊 Node generation results:`)
    console.log(`   ✅ Successful: ${successfulNodes} nodes`)
    console.log(`   ❌ Failed: ${failedNodes} nodes`)
    
    if (failedAddresses.length > 0 && failedAddresses.length <= 10) {
      console.log(`   Failed addresses: ${failedAddresses.join(', ')}`)
    }
  }

  /**
   * Connect intersection nodes using deterministic BRC street order
   * Uses known avenue and radial sequences instead of geometric sorting
   */
  _connectNodesUsingGISTopology() {
    console.log('🛣️  Connecting nodes using deterministic BRC street order...')
    
    let edgesCreated = 0
    
    // Connect radial streets (2:00, 2:15, etc.)
    edgesCreated += this._connectRadialStreets()
    
    // Connect avenue streets (Esplanade, A, B, etc.)  
    edgesCreated += this._connectAvenueStreets()
    
    console.log(`🛣️  Created ${edgesCreated} street edges`)
  }

  /**
   * Connect nodes along radial streets using known avenue order
   */
  _connectRadialStreets() {
    let edgesCreated = 0
    
    // For each radial street, connect intersections in avenue order
    Object.keys(RADIAL_STREET_REACH).forEach(clockTime => {
      const streetReach = RADIAL_STREET_REACH[clockTime]
      const startIndex = AVENUE_ORDER.indexOf(streetReach.innerLimit)
      const endIndex = AVENUE_ORDER.indexOf(streetReach.outerLimit)
      
      // Connect consecutive intersections along this radial
      for (let i = startIndex; i < endIndex; i++) {
        const fromAvenue = AVENUE_ORDER[i]
        const toAvenue = AVENUE_ORDER[i + 1]
        
        const fromNodeId = `${clockTime}&${fromAvenue}`
        const toNodeId = `${clockTime}&${toAvenue}`
        
        const fromNode = this.network.getNode(fromNodeId)
        const toNode = this.network.getNode(toNodeId)
        
        if (fromNode && toNode) {
          // Create edge from inner to outer
          const edgeId1 = this._generateEdgeId()
          const edgeCoords = this._generateEdgeCoordinates(fromNode, toNode)
          const edge1 = new NetworkEdge(
            edgeId1,
            fromNode.id,
            toNode.id,
            edgeCoords,
            clockTime,
            'radial',
            '20'
          )
          
          // DEBUG: Check for NaN in edge creation
          if (isNaN(edge1.distance) || isNaN(edge1.walkTime)) {
            console.error(`🚨 NaN Edge Detected: ${fromNode.id} → ${toNode.id}`)
            console.error(`   Coordinates:`, edgeCoords)
            console.error(`   Distance: ${edge1.distance}`)
            console.error(`   WalkTime: ${edge1.walkTime}`)
          }
          this.network.addEdge(edge1)
          
          // Create edge from outer to inner (bidirectional)
          const edgeId2 = this._generateEdgeId()
          const edge2 = new NetworkEdge(
            edgeId2,
            toNode.id,
            fromNode.id,
            this._generateEdgeCoordinates(toNode, fromNode),
            clockTime,
            'radial',
            '20'
          )
          this.network.addEdge(edge2)
          
          if (edgesCreated < 3) {
            console.log(`🔗 Created bidirectional radial edges: ${fromNode.id} ↔ ${toNode.id} via ${clockTime}`)
          }
          
          edgesCreated += 2 // Count both directions
        }
      }
    })
    
    console.log(`   📍 Connected ${edgesCreated} radial street segments`)
    return edgesCreated
  }

  /**
   * Connect nodes along avenue streets using known radial order
   */
  _connectAvenueStreets() {
    let edgesCreated = 0
    
    // For each avenue, connect intersections in clock order
    AVENUE_ORDER.forEach(avenue => {
      const radialOrder = Object.keys(RADIAL_STREET_REACH)
        .filter(clockTime => isPhysicalIntersection(clockTime, avenue))
        .sort((a, b) => {
          // Sort by clock time (2:00, 2:15, 2:30, etc.)
          const [aHour, aMin] = a.split(':').map(Number)
          const [bHour, bMin] = b.split(':').map(Number)
          return (aHour * 60 + aMin) - (bHour * 60 + bMin)
        })
      
      // Connect consecutive intersections along this avenue
      for (let i = 0; i < radialOrder.length - 1; i++) {
        const fromClock = radialOrder[i]
        const toClock = radialOrder[i + 1]
        
        const fromNodeId = `${fromClock}&${avenue}`
        const toNodeId = `${toClock}&${avenue}`
        
        const fromNode = this.network.getNode(fromNodeId)
        const toNode = this.network.getNode(toNodeId)
        
        if (fromNode && toNode) {
          // Create edge clockwise
          const edgeId1 = this._generateEdgeId()
          const edgeCoords = this._generateEdgeCoordinates(fromNode, toNode)
          const edge1 = new NetworkEdge(
            edgeId1,
            fromNode.id,
            toNode.id,
            edgeCoords,
            avenue,
            'avenue',
            '20'
          )
          
          // DEBUG: Check for NaN in avenue edge creation
          if (isNaN(edge1.distance) || isNaN(edge1.walkTime)) {
            console.error(`🚨 NaN Avenue Edge Detected: ${fromNode.id} → ${toNode.id}`)
            console.error(`   Coordinates:`, edgeCoords)
            console.error(`   Distance: ${edge1.distance}`)
            console.error(`   WalkTime: ${edge1.walkTime}`)
          }
          this.network.addEdge(edge1)
          
          // Create edge counterclockwise (bidirectional)
          const edgeId2 = this._generateEdgeId()
          const edge2 = new NetworkEdge(
            edgeId2,
            toNode.id,
            fromNode.id,
            this._generateEdgeCoordinates(toNode, fromNode),
            avenue,
            'avenue',
            '20'
          )
          this.network.addEdge(edge2)
          
          edgesCreated += 2 // Count both directions
        }
      }
    })
    
    console.log(`   🌉 Connected ${edgesCreated} avenue street segments`)
    return edgesCreated
  }


  /**
   * Find GIS segment data for a street name
   */
  _findGISSegmentForStreet(streetName) {
    if (!this.gisStreetData) return null
    
    // Look for exact name match in GIS features
    for (const feature of this.gisStreetData.features) {
      if (feature.properties?.name === streetName) {
        return feature
      }
    }
    
    return null
  }

  /**
   * Generate coordinate path between two nodes
   */
  _generateEdgeCoordinates(fromNode, toNode) {
    // Return coordinates in [lat, lng] format for Leaflet display
    // Node coordinates are already in [lat, lng] format from brcAddressToLatLon()
    return [
      fromNode.coordinates, // [lat, lng] for Leaflet
      toNode.coordinates    // [lat, lng] for Leaflet
    ]
  }

  /**
   * Validate the address-based network
   */
  _validateAddressBasedNetwork() {
    const stats = this.network.getNetworkStats()
    
    console.log(`📊 Address-Based Network Statistics:`)
    console.log(`   Nodes: ${stats.intersections}`)
    console.log(`   Edges: ${stats.edges}`)
    console.log(`   Address mappings: ${this.addressToNodeId.size}`)
    
    // Validate that we have nodes in expected ranges
    const expectedIntersections = this._calculateExpectedIntersections()
    console.log(`   Expected intersections: ${expectedIntersections}`)
    
    if (stats.intersections < expectedIntersections * 0.8) {
      console.warn(`⚠️  Low intersection count: got ${stats.intersections}, expected ~${expectedIntersections}`)
    }
    
    // Check for orphaned nodes
    const orphanedNodes = Array.from(this.network.nodes.values())
      .filter(node => node.connectedEdges.size === 0)
    
    if (orphanedNodes.length > 0) {
      console.warn(`⚠️  Found ${orphanedNodes.length} orphaned nodes`)
    }
    
    // Validate BRC addressing coverage
    this._validateBRCAddressingCoverage()
  }

  /**
   * Calculate expected number of intersections based on radial street mapping
   */
  _calculateExpectedIntersections() {
    let count = 0
    
    Object.keys(RADIAL_STREET_REACH).forEach(clockTime => {
      AVENUE_ORDER.forEach(avenue => {
        if (isPhysicalIntersection(clockTime, avenue)) {
          count++
        }
      })
    })
    
    return count
  }

  /**
   * Validate that address-based network covers expected BRC patterns
   */
  _validateBRCAddressingCoverage() {
    const nodeAddresses = Array.from(this.nodeIdToAddress.values())
    
    // Check coverage of hour streets
    const hourStreets = Object.keys(RADIAL_STREET_REACH).filter(time => 
      time.includes(':00') || time.includes(':30')
    )
    const quarterHourStreets = Object.keys(RADIAL_STREET_REACH).filter(time => 
      time.includes(':15') || time.includes(':45')
    )
    
    let hourStreetCoverage = 0
    let quarterHourCoverage = 0
    
    hourStreets.forEach(street => {
      const hasNodes = nodeAddresses.some(addr => addr.includes(street))
      if (hasNodes) hourStreetCoverage++
    })
    
    quarterHourStreets.forEach(street => {
      const hasNodes = nodeAddresses.some(addr => addr.includes(street))
      if (hasNodes) quarterHourCoverage++
    })
    
    console.log(`📊 BRC Street Coverage:`)
    console.log(`   Hour streets: ${hourStreetCoverage}/${hourStreets.length}`)
    console.log(`   Quarter-hour streets: ${quarterHourCoverage}/${quarterHourStreets.length}`)
    
    // Validate avenue coverage
    let avenueCoverage = 0
    AVENUE_ORDER.forEach(avenue => {
      const hasNodes = nodeAddresses.some(addr => addr.includes(avenue))
      if (hasNodes) avenueCoverage++
    })
    
    console.log(`   Avenue coverage: ${avenueCoverage}/${AVENUE_ORDER.length}`)
  }

  /**
   * Generate unique edge ID
   */
  _generateEdgeId() {
    return `edge_${++this.edgeIdCounter}`
  }

  /**
   * Get mapping between addresses and node IDs (for debugging)
   */
  getAddressMapping() {
    return {
      addressToNodeId: Object.fromEntries(this.addressToNodeId),
      nodeIdToAddress: Object.fromEntries(this.nodeIdToAddress)
    }
  }

  /**
   * Find node by BRC address (for testing/debugging)
   */
  findNodeByAddress(address) {
    const nodeId = this.addressToNodeId.get(address)
    return nodeId ? this.network.getNode(nodeId) : null
  }

  /**
   * Export network in format compatible with existing caching system
   */
  exportNetwork() {
    return {
      nodes: Array.from(this.network.nodes.entries()),
      edges: Array.from(this.network.edges.entries()),
      streetIndex: Array.from(this.network.streetIndex.entries()),
      stats: this.network.getNetworkStats(),
      addressMapping: this.getAddressMapping(),
      buildTimestamp: new Date().toISOString(),
      buildMethod: 'address-based'
    }
  }
}