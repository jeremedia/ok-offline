<template>
  <section id="map-section" class="view">
    <div class="map-controls">
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
    </div>
    <div id="map" ref="mapContainer"></div>
  </section>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import L from 'leaflet'
import { BRC_CENTER } from '../config'
import { getFromCache } from '../services/storage'
import { isFavorite } from '../services/favorites'
import { getItemName, getItemLocation } from '../utils'
import { brcAddressToLatLon, getSpecialLocationCoords } from '../utils/geocoding'
import { 
  initializeGISData, 
  getStreetLines, 
  getTrashFence, 
  getCityBlocks,
  getPlazas,
  getCPNs,
  gisStyles 
} from '../services/gisData'

const route = useRoute()
const mapContainer = ref(null)
const showCamps = ref(true)
const showArt = ref(true)
const showEvents = ref(true)
const showFavoritesOnly = ref(false)
const showStreets = ref(true)
const showTrashFence = ref(true)
const showCityBlocks = ref(false)
const showPlazas = ref(true)
const year = computed(() => route.params.year || localStorage.getItem('selectedYear') || '2025')

let map = null
let markersLayer = null
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
  // Initialize Leaflet map
  map = L.map(mapContainer.value, {
    center: BRC_CENTER,
    zoom: 13,
    zoomControl: true
  })
  
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
    maxZoom: 19
  }).addTo(map)
  
  markersLayer = L.layerGroup().addTo(map)
  
  // Initialize GIS data
  await initializeGISData()
  
  // Add GIS layers
  updateGISLayers()
  
  // Add special location markers
  addSpecialLocations()
  
  // Load data and add markers
  loadData()
  
  // Fix map size after mounting
  setTimeout(() => map.invalidateSize(), 100)
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
    
    // Add plaza markers
    const plazaData = getPlazas()
    if (plazaData && plazaData.features) {
      plazaData.features.forEach(feature => {
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
          
          marker.bindPopup(`<strong>${feature.properties.name || 'Plaza'}</strong>`)
          markersLayer.addLayer(marker)
        }
      })
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
</script>

<style scoped>
#map-section {
  position: relative;
  height: 100%;
}

#map {
  height: 100%;
  width: 100%;
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
  background: rgba(70, 130, 180, 0.9);
  border-color: #4682B4;
  font-size: 14px;
}

/* Popup styles */
:deep(.map-popup) {
  color: #333;
}

:deep(.map-popup .favorited) {
  color: #FFD700;
  margin-left: 5px;
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