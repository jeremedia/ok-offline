/**
 * Test script for BRC Intelligent Routing System
 * 
 * Tests zone classification and routing logic with known BRC coordinates
 */

import { EnhancedRoutingService } from './enhancedRoutingService.js'
import { BRCZoneClassifier } from './zoneClassifier.js'
import { getClockAddress, distanceFromCenter, metersToFeet } from './utils/geoUtils.js'

// Known BRC coordinates for testing (approximate)
const TEST_COORDINATES = {
  // Urban locations (camps in city blocks)
  oknotok: [-119.203, 40.7716],        // OKNOTOK at ~3:30 & A
  centerCamp: [-119.2065, 40.7864],    // Center Camp
  esplanade630: [-119.1985, 40.7895],  // 6:30 & Esplanade  
  
  // Open playa locations
  theMan: [-119.2065, 40.7864],        // The Man (center)
  temple: [-119.2065, 40.7964],        // Temple (north of center)
  deepPlaya: [-119.2065, 40.8064],     // Deep playa art
  
  // Cross-sector test case
  sevenThirtyE: [-119.196, 40.788],    // 7:30 & E Street
}

/**
 * Test zone classification
 */
async function testZoneClassification() {
  console.log('\n🧭 Testing Zone Classification...\n')
  
  // Create a mock GIS data structure for testing
  const mockGISData = {
    cityBlocks: { features: [] }, // Empty for now, will use manual zones
    streetLines: { features: [] }
  }
  
  const classifier = new BRCZoneClassifier(mockGISData)
  
  for (const [name, coord] of Object.entries(TEST_COORDINATES)) {
    const classification = classifier.classifyCoordinate(coord)
    const clockAddress = getClockAddress(coord)
    const centerDistance = Math.round(metersToFeet(distanceFromCenter(coord)))
    
    console.log(`📍 ${name.toUpperCase()}:`)
    console.log(`   Coordinate: ${coord}`)
    console.log(`   Clock Address: ${clockAddress}`)
    console.log(`   Distance from center: ${centerDistance}ft`)
    console.log(`   Zone Type: ${classification.type}`)
    console.log(`   Allow Straight Line: ${classification.allowStraightLine}`)
    if (classification.requiresStreets) {
      console.log(`   ⚠️  Requires street navigation`)
    }
    console.log('')
  }
}

/**
 * Test routing between different zone combinations
 */
async function testRouting() {
  console.log('\n🚀 Testing Intelligent Routing...\n')
  
  const routingService = new EnhancedRoutingService()
  
  // Test cases with different routing scenarios
  const testCases = [
    {
      name: 'OKNOTOK → 7:30 & E (Cross-sector hybrid)',
      start: TEST_COORDINATES.oknotok,
      end: TEST_COORDINATES.sevenThirtyE,
      expectedType: 'hybrid'
    },
    {
      name: 'Center Camp → Deep Playa (Open playa)',
      start: TEST_COORDINATES.centerCamp, 
      end: TEST_COORDINATES.deepPlaya,
      expectedType: 'straight_line'
    },
    {
      name: 'The Man → Temple (Inner playa)',
      start: TEST_COORDINATES.theMan,
      end: TEST_COORDINATES.temple,
      expectedType: 'straight_line'
    }
  ]
  
  for (const testCase of testCases) {
    console.log(`🧭 ${testCase.name}`)
    console.log(`   From: ${getClockAddress(testCase.start)}`)
    console.log(`   To: ${getClockAddress(testCase.end)}`)
    
    try {
      const route = await routingService.calculateIntelligentRoute(
        testCase.start, 
        testCase.end, 
        'walking'
      )
      
      console.log(`   ✅ Route Type: ${route.type}`)
      console.log(`   📏 Distance: ${route.distance}ft`)
      console.log(`   ⏱️  Duration: ${route.duration} min`)
      console.log(`   🎯 Efficiency: ${(route.summary.efficiency * 100).toFixed(0)}%`)
      
      if (route.segments) {
        console.log(`   📋 Segments: ${route.segments.length}`)
        route.segments.forEach((segment, i) => {
          console.log(`      ${i + 1}. ${segment.type}: ${segment.distance}ft, ${segment.duration}min`)
        })
      }
      
      console.log(`   📝 Instructions:`)
      route.directions.forEach((direction, i) => {
        console.log(`      ${i + 1}. ${direction.instruction}`)
      })
      
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`)
    }
    
    console.log('')
  }
}

/**
 * Test straight-line path obstacle detection
 */
async function testObstacleDetection() {
  console.log('\n🚧 Testing Obstacle Detection...\n')
  
  const mockGISData = { cityBlocks: { features: [] }, streetLines: { features: [] } }
  const classifier = new BRCZoneClassifier(mockGISData)
  
  const testPaths = [
    {
      name: 'Path through Man burn scar',
      start: [-119.210, 40.786], // West of Man
      end: [-119.203, 40.786]    // East of Man
    },
    {
      name: 'Clear playa path',
      start: [-119.210, 40.790], // North path
      end: [-119.203, 40.790]
    }
  ]
  
  for (const path of testPaths) {
    console.log(`🛤️  ${path.name}`)
    const analysis = classifier.canStraightLine(path.start, path.end)
    
    console.log(`   Allowed: ${analysis.allowed}`)
    console.log(`   Confidence: ${analysis.confidence}`)
    console.log(`   Recommendation: ${analysis.recommendation}`)
    
    if (analysis.obstacles && analysis.obstacles.length > 0) {
      console.log(`   ⚠️  Obstacles:`)
      analysis.obstacles.forEach(obstacle => {
        console.log(`      - ${obstacle.type}: ${obstacle.name || 'unnamed'}`)
      })
    }
    
    console.log('')
  }
}

/**
 * Test system status and initialization
 */
async function testSystemStatus() {
  console.log('\n🔧 Testing System Status...\n')
  
  const routingService = new EnhancedRoutingService()
  
  console.log('Before initialization:')
  console.log(`   Ready: ${routingService.isReady()}`)
  console.log(`   Status:`, routingService.getStatus())
  
  try {
    await routingService.initialize()
    console.log('\nAfter initialization:')
    console.log(`   Ready: ${routingService.isReady()}`)
    console.log(`   Status:`, routingService.getStatus())
  } catch (error) {
    console.log(`   ❌ Initialization failed: ${error.message}`)
  }
}

/**
 * Run all tests
 */
async function runTests() {
  console.log('🔥 BRC INTELLIGENT ROUTING SYSTEM - TEST SUITE 🔥')
  console.log('=' * 60)
  
  try {
    await testZoneClassification()
    await testObstacleDetection() 
    await testSystemStatus()
    await testRouting()
    
    console.log('\n✅ All tests completed!')
    
  } catch (error) {
    console.error('\n❌ Test suite failed:', error)
  }
}

// Export for manual testing
export { 
  runTests,
  testZoneClassification,
  testRouting,
  testObstacleDetection,
  testSystemStatus,
  TEST_COORDINATES
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests()
}