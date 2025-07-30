import { openDb } from './storage'

/**
 * Generate a unique ID for custom entries
 * @param {string} type - 'art', 'camp', or 'event'
 * @returns {string} Unique ID with custom prefix
 */
export function generateCustomId(type) {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substr(2, 5)
  return `custom-${type}-${timestamp}-${random}`
}

/**
 * Save a custom entry
 * @param {string} type - 'art', 'camp', or 'event'
 * @param {Object} entry - Entry data
 * @returns {Promise<string>} The saved entry's UID
 */
export async function saveCustomEntry(type, entry) {
  try {
    const database = await openDb()
    const tx = database.transaction(type, 'readwrite')
    const store = tx.objectStore(type)
    
    // Ensure entry has required fields
    const customEntry = {
      ...entry,
      uid: entry.uid || generateCustomId(type),
      isCustom: true,
      createdAt: entry.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      year: parseInt(entry.year || new Date().getFullYear())
    }
    
    // Ensure location_string for geocoding
    if (customEntry.location && !customEntry.location_string) {
      customEntry.location_string = formatLocationString(customEntry.location)
    }
    
    await store.put(customEntry)
    
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => {
        console.log(`Saved custom ${type}:`, customEntry.uid)
        resolve(customEntry.uid)
      }
      tx.onerror = () => reject(tx.error)
    })
  } catch (err) {
    console.error('Failed to save custom entry:', err)
    throw err
  }
}

/**
 * Get all custom entries of a type for a year
 * @param {string} type - 'art', 'camp', or 'event'
 * @param {string} year - Year as string
 * @returns {Promise<Array>} Array of custom entries
 */
export async function getCustomEntries(type, year) {
  try {
    const database = await openDb()
    const tx = database.transaction(type, 'readonly')
    const store = tx.objectStore(type)
    
    const yearIndex = store.index('year')
    const range = IDBKeyRange.only(parseInt(year))
    
    return new Promise((resolve, reject) => {
      const request = yearIndex.openCursor(range)
      const customEntries = []
      
      request.onsuccess = (e) => {
        const cursor = e.target.result
        if (cursor) {
          if (cursor.value.isCustom) {
            customEntries.push(cursor.value)
          }
          cursor.continue()
        } else {
          resolve(customEntries)
        }
      }
      request.onerror = () => reject(request.error)
    })
  } catch (err) {
    console.error('Failed to get custom entries:', err)
    return []
  }
}

/**
 * Delete a custom entry
 * @param {string} type - 'art', 'camp', or 'event'
 * @param {string} uid - Entry UID
 * @returns {Promise<void>}
 */
export async function deleteCustomEntry(type, uid) {
  try {
    const database = await openDb()
    const tx = database.transaction(type, 'readwrite')
    const store = tx.objectStore(type)
    
    // Verify it's a custom entry before deleting
    const entry = await store.get(uid)
    if (!entry || !entry.isCustom) {
      throw new Error('Cannot delete non-custom entry')
    }
    
    await store.delete(uid)
    
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => {
        console.log(`Deleted custom ${type}:`, uid)
        resolve()
      }
      tx.onerror = () => reject(tx.error)
    })
  } catch (err) {
    console.error('Failed to delete custom entry:', err)
    throw err
  }
}

/**
 * Get combined data (API + custom entries)
 * @param {string} type - 'art', 'camp', or 'event'
 * @param {string} year - Year as string
 * @returns {Promise<Array>} Combined array sorted by name
 */
export async function getCombinedData(type, year) {
  try {
    const database = await openDb()
    const tx = database.transaction(type, 'readonly')
    const store = tx.objectStore(type)
    
    const yearIndex = store.index('year')
    const range = IDBKeyRange.only(parseInt(year))
    
    return new Promise((resolve, reject) => {
      const request = yearIndex.getAll(range)
      request.onsuccess = () => {
        const results = request.result
        // Sort by name (custom entries first if same name)
        results.sort((a, b) => {
          const nameA = (a.name || a.title || '').toLowerCase()
          const nameB = (b.name || b.title || '').toLowerCase()
          if (nameA === nameB) {
            // Put custom entries first
            return (b.isCustom ? 1 : 0) - (a.isCustom ? 1 : 0)
          }
          return nameA.localeCompare(nameB)
        })
        resolve(results)
      }
      request.onerror = () => reject(request.error)
    })
  } catch (err) {
    console.error('Failed to get combined data:', err)
    return []
  }
}

/**
 * Export custom entries to JSON
 * @param {string} year - Year to export
 * @returns {Promise<Object>} Export data object
 */
export async function exportCustomEntries(year) {
  try {
    const camps = await getCustomEntries('camp', year)
    const art = await getCustomEntries('art', year)
    const events = await getCustomEntries('event', year)
    
    return {
      version: 1,
      exportDate: new Date().toISOString(),
      year: parseInt(year),
      data: {
        camps,
        art,
        events
      }
    }
  } catch (err) {
    console.error('Failed to export custom entries:', err)
    throw err
  }
}

/**
 * Import custom entries from JSON
 * @param {Object} exportData - Export data object
 * @returns {Promise<Object>} Import results
 */
export async function importCustomEntries(exportData) {
  try {
    if (!exportData || exportData.version !== 1) {
      throw new Error('Invalid export data format')
    }
    
    const results = {
      camps: 0,
      art: 0,
      events: 0,
      errors: []
    }
    
    // Import each type
    for (const type of ['camps', 'art', 'events']) {
      const singularType = type.slice(0, -1) // Remove 's'
      const entries = exportData.data[type] || []
      
      for (const entry of entries) {
        try {
          // Generate new ID to avoid conflicts
          const newEntry = {
            ...entry,
            uid: generateCustomId(singularType),
            importedAt: new Date().toISOString(),
            importedFrom: entry.uid
          }
          await saveCustomEntry(singularType, newEntry)
          results[type]++
        } catch (err) {
          results.errors.push(`Failed to import ${singularType}: ${entry.name || entry.title}`)
        }
      }
    }
    
    return results
  } catch (err) {
    console.error('Failed to import custom entries:', err)
    throw err
  }
}

/**
 * Format location object to string
 * @param {Object} location - Location object
 * @returns {string} Formatted location string
 */
function formatLocationString(location) {
  if (!location) return ''
  
  if (location.intersection && location.intersection_type) {
    return `${location.intersection} ${location.intersection_type} ${location.street || ''}`
  }
  
  if (location.gps_latitude && location.gps_longitude) {
    return `GPS: ${location.gps_latitude}, ${location.gps_longitude}`
  }
  
  return location.string || ''
}

// Re-export openDb for components to use
export { openDb } from './storage'