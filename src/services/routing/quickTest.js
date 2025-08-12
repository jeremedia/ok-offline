/**
 * Quick test for BRC Intelligent Routing - Browser Console Test
 * 
 * Run this in browser console to test the enhanced routing system
 */

import { calculateStreetRoute, isEnhancedRoutingReady } from '../routingService.js'

/**
 * Quick test that can be run in browser console
 */
window.testBRCRouting = async function() {
  console.log('🔥 Testing BRC Intelligent Routing System...\n')
  
  // Test coordinates (approximate BRC locations)
  const testRoutes = [
    {
      name: 'OKNOTOK → 7:30 & E (Cross-sector hybrid test)',
      from: [40.7716, -119.203],  // ~3:30 & A (OKNOTOK)
      to: [40.788, -119.196],     // ~7:30 & E 
      expected: 'hybrid'
    },
    {
      name: 'Center Camp → Deep Playa (Open playa test)', 
      from: [40.7864, -119.2065], // Center Camp
      to: [40.8064, -119.2065],   // Deep playa north
      expected: 'straight_line'
    },
    {
      name: 'The Man → Temple (Inner playa test)',
      from: [40.7864, -119.2065], // The Man
      to: [40.7964, -119.2065],   // Temple
      expected: 'straight_line'
    }
  ]
  
  // Check if enhanced routing is ready
  const isReady = await isEnhancedRoutingReady()
  console.log(`Enhanced routing ready: ${isReady}\n`)
  
  // Test each route
  for (const test of testRoutes) {
    console.log(`🧭 ${test.name}`)
    console.log(`   From: [${test.from[0]}, ${test.from[1]}]`)
    console.log(`   To: [${test.to[0]}, ${test.to[1]}]`)
    
    try {
      // Test both walking and biking
      const walkingRoute = await calculateStreetRoute(test.from, test.to, 'walking')
      
      console.log(`   ✅ Route calculated successfully!`)
      console.log(`   📍 Route Type: ${walkingRoute.type}`)
      console.log(`   🚶 Walking: ${walkingRoute.distanceText} • ${walkingRoute.walkingText}`)
      console.log(`   🚴 Biking: ${walkingRoute.bikingText}`)
      
      if (walkingRoute.isIntelligentRoute) {
        console.log(`   🧠 Routing Method: ${walkingRoute.routingMethod}`)
        
        if (walkingRoute.enhancedRoute?.segments) {
          console.log(`   📋 Segments: ${walkingRoute.enhancedRoute.segments.length}`)
          walkingRoute.enhancedRoute.segments.forEach((segment, i) => {
            console.log(`      ${i + 1}. ${segment.type}: ${segment.distance}ft`)
          })
        }
        
        if (walkingRoute.enhancedRoute?.directions) {
          console.log(`   📝 Directions:`)
          walkingRoute.enhancedRoute.directions.forEach((direction, i) => {
            console.log(`      ${i + 1}. ${direction.instruction}`)
          })
        }
      }
      
      // Verify coordinate format
      if (walkingRoute.geometry && walkingRoute.geometry.length > 0) {
        console.log(`   🗺️  Geometry: ${walkingRoute.geometry.length} waypoints`)
        console.log(`      Start: [${walkingRoute.geometry[0]}]`)
        console.log(`      End: [${walkingRoute.geometry[walkingRoute.geometry.length - 1]}]`)
      }
      
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`)
    }
    
    console.log('')
  }
  
  console.log('✅ BRC Routing test completed!')
  return 'Test completed - check console output above'
}

/**
 * Test zone classification directly
 */
window.testBRCZones = async function() {
  console.log('🧭 Testing BRC Zone Classification...\n')
  
  const { EnhancedRoutingService } = await import('./enhancedRoutingService.js')
  const router = new EnhancedRoutingService()
  await router.initialize()
  
  const testCoords = [
    { name: 'OKNOTOK (3:30 & A)', coord: [-119.203, 40.7716] },
    { name: 'Center Camp', coord: [-119.2065, 40.7864] },
    { name: 'Deep Playa', coord: [-119.2065, 40.8064] },
    { name: '7:30 & E', coord: [-119.196, 40.788] }
  ]
  
  for (const test of testCoords) {
    const classification = router.zoneClassifier.classifyCoordinate(test.coord)
    console.log(`📍 ${test.name}:`)
    console.log(`   Zone: ${classification.type}`)
    console.log(`   Straight Line OK: ${classification.allowStraightLine}`)
    if (classification.requiresStreets) {
      console.log(`   ⚠️  Requires street navigation`)
    }
    console.log('')
  }
  
  return 'Zone classification test completed'
}

// Export for module use
export { window.testBRCRouting, window.testBRCZones }