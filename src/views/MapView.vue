<template>
  <section id="map-section" class="view">
    <button 
      v-if="isMobile" 
      @click="controlsOpen = !controlsOpen"
      class="map-controls-toggle"
      aria-label="Toggle map controls"
    >
      {{ controlsOpen ? '✕' : '☰' }}
    </button>
    <div 
      class="map-controls" 
      :class="{ 
        'mobile-controls': isMobile,
        'controls-open': controlsOpen 
      }"
    >
      <label class="map-control">
        <input type="checkbox" v-model="showCamps" @change="updateMarkers">
        🏠 Camps
      </label>
      <label class="map-control">
        <input type="checkbox" v-model="showArt" @change="updateMarkers">
        🎨 Art
      </label>
      <label class="map-control">
        <input type="checkbox" v-model="showEvents" @change="updateMarkers">
        🎉 Events
      </label>
      <label class="map-control">
        <input type="checkbox" v-model="showFavoritesOnly" @change="updateMarkers">
        ⭐ Favorites Only
      </label>
      <hr class="controls-divider">
      <label class="map-control">
        <input type="checkbox" v-model="showStreets" @change="updateGISLayers">
        🛣️ Streets
      </label>
      <label class="map-control">
        <input type="checkbox" v-model="showTrashFence" @change="updateGISLayers">
        🚧 Trash Fence
      </label>
      <label class="map-control">
        <input type="checkbox" v-model="showCityBlocks" @change="updateGISLayers">
        🏗️ City Blocks
      </label>
      <label class="map-control">
        <input type="checkbox" v-model="showPlazas" @change="updateGISLayers">
        📍 Plazas & CPNs
      </label>
      <div v-if="gisLoadingState.isLoading" class="loading-indicator">
        Loading GIS data...
      </div>
      <div v-if="gisLoadingState.error" class="error-indicator">
        Error loading GIS data
      </div>
      <hr class="controls-divider">
      <label class="map-control">
        <input type="checkbox" v-model="showBasemap" @change="toggleBasemap">
        🗺️ Base Map
      </label>
      <label class="map-control">
        <input type="checkbox" v-model="cityAligned" @change="toggleRotation">
        🧭 City Aligned
      </label>
      <div v-if="cityAligned" class="map-control rotation-slider">
        <label>🔄 Rotation: {{ rotationAngle }}°</label>
        <input 
          type="range" 
          v-model="rotationAngle" 
          @input="applyRotation"
          min="-180" 
          max="180" 
          step="1"
          class="slider"
        >
        <div class="rotation-note">
          🔄 Drag/zoom work with rotation
        </div>
      </div>
      <label class="map-control">
        <input type="checkbox" v-model="showLegend">
        📊 Show Legend
      </label>
      <button 
        v-if="isMobile && controlsOpen" 
        @click="controlsOpen = false"
        class="close-controls"
      >
        Close
      </button>
    </div>
    <div 
      v-if="isMobile && controlsOpen" 
      @click="controlsOpen = false"
      class="map-controls-backdrop"
    ></div>
    <div id="map" ref="mapContainer"></div>
    <div class="map-legend" v-if="showLegend">
      <h4>Map Legend</h4>
      <div class="legend-item">
        <span class="legend-icon special-location">🔥</span>
        <span>The Man</span>
      </div>
      <div class="legend-item">
        <span class="legend-icon special-location">⛺</span>
        <span>Center Camp</span>
      </div>
      <div class="legend-item">
        <span class="legend-icon special-location">🏛</span>
        <span>Temple</span>
      </div>
      <div class="legend-item">
        <span class="legend-icon special-location">✈️</span>
        <span>Airport</span>
      </div>
      <hr class="legend-divider">
      <div class="legend-item">
        <span class="legend-icon camp">🏠</span>
        <span>Camps</span>
      </div>
      <div class="legend-item">
        <span class="legend-icon art">🎨</span>
        <span>Art</span>
      </div>
      <div class="legend-item">
        <span class="legend-icon event">🎉</span>
        <span>Events</span>
      </div>
      <hr class="legend-divider">
      <div class="legend-item">
        <span class="legend-line street"></span>
        <span>Streets</span>
      </div>
      <div class="legend-item">
        <span class="legend-line trash-fence"></span>
        <span>Trash Fence</span>
      </div>
      <div class="legend-item">
        <span class="legend-area city-block"></span>
        <span>City Blocks</span>
      </div>
      <div class="legend-item">
        <span class="legend-area plaza"></span>
        <span>Plazas</span>
      </div>
      <div class="legend-item">
        <span class="legend-icon cpn">📍</span>
        <span>CPN Locations</span>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import L from 'leaflet'
