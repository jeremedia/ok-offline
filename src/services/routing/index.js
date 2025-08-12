/**
 * BRC Intelligent Routing System
 * 
 * Revolutionary routing system for Black Rock City that combines:
 * - Street-following navigation through urban blocks
 * - Direct playa crossing for cross-sector efficiency  
 * - Hybrid route optimization that respects city layout
 * - Turn-by-turn directions with BRC-specific context
 */

export { BRCZoneClassifier } from './zoneClassifier.js'
export { StreetNetworkBuilder } from './streetNetworkBuilder.js'  
export { BRCPathfinder } from './pathfinder.js'
export { BRCDirectionsGenerator } from './directionsGenerator.js'
// export { BRCHybridRouter } from './hybridRouter.js' // Not implemented yet
// export { RouteOptimizer } from './routeOptimizer.js' // Not implemented yet

// Enhanced routing service that replaces/extends the existing one
export { EnhancedRoutingService } from './enhancedRoutingService.js'

// Utility exports
export { NetworkNode, NetworkEdge, BRCStreetNetwork, PriorityQueue } from './utils/graphUtils.js'
export { 
  haversineDistance, 
  calculateBearing, 
  getClockAddress, 
  getClockSector,
  distanceFromCenter,
  BRC_CENTER,
  BRC_TEMPLE
} from './utils/geoUtils.js'