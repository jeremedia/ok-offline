/**
 * Debug script to check geocoding coordinate differences
 * Run this in the browser console to test coordinate mapping
 */

// Expected coordinates that work in direct test
const WORKING_COORDS = [40.779123, -119.199234] // [lat, lng]

// Test the geocoding function
function debugGeocodingTest() {
  console.log('🔬 Debugging Geocoding Coordinate Mapping')
  console.log('=' .repeat(50))
  
  // Check if we can access the geocoding function
  if (typeof window !== 'undefined' && window.brcAddressToLatLon) {
    const geocoded = window.brcAddressToLatLon('7:30 & E')
    console.log('🗺️ Geocoded 7:30 & E:', geocoded)
    console.log('🎯 Working coordinates:', WORKING_COORDS)
    
    if (geocoded) {
      const [gLat, gLng] = geocoded
      const [wLat, wLng] = WORKING_COORDS
      
      console.log('📊 Coordinate Comparison:')
      console.log(`   Geocoded: ${gLat.toFixed(6)}, ${gLng.toFixed(6)}`)
      console.log(`   Working:  ${wLat.toFixed(6)}, ${wLng.toFixed(6)}`)
      
      // Calculate differences
      const latDiff = Math.abs(gLat - wLat)
      const lngDiff = Math.abs(gLng - wLng)
      const distanceDiff = Math.sqrt(latDiff*latDiff + lngDiff*lngDiff)
      
      console.log('📏 Differences:')
      console.log(`   Latitude:  ${latDiff.toFixed(6)}`)
      console.log(`   Longitude: ${lngDiff.toFixed(6)}`)
      console.log(`   Distance:  ${distanceDiff.toFixed(6)} degrees`)
      
      // Convert to feet (rough approximation)
      const feetDiff = distanceDiff * 364000 // rough conversion
      console.log(`   ~${Math.round(feetDiff)} feet difference`)
      
      if (feetDiff > 500) {
        console.log('❌ SIGNIFICANT DIFFERENCE - This explains the hybrid routing failure!')
        console.log('   The geocoded coordinates are too far from working coordinates')
        console.log('   BRCHybridRouter detects "sectors too close" due to incorrect geocoding')
      } else {
        console.log('✅ Minor difference - should not affect hybrid routing')
      }
    } else {
      console.log('❌ Geocoding returned null for 7:30 & E')
    }
  } else {
    console.log('❌ brcAddressToLatLon function not accessible')
    console.log('   Try running this in the app context after page load')
  }
  
  console.log('=' .repeat(50))
}

// Auto-run if in browser environment
if (typeof window !== 'undefined') {
  setTimeout(debugGeocodingTest, 1000) // Wait for app to load
} else {
  console.log('Run this script in the browser console on the app page')
}

// Export for manual use
if (typeof module !== 'undefined') {
  module.exports = { debugGeocodingTest }
}