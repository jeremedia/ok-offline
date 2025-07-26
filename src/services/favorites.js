/**
 * Favorites service for managing favorite camps, art, and events
 */

const FAVORITES_KEY = 'bm_favorites'

/**
 * Get all favorites from localStorage
 */
function getAllFavorites() {
  const data = localStorage.getItem(FAVORITES_KEY)
  return data ? JSON.parse(data) : { camps: [], art: [], events: [] }
}

/**
 * Save favorites to localStorage
 */
function saveFavorites(favorites) {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites))
}

/**
 * Check if an item is favorited
 * @param {string} type - 'camp', 'art', or 'event'
 * @param {string} uid - The item's UID
 */
export function isFavorite(type, uid) {
  const favorites = getAllFavorites()
  const typeKey = type === 'camp' ? 'camps' : type === 'art' ? 'art' : 'events'
  return favorites[typeKey].includes(uid)
}

/**
 * Toggle favorite status for an item
 * @param {string} type - 'camp', 'art', or 'event'
 * @param {string} uid - The item's UID
 */
export function toggleFavorite(type, uid) {
  const favorites = getAllFavorites()
  const typeKey = type === 'camp' ? 'camps' : type === 'art' ? 'art' : 'events'
  
  const index = favorites[typeKey].indexOf(uid)
  if (index === -1) {
    // Add to favorites
    favorites[typeKey].push(uid)
  } else {
    // Remove from favorites
    favorites[typeKey].splice(index, 1)
  }
  
  saveFavorites(favorites)
  return index === -1 // Return true if added, false if removed
}

/**
 * Get all favorite UIDs for a type
 * @param {string} type - 'camp', 'art', or 'event'
 */
export function getFavorites(type) {
  const favorites = getAllFavorites()
  const typeKey = type === 'camp' ? 'camps' : type === 'art' ? 'art' : 'events'
  return favorites[typeKey]
}

/**
 * Clear all favorites
 */
export function clearAllFavorites() {
  localStorage.removeItem(FAVORITES_KEY)
}

/**
 * Get count of favorites by type
 */
export function getFavoriteCounts() {
  const favorites = getAllFavorites()
  return {
    camps: favorites.camps.length,
    art: favorites.art.length,
    events: favorites.events.length
  }
}