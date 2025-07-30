/**
 * Infrastructure data service
 * Manages access to Burning Man infrastructure information
 */

import infrastructureData from '../data/infrastructure.json'

/**
 * Get all infrastructure items
 * @returns {Array} Array of infrastructure objects
 */
export function getAllInfrastructure() {
  return infrastructureData.infrastructure || []
}

/**
 * Get infrastructure by ID
 * @param {string} id - Infrastructure item ID
 * @returns {Object|null} Infrastructure object or null if not found
 */
export function getInfrastructureById(id) {
  const items = getAllInfrastructure()
  return items.find(item => item.id === id) || null
}

/**
 * Get infrastructure by category
 * @param {string} category - Category to filter by (civic, services, commerce, infrastructure)
 * @returns {Array} Array of infrastructure objects in the category
 */
export function getInfrastructureByCategory(category) {
  const items = getAllInfrastructure()
  return items.filter(item => item.category === category)
}

/**
 * Get all categories with counts
 * @returns {Array} Array of category objects with name and count
 */
export function getCategories() {
  const items = getAllInfrastructure()
  const categories = {}
  
  items.forEach(item => {
    if (!categories[item.category]) {
      categories[item.category] = {
        name: item.category,
        displayName: getCategoryDisplayName(item.category),
        count: 0
      }
    }
    categories[item.category].count++
  })
  
  return Object.values(categories).sort((a, b) => {
    const order = ['civic', 'services', 'commerce', 'infrastructure']
    return order.indexOf(a.name) - order.indexOf(b.name)
  })
}

/**
 * Get display name for category
 * @param {string} category - Category ID
 * @returns {string} Display name
 */
export function getCategoryDisplayName(category) {
  const names = {
    civic: 'Civic Structures',
    services: 'City Services',
    commerce: 'Commerce',
    infrastructure: 'Infrastructure'
  }
  return names[category] || category
}

/**
 * Search infrastructure by text
 * @param {string} searchText - Text to search for
 * @returns {Array} Array of matching infrastructure objects
 */
export function searchInfrastructure(searchText) {
  if (!searchText || searchText.trim() === '') {
    return getAllInfrastructure()
  }
  
  const search = searchText.toLowerCase()
  const items = getAllInfrastructure()
  
  return items.filter(item => {
    return (
      item.name.toLowerCase().includes(search) ||
      item.shortDescription.toLowerCase().includes(search) ||
      item.category.toLowerCase().includes(search) ||
      item.icon.includes(search)
    )
  })
}

/**
 * Calculate distance to infrastructure from coordinates
 * @param {Object} item - Infrastructure item
 * @param {Array} fromCoords - [lat, lon] coordinates to calculate from
 * @returns {number} Distance in feet
 */
export function calculateDistanceToInfrastructure(item, fromCoords) {
  if (!item.coordinates || !fromCoords) return null
  
  const [lat1, lon1] = fromCoords
  const [lat2, lon2] = item.coordinates
  
  // Haversine formula
  const R = 20925524.9 // Earth's radius in feet
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  const distance = R * c
  
  return Math.round(distance)
}

/**
 * Sort infrastructure by distance
 * @param {Array} items - Array of infrastructure items
 * @param {Array} fromCoords - [lat, lon] coordinates
 * @returns {Array} Sorted array of items with distance property
 */
export function sortByDistance(items, fromCoords) {
  if (!fromCoords) return items
  
  return items.map(item => ({
    ...item,
    distance: calculateDistanceToInfrastructure(item, fromCoords)
  })).sort((a, b) => (a.distance || 0) - (b.distance || 0))
}

/**
 * Get infrastructure stats
 * @returns {Object} Statistics object
 */
export function getInfrastructureStats() {
  const items = getAllInfrastructure()
  const categories = getCategories()
  
  return {
    total: items.length,
    categories: categories,
    byCategory: categories.reduce((acc, cat) => {
      acc[cat.name] = cat.count
      return acc
    }, {})
  }
}