import 'leaflet-rotate'
import { BRC_CENTER } from '../config'
import { getFromCache } from '../services/storage'
import { isFavorite } from '../services/favorites'
import { getItemName, getItemLocation } from '../utils'
import { brcAddressToLatLon, getSpecialLocationCoords, calculateCityAlignmentAngle, analyzeCityGeometry } from '../utils/geocoding'
import { 
  initializeGISData, 
  getStreetLines, 
  getTrashFence, 
  getCityBlocks,
  getPlazas,
  getCPNs,
  getLoadingState,
  gisStyles 
} from '../services/gisData'

const route = useRoute()
const mapContainer = ref(null)

// Mobile detection and controls state
const checkIfMobile = () => {
  const isSmallScreen = window.innerWidth < 600
  const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0
  const mobileRegex = /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini|Mobile/i
  const isMobileUA = mobileRegex.test(navigator.userAgent)
  
  // For development: use screen width only
  // In production, real mobile devices will have touch + UA
  if (isSmallScreen) return true
  
  // Production mobile detection
  return isSmallScreen && (hasTouch || isMobileUA)
}

const isMobile = ref(checkIfMobile())
const controlsOpen = ref(false)

// Debug mobile detection
console.log('MapView mobile detection:', {
  isMobile: isMobile.value,
  screenWidth: window.innerWidth,
  userAgent: navigator.userAgent,
  hasTouch: 'ontouchstart' in window || navigator.maxTouchPoints > 0
})

// Handle window resize
const handleResize = () => {
  isMobile.value = checkIfMobile()
  // Close controls when switching to desktop
  if (!isMobile.value) {
    controlsOpen.value = false
  }
}

const showCamps = ref(true)
const showArt = ref(true)
const showEvents = ref(true)
const showFavoritesOnly = ref(false)
const showStreets = ref(true)
const showTrashFence = ref(true)
const showCityBlocks = ref(false)
const showPlazas = ref(true)
const gisLoadingState = ref({ isLoading: false, error: null })
const showLegend = ref(!isMobile.value) // Off by default on mobile
const showBasemap = ref(true)
const cityAligned = ref(false)
const rotationAngle = ref(0)
const year = computed(() => route.params.year || localStorage.getItem('selectedYear') || '2025')

let map = null
let markersLayer = null
let basemapLayer = null
let gisLayers = {
  streetLines: null,
  trashFence: null,
  cityBlocks: null,
  plazas: null
}
let items = {
  camps: [],
  art: [],
  events: []
}

onMounted(async () => {
  // Initialize Leaflet map with rotation support
  map = L.map(mapContainer.value, {
    center: BRC_CENTER,
    zoom: 13,
    zoomControl: true,
    rotate: true,
    bearing: 0
  })
  
  // Create basemap layer (but don't add it yet)
  basemapLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
    maxZoom: 19
  })
  
  // Add basemap if enabled
  if (showBasemap.value) {
    basemapLayer.addTo(map)
  }
  
  markersLayer = L.layerGroup().addTo(map)
  
  // Initialize GIS data
  gisLoadingState.value.isLoading = true
  try {
    await initializeGISData()
    gisLoadingState.value = getLoadingState()
    
    // Add GIS layers
    updateGISLayers()
  } catch (error) {
    console.error('Failed to load GIS data:', error)
    gisLoadingState.value = { isLoading: false, error: error.message }
  }
  
  // Add special location markers
  addSpecialLocations()
  
  // Load data and add markers
  loadData()
  
  // Fix map size after mounting
  setTimeout(() => {
    map.invalidateSize()
    console.log('Map invalidated after mount')
  }, 100)
  
  // Additional resize for mobile
  setTimeout(() => {
    map.invalidateSize()
    console.log('Second map invalidation')
  }, 500)
  
  // Add resize event listener
  window.addEventListener('resize', handleResize)
  
  // Also listen for orientation changes on mobile
  window.addEventListener('orientationchange', () => {
    setTimeout(() => map.invalidateSize(), 200)
  })
})

