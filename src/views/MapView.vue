<template>
  <div class="view-container">
    <section id="map-section" class="view">
    <!-- Mobile Controls -->
    <button 
      v-if="isMobile" 
      @click="openBottomSheet"
      class="map-controls-toggle"
      aria-label="Open map controls"
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <line x1="3" y1="9" x2="21" y2="9" />
        <line x1="9" y1="21" x2="9" y2="9" />
      </svg>
    </button>
    
    <!-- Desktop Controls -->
    <div v-if="!isMobile" class="map-controls-desktop">
      <MapControlTabs
        :isMobile="false"
        :year="year"
        :gisLoadingState="gisLoadingState"
        :initialControls="mapControls"
        :showResetView="showResetView"
        :userLocation="userLocation"
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
      :userLocation="userLocation"
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
      :userLocation="userLocation"
      :locationLoading="locationLoading"
      @center-on-location="centerOnUserLocation"
      @enable-location="enableLocationAndCenter"
    />
    
    <!-- Route Info Panel -->
    <div 
      v-if="hasActiveRoute" 
      class="route-info-panel"
      :class="{ 'mobile': isMobile, 'route-mode': isInRouteMode }"
    >
      <div class="route-header">
        <span class="route-icon">🗺️</span>
        <div class="route-details">
          <div class="route-mode-indicator" v-if="isInRouteMode">
            <span class="mode-badge">🎯 ROUTE MODE</span>
          </div>
          <div class="route-target">{{ routeDetails?.target.name }}</div>
          <div class="route-summary">{{ routeSummary }}</div>
        </div>
        <div class="route-controls">
          <BaseButton 
            @click="toggleRouteMode"
            variant="ghost"
            size="sm"
            :title="`Switch to ${routeModeInfo.label === 'Walking' ? 'biking' : 'walking'} mode`"
            class="mode-toggle-btn"
          >
            {{ routeModeInfo.label === 'Walking' ? '🚴' : '🚶' }}
          </BaseButton>
          <BaseButton 
            @click="clearRouteAndRestore"
            variant="ghost"
            size="sm"
            title="Clear route"
            class="clear-route-btn"
          >
            ✕
          </BaseButton>
        </div>
      </div>
    </div>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, reactive, watch, inject } from 'vue'
import { useRoute } from 'vue-router'
import { useGeolocation } from '../composables/useGeolocation'
import { useSimulation } from '../composables/useSimulation'
import { useSoonAndNear } from '../composables/useSoonAndNear'
import { useRouting } from '../composables/useRouting'
import L from 'leaflet'
import 'leaflet-rotate'
import 'leaflet.offline'
import { BRC_CENTER } from '../config'
import { getFromCache } from '../services/storage'
import { isFavorite } from '../services/favorites'
import { getItemName, getItemLocation, getNextOccurrence, isHappeningNow } from '../utils'
import { brcAddressToLatLon, getSpecialLocationCoords, calculateCityAlignmentAngle, analyzeCityGeometry } from '../utils/geocoding'
import { 
  initializeGISData, 
  getStreetLines, 
  getTrashFence, 
  getCityBlocks,
  getPlazas,
  getCPNs,
  getToilets,
  getStreetOutlines,
  getLoadingState,
  gisStyles,
  setGISYear 
} from '../services/gisData'
import MapControlTabs from '../components/map/MapControlTabs.vue'
import MapBottomSheet from '../components/map/MapBottomSheet.vue'
import MapLegend from '../components/map/MapLegend.vue'
import MapInfo from '../components/map/MapInfo.vue'
import BaseButton from '../components/ui/BaseButton.vue'

const route = useRoute()
const mapContainer = ref(null)
const bottomSheet = ref(null)

// Inject map controls toggle event from App
const mapControlsToggle = inject('mapControlsToggle')
console.log('MapView: Injected mapControlsToggle:', mapControlsToggle)

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
console.log('MapView: isMobile initial value:', isMobile.value)
const year = computed(() => route.params.year || localStorage.getItem('selectedYear') || '2025')

// Helper function to get CSS variable values for JavaScript
const getCSSColor = (varName) => {
  return getComputedStyle(document.documentElement).getPropertyValue(varName).trim()
}

// Geolocation integration for "Soon & Near" features
const { userLocation, locationLoading, getCurrentLocation, getDistanceTo, checkLocationPermission } = useGeolocation()
const { getCurrentTime } = useSimulation()
const { isEnabled: soonAndNearEnabled, radius: soonAndNearRadius, setEnabled: setSoonAndNearEnabled, setRadius: setSoonAndNearRadius } = useSoonAndNear()

// Routing integration
const { 
  currentRoute, 
  routeWaypoints, 
  routeStyle, 
  routeSummary, 
  routeDetails,
  createRoute,
  clearRoute,
  hasActiveRoute,
  routeModeInfo,
  toggleRouteMode,
  isInRouteMode,
  isInBrowseMode
} = useRouting()

// User location marker, radius circle, and route line
let userLocationMarker = null
let radiusCircle = null
let routeLine = null

// Performance optimization: Cache nearby events with pre-calculated distances
let cachedNearbyEvents = []
let lastCacheLocation = null
let radiusUpdateTimeout = null

// Live countdown tracking for event popups
let countdownIntervals = new Map() // Track active countdown intervals by marker ID
let openPopups = new Set() // Track which popups are currently open

// Format event time for display
const formatEventTime = (occurrence) => {
  if (!occurrence) return 'Time TBD'
  
  const startTime = new Date(occurrence.start_time)
  const endTime = occurrence.end_time ? new Date(occurrence.end_time) : null
  
  const timeFormat = { 
    weekday: 'short', 
    month: 'short', 
    day: 'numeric', 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  }
  
  let timeString = startTime.toLocaleDateString('en-US', timeFormat)
  if (endTime && endTime.getTime() !== startTime.getTime()) {
    const endFormat = startTime.toDateString() === endTime.toDateString() 
      ? { hour: 'numeric', minute: '2-digit', hour12: true }
      : timeFormat
    timeString += ` - ${endTime.toLocaleDateString('en-US', endFormat)}`
  }
  
  return timeString
}

// Calculate countdown to event start
const calculateCountdown = (startTime) => {
  const now = getCurrentTime()
  const start = new Date(startTime)
  const diffMs = start - now
  
  if (diffMs <= 0) return 'Started'
  
  const minutes = Math.floor(diffMs / (1000 * 60))
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  
  if (hours > 0) {
    return `${hours}h ${remainingMinutes}m`
  } else {
    return `${minutes}m`
  }
}

// Check if event starts within an hour
const isStartingSoon = (startTime) => {
  const now = getCurrentTime()
  const start = new Date(startTime)
  const diffMs = start - now
  return diffMs > 0 && diffMs <= 60 * 60 * 1000 // 1 hour in milliseconds
}

// Generate event-specific popup content
const getEventPopupContent = (event) => {
  const nextOccurrence = getNextOccurrence(event)
  if (!nextOccurrence) return ''
  
  const eventType = event.event_type?.label || 'Event'
  const formattedTime = formatEventTime(nextOccurrence)
  const startingSoon = isStartingSoon(nextOccurrence.start_time)
  
  let eventInfo = `
    <div class="event-info">
      <div class="event-type">📅 ${eventType}</div>
      <div class="event-time">${formattedTime}</div>
  `
  
  if (startingSoon) {
    const countdown = calculateCountdown(nextOccurrence.start_time)
    eventInfo += `
      <div class="event-countdown">
        🚨 Starting in <span class="countdown-text" data-start-time="${nextOccurrence.start_time}">${countdown}</span>
      </div>
    `
  }
  
  eventInfo += '</div>'
  return eventInfo
}

