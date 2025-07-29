<template>
  <section id="map-section" class="view">
    <!-- Mobile Controls -->
    <button 
      v-if="isMobile" 
      @click="openBottomSheet"
      class="map-controls-toggle"
      aria-label="Open map controls"
    >
      ☰
    </button>
    
    <!-- Desktop Controls -->
    <div v-if="!isMobile" class="map-controls-desktop">
      <MapControlTabs
        :isMobile="false"
        :year="year"
        :gisLoadingState="gisLoadingState"
        :initialControls="mapControls"
        :showResetView="showResetView"
        @update:controls="handleControlUpdate"
        @reset-view="resetMapView"
      />
    </div>
    
    <!-- Mobile Bottom Sheet -->
    <MapBottomSheet
      v-if="isMobile"
      ref="bottomSheet"
      :year="year"
      :gisLoadingState="gisLoadingState"
      :controls="mapControls"
      :showResetView="showResetView"
      @update:controls="handleControlUpdate"
      @reset-view="resetMapView"
    />
    
    <!-- Map Container -->
    <div id="map" ref="mapContainer"></div>
    
    <!-- Legend (Desktop draggable, Mobile fixed) -->
    <MapLegend 
      v-if="mapControls.showLegend"
      :isMobile="isMobile"
    />
    
    <!-- Map Info Inspector -->
    <MapInfo
      v-if="mapControls.showMapInfo"
      :isMobile="isMobile"
      :mapState="mapInfoState"
      :markerStats="markerStats"
      :layerStatus="layerStatus"
    />
  </section>
</template>

<script setup>
import { ref, onMounted, computed, reactive, watch } from 'vue'
import { useRoute } from 'vue-router'
import L from 'leaflet'
import 'leaflet-rotate'
import 'leaflet.offline'
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
  gisStyles,
  setGISYear 
} from '../services/gisData'
import MapControlTabs from '../components/map/MapControlTabs.vue'
import MapBottomSheet from '../components/map/MapBottomSheet.vue'
import MapLegend from '../components/map/MapLegend.vue'
import MapInfo from '../components/map/MapInfo.vue'

const route = useRoute()
const mapContainer = ref(null)
const bottomSheet = ref(null)

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
const year = computed(() => route.params.year || localStorage.getItem('selectedYear') || '2025')

// Consolidated map controls
const mapControls = reactive({
  // Content controls
  showCamps: true,
  showArt: true,
  showEvents: true,
  showFavoritesOnly: false,
  showInfrastructure: true,
  // Infrastructure subcategories
  showTheMan: true,
  showCenterCamp: true,
  showTemple: true,
  showAirport: true,
  showMedical: true,
  showRangers: true,
  showDPW: true,
  showArctica: true,
  // Layer controls
  showStreets: true,
  showTrashFence: true,
  showCityBlocks: false,
  showPlazas: true,
  showCPNs: true,
  // Display controls
  showBasemap: false,
  cityAligned: false,
  rotationAngle: 0,
  showLegend: !isMobile.value,
  showMapInfo: false
})

const gisLoadingState = ref({ isLoading: false, error: null })

// Track if we're at default view
const isDefaultView = ref(true)
const defaultZoom = 15  // Zoom level that shows city streets on base map
const defaultCenter = BRC_CENTER
const defaultBearing = 0

// Computed property to show reset view button
const showResetView = computed(() => !isDefaultView.value)

// Map info state
const mapInfoState = reactive({
  zoom: defaultZoom,
  center: { lat: defaultCenter[0], lng: defaultCenter[1] },
  bearing: 0,
  bounds: null,
  size: { width: 0, height: 0 }
})

// Marker statistics
const markerStats = reactive({
  camps: 0,
  campsFiltered: 0,
  art: 0,
  artFiltered: 0,
  events: 0,
  eventsFiltered: 0,
  totalVisible: 0
})

