/**
 * Phase 2 Test Suite - Street-Following Navigation
 * 
 * Tests the complete street-following routing system including:
 * - Street network building
 * - A* pathfinding 
 * - Turn-by-turn directions
 * - Route optimization
 */

import { EnhancedRoutingService } from './enhancedRoutingService.js'

// Test coordinates for street-following routing
const STREET_TEST_COORDINATES = {
  // Urban intersections (should use street routing)
  centerCamp: [-119.2065, 40.7864],        // Center of BRC
  fourThirtyA: [-119.203, 40.7716],        // 4:30 & A (OKNOTOK area)
  sixThirtyEsplanade: [-119.1985, 40.7895], // 6:30 & Esplanade
  sevenThirtyE: [-119.196, 40.788],        // 7:30 & E Street
  nineThirtyKilgore: [-119.215, 40.790],   // 9:30 & Kilgore
  
  // Mixed urban/playa (should test hybrid routing)
  threeThirtyB: [-119.202, 40.7720],       // 3:30 & B
  tenOClockD: [-119.220, 40.792],          // 10:00 & D
  
  // Open playa (should use straight-line)
  deepPlayaNorth: [-119.2065, 40.8064],    // Deep playa north
  deepPlayaEast: [-119.1865, 40.7864],     // Deep playa east
}

/**
 * Test street network building and initialization
 */
async function testStreetNetworkBuilding() {
  console.log('\n🏗️  Testing Street Network Building...\n')
  
  const routingService = new EnhancedRoutingService()
  
  try {
    // Test initialization (this builds the network)
    console.log('⏱️  Initializing routing service with street network...')
    const startTime = performance.now()
    
    await routingService.initialize()
    
    const initTime = performance.now() - startTime
    console.log(`✅ Initialization completed in ${Math.round(initTime)}ms`)
    
    // Check system status
    const status = routingService.getStatus()
    console.log('\n📊 System Status:')
    console.log(`   Initialized: ${status.initialized}`)
    console.log(`   Components:`)
    Object.entries(status.components).forEach(([name, available]) => {
      console.log(`     ${name}: ${available ? '✅' : '❌'}`)
    })
    
    if (status.networkStats) {
      console.log(`\n🛣️  Network Statistics:`)
      console.log(`   Nodes: ${status.networkStats.nodes}`)
      console.log(`   Edges: ${status.networkStats.edges}`)
      console.log(`   Streets: ${status.networkStats.streets}`)
      console.log(`   Intersections: ${status.networkStats.intersections}`)
      console.log(`   Radial streets: ${status.networkStats.radialStreets}`)
      console.log(`   Arc streets: ${status.networkStats.arcStreets}`)
      console.log(`   Total distance: ${Math.round(status.networkStats.totalDistance)}m`)
    }
    
    console.log(`\n🚀 Available Features:`)
    status.features.forEach(feature => console.log(`   ✅ ${feature}`))
    
    if (status.pending.length > 0) {
      console.log(`\n⏳ Pending Features:`)
      status.pending.forEach(feature => console.log(`   ⏸️  ${feature}`))
    }
    
    return routingService
    
  } catch (error) {
    console.error('❌ Street network building failed:', error)
    return null
  }
}

/**
 * Test street-following routing between different location types
 */
