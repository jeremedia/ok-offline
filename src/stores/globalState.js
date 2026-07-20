import { reactive } from 'vue'
import { CURRENT_YEAR, SUPPORTED_YEARS, getSeason } from '../config/seasons'

const historical = year => String(year) !== CURRENT_YEAR
const availabilityDefaults = Object.fromEntries(SUPPORTED_YEARS.map(year => [year, {
  camp: historical(year),
  art: historical(year)
}]))

export const globalState = reactive({
  locationAvailability: availabilityDefaults,
  locationPublication: structuredClone(availabilityDefaults),
  // Compatibility surface for older components; true means at least one
  // placement collection is present, not that both types may be rendered.
  location_data_available: Object.fromEntries(SUPPORTED_YEARS.map(year => [year, historical(year)])),
  show_location_data: Object.fromEntries(SUPPORTED_YEARS.map(year => [year, historical(year)])),
  snapshotMetadata: {},
  lastLocationCheck: null
})

export function canShowLocations(year, type = 'camp') {
  const key = String(year)
  return Boolean(globalState.locationAvailability[key]?.[type] && globalState.locationPublication[key]?.[type])
}

export function applySnapshotMetadata(year, metadata) {
  const key = String(year)
  const counts = metadata.publishedLocationCounts || {}
  globalState.snapshotMetadata[key] = metadata
  globalState.locationAvailability[key] = {
    camp: historical(key) || Number(counts.camp || 0) > 0,
    art: historical(key) || Number(counts.art || 0) > 0
  }
  updateShowLocationFlag(key)
  globalState.lastLocationCheck = new Date().toISOString()
  saveLocationState()
}

export function updateLocationDataAvailability(year, hasLocations, type = 'camp') {
  const key = String(year)
  globalState.locationAvailability[key] ||= { camp: false, art: false }
  globalState.locationAvailability[key][type] = Boolean(hasLocations)
  updateShowLocationFlag(key)
  globalState.lastLocationCheck = new Date().toISOString()
  saveLocationState()
}

// `now` is injectable for embargo boundary tests. Public behavior has no
// development bypass: both the artifact phase and official clock must permit it.
export function updateShowLocationFlag(year = null, now = new Date()) {
  const years = year ? [String(year)] : SUPPORTED_YEARS
  for (const key of years) {
    const season = getSeason(key)
    const metadata = globalState.snapshotMetadata[key]
    const phase = metadata?.phase
    const phaseAllowsCamp = phase === 'camp-public' || phase === 'all-public' || historical(key)
    const phaseAllowsArt = phase === 'all-public' || historical(key)
    globalState.locationPublication[key] = {
      camp: phaseAllowsCamp && (historical(key) || now >= new Date(season.locationRelease.camp)),
      art: phaseAllowsArt && (historical(key) || now >= new Date(season.locationRelease.art))
    }
    globalState.location_data_available[key] = Boolean(
      globalState.locationAvailability[key]?.camp || globalState.locationAvailability[key]?.art
    )
    globalState.show_location_data[key] = canShowLocations(key, 'camp') || canShowLocations(key, 'art')
  }
}

export function saveLocationState() {
  localStorage.setItem('location_data_state', JSON.stringify({
    locationAvailability: globalState.locationAvailability,
    snapshotMetadata: globalState.snapshotMetadata,
    lastLocationCheck: globalState.lastLocationCheck
  }))
}

export function loadLocationState() {
  try {
    const saved = JSON.parse(localStorage.getItem('location_data_state') || '{}')
    if (saved.locationAvailability) Object.assign(globalState.locationAvailability, saved.locationAvailability)
    if (saved.snapshotMetadata) Object.assign(globalState.snapshotMetadata, saved.snapshotMetadata)
    globalState.lastLocationCheck = saved.lastLocationCheck || null
  } catch (error) {
    console.error('Failed to load location state:', error)
  }
  updateShowLocationFlag()
}

export function shouldShowLocation(item, type = null) {
  if (!item?.year) return true
  const inferredType = type || (item.artist ? 'art' : 'camp')
  return canShowLocations(String(item.year), inferredType)
}

export function debugLocationState() {
  if (import.meta.env.DEV) console.log('Location data state:', globalState)
}

loadLocationState()
export default globalState