// Start countdown interval for a popup
const startCountdownInterval = (markerId, startTime) => {
  // Clear existing interval if any
  if (countdownIntervals.has(markerId)) {
    clearInterval(countdownIntervals.get(markerId))
  }
  
  const interval = setInterval(() => {
    const countdownElement = document.querySelector(`[data-marker-id="${markerId}"] .countdown-text`)
    if (countdownElement && openPopups.has(markerId)) {
      const newCountdown = calculateCountdown(startTime)
      countdownElement.textContent = newCountdown
      
      // Stop countdown if event has started
      if (newCountdown === 'Started') {
        countdownElement.closest('.event-countdown').innerHTML = '🎉 <strong>Event Started!</strong>'
        clearInterval(interval)
        countdownIntervals.delete(markerId)
      }
    } else {
      // Cleanup if popup is closed or element not found
      clearInterval(interval)
      countdownIntervals.delete(markerId)
    }
  }, 30000) // Update every 30 seconds
  
  countdownIntervals.set(markerId, interval)
}

// Pre-calculate and cache events within reasonable distance (performance optimization)
const cacheNearbyEvents = () => {
  if (!userLocation.value || !items.events.length) {
    cachedNearbyEvents = []
    return
  }

  console.log('🔄 Pre-calculating distances for Soon & Near optimization...')
  const maxReasonableDistance = 1500 // Cache events within 1500ft (beyond max slider range)
  
  cachedNearbyEvents = items.events
    .map(event => {
      const distanceData = getDistanceTo(getItemLocation(event))
      return {
        event,
        distanceInFeet: distanceData?.feet || 99999
      }
    })
    .filter(item => item.distanceInFeet <= maxReasonableDistance)
    .sort((a, b) => a.distanceInFeet - b.distanceInFeet) // Sort by distance for faster filtering

  lastCacheLocation = [...userLocation.value] // Store current location
  console.log(`⚡ Cached ${cachedNearbyEvents.length} nearby events (from ${items.events.length} total)`)
}

// Debounced radius update using cached data (performance optimization)
const debouncedRadiusUpdate = () => {
  // Clear existing timeout
  if (radiusUpdateTimeout) {
    clearTimeout(radiusUpdateTimeout)
  }

  // Debounce rapid slider changes (100ms delay)
  radiusUpdateTimeout = setTimeout(() => {
    updateMarkers()
  }, 100)
}

// Add or update user location marker
const updateUserLocationMarker = () => {
  if (!map) return
  
  // Remove existing marker
  if (userLocationMarker) {
    map.removeLayer(userLocationMarker)
    userLocationMarker = null
  }
  
  // Add new marker if location is available
  if (userLocation.value) {
    userLocationMarker = L.marker(userLocation.value, {
      icon: L.divIcon({
        className: 'user-location-marker',
        html: '<div class="user-marker-icon">📍</div>',
        iconSize: [30, 30],
        iconAnchor: [15, 15]
      }),
      zIndexOffset: 1000  // Ensure user marker is always on top
    })
    
    userLocationMarker.bindPopup(`
      <div class="map-popup">
        <strong>Your Location</strong><br>
        <small>Lat: ${userLocation.value[0].toFixed(6)}<br>
        Lng: ${userLocation.value[1].toFixed(6)}</small>
      </div>
    `)
    
    userLocationMarker.addTo(map)
    console.log('Added user location marker at:', userLocation.value)
  }
}

// Add or update radius circle for Soon & Near filtering
const updateRadiusCircle = () => {
  if (!map) return
  
  // Remove existing circle
  if (radiusCircle) {
    map.removeLayer(radiusCircle)
    radiusCircle = null
  }
  
  // Add circle if Soon & Near is enabled and user location is available
  if (mapControls.showEventsSoonAndNear && userLocation.value) {
    // Convert feet to meters for Leaflet (1 foot = 0.3048 meters)
    const radiusInMeters = soonAndNearRadius.value * 0.3048
    
    radiusCircle = L.circle(userLocation.value, {
      radius: radiusInMeters,
      fillColor: getCSSColor('--color-accent') || '#8B0000',
      color: getCSSColor('--color-accent') || '#8B0000',
      weight: 2,
      opacity: 0.8,
      fillOpacity: 0.1,
      dashArray: '5, 10' // Dashed line for subtle appearance
    })
    
    radiusCircle.addTo(map)
    console.log(`Added radius circle: ${soonAndNearRadius.value}ft (${radiusInMeters.toFixed(1)}m)`)
  }
}

// Add or update route line on map
const updateRouteLine = () => {
  if (!map) return
  
  // Remove existing route line
  if (routeLine) {
    map.removeLayer(routeLine)
    routeLine = null
  }
  
  // Add route line if route exists
  if (hasActiveRoute.value && routeWaypoints.value.length > 1) {
    routeLine = L.polyline(routeWaypoints.value, {
      ...routeStyle.value,
      zIndexOffset: 1000 // Ensure route appears on top
    })
    
    // Add popup with route info
    const routeInfo = routeDetails.value
    if (routeInfo) {
      routeLine.bindPopup(`
        <div class="route-popup">
          <strong>Route to ${routeInfo.target.name}</strong><br>
          <div style="margin-top: 0.5rem;">
            📏 ${routeInfo.distance}<br>
            🚶 ${routeInfo.walkingTime}<br>
            🚴 ${routeInfo.bikingTime}<br>
          </div>
          <div style="margin-top: 0.5rem; font-size: 0.875rem; color: #666;">
            Current mode: ${routeInfo.currentMode.icon} ${routeInfo.currentMode.label}
          </div>
        </div>
      `)
    }
    
    routeLine.addTo(map)
    console.log(`🗺️ Route line added: ${routeWaypoints.value.length} waypoints`)
  }
}

// Time-Distance composite scoring for "Soon & Near" events (same as ListView)
const getTimeDistanceScore = (event) => {
  const now = getCurrentTime()
  const nextOccurrence = getNextOccurrence(event)
  
  if (!nextOccurrence) return 999999 // No future occurrences
  
  const startTime = new Date(nextOccurrence.start_time)
  const hoursUntilStart = (startTime - now) / (1000 * 60 * 60)
  
  // Events too far in future (48+ hours) get deprioritized
  if (hoursUntilStart > 48) return 999999
  
  const distanceData = getDistanceTo(getItemLocation(event))
  const distanceInFeet = distanceData?.feet || 10000
  
  // HAPPENING NOW: Highest priority
  if (isHappeningNow(event)) {
    return -(10000 - Math.min(distanceInFeet, 9999))
  }
  
  // FUTURE EVENTS: Weight time more heavily than distance
  const timeScore = Math.max(0, hoursUntilStart) * 1000
  const distanceScore = Math.min(distanceInFeet, 9999)
  
  return timeScore + distanceScore
}

// Check if an event is within the specified radius (for Soon & Near filtering)
// OPTIMIZED: Uses cached pre-calculated distances when available
const isEventWithinRadius = (event) => {
  if (!userLocation.value) return false
  
  // Try to use cached data first (performance optimization)
  const cachedItem = cachedNearbyEvents.find(item => item.event.uid === event.uid)
  if (cachedItem) {
    return cachedItem.distanceInFeet <= soonAndNearRadius.value
  }
  
  // Fall back to real-time calculation if not in cache
  const distanceData = getDistanceTo(getItemLocation(event))
  const distanceInFeet = distanceData?.feet || 99999
  
  return distanceInFeet <= soonAndNearRadius.value
}