const addSpecialLocations = () => {
  const specialLocations = [
    { name: 'The Man', coords: BRC_CENTER, icon: '🔥' },
    { name: 'Center Camp', coords: getSpecialLocationCoords('CENTER CAMP'), icon: '⛺' },
    { name: 'Temple', coords: getSpecialLocationCoords('TEMPLE'), icon: '🏛' },
    { name: 'Airport', coords: getSpecialLocationCoords('AIRPORT'), icon: '✈️' }
  ]
  
  specialLocations.forEach(loc => {
    if (loc.coords) {
      const marker = L.marker(loc.coords, {
        icon: L.divIcon({
          className: 'special-marker',
          html: `<div class="marker-icon">${loc.icon}</div>`,
          iconSize: [30, 30],
          iconAnchor: [15, 15]
        })
      })
      
      marker.bindPopup(`<strong>${loc.name}</strong>`)
      markersLayer.addLayer(marker)
    }
  })
}

const loadData = async () => {
  try {
    // Load all data types
    const [camps, art, events] = await Promise.all([
      getFromCache('camp', year.value),
      getFromCache('art', year.value),
      getFromCache('event', year.value)
    ])
    
    items.camps = camps || []
    items.art = art || []
    items.events = events || []
    
    updateMarkers()
  } catch (err) {
    console.error('Error loading map data:', err)
  }
}

const updateMarkers = () => {
  // Clear existing markers (except special locations)
  markersLayer.eachLayer(layer => {
    if (!layer.options.icon?.options?.className?.includes('special-marker')) {
      markersLayer.removeLayer(layer)
    }
  })
  
  // Add camp markers
  if (showCamps.value) {
    items.camps.forEach(camp => {
      if (showFavoritesOnly.value && !isFavorite('camp', camp.uid)) return
      addMarker(camp, 'camp', '🏠')
    })
  }
  
  // Add art markers
  if (showArt.value) {
    items.art.forEach(art => {
      if (showFavoritesOnly.value && !isFavorite('art', art.uid)) return
      addMarker(art, 'art', '🎨')
    })
  }
  
  // Add event markers
  if (showEvents.value) {
    items.events.forEach(event => {
      if (showFavoritesOnly.value && !isFavorite('event', event.uid)) return
      addMarker(event, 'event', '🎉')
    })
  }
}

const addMarker = (item, type, icon) => {
  const location = getItemLocation(item)
  if (!location || location === 'Unknown location') return
  
  const coords = brcAddressToLatLon(location)
  if (!coords) return
  
  const marker = L.marker(coords, {
    icon: L.divIcon({
      className: `${type}-marker`,
      html: `<div class="marker-icon">${icon}</div>`,
      iconSize: [25, 25],
      iconAnchor: [12, 12]
    })
  })
  
  const name = getItemName(item)
  const favorited = isFavorite(type, item.uid)
  
  marker.bindPopup(`
    <div class="map-popup">
      <strong>${name}</strong>
      ${favorited ? '<span class="favorited">★</span>' : ''}
      <br>
      <small>${location}</small>
      ${item.description ? `<br><br>${item.description.substring(0, 100)}...` : ''}
    </div>
  `)
  
  markersLayer.addLayer(marker)
}

const updateGISLayers = () => {
  // Remove existing GIS layers
  Object.values(gisLayers).forEach(layer => {
    if (layer && map.hasLayer(layer)) {
      map.removeLayer(layer)
    }
  })
  
  // Add street lines
  if (showStreets.value) {
    const streetData = getStreetLines()
    if (streetData) {
      gisLayers.streetLines = L.geoJSON(streetData, {
        style: (feature) => {
          const type = feature.properties.type
          return gisStyles.streetLines[type] || gisStyles.streetLines.arc
        },
        onEachFeature: (feature, layer) => {
          if (feature.properties && feature.properties.name) {
            layer.bindPopup(`<strong>${feature.properties.name}</strong><br>Type: ${feature.properties.type}`)
          }
        }
      }).addTo(map)
    }
  }
  
  // Add trash fence
  if (showTrashFence.value) {
    const trashFenceData = getTrashFence()
    if (trashFenceData) {
      gisLayers.trashFence = L.geoJSON(trashFenceData, {
        style: gisStyles.trashFence
      }).addTo(map)
    }
  }
  
  // Add city blocks
  if (showCityBlocks.value) {
    const cityBlocksData = getCityBlocks()
    if (cityBlocksData) {
      gisLayers.cityBlocks = L.geoJSON(cityBlocksData, {
        style: gisStyles.cityBlocks
      }).addTo(map)
    }
  }
  
  // Add plazas and CPNs
  if (showPlazas.value) {
    // Clear existing plaza markers
    markersLayer.eachLayer(layer => {
      if (layer.options.icon?.options?.className?.includes('plaza-marker')) {
        markersLayer.removeLayer(layer)
      }
    })
    
    // Add plaza polygons
    const plazaData = getPlazas()
    if (plazaData) {
      gisLayers.plazas = L.geoJSON(plazaData, {
        style: {
          color: '#6a0dad',
          weight: 2,
          opacity: 0.8,
          fillOpacity: 0.3,
          fillColor: '#6a0dad'
        },
        onEachFeature: (feature, layer) => {
          if (feature.properties && feature.properties.Name) {
            layer.bindPopup(`<strong>${feature.properties.Name}</strong>`)
          }
        }
      }).addTo(map)
    }
    
    // Add CPN markers
    const cpnData = getCPNs()
    if (cpnData && cpnData.features) {
      cpnData.features.forEach(feature => {
        if (feature.geometry && feature.geometry.coordinates) {
          const coords = [feature.geometry.coordinates[1], feature.geometry.coordinates[0]]
          const marker = L.marker(coords, {
            icon: L.divIcon({
              className: 'plaza-marker',
              html: '<div class="marker-icon">📍</div>',
              iconSize: [20, 20],
              iconAnchor: [10, 10]
            })
          })
          
          marker.bindPopup(`<strong>${feature.properties.NAME || 'CPN'}</strong>`)
          markersLayer.addLayer(marker)
        }
      })
    }
  }
}