// Layer status for info panel
const layerStatus = computed(() => ({
  basemap: mapControls.showBasemap,
  streets: mapControls.showStreets,
  trashFence: mapControls.showTrashFence,
  cityBlocks: mapControls.showCityBlocks,
  plazas: mapControls.showPlazas,
  cpns: mapControls.showCPNs,
  infrastructure: mapControls.showInfrastructure,
  favoritesOnly: mapControls.showFavoritesOnly
}))

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
}

// Open bottom sheet on mobile
const openBottomSheet = () => {
  if (bottomSheet.value) {
    bottomSheet.value.open()
  }
}

// Handle control updates from child components
const handleControlUpdate = (newControls) => {
  Object.assign(mapControls, newControls)
  
  // Don't process updates if map isn't initialized yet
  if (!map || !markersLayer) {
    console.log('Map not initialized yet, skipping control update')
    return
  }
  
  // Update markers based on content controls
  if ('showCamps' in newControls || 'showArt' in newControls || 
      'showEvents' in newControls || 'showFavoritesOnly' in newControls) {
    updateMarkers()
  }
  
  // Update GIS layers
  if ('showStreets' in newControls || 'showTrashFence' in newControls || 
      'showCityBlocks' in newControls || 'showPlazas' in newControls || 
      'showCPNs' in newControls) {
    updateGISLayers()
  }
  
  // Update infrastructure markers
  if ('showInfrastructure' in newControls || 'showTheMan' in newControls || 
      'showCenterCamp' in newControls || 'showTemple' in newControls ||
      'showAirport' in newControls || 'showMedical' in newControls ||
      'showRangers' in newControls || 'showDPW' in newControls ||
      'showArctica' in newControls) {
    // Clear existing infrastructure markers
    markersLayer.eachLayer(layer => {
      if (layer.options.className === 'infrastructure-marker') {
        markersLayer.removeLayer(layer)
      }
    })
    // Re-add with new settings
    addInfrastructureMarkers()
  }
  
  // Update plazas and CPNs layers
  if ('showPlazas' in newControls || 'showCPNs' in newControls) {
    updateGISLayers()
  }
  
  // Handle basemap toggle
  if ('showBasemap' in newControls) {
    toggleBasemap()
  }
  
  // Handle rotation
  if ('cityAligned' in newControls) {
    toggleRotation()
  } else if ('rotationAngle' in newControls && mapControls.cityAligned) {
    applyRotation()
  }
}

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

// Function to check if we're at default view
const checkDefaultView = () => {
  if (!map) return
  
  const currentZoom = map.getZoom()
  const currentCenter = map.getCenter()
  const currentBearing = map.getBearing() || 0
  
  const isAtDefaultZoom = Math.abs(currentZoom - defaultZoom) < 0.5
  const isAtDefaultCenter = currentCenter.distanceTo(defaultCenter) < 100 // within 100 meters
  const isAtDefaultBearing = Math.abs(currentBearing - defaultBearing) < 5 // within 5 degrees
  
  isDefaultView.value = isAtDefaultZoom && isAtDefaultCenter && isAtDefaultBearing && !mapControls.cityAligned
}

// Update map info state
const updateMapInfoState = () => {
  if (!map) return
  
  const center = map.getCenter()
  const size = map.getSize()
  
  mapInfoState.zoom = map.getZoom()
  mapInfoState.center = { lat: center.lat, lng: center.lng }
  mapInfoState.bearing = map.getBearing() || 0
  mapInfoState.bounds = map.getBounds()
  mapInfoState.size = { width: size.x, height: size.y }
}

// Reset map to default view
const resetMapView = () => {
  if (!map) return
  
  // Reset rotation if needed
  if (mapControls.cityAligned) {
    mapControls.cityAligned = false
    mapControls.rotationAngle = 0
  }
  
  // Animate to default view
  map.flyTo(defaultCenter, defaultZoom, {
    bearing: defaultBearing,
    duration: 1.5
  })
  
  // Update default view state after animation
  setTimeout(() => {
    checkDefaultView()
  }, 1600)
}

