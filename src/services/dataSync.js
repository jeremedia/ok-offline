import { API_KEY, API_BASE } from '../config'
import { saveToCache, getFromCache } from './storage'
import { AppError, handleError } from '../utils/errorHandler'

/**
 * Sync all data for a given year
 * @param {string} year - The year to sync
 * @param {Function} onProgress - Progress callback (type, current, total)
 * @returns {Promise<Object>} Sync results
 */
export async function syncYear(year, onProgress = () => {}) {
  const types = ['camp', 'art', 'event']
  const results = {}
  
  for (let i = 0; i < types.length; i++) {
    const type = types[i]
    onProgress(type, i, types.length)
    
    try {
      results[type] = await syncType(type, year)
    } catch (err) {
      console.error(`Failed to sync ${type}s:`, err)
      results[type] = { success: false, error: err.message }
    }
  }
  
  // Enrich events with location data
  if (results.event?.success && results.camp?.success) {
    onProgress('enriching', types.length, types.length + 1)
    await enrichAndSaveEvents(year, results)
  }
  
  onProgress('complete', types.length + 1, types.length + 1)
  return results
}

/**
 * Sync a specific data type for a year
 * @param {string} type - 'camp', 'art', or 'event'
 * @param {string} year - The year to sync
 * @returns {Promise<Object>} Sync result
 */
export async function syncType(type, year) {
  try {
    const url = `${API_BASE}/${type}?year=${year}`
    console.log(`Syncing ${type}s for year ${year} from ${url}`)
    
    const response = await fetch(url, {
      headers: { 'X-API-Key': API_KEY }
    })
    
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        throw new AppError(
          `API authentication failed`, 
          'API_ERROR',
          'Unable to access Burning Man API. Please check your connection.'
        )
      }
      throw new AppError(
        `API returned ${response.status}: ${response.statusText}`,
        'API_ERROR',
        'Unable to sync data. Please try again later.'
      )
    }
    
    const data = await response.json()
    let items = Array.isArray(data) ? data : []
    
    // Handle different API response formats
    if (!Array.isArray(data) && data && typeof data === 'object') {
      if (data.data && Array.isArray(data.data)) {
        items = data.data
      } else if (data[type] && Array.isArray(data[type])) {
        items = data[type]
      }
    }
    
    // Ensure each item has a year
    items = items.map(item => ({ ...item, year: parseInt(year) }))
    
    // Save to cache
    await saveToCache(type, year, items)
    
    // Save sync metadata
    await saveSyncMetadata(type, year)
    
    return {
      success: true,
      count: items.length,
      timestamp: new Date().toISOString()
    }
  } catch (err) {
    // Re-throw AppError as-is
    if (err instanceof AppError) {
      throw err
    }
    
    // Handle network errors
    if (err.name === 'TypeError' && err.message.includes('fetch')) {
      throw new AppError(
        err.message,
        'NETWORK_ERROR',
        'No internet connection. Please check your network.'
      )
    }
    
    // Handle timeout
    if (err.name === 'AbortError') {
      throw new AppError(
        err.message,
        'TIMEOUT',
        'Request timed out. Please try again.'
      )
    }
    
    // Generic error
    const message = handleError(err, `syncType ${type} ${year}`)
    throw new AppError(err.message, 'SYNC_FAILED', message)
  }
}

/**
 * Enrich events with location data from camps and art
 */
async function enrichAndSaveEvents(year, syncResults) {
  try {
    // Get all data from cache
    const [camps, art, events] = await Promise.all([
      getFromCache('camp', year),
      getFromCache('art', year),
      getFromCache('event', year)
    ])
    
    console.log(`Retrieved ${camps.length} camps, ${art.length} art, ${events.length} events for enrichment`)
    
    // If no events, nothing to enrich
    if (!events || events.length === 0) {
      console.warn(`No events found in cache for year ${year}, skipping enrichment`)
      return {
        success: true,
        count: 0,
        enrichedCount: 0
      }
    }
    
    // Create lookup maps
    const campMap = new Map(camps.map(c => [c.uid, c]))
    const artMap = new Map(art.map(a => [a.uid, a]))
    
    // Enrich events
    const enrichedEvents = events.map(event => {
      const enriched = { ...event }
      
      // Add location from camp
      if (event.hosted_by_camp && campMap.has(event.hosted_by_camp)) {
        const camp = campMap.get(event.hosted_by_camp)
        enriched.camp_name = camp.name
        enriched.enriched_location = camp.location_string || 
                                    (camp.location && `${camp.location.frontage} & ${camp.location.intersection}`) ||
                                    null
      }
      
      // Add location from art
      if (event.located_at_art && artMap.has(event.located_at_art)) {
        const artPiece = artMap.get(event.located_at_art)
        enriched.art_name = artPiece.name
        enriched.enriched_location = artPiece.location_string || 
                                    (artPiece.location && `${artPiece.location.frontage} & ${artPiece.location.intersection}`) ||
                                    null
      }
      
      // Use other_location if no camp/art location
      if (!enriched.enriched_location && event.other_location) {
        enriched.enriched_location = event.other_location
      }
      
      return enriched
    })
    
    // Save enriched events back to cache
    await saveToCache('event', year, enrichedEvents)
    console.log(`Enriched ${enrichedEvents.length} events with location data`)
    
    return {
      success: true,
      count: enrichedEvents.length,
      enrichedCount: enrichedEvents.filter(e => e.enriched_location).length
    }
  } catch (err) {
    console.error('Failed to enrich events:', err)
    throw err
  }
}

/**
 * Save sync metadata
 */
async function saveSyncMetadata(type, year) {
  const key = `sync_${type}_${year}`
  const metadata = {
    lastSync: new Date().toISOString(),
    type,
    year
  }
  localStorage.setItem(key, JSON.stringify(metadata))
}

/**
 * Get sync metadata
 */
export function getSyncMetadata(type, year) {
  const key = `sync_${type}_${year}`
  const data = localStorage.getItem(key)
  return data ? JSON.parse(data) : null
}

/**
 * Get sync status for all types in a year
 */
export async function getSyncStatus(year) {
  const types = ['camp', 'art', 'event']
  const status = {}
  
  for (const type of types) {
    const metadata = getSyncMetadata(type, year)
    const cached = await getFromCache(type, year)
    
    status[type] = {
      lastSync: metadata?.lastSync || null,
      count: cached?.length || 0,
      synced: !!metadata
    }
  }
  
  return status
}

/**
 * Clear all data for a year
 */
export async function clearYear(year) {
  const types = ['camp', 'art', 'event']
  
  for (const type of types) {
    await clearType(type, year)
  }
}

/**
 * Clear data for a specific type and year
 */
export async function clearType(type, year) {
  // Clear from IndexedDB
  await saveToCache(type, year, [])
  
  // Clear sync metadata
  const key = `sync_${type}_${year}`
  localStorage.removeItem(key)
}