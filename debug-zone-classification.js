/**
 * Debug script to test zone classification for the problematic coordinates
 */

// Import necessary modules
import { BRCZoneClassifier } from './src/services/routing/zoneClassifier.js'
import { getGISData } from './src/services/gisData.js'
import { getClockAddress, distanceFromCenter, getClockPosition, getClockSector } from './src/services/routing/utils/geoUtils.js'
import { latLonToBRCAddress } from './src/utils/geocoding.js'

// Test coordinates from the debug logs
const startCoord = [40.779987, -119.197708]  // User's location (3:30&A)
const endCoord = [40.785520373563145, -119.21741883553943]  // Shitty Wood (E & 7:15)

console.log('🧪 DEBUG: Zone Classification for Problematic Coordinates')
console.log('=' .repeat(60))

// Test individual coordinate details
function debugCoordinate(coord, label) {
  console.log(`\n📍 ${label}:`)
  console.log(`   Coordinates: [${coord[0]}, ${coord[1]}]`)
  console.log(`   Distance from center: ${Math.round(distanceFromCenter(coord))}m`)
  console.log(`   Clock position: ${getClockPosition(coord)} minutes`)
  console.log(`   Clock sector: ${getClockSector(coord)}`)
  console.log(`   Clock address: ${getClockAddress(coord)}`)
  console.log(`   Reverse geocode: ${latLonToBRCAddress(coord)}`)
}

async function runDebugTest() {
  try {
    // Debug individual coordinates
    debugCoordinate(startCoord, 'START - User Location (should be 3:30&A)')
    debugCoordinate(endCoord, 'END - Shitty Wood (should be E & 7:15)')
    
    // Initialize zone classifier with GIS data
    console.log('\n🗺️  Loading GIS data...')
    const gisData = await getGISData(2025)
    const zoneClassifier = new BRCZoneClassifier(gisData)
    
    // Test zone classification
    console.log('\n🔍 Zone Classification Results:')
    const startZone = zoneClassifier.classifyCoordinate(startCoord)
    const endZone = zoneClassifier.classifyCoordinate(endCoord)
    
    console.log(`\n📊 START ZONE (${getClockAddress(startCoord)}):`)
    console.log(`   Type: ${startZone.type}`)
    console.log(`   Allow straight line: ${startZone.allowStraightLine}`)
    console.log(`   Requires streets: ${startZone.requiresStreets || false}`)
    console.log(`   Zone details:`, startZone.zone)
    
    console.log(`\n📊 END ZONE (${getClockAddress(endCoord)}):`)
    console.log(`   Type: ${endZone.type}`)
    console.log(`   Allow straight line: ${endZone.allowStraightLine}`)
    console.log(`   Requires streets: ${endZone.requiresStreets || false}`)
    console.log(`   Zone details:`, endZone.zone)
    
    // Test straight-line analysis
    console.log('\n🧭 Route Analysis:')
    const straightLineAnalysis = zoneClassifier.canStraightLine(startCoord, endCoord)
    console.log(`   Recommendation: ${straightLineAnalysis.recommendation}`)
    console.log(`   Allowed: ${straightLineAnalysis.allowed}`)
    console.log(`   Confidence: ${straightLineAnalysis.confidence}`)
    if (straightLineAnalysis.reason) {
      console.log(`   Reason: ${straightLineAnalysis.reason}`)
    }
    
    // Expected vs Actual
    console.log('\n❓ EXPECTED vs ACTUAL:')
    console.log(`   Expected: Both coordinates should be classified as 'urban'`)
    console.log(`   Expected: Route recommendation should be 'street_following' or 'hybrid'`)
    console.log(`   Actual Start: ${startZone.type}`)
    console.log(`   Actual End: ${endZone.type}`)
    console.log(`   Actual Recommendation: ${straightLineAnalysis.recommendation}`)
    
    // Issue analysis
    console.log('\n🔍 ISSUE ANALYSIS:')
    if (startZone.type !== 'urban') {
      console.log(`   ❌ START incorrectly classified as '${startZone.type}' instead of 'urban'`)
    } else {
      console.log(`   ✅ START correctly classified as 'urban'`)
    }
    
    if (endZone.type !== 'urban') {
      console.log(`   ❌ END incorrectly classified as '${endZone.type}' instead of 'urban'`)
    } else {
      console.log(`   ✅ END correctly classified as 'urban'`)
    }
    
    if (straightLineAnalysis.recommendation === 'straight_line') {
      console.log(`   ❌ ROUTE incorrectly recommending 'straight_line' for urban-to-urban route`)
    } else {
      console.log(`   ✅ ROUTE correctly recommending '${straightLineAnalysis.recommendation}'`)
    }
    
  } catch (error) {
    console.error('❌ Debug test failed:', error)
    console.error(error.stack)
  }
}

// Run the debug test
runDebugTest()