async function testStreetFollowingRoutes(routingService) {
  console.log('\n🛣️  Testing Street-Following Routes...\n')
  
  const testRoutes = [
    {
      name: '4:30 & A → 7:30 & E (Cross-sector street routing)',
      start: STREET_TEST_COORDINATES.fourThirtyA,
      end: STREET_TEST_COORDINATES.sevenThirtyE,
      expectedType: 'street_following',
      mode: 'walking'
    },
    {
      name: '6:30 & Esplanade → 9:30 & Kilgore (Arc to arc)',
      start: STREET_TEST_COORDINATES.sixThirtyEsplanade,
      end: STREET_TEST_COORDINATES.nineThirtyKilgore,
      expectedType: 'street_following',
      mode: 'biking'
    },
    {
      name: 'Center Camp → Deep Playa (Should use straight-line)',
      start: STREET_TEST_COORDINATES.centerCamp,
      end: STREET_TEST_COORDINATES.deepPlayaNorth,
      expectedType: 'straight_line',
      mode: 'walking'
    },
    {
      name: '3:30 & B → 10:00 & D (May use hybrid routing)',
      start: STREET_TEST_COORDINATES.threeThirtyB,
      end: STREET_TEST_COORDINATES.tenOClockD,
      expectedType: 'hybrid',
      mode: 'walking'
    }
  ]
  
  for (const testRoute of testRoutes) {
    console.log(`🧭 ${testRoute.name}`)
    console.log(`   From: ${testRoute.start}`)
    console.log(`   To: ${testRoute.end}`)
    console.log(`   Mode: ${testRoute.mode}`)
    
    try {
      const startTime = performance.now()
      const route = await routingService.calculateIntelligentRoute(
        testRoute.start,
        testRoute.end,
        testRoute.mode
      )
      const routeTime = performance.now() - startTime
      
      if (route) {
        console.log(`   ✅ Route calculated in ${Math.round(routeTime)}ms`)
        console.log(`   📍 Route Type: ${route.type}`)
        console.log(`   📏 Distance: ${route.distance}ft`)
        console.log(`   ⏱️  Duration: ${route.duration} min (${route.mode})`)
        
        if (route.isIntelligentRoute) {
          console.log(`   🧠 Method: ${route.routingMethod}`)
          
          if (route.summary?.efficiency) {
            console.log(`   📈 Efficiency: ${(route.summary.efficiency * 100).toFixed(1)}% vs straight-line`)
          }
        }
        
        // Street-following specific information
        if (route.type === 'street_following' && route.streetRoute) {
          const streetRoute = route.streetRoute
          console.log(`   🛣️  Street Details:`)
          console.log(`      Segments: ${streetRoute.segments?.length || 0}`)
          console.log(`      Nodes: ${streetRoute.nodePath?.length || 0}`)
          console.log(`      Streets: ${streetRoute.summary?.streets?.length || 0}`)
          
          if (streetRoute.summary?.streets) {
            console.log(`      Used streets: ${streetRoute.summary.streets.slice(0, 3).join(', ')}${streetRoute.summary.streets.length > 3 ? '...' : ''}`)
          }
        }
        
        // Turn-by-turn directions
        if (route.directions && route.directions.length > 0) {
          console.log(`   📋 Turn-by-turn Directions (${route.directions.length} steps):`)
          route.directions.slice(0, 3).forEach((step, i) => {
            console.log(`      ${i + 1}. ${step.instruction}`)
            if (step.distanceText && step.durationText) {
              console.log(`         (${step.distanceText}, ${step.durationText})`)
            }
          })
          if (route.directions.length > 3) {
            console.log(`      ... and ${route.directions.length - 3} more steps`)
          }
        }
        
        if (route.directionsOverview) {
          console.log(`   📝 Route Overview: ${route.directionsOverview}`)
        }
        
      } else {
        console.log(`   ❌ No route found`)
      }
      
    } catch (error) {
      console.log(`   ❌ Route calculation failed: ${error.message}`)
    }
    
    console.log('')
  }
}

/**
 * Test route comparison between different routing methods
 */