// Get events within radius using cached data (performance optimization)
const getEventsWithinRadius = () => {
  if (!userLocation.value) return []
  
  // Use cached data if available and valid
  if (cachedNearbyEvents.length > 0 && lastCacheLocation && 
      userLocation.value[0] === lastCacheLocation[0] && 
      userLocation.value[1] === lastCacheLocation[1]) {
    // Ultra-fast: Filter pre-calculated distances
    return cachedNearbyEvents
      .filter(item => item.distanceInFeet <= soonAndNearRadius.value)
      .map(item => item.event)
  }
  
  // Fall back to original method if cache is invalid
  return items.events.filter(event => isEventWithinRadius(event))
}

// Get event marker style based on urgency
const getEventMarkerStyle = (event) => {
  const now = getCurrentTime()
  const nextOccurrence = getNextOccurrence(event)
  
  if (!nextOccurrence) return { icon: '⏰', color: '#666' } // No future occurrence
  
  const startTime = new Date(nextOccurrence.start_time)
  const hoursUntilStart = (startTime - now) / (1000 * 60 * 60)
  
  if (isHappeningNow(event)) {
    return { icon: '🔴', color: '#ff0000', priority: 1 } // Happening NOW
  } else if (hoursUntilStart <= 2) {
    return { icon: '🟠', color: '#ff8800', priority: 2 } // Starting soon (2 hours)
  } else if (hoursUntilStart <= 12) {
    return { icon: '🟡', color: '#ffaa00', priority: 3 } // Later today
  } else {
    return { icon: '⏰', color: '#666', priority: 4 } // Tomorrow+
  }
}

