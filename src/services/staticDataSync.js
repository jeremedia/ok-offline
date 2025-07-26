import { saveToCache, getFromCache } from './storage'
import { AppError, handleError } from '../utils/errorHandler'

/**
 * Sync all data for a given year from static JSON files
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
  
  // Skip enrichment - data is pre-enriched in static files
  // This saves processing time on mobile devices
  
  onProgress('complete', types.length + 1, types.length + 1)
  return results
}

/**
 * Sync a specific data type for a year from static JSON
 * @param {string} type - 'camp', 'art', or 'event'
 * @param {string} year - The year to sync
 * @returns {Promise<Object>} Sync result
 */
export async function syncType(type, year) {
  try {
    // Construct the path to the static JSON file
    const fileName = type === 'camp' ? 'camps' : type === 'art' ? 'art' : 'events'
    const url = `/data/${year}/${fileName}.json`
    
    console.log(`Loading ${type}s for year ${year} from ${url}`)
    
    const response = await fetch(url)
    
    if (!response.ok) {
      if (response.status === 404) {
        throw new AppError(
          `Data file not found for ${year} ${type}s`,
          'NO_DATA',
          `No ${year} ${type} data available yet.`
        )
      }
      throw new AppError(
        `Failed to load ${type} data: ${response.status}`,
        'DATA_ERROR',
        'Unable to load data. Please try again.'
      )
    }
    
    const data = await response.json()
    let items = Array.isArray(data) ? data : []
    
    // Handle different data formats (just in case)
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
    
    // Create lookup maps
    const campMap = new Map(camps.map(camp => [camp.uid, camp]))
    const artMap = new Map(art.map(piece => [piece.uid, piece]))
    
    // Enrich events with location data
    const enrichedEvents = events.map(event => {
      // If event already has a location, keep it
      if (event.location && event.location_string) {
        return event
      }
      
      // Look up the camp or art that hosts this event
      if (event.hosted_by_camp) {
        const camp = campMap.get(event.hosted_by_camp)
        if (camp && camp.location_string) {
          return {
            ...event,
            camp_name: camp.name,
            enriched_location: camp.location_string
          }
        }
      }
      
      if (event.hosted_by_art) {
        const artPiece = artMap.get(event.hosted_by_art)
        if (artPiece && artPiece.location_string) {
          return {
            ...event,
            art_name: artPiece.name,
            enriched_location: artPiece.location_string
          }
        }
      }
      
      // No location found, return as-is
      return event
    })
    
    // Save enriched events back to cache
    await saveToCache('event', year, enrichedEvents)
    console.log(`Enriched and saved ${enrichedEvents.length} events`)
  } catch (err) {
    console.error('Failed to enrich events:', err)
    // Don't throw - enrichment is a nice-to-have
  }
}

/**
 * Save sync metadata
 */
async function saveSyncMetadata(type, year) {
  const key = `sync_${type}_${year}`
  const metadata = {
    lastSync: new Date().toISOString(),
    source: 'static'
  }
  localStorage.setItem(key, JSON.stringify(metadata))
}

/**
 * Get sync metadata for a type and year
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
  const status = {}
  
  for (const type of ['camp', 'art', 'event']) {
    const cached = await getFromCache(type, year)
    const metadata = getSyncMetadata(type, year)
    
    status[type] = {
      count: cached?.length || 0,
      lastSync: metadata?.lastSync || null
    }
  }
  
  return status
}

/**
 * Clear data for a specific year
 */
export async function clearYear(year) {
  for (const type of ['camp', 'art', 'event']) {
    await saveToCache(type, year, [])
    localStorage.removeItem(`sync_${type}_${year}`)
  }
}