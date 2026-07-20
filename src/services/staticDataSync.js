import { saveToCache, getFromCache } from './storage'
import { AppError, handleError } from '../utils/errorHandler'
import { applySnapshotMetadata } from '../stores/globalState'
import { CURRENT_YEAR } from '../config/seasons'

const DATA_TYPES = {
  camp: { fileName: 'camps', minimum: 1 },
  art: { fileName: 'art', minimum: 1 },
  event: { fileName: 'events', minimum: 1 }
}

async function fetchValidatedJson(url, validate) {
  const response = await fetch(url, { cache: 'no-store' })
  if (!response.ok) throw new AppError(`Failed to load ${url}: ${response.status}`, 'DATA_ERROR', 'Unable to load data. Please try again.')
  const contentType = response.headers.get('content-type') || ''
  if (!contentType.toLowerCase().includes('json')) {
    throw new AppError(`${url} returned ${contentType || 'no Content-Type'}`, 'INVALID_SNAPSHOT', 'The data server returned an invalid file.')
  }
  const data = await response.json()
  if (!validate(data)) throw new AppError(`${url} has an invalid shape`, 'INVALID_SNAPSHOT', 'The downloaded data failed validation.')
  return data
}

export async function syncSnapshotMetadata(year) {
  const metadata = await fetchValidatedJson(`/data/${year}/metadata.json`, value =>
    value && String(value.year) === String(year) && (String(year) !== CURRENT_YEAR || (value.publishedCounts && value.phase))
  )
  applySnapshotMetadata(year, metadata)
  localStorage.setItem(`snapshot_metadata_${year}`, JSON.stringify(metadata))
  return metadata
}

/**
 * Sync all data for a given year from static JSON files
 * @param {string} year - The year to sync
 * @param {Function} onProgress - Progress callback (type, current, total)
 * @returns {Promise<Object>} Sync results
 */
export async function syncYear(year, onProgress = () => {}) {
  const types = ['camp', 'art', 'event']
  const results = {}
  
  console.log('[StaticDataSync] Starting sync for year:', year)
  
  await syncSnapshotMetadata(year)
  // First sync all data types
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
  
  // Note: Tile downloading has been moved to progressiveSync service
  // for better integration with the ProgressiveLoader component
  
  onProgress('complete', types.length, types.length)
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
    const typeConfig = DATA_TYPES[type]
    if (!typeConfig) throw new AppError(`Unknown data type ${type}`, 'INVALID_SNAPSHOT', 'The requested data type is invalid.')
    const fileName = typeConfig.fileName
    const url = `/data/${year}/${fileName}.json`
    
    console.log(`Loading ${type}s for year ${year} from ${url}`)
    
    const data = await fetchValidatedJson(url, value => Array.isArray(value) && value.length >= typeConfig.minimum && value.every(item =>
      item && typeof item === 'object' && !Array.isArray(item) && item.uid && Number(item.year) === Number(year)
    ))
    let items = data
    
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
      
      if (event.located_at_art) {
        const artPiece = artMap.get(event.located_at_art)
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
