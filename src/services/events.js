import { getFromCache } from './storage'
import { syncType } from './staticDataSync'

/**
 * Get events for a specific camp
 * @param {string} campId - The camp UID
 * @param {string} year - The year
 * @returns {Promise<Array>} Events hosted by the camp
 */
export async function getCampEvents(campId, year) {
  try {
    // First try cache
    const cachedEvents = await getFromCache('event', year)
    
    if (cachedEvents && cachedEvents.length > 0) {
      console.log(`Using cached events for filtering by camp ${campId}`)
      const campEvents = filterEventsByCamp(cachedEvents, campId)
      
      // Try to refresh in background
      fetchAndFilterEvents(campId, year)
      
      return campEvents
    }
    
    // No cache, fetch the validated public snapshot. Official API credentials
    // are build/CI secrets and are never available to the browser.
    return await fetchAndFilterEvents(campId, year)
  } catch (err) {
    console.error('Error getting camp events:', err)
    return []
  }
}

async function fetchAndFilterEvents(campId, year) {
  try {
    await syncType('event', year)
    const events = await getFromCache('event', year)
    
    // Filter for this camp
    return filterEventsByCamp(events, campId)
  } catch (err) {
    console.error('Failed to fetch events:', err)
    return []
  }
}

function filterEventsByCamp(events, campId) {
  // Events use hosted_by_camp field with the camp UID
  return events.filter(event => event.hosted_by_camp === campId)
}