// Watch for year changes and reload data
watch(year, async (newYear, oldYear) => {
  if (!map || newYear === oldYear) return
  
  console.log(`Year changed from ${oldYear} to ${newYear}, reloading map data...`)
  
  // Update basemap availability (only 2025 has basemap)
  if (newYear !== '2025' && mapControls.showBasemap) {
    mapControls.showBasemap = false
    toggleBasemap()
  } else if (newYear === '2025' && !mapControls.showBasemap) {
    // Optionally enable basemap for 2025
    mapControls.showBasemap = true
    toggleBasemap()
  }
  
  // Clear existing markers
  markersLayer.clearLayers()
  
  // Update GIS data year
  setGISYear(parseInt(newYear))
  
  // Reload GIS layers with new year's data
  updateGISLayers()
  
  // Re-add infrastructure markers
  addInfrastructureMarkers()
  
  // Reload camps/art/events data
  await loadData()
  
  // Update map info state
  updateMapInfoState()
})

onMounted(async () => {
  // Load saved control state from localStorage
  const savedState = localStorage.getItem('mapControlState')
  if (savedState) {
    try {
      const parsed = JSON.parse(savedState)
      Object.assign(mapControls, parsed)
    } catch (e) {
      console.error('Failed to load map control state:', e)
    }
  }
  
  // Enable basemap only for 2025 (if not already set by saved state)
  if (year.value === '2025' && savedState && !JSON.parse(savedState).hasOwnProperty('showBasemap')) {
    mapControls.showBasemap = true
  }
  
  // Initialize Leaflet map with rotation support
  map = L.map(mapContainer.value, {
    center: BRC_CENTER,
    zoom: defaultZoom,
    zoomControl: true,
    rotate: true,
    bearing: 0
  })
  
  // Set black background when basemap is off
  if (!mapControls.showBasemap) {
    mapContainer.value.style.backgroundColor = '#000000'
  }
  
  // Create offline-capable basemap layer
  basemapLayer = L.tileLayer.offline('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
    maxZoom: 19,
    subdomains: 'abc',
    crossOrigin: true
  })
  
  // Add basemap if enabled and year is 2025
  if (mapControls.showBasemap && year.value === '2025') {
    basemapLayer.addTo(map)
  }
  
  markersLayer = L.layerGroup().addTo(map)
  
  // Track map view changes
  map.on('moveend zoomend rotate', () => {
    checkDefaultView()
    updateMapInfoState()
  })
  
  // Track map size changes
  map.on('resize', () => {
    mapInfoState.size = {
      width: map.getSize().x,
      height: map.getSize().y
    }
  })
  
  // Initial map info update
  updateMapInfoState()
  
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
  
  // Add infrastructure markers
  addInfrastructureMarkers()
  
  // Load data and add markers
  loadData()
  
  // Apply rotation if city aligned was saved
  if (mapControls.cityAligned) {
    // If no rotation angle is saved, calculate it
    if (!mapControls.rotationAngle) {
      mapControls.rotationAngle = calculateCityAlignmentAngle()
    }
    map.setBearing(mapControls.rotationAngle)
    console.log(`Applied saved rotation: ${mapControls.rotationAngle}°`)
  }
  
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

const addInfrastructureMarkers = () => {
  // Only add if infrastructure is enabled
  if (!mapControls.showInfrastructure) {
    return
  }
  
  const specialLocations = [
    { 
      name: 'The Man', 
      coords: BRC_CENTER, 
      icon: '🔥',
      description: 'The heart of Black Rock City - our iconic effigy and gathering place',
      controlKey: 'showTheMan'
    },
    { 
      name: 'Center Camp', 
      coords: getSpecialLocationCoords('CENTER CAMP'), 
      icon: '⛺',
      description: 'Central hub with cafe, performances, and community services',
      controlKey: 'showCenterCamp'
    },
    { 
      name: 'Temple', 
      coords: getSpecialLocationCoords('TEMPLE'), 
      icon: '🏛',
      description: 'Sacred space for reflection, remembrance, and healing',
      controlKey: 'showTemple'
    },
    { 
      name: 'Airport', 
      coords: getSpecialLocationCoords('AIRPORT'), 
      icon: '✈️',
      description: 'Black Rock City Municipal Airport - scenic flights and aviation services',
      controlKey: 'showAirport'
    },
    {
      name: 'Medical',
      coords: getSpecialLocationCoords('MEDICAL'),
      icon: '🏥',
      description: 'Emergency medical services - 5:30 & Esplanade',
      controlKey: 'showMedical'
    },
    {
      name: 'Ranger HQ',
      coords: getSpecialLocationCoords('RANGER HQ'),
      icon: '🎯',
      description: 'Black Rock Rangers headquarters - 5:45 & Esplanade',
      controlKey: 'showRangers'
    },
    {
      name: 'DPW Depot',
      coords: getSpecialLocationCoords('DPOW'),
      icon: '🔧',
      description: 'Department of Public Works - city infrastructure and operations',
      controlKey: 'showDPW'
    },
    {
      name: 'Arctica',
      coords: getSpecialLocationCoords('ARCTICA'),
      icon: '🧊',
      description: 'Ice sales for keeping cool in the desert - 3:00 & C',
      controlKey: 'showArctica'
    }
  ]
  
  specialLocations.forEach(loc => {
    // Check if this specific infrastructure is enabled
    if (!mapControls[loc.controlKey]) return
    if (loc.coords) {
      const marker = L.marker(loc.coords, {
        icon: L.divIcon({
          className: 'infrastructure-marker',
          html: `<div class="marker-icon">${loc.icon}</div>`,
          iconSize: [30, 30],
          iconAnchor: [15, 15]
        })
      })
      
      marker.bindPopup(`
        <div class="infrastructure-popup">
          <strong>${loc.name}</strong>
          <span class="description">${loc.description}</span>
        </div>
      `)
      markersLayer.addLayer(marker)
    }
  })
}

const loadData = async () => {
  try {
    // Set the correct year for GIS data
    setGISYear(parseInt(year.value))
    
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
  // Clear existing markers (except infrastructure)
  markersLayer.eachLayer(layer => {
    if (!layer.options.icon?.options?.className?.includes('infrastructure-marker') &&
        !layer.options.icon?.options?.className?.includes('cpn-marker')) {
      markersLayer.removeLayer(layer)
    }
  })
  
  // Reset marker statistics
  let visibleCamps = 0
  let filteredCamps = 0
  let visibleArt = 0
  let filteredArt = 0
  let visibleEvents = 0
  let filteredEvents = 0
  
  // Add camp markers
  if (mapControls.showCamps) {
    items.camps.forEach(camp => {
      if (mapControls.showFavoritesOnly && !isFavorite('camp', camp.uid)) {
        filteredCamps++
        return
      }
      addMarker(camp, 'camp', '🏠')
      visibleCamps++
    })
  }
  
  // Add art markers
  if (mapControls.showArt) {
    items.art.forEach(art => {
      if (mapControls.showFavoritesOnly && !isFavorite('art', art.uid)) {
        filteredArt++
        return
      }
      addMarker(art, 'art', '🎨')
      visibleArt++
    })
  }
  
  // Add event markers
  if (mapControls.showEvents) {
    items.events.forEach(event => {
      if (mapControls.showFavoritesOnly && !isFavorite('event', event.uid)) {
        filteredEvents++
        return
      }
      addMarker(event, 'event', '🎉')
      visibleEvents++
    })
  }
  
  // Update marker statistics
  markerStats.camps = mapControls.showCamps ? visibleCamps : 0
  markerStats.campsFiltered = mapControls.showCamps ? filteredCamps : 0
  markerStats.art = mapControls.showArt ? visibleArt : 0
  markerStats.artFiltered = mapControls.showArt ? filteredArt : 0
  markerStats.events = mapControls.showEvents ? visibleEvents : 0
  markerStats.eventsFiltered = mapControls.showEvents ? filteredEvents : 0
  markerStats.totalVisible = visibleCamps + visibleArt + visibleEvents
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
  if (mapControls.showStreets) {
    const streetData = getStreetLines()
    if (streetData) {
      gisLayers.streetLines = L.geoJSON(streetData, {
        style: (feature) => {
          // Use custom red styling when basemap is off
          if (!mapControls.showBasemap) {
            return {
              color: '#FF0000',
              weight: 4,
              opacity: 1
            }
          }
          // Use default styling when basemap is on
          const type = feature.properties.type
          return gisStyles.streetLines[type] || gisStyles.streetLines.arc
        },
        onEachFeature: (feature, layer) => {
          if (feature.properties && feature.properties.name) {
            layer.bindPopup(`<strong>${feature.properties.name}</strong>Type: ${feature.properties.type}`)
          }
        }
      }).addTo(map)
    }
  }
  
  // Add trash fence
  if (mapControls.showTrashFence) {
    const trashFenceData = getTrashFence()
    if (trashFenceData) {
      gisLayers.trashFence = L.geoJSON(trashFenceData, {
        style: gisStyles.trashFence
      }).addTo(map)
    }
  }
  
  // Add city blocks
  if (mapControls.showCityBlocks) {
    const cityBlocksData = getCityBlocks()
    if (cityBlocksData) {
      gisLayers.cityBlocks = L.geoJSON(cityBlocksData, {
        style: gisStyles.cityBlocks
      }).addTo(map)
    }
  }
  
  
  // Add plaza polygons
  if (mapControls.showPlazas) {
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
            layer.bindPopup(`
              <div class="infrastructure-popup">
                <strong>${feature.properties.Name}</strong>
                <span class="description">Plaza area - Themed community space</span>
              </div>
            `)
          }
        }
      }).addTo(map)
    }
  }
  
  // Add CPN markers
  if (mapControls.showCPNs) {
    const cpnData = getCPNs()
    if (cpnData && cpnData.features) {
      cpnData.features.forEach(feature => {
        if (feature.geometry && feature.geometry.coordinates) {
          const coords = [feature.geometry.coordinates[1], feature.geometry.coordinates[0]]
          const marker = L.marker(coords, {
            icon: L.divIcon({
              className: 'cpn-marker',
              html: '<div class="marker-icon">📍</div>',
              iconSize: [20, 20],
              iconAnchor: [10, 10]
            })
          })
          
          // Determine CPN type and description
          const cpnName = feature.properties.NAME || 'CPN'
          let description = 'Info Pending'
          
          // Check if it's a plaza portal based on name or location
          if (cpnName.includes('Plaza') || cpnName.includes('PLAZA')) {
            description = 'Plaza portal - Entry/exit point to themed plaza area'
          } else if (cpnName.includes('Center') || cpnName.includes('CENTER')) {
            description = 'Center Camp Portal - Access point to Center Camp plaza'
          } else if (cpnName.includes('CPN')) {
            description = 'Camp Placement Number - Reference point for camp locations'
          }
          
          marker.bindPopup(`
            <div class="infrastructure-popup">
              <strong>${cpnName}</strong>
              <span class="description">${description}</span>
            </div>
          `)
          markersLayer.addLayer(marker)
        }
      })
    }
  }
}