const toggleBasemap = () => {
  if (showBasemap.value) {
    basemapLayer.addTo(map)
  } else {
    map.removeLayer(basemapLayer)
  }
}

const toggleRotation = () => {
  if (cityAligned.value) {
    // Start with calculated angle, but allow manual adjustment
    const calculatedAngle = calculateCityAlignmentAngle()
    rotationAngle.value = calculatedAngle
    console.log(`Initial calculated angle: ${calculatedAngle}°`)
    
    // Show detailed geometric analysis
    const analysis = analyzeCityGeometry(getTrashFence())
    if (analysis.success) {
      console.log('🔥 Black Rock City Geometric Analysis:', analysis)
    }
    
    // Use leaflet-rotate API for proper rotation
    map.setBearing(calculatedAngle)
    console.log('🔄 Applied rotation using leaflet-rotate plugin')
  } else {
    // Reset to true north orientation
    rotationAngle.value = 0
    map.setBearing(0)
    console.log('🧭 Reset to true north orientation')
  }
  
  // Force map to recalculate size after rotation
  setTimeout(() => map.invalidateSize(), 100)
}

const applyRotation = () => {
  if (!cityAligned.value) return
  
  console.log(`Applying rotation: ${rotationAngle.value}°`)
  
  // Use leaflet-rotate API for proper rotation with maintained interactions
  map.setBearing(rotationAngle.value)
  console.log('🔄 Applied rotation using leaflet-rotate plugin - interactions maintained!')
  
  // Force map to recalculate size after rotation
  setTimeout(() => map.invalidateSize(), 50)
}
</script>

<style scoped>
#map-section {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  height: 100%;
}

#map {
  height: 100%;
  width: 100%;
}

/* Adjust Leaflet controls to avoid header on mobile */
:deep(.leaflet-top.leaflet-left) {
  top: 66px !important; /* Push below mobile header */
  left: 10px !important;
}

/* Additional margin for zoom controls */
:deep(.leaflet-control-zoom) {
  margin-top: 0 !important;
}

.map-controls {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 1000;
  background: rgba(26, 26, 26, 0.9);
  padding: 10px;
  border-radius: 4px;
  border: 1px solid #444;
}

.map-control {
  display: block;
  margin: 5px 0;
  color: #ccc;
  cursor: pointer;
}

.map-control input {
  margin-right: 5px;
}

.map-control:hover {
  color: #fff;
}

