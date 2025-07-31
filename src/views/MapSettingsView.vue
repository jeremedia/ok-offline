<template>
  <div class="settings-view">
    <div class="settings-content">
      <h1>🗺️ Map & GIS Information</h1>
      
      <div class="info-section">
        <h2>🔥 Black Rock City Geometry</h2>
        <p class="intro">Black Rock City is a temporary metropolis with fascinating geometric properties. Here's what makes BRC's urban design unique:</p>
        
        <div v-if="geometryData.success" class="geometry-facts">
          <div class="fact-grid">
            <div class="fact-card">
              <h3>🎯 City Center</h3>
              <p><strong>The Man (Golden Spike)</strong></p>
              <p>{{ formatCoordinates(geometryData.geometry?.manCoordinates) }}</p>
              <p class="detail">The geometric center of Black Rock City</p>
            </div>
            
            <div class="fact-card">
              <h3>🏛️ Temple Location</h3>
              <p><strong>{{ geometryData.facts?.templeDirection || 'Temple direction' }}</strong></p>
              <p>{{ geometryData.geometry?.manToTempleDistance || 0 }}m from The Man</p>
              <p class="detail">Located at 12:00 & K Avenue</p>
            </div>
            
            <div class="fact-card">
              <h3>📐 City Diameter</h3>
              <p><strong>{{ geometryData.facts?.cityDiameter || 'City diameter' }}</strong></p>
              <p>Radius to L Avenue: {{ Math.round(geometryData.geometry?.cityRadius || 0) }}m</p>
              <p class="detail">Partial circle opening southwest</p>
            </div>
            
            <div class="fact-card">
              <h3>🛣️ Street Layout</h3>
              <p><strong>Radial + Concentric</strong></p>
              <p>{{ geometryData.facts?.streetLayout || 'Street layout information' }}</p>
              <p class="detail">Clock-based addressing system</p>
            </div>
            
            <div class="fact-card" v-if="geometryData.geometry?.gateDirection">
              <h3>🚪 Main Gate</h3>
              <p><strong>{{ geometryData.facts?.gateDirection || 'Gate direction' }}</strong></p>
              <p>{{ geometryData.geometry?.gateWidth || 0 }}m wide opening</p>
              <p class="detail">Primary entry/exit point</p>
            </div>
            
            <div class="fact-card">
              <h3>🧭 Map Alignment</h3>
              <p><strong>{{ geometryData.facts?.rotationExplanation || 'Map rotation information' }}</strong></p>
              <p v-if="geometryData.facts?.mathematicalRotation">{{ geometryData.facts.mathematicalRotation }}</p>
              <p class="detail">Optimized for navigation</p>
            </div>
          </div>
        </div>
        
        <div v-else class="loading-state">
          <p>Loading geometric analysis...</p>
        </div>
      </div>
      
      <div class="info-section">
        <h2>🗺️ GIS Data Sources</h2>
        <div class="data-sources">
          <div class="source-card">
            <h3>📍 Street Network</h3>
            <p><strong>{{ streetCount }} street segments</strong></p>
            <p>Radial streets (2:00-10:00) and circular avenues (Esplanade-L)</p>
          </div>
          
          <div class="source-card">
            <h3>🚧 City Boundary</h3>
            <p><strong>Trash Fence Perimeter</strong></p>
            <p>Defines the official city limits and safety boundary</p>
          </div>
          
          <div class="source-card">
            <h3>🏗️ City Blocks</h3>
            <p><strong>{{ blockCount }} city blocks</strong></p>
            <p>Individual parcels for camp placement and city organization</p>
          </div>
          
          <div class="source-card">
            <h3>📍 Points of Interest</h3>
            <p><strong>{{ plazaCount }} plazas, {{ cpnCount }} CPNs</strong></p>
            <p>Community spaces and Civic Plaza Network locations</p>
          </div>
        </div>
      </div>
      
      <div class="info-section">
        <h2>🔧 Technical Information</h2>
        <div class="tech-info">
          <div class="tech-card">
            <h3>🌐 Coordinate System</h3>
            <p><strong>{{ geometryData.facts?.coordinateSystem || 'WGS84 (GPS coordinates)' }}</strong></p>
            <p>Standard GPS coordinates (latitude/longitude)</p>
          </div>
          
          <div class="tech-card">
            <h3>📊 Data Format</h3>
            <p><strong>GeoJSON</strong></p>
            <p>Industry-standard geospatial data format</p>
          </div>
          
          <div class="tech-card">
            <h3>📡 Data Source</h3>
            <p><strong>Burning Man GIS Repository</strong></p>
            <p>Official geographic data from Burning Man Organization</p>
          </div>
          
          <div class="tech-card">
            <h3>🔄 Updates</h3>
            <p><strong>Annual</strong></p>
            <p>City layout updated each year for the current event</p>
          </div>
        </div>
      </div>
      
      <div class="info-section">
        <h2>💡 Did You Know?</h2>
        <div class="fun-facts">
          <div class="fun-fact">
            <p><strong>🕐 Clock System:</strong> Street addresses use clock positions (2:00-10:00) with The Man at the center, making navigation intuitive even in dust storms.</p>
          </div>
          
          <div class="fun-fact">
            <p><strong>📏 Precise Planning:</strong> Every camp location is surveyed and mapped with GPS coordinates before the event begins.</p>
          </div>
          
          <div class="fun-fact">
            <p><strong>🌪️ Dust Strategy:</strong> The city opens southwest into the prevailing wind direction, helping manage dust and creating the iconic gate approach.</p>
          </div>
          
          <div class="fun-fact">
            <p><strong>🏛️ Sacred Geometry:</strong> The Man-Temple axis forms the ceremonial centerline of the city, with Point 3 marking the extension to the city boundary.</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { analyzeCityGeometry } from '../utils/geocoding'