// Consolidated map controls
const mapControls = reactive({
  // Content controls
  showCamps: true,
  showArt: true,
  showEvents: true,
  showFavoritesOnly: false,
  showEventsSoonAndNear: false, // NEW: Soon & Near events filter
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
  showPoints: true,
  showDMZ: true,
  showHellStation: true,
  showToilets: true,
  // Layer controls
  showStreets: true,
  showStreetOutlines: false,
  showTrashFence: true,
  showCityBlocks: false,
  showPlazas: true,
  showPortals: true,
  showCPNs: false, // Hidden by default
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
      'showEvents' in newControls || 'showFavoritesOnly' in newControls ||
      'showEventsSoonAndNear' in newControls) {
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
      'showArctica' in newControls || 'showPoints' in newControls ||
      'showDMZ' in newControls || 'showHellStation' in newControls || 
      'showToilets' in newControls) {
    // Clear existing infrastructure markers
    markersLayer.eachLayer(layer => {
      if (layer.options.icon?.options?.className === 'infrastructure-marker' ||
          layer.options.icon?.options?.className === 'point-marker') {
        markersLayer.removeLayer(layer)
      }
    })
    
    // Remove toilet layer if infrastructure is being turned off
    if ('showInfrastructure' in newControls && !mapControls.showInfrastructure && 
        gisLayers.toilets && map.hasLayer(gisLayers.toilets)) {
      map.removeLayer(gisLayers.toilets)
    }
    
    // Re-add with new settings
    addInfrastructureMarkers()
  }
  
  // Update plazas, portals and CPNs layers
  if ('showPlazas' in newControls || 'showPortals' in newControls || 'showCPNs' in newControls ||
      'showStreets' in newControls || 'showStreetOutlines' in newControls) {
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
  
  // Reset ALL layer controls to match the visual state
  const layerUpdates = {
    // Content controls - turn everything off
    showCamps: false,
    showArt: false,
    showEvents: false,
    showFavoritesOnly: false,
    showInfrastructure: false,
    // Infrastructure sub-items
    showTheMan: false,
    showCenterCamp: false,
    showTemple: false,
    showAirport: false,
    showMedical: false,
    showRangers: false,
    showDPW: false,
    showArctica: false,
    showDMZ: false,
    showHellStation: false,
    showToilets: false,
    showPoints: false,
    // Layer controls - only streets and trash fence on
    showStreets: true,
    showTrashFence: true,
    showStreetOutlines: false,
    showCityBlocks: false,
    showPlazas: false,
    showPortals: false,
    showCPNs: false,
    // Display controls
    showBasemap: false,  // Disable base map for cooler look
    showLegend: false,
    showMapInfo: false
  }
  
  // Update the controls
  Object.assign(mapControls, layerUpdates)
  
  // Trigger layer update
  handleControlUpdate(layerUpdates)
  
  // Try to fit to trash fence bounds
  const trashFenceData = getTrashFence()
  if (trashFenceData && trashFenceData.features && trashFenceData.features.length > 0) {
    // Convert GeoJSON to Leaflet bounds
    const layer = L.geoJSON(trashFenceData)
    const bounds = layer.getBounds()
    
    // Fit map to trash fence with no padding for tightest view
    map.flyToBounds(bounds, {
      padding: [0, 0],    // No padding - fill viewport
      maxZoom: 15,        // Don't zoom in too far
      duration: 0.4       // Faster animation
    })
  } else {
    // Fallback to default view if no trash fence data
    map.flyTo(defaultCenter, defaultZoom, {
      bearing: defaultBearing,
      duration: 1.5
    })
  }
  
  // Update default view state after animation
  setTimeout(() => {
    checkDefaultView()
  }, 1600)
}

// Center map on user location
const centerOnUserLocation = () => {
  if (!map || !userLocation.value) return
  
  map.flyTo(userLocation.value, 16, {
    duration: 1.0
  })
}

// Enable location and center on it once obtained
const enableLocationAndCenter = async () => {
  if (locationLoading.value) return
  
  try {
    await getCurrentLocation()
    // Once location is obtained, center on it
    if (userLocation.value) {
      centerOnUserLocation()
    }
  } catch (error) {
    console.error('Failed to get location:', error)
    // You could show a user-friendly error message here
  }
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

// Watch for map controls toggle from bottom nav
watch(mapControlsToggle, () => {
  console.log('MapView: Toggle watcher triggered')
  console.log('MapView: bottomSheet.value:', bottomSheet.value)
  if (bottomSheet.value) {
    console.log('MapView: Calling bottomSheet.toggle()')
    bottomSheet.value.toggle()
  } else {
    console.log('MapView: bottomSheet ref is null')
  }
})

// Watch for user location changes to update marker, radius circle, and cache
watch(userLocation, (newLocation, oldLocation) => {
  updateUserLocationMarker()
  updateRadiusCircle()
  
  // Invalidate cache if user location has changed significantly (performance optimization)
  if (newLocation && oldLocation && mapControls.showEventsSoonAndNear) {
    const locationChangedSignificantly = 
      Math.abs(newLocation[0] - oldLocation[0]) > 0.0001 ||  // ~30ft change in lat
      Math.abs(newLocation[1] - oldLocation[1]) > 0.0001     // ~30ft change in lng
    
    if (locationChangedSignificantly) {
      console.log('📍 User location changed significantly, recaching nearby events...')
      cacheNearbyEvents()
    }
  }
})

// Watch for radius changes to update circle and markers (OPTIMIZED with debouncing)
watch(soonAndNearRadius, () => {
  updateRadiusCircle()
  // If Soon & Near is enabled, use debounced update for smooth performance
  if (mapControls.showEventsSoonAndNear) {
    debouncedRadiusUpdate()
  }
})

// Watch for Soon & Near toggle to update circle and cache nearby events
watch(() => mapControls.showEventsSoonAndNear, (isEnabled) => {
  updateRadiusCircle()
  
  if (isEnabled && userLocation.value) {
    // Cache nearby events when enabling Soon & Near for optimal performance
    cacheNearbyEvents()
  } else {
    // Clear cache when disabling
    cachedNearbyEvents = []
    lastCacheLocation = null
  }
})

// Watch for route changes to update route line
watch(currentRoute, () => {
  updateRouteLine()
})

// Watch for route mode changes to update route line style
watch(routeModeInfo, () => {
  updateRouteLine()
})

// Watch for route mode switching (Browse Mode ↔ Route Mode)
watch(isInRouteMode, (newRouteMode) => {
  if (newRouteMode) {
    // Entering Route Mode - apply minimal settings
    console.log('🎯 Switching to Route Mode - applying minimal display')
    applyRouteModeSettings()
  } else {
    // Exiting Route Mode - this is handled by clearRoute() returning saved state
    console.log('🌍 Switching to Browse Mode')
  }
  
  // Reload data to reflect new mode
  loadData()
})

// Apply minimal settings for Route Mode (like Apple Maps navigation)
const applyRouteModeSettings = () => {
  // Turn off all the clutter - focus only on the route
  mapControls.showCamps = false
  mapControls.showArt = false
  mapControls.showEvents = false
  mapControls.showEventsSoonAndNear = false  // Turn off Soon & Near
  mapControls.showFavoritesOnly = false
  mapControls.showInfrastructure = false
  
  // Keep only essential elements
  // Keep user location and the route line (handled by route visualization)
  // Keep minimal GIS (streets might be helpful for navigation)
  
  console.log('🎯 Route Mode settings applied - minimal display active')
}

// Custom clearRoute wrapper to handle state restoration
const clearRouteAndRestore = () => {
  const savedState = clearRoute()
  
  if (savedState) {
    console.log('🔄 Restoring saved map state:', savedState)
    Object.assign(mapControls, savedState)
    loadData() // Reload to apply restored settings
  }
}

onMounted(async () => {
  console.log('MapView: Component mounted')
  console.log('MapView: bottomSheet ref on mount:', bottomSheet.value)
  console.log('MapView: isMobile on mount:', isMobile.value)
  
  // Check for location permission for Soon & Near features
  checkLocationPermission()
  
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
  
  // Enable basemap by default for 2025
  if (year.value === '2025') {
    // If no saved state exists, or saved state doesn't have showBasemap property, default to true
    const parsed = savedState ? JSON.parse(savedState) : null
    if (!parsed || !parsed.hasOwnProperty('showBasemap')) {
      mapControls.showBasemap = true
    }
  }
  
  // Try to restore saved map position
  let initialCenter = BRC_CENTER
  let initialZoom = defaultZoom
  let initialBearing = 0
  
  const savedPosition = localStorage.getItem('mapPosition')
  if (savedPosition) {
    try {
      const position = JSON.parse(savedPosition)
      // Only use saved position if it's less than 24 hours old
      if (position.timestamp && Date.now() - position.timestamp < 24 * 60 * 60 * 1000) {
        initialCenter = [position.lat, position.lng]
        initialZoom = position.zoom
        initialBearing = position.bearing || 0
      }
    } catch (e) {
      console.error('Failed to restore map position:', e)
    }
  }
  
  // Initialize Leaflet map with rotation support
  map = L.map(mapContainer.value, {
    center: initialCenter,
    zoom: initialZoom,
    zoomControl: false,  // Disable default zoom controls
    rotate: true,
    bearing: initialBearing,
    zoomSnap: 0.001,    // Very fine fractional zoom control
    zoomDelta: 0.5      // Zoom buttons use 0.5 increments
  })
  
  // Set black background when basemap is off
  if (!mapControls.showBasemap) {
    mapContainer.value.style.backgroundColor = 'var(--color-background-primary)'
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
    
    // Save map position to localStorage
    const center = map.getCenter()
    const zoom = map.getZoom()
    const bearing = map.getBearing() || 0
    
    localStorage.setItem('mapPosition', JSON.stringify({
      lat: center.lat,
      lng: center.lng,
      zoom: zoom,
      bearing: bearing,
      timestamp: Date.now()
    }))
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
  
  // Initialize user location marker
  updateUserLocationMarker()
  
  // Add resize event listener
  window.addEventListener('resize', handleResize)
  
  // Also listen for orientation changes on mobile
  window.addEventListener('orientationchange', () => {
    setTimeout(() => map.invalidateSize(), 200)
  })
  
  // Create global function for popup route buttons
  window.createRouteFromPopup = (itemId, itemType) => {
    // Find the item by ID in the correct array
    let item = null
    if (itemType === 'camp' && items.camps) {
      item = items.camps.find(i => i.uid === itemId)
    } else if (itemType === 'art' && items.art) {
      item = items.art.find(i => i.uid === itemId)
    } else if (itemType === 'event' && items.events) {
      item = items.events.find(i => i.uid === itemId)
    }
    
    if (!item || !userLocation.value) {
      console.warn('Cannot create route: item or user location not found', { itemId, itemType, hasUserLocation: !!userLocation.value })
      return
    }
    
    // Create the route
    const route = createRoute(userLocation.value, item, getItemLocation, mapControls)
    if (route) {
      console.log(`🗺️ Route created from popup to ${item.name || item.title}`)
      // Update markers to reflect new route state
      loadData()
    }
  }
  
  // Create global function for popup favorite buttons
  window.toggleFavoriteFromPopup = async (itemId, itemType) => {
    const { toggleFavorite, isFavorite } = await import('../services/favorites')
    toggleFavorite(itemType, itemId)
    
    console.log(`⭐ Toggled favorite for ${itemType} ${itemId}`)
    
    // Update the button text immediately
    const favoriteBtn = document.querySelector(`[data-favorite-btn="${itemType}-${itemId}"]`)
    if (favoriteBtn) {
      const isNowFavorited = isFavorite(itemType, itemId)
      
      if (isNowFavorited) {
        favoriteBtn.innerHTML = '<span class="star-icon favorited-star">⭐</span> Favorited'
      } else {
        favoriteBtn.innerHTML = '<span class="star-icon">⭐</span> Favorite'
      }
      favoriteBtn.className = `favorite-popup-btn ${isNowFavorited ? 'favorite-active' : ''}`
      favoriteBtn.title = isNowFavorited ? 'Remove from favorites' : 'Add to favorites'
    }
    
    // Update markers to reflect new favorite state (stars on map markers)
    loadData()
  }
})

const addInfrastructureMarkers = () => {
  // Clear any existing infrastructure markers first
  markersLayer.eachLayer(layer => {
    if (layer.options.icon?.options?.className === 'infrastructure-marker' ||
        layer.options.icon?.options?.className === 'point-marker') {
      markersLayer.removeLayer(layer)
    }
  })
  
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
      name: 'Rampart',
      coords: getSpecialLocationCoords('RAMPART'),
      icon: '🏥',
      description: 'Field hospital - Emergency medical services',
      controlKey: 'showMedical'
    },
    {
      name: 'Station 3',
      coords: [40.779913445324667, -119.19410428430447],
      icon: '🏥',
      description: 'Emergency services station - 3:00 sector',
      controlKey: 'showMedical'
    },
    {
      name: 'Station 6',
      coords: [40.780509618833086, -119.20652384845459],
      icon: '🏥',
      description: 'Emergency services station - 6:00 sector',
      controlKey: 'showMedical'
    },
    {
      name: 'Station 9',
      coords: [40.794090422669733, -119.21197232230189],
      icon: '🏥',
      description: 'Emergency services station - 9:00 sector',
      controlKey: 'showMedical'
    },
    {
      name: 'Ranger HQ',
      coords: getSpecialLocationCoords('RANGER HQ'),
      icon: '🎯',
      description: 'Black Rock Rangers headquarters',
      controlKey: 'showRangers'
    },
    {
      name: 'Ranger Station Berlin',
      coords: [40.780198273707583, -119.19373531464844],
      icon: '🎯',
      description: 'Black Rock Rangers station - 3:00 sector',
      controlKey: 'showRangers'
    },
    {
      name: 'Ranger Station Tokyo', 
      coords: [40.793802980792094, -119.21231514202253],
      icon: '🎯',
      description: 'Black Rock Rangers station - 9:00 sector',
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
      name: 'DMZ',
      coords: [40.801877800966253, -119.19912198324673],
      icon: '🎵',
      description: 'Deep Playa Music Zone - sound camps and art cars',
      controlKey: 'showDMZ'
    },
    {
      name: 'Hell Station',
      coords: [40.803639907073524, -119.20864863758413],
      icon: '⛽',
      description: 'Fuel depot for mutant vehicles and art cars',
      controlKey: 'showHellStation'
    },
    {
      name: 'Arctica Center Camp',
      coords: [40.781994283666222, -119.21188689559813],
      icon: '🧊',
      description: 'Ice sales - Center Camp area',
      controlKey: 'showArctica'
    },
    {
      name: 'Ice Cubed (Arctica 3)',
      coords: [40.777479126910642, -119.19003308126543],
      icon: '🧊',
      description: 'Ice sales - 3:00 sector',
      controlKey: 'showArctica'
    },
    {
      name: 'Ice Nine (Arctica 9)',
      coords: [40.796433491680219, -119.21595443147025],
      icon: '🧊',
      description: 'Ice sales - 9:00 sector',
      controlKey: 'showArctica'
    },
    // Fence Points
    {
      name: 'Point 1',
      coords: [40.783393446220742, -119.23273810046453],
      icon: '1️⃣',
      description: 'Pentagon fence perimeter point',
      controlKey: 'showPoints',
      isPoint: true
    },
    {
      name: 'Point 2',
      coords: [40.80735944960697, -119.21663410121627],
      icon: '2️⃣',
      description: 'Pentagon fence perimeter point',
      controlKey: 'showPoints',
      isPoint: true
    },
    {
      name: 'Point 3',
      coords: [40.803105452153233, -119.18168009473446],
      icon: '3️⃣',
      description: 'Pentagon fence perimeter point',
      controlKey: 'showPoints',
      isPoint: true
    },
    {
      name: 'Point 4',
      coords: [40.776562450338268, -119.17619408999123],
      icon: '4️⃣',
      description: 'Pentagon fence perimeter point',
      controlKey: 'showPoints',
      isPoint: true
    },
    {
      name: 'Point 5',
      coords: [40.764368446673565, -119.20773209353284],
      icon: '5️⃣',
      description: 'Pentagon fence perimeter point',
      controlKey: 'showPoints',
      isPoint: true
    }
  ]
  
  specialLocations.forEach(loc => {
    // Check if this specific infrastructure is enabled
    if (!mapControls[loc.controlKey]) return
    
    if (loc.coords) {
      const marker = L.marker(loc.coords, {
        icon: L.divIcon({
          className: loc.isPoint ? 'point-marker' : 'infrastructure-marker',
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
  
  // Add toilet polygons and markers from GIS data
  if (mapControls.showInfrastructure && mapControls.showToilets && year.value === '2025') {
    const toiletData = getToilets()
    if (toiletData && toiletData.features) {
      // Create a layer group for toilets if it doesn't exist
      if (!gisLayers.toilets) {
        gisLayers.toilets = L.layerGroup()
      } else {
        gisLayers.toilets.clearLayers()
      }
      
      toiletData.features.forEach((feature, index) => {
        if (feature.geometry && feature.geometry.coordinates) {
          // Add the polygon
          const polygon = L.geoJSON(feature, {
            style: {
              color: getCSSColor('--color-info'),
              weight: 2,
              opacity: 0.8,
              fillOpacity: 0.3,
              fillColor: getCSSColor('--color-info')
            }
          })
          
          // Bind popup to polygon
          polygon.bindPopup(`
            <div class="infrastructure-popup">
              <strong>Porto Bank ${index + 1}</strong>
              <span class="description">Portable restroom facilities</span>
            </div>
          `)
          
          gisLayers.toilets.addLayer(polygon)
          
          // Get the center of the polygon for the icon
          const coords = feature.geometry.coordinates[0]
          let sumLat = 0, sumLon = 0
          coords.forEach(coord => {
            sumLon += coord[0]
            sumLat += coord[1]
          })
          const centerLat = sumLat / coords.length
          const centerLon = sumLon / coords.length
          
          // Add a smaller icon on top
          const marker = L.marker([centerLat, centerLon], {
            icon: L.divIcon({
              className: 'toilet-marker',
              html: '<div class="marker-icon">🚻</div>',
              iconSize: [20, 20],
              iconAnchor: [10, 10]
            })
          })
          
          // Bind the same popup to the marker
          marker.bindPopup(`
            <div class="infrastructure-popup">
              <strong>Porto Bank ${index + 1}</strong>
              <span class="description">Portable restroom facilities</span>
            </div>
          `)
          
          gisLayers.toilets.addLayer(marker)
        }
      })
      
      // Add the toilet layer group to the map
      gisLayers.toilets.addTo(map)
    }
  }
  
  // Always check if toilets should be removed (either infrastructure or toilets toggled off)
  if ((!mapControls.showInfrastructure || !mapControls.showToilets) && 
      gisLayers.toilets && map.hasLayer(gisLayers.toilets)) {
    map.removeLayer(gisLayers.toilets)
  }
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
        !layer.options.icon?.options?.className?.includes('point-marker') &&
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
  if (mapControls.showCamps || (isInRouteMode.value && routeTarget.value?.type === 'camp')) {
    items.camps.forEach(camp => {
      // In route mode, only show the destination camp
      if (isInRouteMode.value && routeTarget.value?.uid !== camp.uid) {
        return
      }
      
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
    let eventsToShow = items.events
    
    // Apply Soon & Near filtering if enabled
    if (mapControls.showEventsSoonAndNear && userLocation.value) {
      // OPTIMIZED: Use cached pre-calculated distances for fast filtering
      const eventsInRadius = getEventsWithinRadius()
      filteredEvents += items.events.length - eventsInRadius.length // Count radius-filtered events
      
      eventsToShow = eventsInRadius
        .map(event => ({ event, score: getTimeDistanceScore(event) }))
        .filter(({ score }) => score < 999999) // Remove events with no future occurrences
        .sort((a, b) => a.score - b.score) // Sort by urgency
        .slice(0, 50) // Limit to top 50 most relevant events to avoid clutter
        .map(({ event }) => event)
    }
    
    eventsToShow.forEach(event => {
      if (mapControls.showFavoritesOnly && !isFavorite('event', event.uid)) {
        filteredEvents++
        return
      }
      
      // Use urgency-based marker style for Soon & Near mode, default icon otherwise
      const markerStyle = mapControls.showEventsSoonAndNear ? getEventMarkerStyle(event) : { icon: '🎉' }
      addMarker(event, 'event', markerStyle.icon, markerStyle.color)
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

const addMarker = (item, type, icon, color = null) => {
  const location = getItemLocation(item)
  if (!location || location === 'Unknown Location' || location === 'Location Not Released') return
  
  const coords = brcAddressToLatLon(location)
  if (!coords) return
  
  // Create custom styling for Soon & Near events with urgency colors
  const markerHtml = color 
    ? `<div class="marker-icon" style="color: ${color}; filter: drop-shadow(0 0 3px ${color}40);">${icon}</div>`
    : `<div class="marker-icon">${icon}</div>`
  
  const markerId = `${type}-${item.uid}`
  const marker = L.marker(coords, {
    icon: L.divIcon({
      className: `${type}-marker${color ? ' urgent-event' : ''}`,
      html: markerHtml,
      iconSize: [25, 25],
      iconAnchor: [12, 12]
    })
  })
  
  const name = getItemName(item)
  const favorited = isFavorite(type, item.uid)
  
  // Check if user can create routes
  const canCreateRouteToItem = userLocation.value && location !== 'Unknown Location'
  const hasExistingRoute = hasActiveRoute.value && routeDetails.value?.target.uid === item.uid
  
  // Get event-specific content if this is an event
  const eventContent = type === 'event' ? getEventPopupContent(item) : ''
  
  marker.bindPopup(`
    <div class="map-popup" data-marker-id="${markerId}">
      ${location} <strong>${name}</strong>

      ${eventContent}

      <div><small>Lat: ${coords[0].toFixed(6)}, Lng: ${coords[1].toFixed(6)}</small></div>

      ${item.description ? `<div class="item-description">${item.description.substring(0, 300)}</div>` : ''}
      
      <div class="popup-actions">
        <button 
          onclick="window.toggleFavoriteFromPopup('${item.uid}', '${type}')" 
          class="favorite-popup-btn ${favorited ? 'favorite-active' : ''}"
          title="${favorited ? 'Remove from favorites' : 'Add to favorites'}"
          data-favorite-btn="${type}-${item.uid}"
        >
          ${favorited ? '<span class="star-icon favorited-star">⭐</span> Favorited' : '<span class="star-icon">⭐</span> Favorite'}
        </button>
        ${canCreateRouteToItem ? `
          <button 
            onclick="window.createRouteFromPopup('${item.uid}', '${type}')" 
            class="route-popup-btn ${hasExistingRoute ? 'route-active' : ''}"
            title="${hasExistingRoute ? 'View route details' : 'Create route to this location'}"
          >
            ${hasExistingRoute ? '🗺️ Route Active' : '🗺️ Route Here'}
          </button>
        ` : ''}
      </div>
    </div>
  `, {
    autoClose: false,
    closeOnClick: false  // Prevent popup from closing when clicking inside it
  })
  
  // Handle popup open/close events for countdown management
  marker.on('popupopen', () => {
    openPopups.add(markerId)
    
    // Start countdown if this is an event starting soon
    if (type === 'event') {
      const nextOccurrence = getNextOccurrence(item)
      if (nextOccurrence && isStartingSoon(nextOccurrence.start_time)) {
        startCountdownInterval(markerId, nextOccurrence.start_time)
      }
    }
  })
  
  marker.on('popupclose', () => {
    openPopups.delete(markerId)
    
    // Clear countdown interval
    if (countdownIntervals.has(markerId)) {
      clearInterval(countdownIntervals.get(markerId))
      countdownIntervals.delete(markerId)
    }
  })
  
  markersLayer.addLayer(marker)
}

const updateGISLayers = () => {
  // Remove existing GIS layers (except toilets which is handled separately)
  Object.entries(gisLayers).forEach(([key, layer]) => {
    if (key !== 'toilets' && layer && map.hasLayer(layer)) {
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
              color: getCSSColor('--color-danger'),
              weight: 1,
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
  
  // Add street outlines
  if (mapControls.showStreetOutlines) {
    const streetOutlinesData = getStreetOutlines()
    if (streetOutlinesData) {
      gisLayers.streetOutlines = L.geoJSON(streetOutlinesData, {
        style: {
          color: getCSSColor('--color-danger'),
          weight: 2,
          opacity: 1,
          fillOpacity: 0.25,
          fillColor: getCSSColor('--color-danger')
        },
        onEachFeature: (feature, layer) => {
          if (feature.properties && feature.properties.name) {
            layer.bindPopup(`<strong>${feature.properties.name}</strong><br>Street Width`)
          }
        }
      }).addTo(map)
    }
  }
  
  // Add trash fence
  if (mapControls.showTrashFence) {
    const trashFenceData = getTrashFence()
    if (trashFenceData) {
      // Use brighter red color and thicker line for better visibility
      gisLayers.trashFence = L.geoJSON(trashFenceData, {
        style: {
          color: '#FF0000',  // Bright red
          weight: 4,         // Thicker line
          opacity: 1,        // Full opacity
          fillOpacity: 0,
          dashArray: '10, 5'
        }
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
          color: getCSSColor('--color-purple'),
          weight: 2,
          opacity: 0.8,
          fillOpacity: 0.3,
          fillColor: getCSSColor('--color-purple')
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
  
  // Clear existing CPN and portal markers
  markersLayer.eachLayer(layer => {
    if (layer.options.icon?.options?.className === 'cpn-marker' || 
        layer.options.icon?.options?.className === 'portal-marker') {
      markersLayer.removeLayer(layer)
    }
  })
  
  // Add portal markers if enabled
  if (mapControls.showPortals) {
    const cpnData = getCPNs()
    if (cpnData && cpnData.features) {
      // Define portal names to look for
      const portalNames = ['300 Portal', '430 Portal', '600 Portal', '730 Portal', '900 Portal']
      
      cpnData.features.forEach(feature => {
        if (feature.geometry && feature.geometry.coordinates) {
          const cpnName = feature.properties.NAME || ''
          
          // Check if this is a portal
          if (portalNames.includes(cpnName)) {
            const coords = [feature.geometry.coordinates[1], feature.geometry.coordinates[0]]
            const marker = L.marker(coords, {
              icon: L.divIcon({
                className: 'portal-marker',
                html: '<div class="marker-icon">🅿️</div>',
                iconSize: [30, 30],
                iconAnchor: [15, 15]
              })
            })
            
            marker.bindPopup(`
              <div class="infrastructure-popup">
                <strong>${cpnName}</strong><br>
                <span class="description">Plaza entry/exit portal</span>
              </div>
            `)
            markersLayer.addLayer(marker)
          }
        }
      })
    }
  }
  
  // Add CPN markers if enabled
  if (mapControls.showCPNs) {
    const cpnData = getCPNs()
    if (cpnData && cpnData.features) {
      // Infrastructure items that should not be shown as CPNs (already handled by infrastructure layer)
      // Filter out all infrastructure items now shown in infrastructure layer
      const infrastructureNames = [
        'The Man', 'The Temple', 'Center Camp', 'Airport', 
        'DMV', 'Media Mecca', 'Playa Info', 'HEaT', 'DMZ', 'Hell Station',
        // Medical/Emergency services
        'Rampart', 'Station 3', 'Station 6', 'Station 9',
        // Ranger stations
        'Ranger HQ', 'Ranger Station Berlin', 'Ranger Station Tokyo',
        // Ice/Arctica locations
        'Arctica', 'Arctica Center Camp', 'Ice Cubed Arctica 3', 'Ice Nine Arctica',
        // Fence points
        'Point 1', 'Point 2', 'Point 3', 'Point 4', 'Point 5'
      ]
      
      cpnData.features.forEach(feature => {
        if (feature.geometry && feature.geometry.coordinates) {
          const cpnName = feature.properties.NAME || ''
          
          // Skip if this is an infrastructure item or a portal (handled separately)
          if (infrastructureNames.includes(cpnName) || cpnName.includes('Portal')) {
            return
          }
          
          const coords = [feature.geometry.coordinates[1], feature.geometry.coordinates[0]]
          const marker = L.marker(coords, {
            icon: L.divIcon({
              className: 'cpn-marker',
              html: '<div class="marker-icon">📍</div>',
              iconSize: [20, 20],
              iconAnchor: [10, 10]
            })
          })
          
          // Determine description based on name patterns
          let description = 'City reference point'
          
          if (cpnName.includes('Plaza')) {
            description = 'Plaza location marker'
          } else if (cpnName.includes('Portal')) {
            description = 'Plaza entry/exit portal'
          } else if (cpnName.includes('Promenade')) {
            description = 'Wide pedestrian walkway (40\' wide)'
          } else if (cpnName.match(/^Station \d+$/)) {
            description = 'Emergency services station - may include first aid'
          } else if (cpnName.includes('Point')) {
            description = 'Fence perimeter point'
          } else if (cpnName.includes(' & ')) {
            description = 'Street intersection marker'
          } else if (cpnName === 'Rampart') {
            description = 'Field hospital location'
          } else if (cpnName === 'Greeters') {
            description = 'City entrance - participant greeting station'
          } else if (cpnName.includes('Ranger')) {
            description = 'Black Rock Rangers station'
          } else if (cpnName.includes('Arctica') || cpnName.includes('Ice')) {
            description = 'Ice sales location'
          }
          
          marker.bindPopup(`
            <div class="infrastructure-popup">
              <strong>${cpnName}</strong><br>
              <span class="description">${description}</span>
            </div>
          `)
          markersLayer.addLayer(marker)
        }
      })
    }
  }
}

// Cleanup on unmount
onUnmounted(() => {
  // Clear radius update timeout to prevent memory leaks
  if (radiusUpdateTimeout) {
    clearTimeout(radiusUpdateTimeout)
  }
  
  // Clear all countdown intervals
  countdownIntervals.forEach((interval) => {
    clearInterval(interval)
  })
  countdownIntervals.clear()
  openPopups.clear()
  
  // Clear cached data
  cachedNearbyEvents = []
  lastCacheLocation = null
})

const toggleBasemap = () => {
  if (year.value !== '2025') return // Don't allow toggle for non-2025 years
  
  if (mapControls.showBasemap) {
    basemapLayer.addTo(map)
    mapContainer.value.style.backgroundColor = ''
  } else {
    map.removeLayer(basemapLayer)
    mapContainer.value.style.backgroundColor = 'var(--color-background-primary)'
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
.view-container {
  width: 100%;
  height: 100%;
  overflow: hidden;
}

#map-section {
  width: 100%;
  height: 100%;
  position: relative;
  display: flex;
  flex-direction: column;
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
  bottom: 10px;
  z-index: 1000;
  max-height: calc(100% - 20px); /* Account for top/bottom margins */
  display: flex;
  flex-direction: column;
  /* When collapsed, don't consume clicks on empty space */
  pointer-events: none;
}

/* Enable pointer events on the actual control component */
.map-controls-desktop > * {
  pointer-events: auto;
}

/* Mobile controls toggle button */
.map-controls-toggle {
  position: fixed;
  bottom: 80px; /* Above bottom navigation */
  left: 10px;
  z-index: 1001;
  width: 48px;
  height: 48px;
  border-radius: 4px;
  background: var(--color-bg-elevated);
  border: 2px solid var(--color-border-medium);
  color: var(--color-text-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 2px 8px var(--color-shadow-medium);
  transition: all 0.2s ease;
}

.map-controls-toggle:hover {
  background: var(--color-primary);
  border-color: var(--color-primary);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px var(--color-shadow-medium);
}

.map-controls-toggle svg {
  width: 24px;
  height: 24px;
}

.map-controls-toggle:active {
  transform: scale(0.95);
}

/* Marker styles */
:deep(.marker-icon) {
  background: var(--color-background-secondary-alpha-90);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  border: 2px solid var(--color-text-primary);
}

:deep(.infrastructure-marker .marker-icon) {
  background: var(--color-primary-alpha-90);
  border-color: var(--color-accent);
  font-size: 20px;
}

:deep(.point-marker .marker-icon) {
  background: none;
  border: none;
  font-size: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

:deep(.cpn-marker .marker-icon) {
  background: var(--color-purple-alpha-90);
  border-color: var(--color-text-primary);
  font-size: 14px;
}

:deep(.portal-marker .marker-icon) {
  background: var(--color-primary-alpha-90);
  border-color: var(--color-accent);
  font-size: 18px;
  box-shadow: 0 0 8px var(--color-accent-alpha-50);
}

:deep(.toilet-marker .marker-icon) {
  background: var(--color-info-alpha-90);
  border-color: var(--color-text-primary);
  font-size: 12px;
}

:deep(.camp-marker .marker-icon) {
  background: var(--color-success-alpha-90);
}

:deep(.art-marker .marker-icon) {
  background: var(--color-purple-alpha-90);
}

:deep(.event-marker .marker-icon) {
  background: var(--color-warning-alpha-90);
}

/* Urgent event markers for Soon & Near mode */
:deep(.urgent-event .marker-icon) {
  font-size: 18px !important;
  font-weight: bold;
  border-width: 3px;
  box-shadow: 0 0 8px rgba(0,0,0,0.4);
  transform: scale(1.1);
  z-index: 1000 !important;
  background: rgba(255,255,255,0.95) !important;
}

:deep(.urgent-event:hover .marker-icon) {
  transform: scale(1.3);
  box-shadow: 0 0 12px rgba(0,0,0,0.6);
}

:deep(.plaza-marker .marker-icon) {
  background: var(--color-purple-alpha-90);
}

/* User location marker */
:deep(.user-location-marker .user-marker-icon) {
  background: var(--color-accent);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  border: 3px solid var(--color-text-primary);
  box-shadow: 0 0 12px var(--color-accent-alpha-50);
  animation: pulse-location 2s infinite;
}

@keyframes pulse-location {
  0%, 100% { 
    transform: scale(1);
    opacity: 1;
  }
  50% { 
    transform: scale(1.1);
    opacity: 0.8;
  }
}

.loading-indicator {
  margin-top: 10px;
  color: var(--color-accent);
  font-size: 12px;
  text-align: center;
}

.error-indicator {
  margin-top: 10px;
  color: var(--color-error);
  font-size: 12px;
  text-align: center;
}

/* Popup styles */
:deep(.map-popup) {
  color: var(--color-text-secondary);
}

:deep(.map-popup .favorited) {
  color: var(--color-accent);
  margin-left: 5px;
}


/* Leaflet Popup Styling */
:deep(.leaflet-popup-content-wrapper) {
  background: var(--color-background-secondary-alpha-95);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  box-shadow: 0 3px 14px var(--color-overlay-dark);
}

:deep(.leaflet-popup-content) {
  margin: 12px;
  font-size: 14px;
  line-height: 1.4;
}

:deep(.leaflet-popup-tip) {
  background: var(--color-background-secondary-alpha-95);
  border: 1px solid var(--color-border);
  box-shadow: 0 3px 14px var(--color-overlay-dark);
}

:deep(.leaflet-popup-close-button) {
  color: var(--color-text-muted);
  font-size: 20px;
  font-weight: normal;
  padding: 4px 8px;
}

:deep(.leaflet-popup-close-button:hover) {
  color: var(--color-text-primary);
  background: var(--color-primary-alpha-30);
  border-radius: 4px;
}

/* Popup content styling */
:deep(.map-popup) {
  color: var(--color-text-primary);
}

/* Infrastructure popup styling */
:deep(.infrastructure-popup) {
  min-width: 200px;
}

/* Speed up popup animations */
:deep(.leaflet-fade-anim .leaflet-popup) {
  transition: opacity 0.1s linear !important;
}

:deep(.leaflet-fade-anim .leaflet-map-pane .leaflet-popup) {
  opacity: 1;
  transition: opacity 0.1s !important;
}

:deep(.infrastructure-popup strong) {
  color: var(--color-accent);
  font-weight: bold;
  display: block;
  margin-bottom: 0.25rem;
}

:deep(.infrastructure-popup .description) {
  color: var(--color-text-disabled);
  font-size: 0.8rem;
  line-height: 1.3;
  display: block;
  margin-top: 0.25rem;
}

:deep(.map-popup strong) {
  color: var(--color-accent);
  font-size: 16px;
  display: block;
  margin-bottom: 4px;
}

:deep(.map-popup small) {
  color: var(--color-text-secondary);
  font-size: 12px;
}

:deep(.map-popup .favorited) {
  color: var(--color-accent);
  font-size: 16px;
  margin-left: 8px;
}

/* Event-specific popup styling */
:deep(.map-popup .event-info) {
  margin: 8px 0;
  padding: 8px;
  background: var(--color-bg-elevated);
  border-radius: 4px;
  border-left: 3px solid var(--color-accent);
}

:deep(.map-popup .event-type) {
  font-weight: 600;
  color: var(--color-accent);
  font-size: 13px;
  margin-bottom: 4px;
}

:deep(.map-popup .event-time) {
  font-size: 12px;
  color: var(--color-text-primary);

}

:deep(.map-popup .event-countdown) {
  font-size: 12px;
  color: var(--color-warning);
  font-weight: 600;
  background: var(--color-warning-alpha-20);
  padding: 4px 6px;
  border-radius: 3px;
  margin-top: 4px;
}

:deep(.map-popup .countdown-text) {
  font-weight: 700;
  color: var(--color-warning-dark);
}

:deep(.map-popup .item-description) {
  margin: 8px 0;
  font-size: 1.2rem;
  color: var(--color-text-secondary);
  line-height: normal;
}

/* Map background styling */
#map {
  background-color: var(--color-background-secondary); /* Default dark background */
}

:deep(.leaflet-container) {
  background-color: inherit;
}

/* Route Info Panel */
.route-info-panel {
  position: absolute;
  top: 10px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1001;
  background: var(--color-background-secondary-alpha-95);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 0.75rem;
  min-width: 300px;
  max-width: 400px;
  box-shadow: 0 4px 12px var(--color-black-alpha-20);
  backdrop-filter: blur(10px);
}

.route-info-panel.mobile {
  position: fixed;
  top: 70px; /* Below header */
  left: 10px;
  right: 10px;
  transform: none;
  min-width: auto;
  max-width: none;
}

.route-info-panel.route-mode {
  border-color: var(--color-success);
  box-shadow: 0 4px 20px var(--color-success-alpha-20);
}

.route-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.route-icon {
  font-size: 1.25rem;
  flex-shrink: 0;
}

.route-details {
  flex: 1;
  min-width: 0;
}

.route-target {
  font-weight: 600;
  color: var(--color-text-primary);
  font-size: 0.875rem;
  margin-bottom: 0.25rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.route-summary {
  font-size: 0.75rem;
  color: var(--color-success);
  font-weight: 500;
}

.route-controls {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  flex-shrink: 0;
}

.mode-toggle-btn,
.clear-route-btn {
  width: 32px;
  height: 32px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.875rem;
}

.mode-toggle-btn:hover {
  background: var(--color-primary-alpha-20);
  color: var(--color-primary);
}

.clear-route-btn:hover {
  background: var(--color-error-alpha-20);
  color: var(--color-error);
}

/* Route Mode Indicator */
.route-mode-indicator {
  margin-bottom: 0.25rem;
}

.mode-badge {
  background: var(--color-success);
  color: var(--color-text-primary);
  font-size: 0.625rem;
  font-weight: 600;
  padding: 0.125rem 0.375rem;
  border-radius: 12px;
  text-transform: uppercase;
  letter-spacing: 0.025em;
  display: inline-block;
}

/* Route popup styling */
:deep(.route-popup) {
  font-family: inherit;
  font-size: 0.875rem;
}

:deep(.route-popup strong) {
  color: var(--color-text-primary);
  display: block;
  margin-bottom: 0.5rem;
}

/* Map popup action buttons */
:deep(.popup-actions) {
  margin-top: 0.75rem;
  padding-top: 0.5rem;
  border-top: 1px solid var(--color-border-light);
  display: flex;
  gap: 0.5rem;
}

/* Base button styles for both favorite and route buttons - following BaseButton patterns */
:deep(.favorite-popup-btn),
:deep(.route-popup-btn) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  font-family: 'Berkeley Mono', monospace;
  font-weight: 500;
  border-radius: 4px;
  border: 1px solid transparent;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  text-decoration: none;
  position: relative;
  outline: none;
  line-height: 1.2;
  padding: 0.375rem 0.75rem;
  font-size: 0.875rem;
  min-height: 32px;
  flex: 1;
}

:deep(.favorite-popup-btn:focus-visible),
:deep(.route-popup-btn:focus-visible) {
  outline: 2px solid var(--color-focus-ring);
  outline-offset: 2px;
}

/* Favorite button styles - secondary variant when inactive */
:deep(.favorite-popup-btn) {
  background: var(--color-bg-elevated);
  color: var(--color-text-primary);
  border-color: var(--color-border-heavy);
  border-width: 2px;
}

:deep(.favorite-popup-btn:hover:not(:disabled)) {
  background: var(--color-bg-hover);
  border-color: var(--color-primary);
  color: var(--color-primary);
}

:deep(.favorite-popup-btn:active:not(:disabled)) {
  background: var(--color-bg-active);
  border-color: var(--color-primary-dark);
  color: var(--color-primary-dark);
}

/* Favorite button active state - primary variant */
:deep(.favorite-popup-btn.favorite-active) {
  background: var(--color-primary);
  color: var(--color-text-inverse);
  border-color: var(--color-primary);
}

:deep(.favorite-popup-btn.favorite-active:hover:not(:disabled)) {
  background: var(--color-primary-hover);
  border-color: var(--color-primary-hover);
}

:deep(.favorite-popup-btn.favorite-active:active:not(:disabled)) {
  background: var(--color-primary-dark);
  border-color: var(--color-primary-dark);
}

/* Route button styles - secondary variant by default (matches standard buttons) */
:deep(.route-popup-btn) {
  background: var(--color-bg-elevated);
  color: var(--color-text-primary);
  border-color: var(--color-border-heavy);
  border-width: 2px;
}

:deep(.route-popup-btn:hover:not(:disabled)) {
  background: var(--color-bg-hover);
  border-color: var(--color-primary);
  color: var(--color-primary);
}

:deep(.route-popup-btn:active:not(:disabled)) {
  background: var(--color-bg-active);
  border-color: var(--color-primary-dark);
  color: var(--color-primary-dark);
}

/* Route button active state - success color for active routes */
:deep(.route-popup-btn.route-active) {
  background: var(--color-success);
  color: var(--color-text-inverse);
  border-color: var(--color-success);
}

:deep(.route-popup-btn.route-active:hover:not(:disabled)) {
  background: var(--color-success);
  border-color: var(--color-success);
  opacity: 0.9;
}

:deep(.route-popup-btn.route-active:active:not(:disabled)) {
  background: var(--color-success-dark);
  border-color: var(--color-success-dark);
}

/* Single button takes full width when only one present */
:deep(.popup-actions:has(button:only-child) button) {
  flex: none;
  width: 100%;
}

/* Star icon styling - normal size by default */
:deep(.popup-actions .star-icon) {
  display: inline-block;
  transform-origin: center;
  line-height: 1;
  transition: transform 0.2s ease;
}

/* Make favorited star prominent with 2x scale */
:deep(.popup-actions .star-icon.favorited-star) {
  transform: scale(1.5);
  line-height: 0.67;
}
</style>