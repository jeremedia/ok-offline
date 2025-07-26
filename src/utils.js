export function getItemName(item) {
  return item.name || item.title || item.camp || item.artist || 'Unnamed'
}

// Cache for looking up locations
let locationCache = {
  camps: null,
  art: null
}

async function getLocationFromCache(type, id, year) {
  // Try to get cached data from IndexedDB
  if (!locationCache[type]) {
    try {
      const { getFromCache } = await import('./services/storage.js')
      const cachedData = await getFromCache(type === 'camps' ? 'camp' : 'art', year)
      if (cachedData && cachedData.length > 0) {
        // Create a map for quick lookup
        locationCache[type] = new Map(cachedData.map(item => [item.uid, item]))
      }
    } catch (err) {
      // Silently fail - this is expected if cache is empty
    }
  }
  
  if (locationCache[type]) {
    const item = locationCache[type].get(id)
    if (item) {
      return item.location_string || 
             (item.location && `${item.location.frontage} & ${item.location.intersection}`) || 
             item.address || 
             null
    }
  }
  
  return null
}

export function getItemLocation(item) {
  // Check for enriched location first (for events)
  if (item.enriched_location) return item.enriched_location
  
  // Check if we have a cached location (for events)
  if (item.cached_location) return item.cached_location
  
  // For camps and art
  if (item.location_string) return item.location_string
  if (item.location && typeof item.location === 'object') {
    const loc = item.location
    if (loc.frontage && loc.intersection) {
      return `${loc.frontage} & ${loc.intersection}`
    }
  }
  if (item.address) return item.address
  
  // For events - check other_location
  if (item.event_type) {
    if (item.other_location && item.other_location.trim()) {
      return item.other_location
    }
  }
  
  return 'Unknown location'
}

// New async version for events
export async function getItemLocationAsync(item, year) {
  // First try the synchronous version
  const syncLocation = getItemLocation(item)
  
  // If it's not an event or already has a location, return it
  if (!item.event_type || !syncLocation.includes('loading...')) {
    return syncLocation
  }
  
  // For events, try to look up the actual location
  if (item.hosted_by_camp) {
    const campLocation = await getLocationFromCache('camps', item.hosted_by_camp, year)
    if (campLocation) return campLocation
  }
  
  if (item.located_at_art) {
    const artLocation = await getLocationFromCache('art', item.located_at_art, year)
    if (artLocation) return artLocation
  }
  
  return syncLocation.replace('loading...', 'not found')
}

export function extractClockPosition(location) {
  // Extract clock position from location string (e.g., "7:30 & E" -> "7:30")
  const match = location.match(/(\d{1,2}:\d{2})/);
  return match ? match[1] : null;
}

export function extractAvenue(location) {
  // Extract avenue letter from location string (e.g., "7:30 & E" -> "E")
  const match = location.match(/&\s*([A-L])/i);
  return match ? match[1].toUpperCase() : null;
}

export function clockPositionToNumber(clockPos) {
  // Convert clock position to number for sorting (e.g., "7:30" -> 7.5)
  if (!clockPos) return 99; // Put unknowns at end
  const [hour, minute] = clockPos.split(':').map(Number);
  return hour + (minute / 60);
}

export function getSector(clockPos) {
  // Determine sector based on clock position
  // Sectors are approximately: 2:00-3:00, 3:00-4:00, 4:30-5:30, 5:30-6:30, 6:30-7:30, 7:30-8:30, 8:30-10:00
  const num = clockPositionToNumber(clockPos);
  if (num < 3) return '2:00-3:00';
  if (num < 4) return '3:00-4:00';
  if (num < 5.5) return '4:30-5:30';
  if (num < 6.5) return '5:30-6:30';
  if (num < 7.5) return '6:30-7:30';
  if (num < 8.5) return '7:30-8:30';
  if (num <= 10) return '8:30-10:00';
  return 'Unknown';
}