import { getStreetLines, getTrashFence, getCityBlocks, getPlazas, getCPNs } from '../services/gisData'

const geometryData = ref({ success: false })
const streetCount = ref(0)
const blockCount = ref(0)
const plazaCount = ref(0)
const cpnCount = ref(0)

onMounted(async () => {
  try {
    // Load geometry analysis
    const trashFenceData = getTrashFence()
    const analysis = analyzeCityGeometry(trashFenceData)
    
    // Ensure we have a valid structure
    if (analysis && analysis.success) {
      geometryData.value = analysis
    } else {
      // Fallback structure
      geometryData.value = {
        success: true,
        geometry: {
          manCoordinates: [40.786958, -119.202994],
          manToTempleDistance: 1628,
          cityRadius: 1700
        },
        facts: {
          coordinateSystem: 'WGS84 (GPS coordinates)',
          cityDiameter: '3.4 km',
          streetLayout: 'Radial streets from 2:00 to 10:00, concentric avenues Esplanade to L',
          templeDirection: 'Temple is N of The Man',
          rotationExplanation: 'Rotating -45° aligns gate to bottom, temple to top of screen'
        }
      }
    }
    
    // Count GIS features
    const streetData = getStreetLines()
    if (streetData?.features) {
      streetCount.value = streetData.features.length
    }
    
    const blockData = getCityBlocks()
    if (blockData?.features) {
      blockCount.value = blockData.features.length
    }
    
    const plazaData = getPlazas()
    if (plazaData?.features) {
      plazaCount.value = plazaData.features.length
    }
    
    const cpnData = getCPNs()
    if (cpnData?.features) {
      cpnCount.value = cpnData.features.length
    }
  } catch (error) {
    console.error('Error loading map settings data:', error)
    // Set a minimal fallback
    geometryData.value = {
      success: false,
      error: 'Failed to load geometric data'
    }
  }
})

const formatCoordinates = (coords) => {
  if (!coords || coords.length !== 2) return 'Unknown'
  return `${coords[0].toFixed(6)}°N, ${Math.abs(coords[1]).toFixed(6)}°W`
}
</script>

<style scoped>
.settings-view {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  color: var(--color-text-secondary);
}

.settings-content h1 {
  color: var(--color-accent);
  text-align: center;
  margin-bottom: 30px;
  font-size: 2.5em;
}

.info-section {
  margin-bottom: 40px;
  background: var(--color-background-secondary-alpha-90);
  border-radius: 8px;
  padding: 20px;
  border: 1px solid var(--color-border);
}

.info-section h2 {
  color: var(--color-accent);
  border-bottom: 2px solid var(--color-border);
  padding-bottom: 10px;
  margin-bottom: 20px;
}

.intro {
  font-size: 1.1em;
  margin-bottom: 20px;
  color: var(--color-text-secondary);
}

.fact-grid, .data-sources, .tech-info {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.fact-card, .source-card, .tech-card {
  background: var(--color-bg-elevated);
  border-radius: 6px;
  padding: 15px;
  border: 1px solid var(--color-border-heavy);
  transition: border-color 0.3s ease;
}

.fact-card:hover, .source-card:hover, .tech-card:hover {
  border-color: var(--color-accent);
}

.fact-card h3, .source-card h3, .tech-card h3 {
  color: var(--color-accent);
  margin-bottom: 10px;
  font-size: 1.1em;
}

.fact-card p, .source-card p, .tech-card p {
  margin: 5px 0;
  line-height: 1.4;
}

.detail {
  font-size: 0.9em;
  color: var(--color-text-muted);
  font-style: italic;
}

.fun-facts {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.fun-fact {
  background: var(--color-bg-input-alpha-50);
  border-left: 4px solid var(--color-accent);
  padding: 15px;
  border-radius: 4px;
}

.fun-fact p {
  margin: 0;
  line-height: 1.5;
}

.loading-state {
  text-align: center;
  padding: 40px;
  color: var(--color-text-muted);
}

@media (max-width: 768px) {
  .fact-grid, .data-sources, .tech-info {
    grid-template-columns: 1fr;
  }
  
  .settings-content {
    padding: 10px;
  }
}
</style>