/* Mobile controls toggle button */
.map-controls-toggle {
  position: fixed;
  top: 66px; /* Account for mobile header height */
  right: 10px;
  z-index: 1001;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: rgba(26, 26, 26, 0.9);
  border: 1px solid #444;
  color: #fff;
  font-size: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.map-controls-toggle:active {
  transform: scale(0.95);
}

/* Mobile controls panel */
.map-controls.mobile-controls {
  position: fixed;
  top: 0;
  right: -350px; /* Fully hide panel including padding, border and shadow */
  width: 280px;
  height: 100%;
  max-width: 80vw;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  transition: right 0.3s ease;
  z-index: 1002;
  padding: 20px;
  padding-bottom: 80px;
}

.map-controls.mobile-controls.controls-open {
  right: 0;
}

/* Mobile backdrop */
.map-controls-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1001;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Close button for mobile */
.close-controls {
  width: 100%;
  padding: 12px;
  margin-top: 20px;
  background: #333;
  border: 1px solid #555;
  color: #fff;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
}

.close-controls:active {
  background: #444;
}

.rotation-slider {
  flex-direction: column;
  gap: 5px;
}

.rotation-slider label {
  font-size: 11px;
  color: #FFD700;
}

.slider {
  width: 150px;
  height: 4px;
  border-radius: 2px;
  background: #444;
  outline: none;
}

.slider::-webkit-slider-thumb {
  appearance: none;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #FFD700;
  cursor: pointer;
}

.slider::-moz-range-thumb {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #FFD700;
  cursor: pointer;
  border: none;
}

.rotation-note {
  font-size: 10px;
  color: #00ff88;
  margin-top: 3px;
  text-align: center;
  line-height: 1.2;
}

.controls-divider {
  margin: 10px 0;
  border: none;
  border-top: 1px solid #444;
}

/* Marker styles */
:deep(.marker-icon) {
  background: rgba(26, 26, 26, 0.9);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  border: 2px solid #fff;
}

:deep(.special-marker .marker-icon) {
  background: rgba(139, 0, 0, 0.9);
  border-color: #FFD700;
  font-size: 20px;
}

:deep(.camp-marker .marker-icon) {
  background: rgba(34, 139, 34, 0.9);
}

:deep(.art-marker .marker-icon) {
  background: rgba(106, 90, 205, 0.9);
}

:deep(.event-marker .marker-icon) {
  background: rgba(255, 140, 0, 0.9);
}

:deep(.plaza-marker .marker-icon) {
  background: rgba(106, 13, 173, 0.9);
}


.loading-indicator {
  margin-top: 10px;
  color: #FFD700;
  font-size: 12px;
  text-align: center;
}

.error-indicator {
  margin-top: 10px;
  color: #ff6b6b;
  font-size: 12px;
  text-align: center;
}

/* Popup styles */
:deep(.map-popup) {
  color: #333;
}

:deep(.map-popup .favorited) {
  color: #FFD700;
  margin-left: 5px;
}

/* Map Legend */
.map-legend {
  position: fixed;
  bottom: 20px;
  left: 10px;
  z-index: 1000;
  background: rgba(26, 26, 26, 0.95);
  padding: 15px;
  border-radius: 4px;
  border: 1px solid #444;
  max-width: 200px;
}

.map-legend h4 {
  margin: 0 0 10px 0;
  color: #FFD700;
  font-size: 14px;
  text-transform: uppercase;
}

.legend-item {
  display: flex;
  align-items: center;
  margin: 5px 0;
  color: #ccc;
  font-size: 12px;
}

.legend-divider {
  margin: 10px 0;
  border: none;
  border-top: 1px solid #444;
}

.legend-icon {
  width: 20px;
  height: 20px;
  margin-right: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-size: 12px;
}

.legend-icon.special-location {
  background: rgba(139, 0, 0, 0.9);
  border: 2px solid #FFD700;
}

.legend-icon.camp {
  background: rgba(34, 139, 34, 0.9);
  border: 2px solid #fff;
}

.legend-icon.art {
  background: rgba(106, 90, 205, 0.9);
  border: 2px solid #fff;
}

.legend-icon.event {
  background: rgba(255, 140, 0, 0.9);
  border: 2px solid #fff;
}

.legend-icon.cpn {
  background: rgba(106, 13, 173, 0.9);
  border: 2px solid #fff;
}

.legend-line {
  width: 20px;
  height: 2px;
  margin-right: 8px;
  display: block;
}

.legend-line.street {
  background: #666666;
}

.legend-line.trash-fence {
  background: #ff0000;
  border-top: 2px dashed #ff0000;
  height: 0;
}

.legend-area {
  width: 20px;
  height: 14px;
  margin-right: 8px;
  display: block;
  border: 1px solid;
}

.legend-area.city-block {
  border-color: #444444;
  background: rgba(34, 34, 34, 0.3);
}

.legend-area.plaza {
  border-color: #6a0dad;
  background: rgba(106, 13, 173, 0.3);
}

:deep(.leaflet-popup-content-wrapper) {
  background: #1a1a1a;
  color: #ccc;
}

:deep(.leaflet-popup-tip) {
  background: #1a1a1a;
}

:deep(.leaflet-popup-close-button) {
  color: #ccc;
}

:deep(.leaflet-popup-close-button:hover) {
  color: #fff;
}
</style>