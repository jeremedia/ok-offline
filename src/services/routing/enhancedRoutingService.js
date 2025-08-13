/**
 * Enhanced Routing Service for BRC
 * 
 * Integrates the intelligent routing system with existing components.
 * Provides hybrid routing that combines street-following and direct playa crossing.
 */

import { BRCZoneClassifier } from './zoneClassifier.js'
import { StreetNetworkBuilder } from './streetNetworkBuilder.js'
import { AddressBasedNetworkBuilder } from './addressBasedNetworkBuilder.js'
import { BRCPathfinder } from './pathfinder.js'
import { BRCDirectionsGenerator } from './directionsGenerator.js'
import { BRCHybridRouter } from './brcHybridRouter.js'
import { haversineDistance, metersToFeet, getClockAddress } from './utils/geoUtils.js'
import { loadAllGISData } from '../gisData.js'

export class EnhancedRoutingService {
  constructor() {
    this.zoneClassifier = null
    this.streetNetwork = null
    this.pathfinder = null
    this.directionsGenerator = null
    this.networkBuilder = null
    this.hybridRouter = null
    this.isInitialized = false
    this.networkCacheKey = 'brc_street_network_cache_address_based_v1' // Address-based network cache
    
    // Travel speed constants (feet per minute)
    this.TRAVEL_SPEEDS = {
      walking: {
        street: 240,     // 4 ft/sec = 240 ft/min (accounting for stops, intersections)
        playa: 300,      // 5 ft/sec = 300 ft/min (direct playa crossing)
      },
      biking: {
        street: 640,     // 10.7 ft/sec = 640 ft/min (accounting for stops)
        playa: 800,      // 13.3 ft/sec = 800 ft/min (direct playa crossing) 
      }
    }
  }

  /**
   * Initialize the routing system with GIS data and street network
   */
  async initialize() {
    if (this.isInitialized) return

    try {
      console.log('🚀 Initializing BRC Intelligent Routing System...')
      const startTime = performance.now()
      
      // Clean up old cache versions
      this._cleanupOldCaches()
      
      // Load GIS data
      const gisData = await loadAllGISData()
      if (!gisData) {
        throw new Error('Failed to load GIS data for routing')
      }

      // Initialize zone classifier  
      this.zoneClassifier = new BRCZoneClassifier(gisData)
      console.log('✅ Zone classifier initialized')

      // Initialize street network (with caching)
      await this._initializeStreetNetwork(gisData)
      console.log('✅ Street network initialized')

      // Initialize pathfinding and directions
      if (this.streetNetwork?.isBuilt) {
        this.pathfinder = new BRCPathfinder(this.streetNetwork)
        this.directionsGenerator = new BRCDirectionsGenerator()
        console.log('✅ Pathfinder and directions generator initialized')
      }

      // Initialize hybrid router with street pathfinder if available
      this.hybridRouter = new BRCHybridRouter(this.pathfinder)
      console.log('🔥 Revolutionary BRC Hybrid Router initialized')

      const initTime = performance.now() - startTime
      this.isInitialized = true
      
      console.log(`✅ BRC Routing System initialized in ${Math.round(initTime)}ms`)
      
    } catch (error) {
      console.error('❌ Failed to initialize BRC Routing System:', error)
      // Don't throw - allow fallback to hybrid routing
      this.isInitialized = true
    }
  }

  /**
   * Initialize street network with caching support
   */
  async _initializeStreetNetwork(gisData) {
    try {
      // Try to load cached network first
      const cachedNetwork = this._loadNetworkFromCache()
      if (cachedNetwork && cachedNetwork.buildMethod === 'address-based') {
        console.log('📦 Loading address-based street network from cache...')
        this.networkBuilder = new AddressBasedNetworkBuilder()
        
        try {
          // For now, rebuild since import not implemented yet
          console.log('🔨 Rebuilding address-based network (import not yet implemented)...')
          throw new Error('Import not implemented, rebuild required')
        } catch (cacheError) {
          console.warn('🗑️ Rebuilding address-based network...', cacheError.message)
          // Clear cache and rebuild
          this._clearNetworkCache()
          // Fall through to rebuild from GIS data
        }
      }

      // Build address-based network from scratch
      console.log('🔨 Building address-based street network from GIS data...')
      this.networkBuilder = new AddressBasedNetworkBuilder()
      this.streetNetwork = await this.networkBuilder.buildAddressBasedNetwork(gisData)
      
      // Cache the built network for next time
      this._saveNetworkToCache(this.networkBuilder.exportNetwork())
      console.log('💾 Street network cached for future use')
      
    } catch (error) {
      console.error('⚠️  Failed to build street network:', error)
      this.streetNetwork = null
    }
  }