const toggleBasemap = () => {
  if (year.value !== '2025') return // Don't allow toggle for non-2025 years
  
  if (mapControls.showBasemap) {
    basemapLayer.addTo(map)
    mapContainer.value.style.backgroundColor = ''
  } else {
    map.removeLayer(basemapLayer)
    mapContainer.value.style.backgroundColor = '#000000'
  }
  
  // Update GIS layers to apply correct styling
  updateGISLayers()
}

const toggleRotation = () => {
  if (mapControls.cityAligned) {
    // Only calculate angle if we don't have one saved
    if (!mapControls.rotationAngle) {
      const calculatedAngle = calculateCityAlignmentAngle()
      mapControls.rotationAngle = calculatedAngle
      console.log(`Initial calculated angle: ${calculatedAngle}°`)
      
      // Show detailed geometric analysis
      const analysis = analyzeCityGeometry(getTrashFence())
      if (analysis.success) {
        console.log('🔥 Black Rock City Geometric Analysis:', analysis)
      }
    }
    
    // Use leaflet-rotate API for proper rotation
    map.setBearing(mapControls.rotationAngle)
    console.log('🔄 Applied rotation using leaflet-rotate plugin')
  } else {
    // Reset to true north orientation
    mapControls.rotationAngle = 0
    map.setBearing(0)
    console.log('🧭 Reset to true north orientation')
  }
  
  // Force map to recalculate size after rotation
  setTimeout(() => map.invalidateSize(), 100)
}