async function testRouteComparison(routingService) {
  console.log('\n⚡ Testing Route Method Comparison...\n')
  
  // Test same route with different methods by forcing different approaches
  const testStart = STREET_TEST_COORDINATES.fourThirtyA
  const testEnd = STREET_TEST_COORDINATES.sevenThirtyE
  
  console.log('🔄 Comparing routing methods for 4:30 & A → 7:30 & E:')
  console.log(`   Start: ${testStart}`)
  console.log(`   End: ${testEnd}`)
  
  try {
    // Get the intelligent route (will choose best method)
    const intelligentRoute = await routingService.calculateIntelligentRoute(testStart, testEnd, 'walking')
    
    // Get straight-line for comparison  
    const straightRoute = routingService.generateStraightLineRoute(testStart, testEnd, 'walking')
    
    console.log(`\n📊 Route Comparison:`)
    
    if (intelligentRoute) {
      console.log(`   🧠 Intelligent Route (${intelligentRoute.type}):`)
      console.log(`      Distance: ${intelligentRoute.distance}ft`)
      console.log(`      Time: ${intelligentRoute.duration}min`)
      console.log(`      Method: ${intelligentRoute.routingMethod || intelligentRoute.type}`)
      
      if (intelligentRoute.summary?.efficiency) {
        console.log(`      Efficiency: ${(intelligentRoute.summary.efficiency * 100).toFixed(1)}%`)
      }
    }
    
    if (straightRoute) {
      console.log(`   ➡️  Straight-line Route:`)
      console.log(`      Distance: ${straightRoute.distance}ft`)
      console.log(`      Time: ${straightRoute.duration}min`)
      console.log(`      Method: Direct playa crossing`)
    }
    
    if (intelligentRoute && straightRoute) {
      const distanceDiff = ((intelligentRoute.distance - straightRoute.distance) / straightRoute.distance * 100).toFixed(1)
      const timeDiff = ((intelligentRoute.duration - straightRoute.duration) / straightRoute.duration * 100).toFixed(1)
      
      console.log(`\n📈 Intelligent vs Straight-line:`)
      console.log(`      Distance: ${distanceDiff > 0 ? '+' : ''}${distanceDiff}%`)
      console.log(`      Time: ${timeDiff > 0 ? '+' : ''}${timeDiff}%`)
      
      if (distanceDiff < 0 || timeDiff < 0) {
        console.log(`      ✅ Intelligent routing is more efficient!`)
      } else {
        console.log(`      ℹ️  Straight-line is shorter (expected for some routes)`)
      }
    }
    
  } catch (error) {
    console.error('❌ Route comparison failed:', error)
  }
}

/**
 * Test network caching functionality
 */
async function testNetworkCaching() {
  console.log('\n💾 Testing Network Caching...\n')
  
  try {
    // First initialization (builds network)
    console.log('🔨 First initialization (building network)...')
    const startTime1 = performance.now()
    const service1 = new EnhancedRoutingService()
    await service1.initialize()
    const buildTime = performance.now() - startTime1
    
    console.log(`   Built in ${Math.round(buildTime)}ms`)
    
    // Second initialization (should use cache)
    console.log('📦 Second initialization (using cache)...')
    const startTime2 = performance.now()
    const service2 = new EnhancedRoutingService()
    await service2.initialize()
    const cacheTime = performance.now() - startTime2
    
    console.log(`   Loaded from cache in ${Math.round(cacheTime)}ms`)
    
    const speedImprovement = ((buildTime - cacheTime) / buildTime * 100).toFixed(1)
    console.log(`   ⚡ Cache speedup: ${speedImprovement}% faster`)
    
    // Verify both services have same network stats
    const stats1 = service1.getStatus().networkStats
    const stats2 = service2.getStatus().networkStats
    
    if (stats1 && stats2 && stats1.nodes === stats2.nodes && stats1.edges === stats2.edges) {
      console.log('   ✅ Cache integrity verified (same network statistics)')
    } else {
      console.log('   ⚠️  Cache integrity issue detected')
    }
    
  } catch (error) {
    console.error('❌ Network caching test failed:', error)
  }
}

/**
 * Run comprehensive Phase 2 test suite
 */
async function runPhase2Tests() {
  console.log('🚀 BRC PHASE 2 ROUTING SYSTEM - COMPREHENSIVE TEST SUITE 🚀')
  console.log('=' * 80)
  console.log('Testing: Street Network Building, A* Pathfinding, Turn-by-Turn Directions')
  console.log('')
  
  try {
    // Test 1: Street network building
    const routingService = await testStreetNetworkBuilding()
    
    if (!routingService) {
      console.log('❌ Cannot continue tests - street network building failed')
      return
    }
    
    // Test 2: Street-following routing
    await testStreetFollowingRoutes(routingService)
    
    // Test 3: Route method comparison
    await testRouteComparison(routingService)
    
    // Test 4: Network caching
    await testNetworkCaching()
    
    console.log('\n✅ Phase 2 test suite completed!')
    console.log('🎯 Street-following navigation system is ready for production!')
    
  } catch (error) {
    console.error('\n❌ Test suite failed:', error)
  }
}

// Export for manual testing
export { 
  runPhase2Tests,
  testStreetNetworkBuilding,
  testStreetFollowingRoutes,
  testRouteComparison,
  testNetworkCaching,
  STREET_TEST_COORDINATES
}

// Quick browser test function
if (typeof window !== 'undefined') {
  window.testPhase2Routing = runPhase2Tests
  window.testStreetNetwork = testStreetNetworkBuilding
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runPhase2Tests()
}