  /**
   * Load street network from browser cache
   */
  _loadNetworkFromCache() {
    try {
      const cached = localStorage.getItem(this.networkCacheKey)
      if (cached) {
        const data = JSON.parse(cached)
        // Check if cache is recent (within 7 days)
        const cacheAge = Date.now() - new Date(data.buildTimestamp).getTime()
        if (cacheAge < 7 * 24 * 60 * 60 * 1000) {
          return data
        }
      }
    } catch (error) {
      console.warn('Failed to load network cache:', error)
    }
    return null
  }

  /**
   * Save street network to browser cache
   */
  _saveNetworkToCache(networkData) {
    try {
      localStorage.setItem(this.networkCacheKey, JSON.stringify(networkData))
    } catch (error) {
      console.warn('Failed to cache network:', error)
    }
  }

  /**
   * Clear corrupted network cache
   */
  _clearNetworkCache() {
    try {
      localStorage.removeItem(this.networkCacheKey)
      console.log('🗑️ Corrupted street network cache cleared')
    } catch (error) {
      console.warn('Failed to clear network cache:', error)
    }
  }

  /**
   * Calculate intelligent route with street-following and hybrid routing
   * @param {[number, number]} startCoords [latitude, longitude]
   * @param {[number, number]} endCoords [latitude, longitude] 
   * @param {string} mode 'walking' or 'biking'
   * @returns {Promise<Object>} Route with segments and directions
   */
  async calculateIntelligentRoute(startCoords, endCoords, mode = 'walking') {
    await this.initialize()

    const startZone = this.zoneClassifier.classifyCoordinate(startCoords)
    const endZone = this.zoneClassifier.classifyCoordinate(endCoords)
    const straightLineAnalysis = this.zoneClassifier.canStraightLine(startCoords, endCoords)

    console.log('🧭 Route Analysis:', {
      start: { zone: startZone.type, address: getClockAddress(startCoords) },
      end: { zone: endZone.type, address: getClockAddress(endCoords) },
      recommendation: straightLineAnalysis.recommendation,
      streetNetworkAvailable: !!this.pathfinder
    })

    // Try routes in order of preference
    
    // 1. Try street-following routing first (if network available and appropriate)
    if (this.pathfinder && this._shouldUseStreetRouting(startZone, endZone, straightLineAnalysis)) {
      console.log('🛣️  Attempting street-following route...')
      try {
        const streetRoute = await this._generateStreetFollowingRoute(startCoords, endCoords, mode)
        if (streetRoute) {
          console.log('✅ Street-following route successful')
          return streetRoute
        }
      } catch (error) {
        console.warn('⚠️  Street-following failed, trying hybrid routing:', error.message)
      }
    }

    // 2. Fall back to hybrid routing
    if (straightLineAnalysis.recommendation === 'hybrid') {
      console.log('🔄 Using hybrid routing (urban→playa→urban)...')
      return await this.generateHybridRoute(startCoords, endCoords, straightLineAnalysis, mode)
    }

    // 3. Use straight-line routing
    if (straightLineAnalysis.recommendation === 'straight_line') {
      console.log('➡️  Using direct playa route...')
      return this.generateStraightLineRoute(startCoords, endCoords, mode)
    }

    // 4. Default fallback
    console.log('🔄 Using enhanced straight-line routing...')
    return this.generateEnhancedStraightLineRoute(startCoords, endCoords, mode, 'fallback')
  }

  /**
   * Determine if street routing should be attempted
   */
  _shouldUseStreetRouting(startZone, endZone, analysis) {
    // Use street routing when:
    // 1. Zone classifier specifically recommends it
    // 2. Street network is available
    
    if (!this.pathfinder) return false
    
    // FIXED: Respect zone classifier's decision completely
    // If zone classifier says "hybrid", always use hybrid (don't override!)
    if (analysis.recommendation === 'hybrid') {
      console.log('🔄 Zone classifier recommends hybrid - skipping street routing')
      return false
    }
    
    // If zone classifier says "street_following", use it
    if (analysis.recommendation === 'street_following') {
      console.log('🛣️  Zone classifier recommends street-following')
      return true
    }
    
    // For straight-line routes, don't use street routing
    console.log('➡️  Zone classifier recommends direct routing - skipping street routing')
    return false
  }