const applyRotation = () => {
  if (!mapControls.cityAligned) return
  
  console.log(`Applying rotation: ${mapControls.rotationAngle}°`)
  
  // Use leaflet-rotate API for proper rotation with maintained interactions
  map.setBearing(mapControls.rotationAngle)
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

/* Desktop controls container */
.map-controls-desktop {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 1000;
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

:deep(.infrastructure-marker .marker-icon) {
  background: rgba(139, 0, 0, 0.9);
  border-color: #FFD700;
  font-size: 20px;
}

:deep(.cpn-marker .marker-icon) {
  background: rgba(106, 13, 173, 0.9);
  border-color: #fff;
  font-size: 14px;
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


/* Leaflet Popup Styling */
:deep(.leaflet-popup-content-wrapper) {
  background: rgba(26, 26, 26, 0.95);
  color: #fff;
  border: 1px solid #444;
  border-radius: 8px;
  box-shadow: 0 3px 14px rgba(0, 0, 0, 0.4);
}

:deep(.leaflet-popup-content) {
  margin: 12px;
  font-size: 14px;
  line-height: 1.4;
}

:deep(.leaflet-popup-tip) {
  background: rgba(26, 26, 26, 0.95);
  border: 1px solid #444;
  box-shadow: 0 3px 14px rgba(0, 0, 0, 0.4);
}

:deep(.leaflet-popup-close-button) {
  color: #999;
  font-size: 20px;
  font-weight: normal;
  padding: 4px 8px;
}

:deep(.leaflet-popup-close-button:hover) {
  color: #fff;
  background: rgba(139, 0, 0, 0.3);
  border-radius: 4px;
}

/* Popup content styling */
:deep(.map-popup) {
  color: #fff;
}

/* Infrastructure popup styling */
:deep(.infrastructure-popup) {
  min-width: 200px;
}

:deep(.infrastructure-popup strong) {
  color: #FFD700;
  font-weight: bold;
  display: block;
  margin-bottom: 0.25rem;
}

:deep(.infrastructure-popup .description) {
  color: #ccc;
  font-size: 0.8rem;
  line-height: 1.3;
  display: block;
  margin-top: 0.25rem;
}

:deep(.map-popup strong) {
  color: #FFD700;
  font-size: 16px;
  display: block;
  margin-bottom: 4px;
}

:deep(.map-popup small) {
  color: #ccc;
  font-size: 12px;
}

:deep(.map-popup .favorited) {
  color: #FFD700;
  font-size: 16px;
  margin-left: 8px;
}

/* Map background styling */
#map {
  background-color: #1a1a1a; /* Default dark background */
}

:deep(.leaflet-container) {
  background-color: inherit;
}
</style>