  /**
   * Generate street-following route using pathfinder
   */
  async _generateStreetFollowingRoute(startCoords, endCoords, mode) {
    const route = await this.pathfinder.findRoute(startCoords, endCoords, mode)
    
    if (!route) {
      return null
    }

    // Generate turn-by-turn directions
    const directions = this.directionsGenerator ? 
      this.directionsGenerator.generateDirections(route, mode) : null

    // Convert to standard route format
    return {
      type: 'street_following',
      coordinates: route.coordinates, // Already normalized to [lat, lng] in pathfinder
      distance: route.distance, // Already in feet
      duration: route.duration, // Already in minutes from pathfinder
      mode: mode,
      
      // Street routing specific data
      streetRoute: {
        segments: route.segments,
        nodePath: route.nodePath,
        summary: route.summary
      },
      
      // Turn-by-turn directions
      directions: directions?.steps || [],
      directionsOverview: directions?.overview,
      directionsSummary: directions?.summary,
      
      // Legacy compatibility
      travelTimes: {
        walking: {
          minutes: mode === 'walking' ? route.duration : Math.round(route.duration * 1.3),
          formatted: this._formatDuration(mode === 'walking' ? route.duration * 60 : route.duration * 60 * 1.3)
        },
        biking: {
          minutes: mode === 'biking' ? route.duration : Math.round(route.duration * 0.7),
          formatted: this._formatDuration(mode === 'biking' ? route.duration * 60 : route.duration * 60 * 0.7)
        }
      },
      
      // Enhanced route metadata
      isIntelligentRoute: true,
      routingMethod: 'Street-following with turn-by-turn directions',
      
      // Summary for display
      summary: {
        totalDistance: route.distance,
        totalDuration: route.duration,
        routeType: 'Street-following navigation',
        streetsUsed: route.summary?.streets || [],
        intersections: route.summary?.intersections || 0,
        efficiency: this._calculateRouteEfficiency(startCoords, endCoords, route.distance)
      }
    }
  }

  /**
   * Calculate route efficiency compared to straight line
   */
  _calculateRouteEfficiency(startCoords, endCoords, routeDistance) {
    const straightDistance = haversineDistance(startCoords, endCoords) * 3.28084 // feet
    return Math.max(0.1, Math.min(1.0, straightDistance / routeDistance))
  }

  /**
   * Format duration from seconds to readable string
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
   * Generate pure straight-line route
   */
  generateStraightLineRoute(startCoords, endCoords, mode) {
    const distance = haversineDistance(startCoords, endCoords)
    const distanceFeet = Math.round(metersToFeet(distance))
    const speed = this.TRAVEL_SPEEDS[mode].playa
    const duration = Math.round(distance * 3.28 / speed) // Convert to minutes

    // DEBUG: Check coordinate format at route generation
    console.log('🔍 ROUTE GENERATION DEBUG:')
    console.log('  - startCoords:', startCoords)
    console.log('  - endCoords:', endCoords)
    console.log('  - coordinates array:', [startCoords, endCoords])

    return {
      type: 'straight_line',
      coordinates: [startCoords, endCoords],
      distance: distanceFeet,
      duration: duration,
      mode: mode,
      segments: [
        {
          type: 'straight_line',
          coordinates: [startCoords, endCoords], 
          distance: distanceFeet,
          duration: duration,
          instruction: `Head directly to destination (${distanceFeet}ft, ${duration} min)`
        }
      ],
      directions: [
        {
          instruction: `Head directly toward ${getClockAddress(endCoords)}`,
          distance: distanceFeet,
          duration: duration,
          coordinates: [startCoords, endCoords]
        }
      ],
      summary: {
        totalDistance: distanceFeet,
        totalDuration: duration,
        routeType: 'Direct playa crossing',
        efficiency: 1.0
      }
    }
  }

  /**
   * Generate enhanced straight-line route with zone awareness
   */
  generateEnhancedStraightLineRoute(startCoords, endCoords, mode, reason) {
    const route = this.generateStraightLineRoute(startCoords, endCoords, mode)
    
    // Add zone-specific context
    route.zoneAnalysis = {
      startZone: this.zoneClassifier.classifyCoordinate(startCoords),
      endZone: this.zoneClassifier.classifyCoordinate(endCoords),
      routingReason: reason
    }

    // Modify instructions based on zones
    if (route.zoneAnalysis.startZone.type === 'urban') {
      route.directions[0].instruction = `Exit urban area and head directly toward ${getClockAddress(endCoords)}`
    }

    return route
  }

  /**
   * Generate revolutionary hybrid route (urban → playa → urban)
   * Uses the BRCHybridRouter for mathematical waypoint optimization
   */
  async generateHybridRoute(startCoords, endCoords, analysis, mode) {
    console.log('🔥 Generating revolutionary hybrid route...')
    
    if (!this.hybridRouter) {
      console.warn('⚠️  Hybrid router not available, falling back to straight-line')
      return this.generateStraightLineRoute(startCoords, endCoords, mode)
    }
    
    // Use the revolutionary BRCHybridRouter for optimal route generation
    const hybridRoute = await this.hybridRouter.generateHybridRoute(startCoords, endCoords, mode)
    
    if (!hybridRoute) {
      console.log('❌ Hybrid router could not generate beneficial route, falling back to street-following')
      
      // Try street-following as fallback when hybrid is rejected
      if (this.pathfinder) {
        try {
          const streetRoute = await this._generateStreetFollowingRoute(startCoords, endCoords, mode)
          if (streetRoute) {
            console.log('✅ Street-following fallback successful')
            return streetRoute
          }
        } catch (error) {
          console.warn('⚠️  Street-following fallback failed:', error.message)
        }
      }
      
      // Final fallback to straight-line only if street-following also fails
      console.log('🔄 Using straight-line as final fallback')
      return this.generateStraightLineRoute(startCoords, endCoords, mode)
    }
    
    // Convert to enhanced routing service format for compatibility
    return {
      type: 'hybrid',
      coordinates: hybridRoute.coordinates,
      distance: hybridRoute.distance,
      duration: hybridRoute.duration,
      mode: hybridRoute.mode,
      segments: hybridRoute.segments,
      directions: hybridRoute.directions,
      
      // Enhanced hybrid route data
      waypoints: hybridRoute.waypoints,
      landmarks: hybridRoute.landmarks,
      artOpportunities: hybridRoute.artOpportunities,
      
      summary: {
        totalDistance: hybridRoute.distance,
        totalDuration: hybridRoute.duration,
        routeType: hybridRoute.summary.routeType,
        efficiency: hybridRoute.summary.efficiency,
        timeSavings: hybridRoute.summary.timeSavings,
        segmentBreakdown: {
          streetDistance: hybridRoute.summary.streetDistance,
          playaDistance: hybridRoute.summary.playaDistance
        }
      },
      
      // Route metadata
      isIntelligentRoute: true,
      routingMethod: 'Revolutionary Hybrid Router with Mathematical Optimization',
      hybridAnalysis: analysis
    }
  }

  /**
   * Generate urban segment (simulated street following for now)
   */
  generateUrbanSegment(startCoords, endCoords, segmentType, mode) {
    const distance = haversineDistance(startCoords, endCoords)
    const distanceFeet = Math.round(metersToFeet(distance))
    
    // Urban segments use street speed (slower due to intersections)
    const speed = this.TRAVEL_SPEEDS[mode].street
    const duration = Math.round(distance * 3.28 / speed)

    let instruction = ''
    switch (segmentType) {
      case 'urban_exit':
        instruction = `Navigate through urban blocks toward open playa (${distanceFeet}ft, ${duration} min)`
        break
      case 'urban_entry':
        instruction = `Navigate through urban blocks to destination (${distanceFeet}ft, ${duration} min)`
        break
      default:
        instruction = `Navigate through urban area (${distanceFeet}ft, ${duration} min)`
    }

    return {
      type: 'urban_navigation',
      subType: segmentType,
      coordinates: [startCoords, endCoords],
      distance: distanceFeet,
      duration: duration,
      instruction: instruction,
      // TODO: Replace with actual street-following once network is built
      note: 'Simulated urban navigation - full street routing coming soon'
    }
  }

  /**
   * Generate playa crossing segment
   */
  generatePlayaCrossingSegment(startCoords, endCoords, mode) {
    const distance = haversineDistance(startCoords, endCoords)
    const distanceFeet = Math.round(metersToFeet(distance))
    
    // Playa crossing uses faster open-ground speed
    const speed = this.TRAVEL_SPEEDS[mode].playa
    const duration = Math.round(distance * 3.28 / speed)

    return {
      type: 'playa_crossing',
      coordinates: [startCoords, endCoords],
      distance: distanceFeet,
      duration: duration,
      instruction: `Cross open playa directly toward destination sector (${distanceFeet}ft, ${duration} min)`,
      note: 'Direct playa crossing - watch for obstacles'
    }
  }

  /**
   * Generate turn-by-turn directions for hybrid route
   */
  generateHybridDirections(segments) {
    const directions = []
    
    segments.forEach((segment, index) => {
      directions.push({
        step: index + 1,
        instruction: segment.instruction,
        distance: segment.distance,
        duration: segment.duration,
        coordinates: segment.coordinates,
        segmentType: segment.type
      })
    })

    return directions
  }

  /**
   * Get route between coordinates (main interface)
   * Maintains compatibility with existing routing service
   */
  /**
   * Main routing interface - delegates to intelligent routing system
   * @param {Array} startCoords [latitude, longitude]
   * @param {Array} endCoords [latitude, longitude]  
   * @param {string} mode 'walking' or 'biking'
   * @returns {Object} Complete route with path and metadata
   */
  async findRoute(startCoords, endCoords, mode = 'walking') {
    if (!this.isInitialized) {
      await this.initialize()
    }
    
    return this.calculateIntelligentRoute(startCoords, endCoords, mode)
  }

  async getRoute(startCoords, endCoords, mode = 'walking') {
    try {
      return await this.calculateIntelligentRoute(startCoords, endCoords, mode)
    } catch (error) {
      console.error('Intelligent routing failed, falling back to simple route:', error)
      return this.generateStraightLineRoute(startCoords, endCoords, mode)
    }
  }

  /**
   * Calculate distance and travel time (utility method)
   */
  calculateDistance(startCoords, endCoords) {
    const distance = haversineDistance(startCoords, endCoords)
    return {
      feet: Math.round(metersToFeet(distance)),
      meters: Math.round(distance)
    }
  }

  /**
   * Calculate travel time for given distance and mode
   */
  calculateTravelTime(distance, mode = 'walking', terrain = 'playa') {
    const speed = this.TRAVEL_SPEEDS[mode][terrain] || this.TRAVEL_SPEEDS[mode].playa
    return Math.round(distance / speed) // Distance in feet, speed in feet/minute
  }

  /**
   * Check if routing system is ready
   */
  isReady() {
    return this.isInitialized && this.zoneClassifier !== null
  }

  /**
   * Clean up old incompatible cache versions
   */
  _cleanupOldCaches() {
    const oldCacheKeys = [
      'brc_street_network_cache_v1',
      // Add more old versions here as needed
    ]
    
    let cleaned = 0
    for (const oldKey of oldCacheKeys) {
      if (localStorage.getItem(oldKey)) {
        localStorage.removeItem(oldKey)
        cleaned++
      }
    }
    
    if (cleaned > 0) {
      console.log(`🧹 Cleaned up ${cleaned} old cache version(s)`)
    }
  }

  /**
   * Get system status for debugging
   */
  getStatus() {
    const features = [
      'Zone classification',
      'Hybrid routing logic', 
      'Playa crossing optimization',
      'Urban area detection'
    ]

    const pending = []

    // Add street network features if available
    if (this.streetNetwork?.isBuilt) {
      features.push('Street network graph', 'Intersection-based routing')
    } else {
      pending.push('Street network graph')
    }

    if (this.pathfinder) {
      features.push('A* pathfinding algorithm', 'BRC-optimized route costs')
    } else {
      pending.push('A* pathfinding')
    }

    if (this.directionsGenerator) {
      features.push('Turn-by-turn directions', 'BRC address navigation')
    } else {
      pending.push('Turn-by-turn street directions')
    }

    // Always pending (not implemented yet)
    pending.push('Multi-waypoint optimization')

    return {
      initialized: this.isInitialized,
      components: {
        zoneClassifier: !!this.zoneClassifier,
        streetNetwork: !!this.streetNetwork?.isBuilt,
        pathfinder: !!this.pathfinder,
        directionsGenerator: !!this.directionsGenerator,
        networkBuilder: !!this.networkBuilder
      },
      networkStats: this.streetNetwork?.getNetworkStats() || null,
      pathfinderStatus: this.pathfinder?.getStatus() || null,
      directionsStatus: this.directionsGenerator?.getStatus() || null,
      cacheEnabled: !!this.networkCacheKey,
      features,
      pending,
      version: 'Phase 2 - Street-following navigation'
    }
  }
}