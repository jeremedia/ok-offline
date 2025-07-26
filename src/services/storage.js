const DB_NAME = 'bm2025-db'
const DB_VERSION = 2  // Increased to force upgrade
const STORE_NAMES = ['art', 'camp', 'event']

let db = null

/**
 * Open the IndexedDB database
 */
function openDb() {
  return new Promise((resolve, reject) => {
    if (db) {
      resolve(db)
      return
    }
    
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    
    request.onupgradeneeded = (e) => {
      const database = e.target.result
      
      // For version 2, ensure all stores have the year index
      STORE_NAMES.forEach((storeName) => {
        let store
        
        if (!database.objectStoreNames.contains(storeName)) {
          // Create new store with index
          store = database.createObjectStore(storeName, { keyPath: 'uid' })
          store.createIndex('year', 'year', { unique: false })
        } else {
          // Check existing store for index
          const transaction = e.target.transaction
          store = transaction.objectStore(storeName)
          
          if (!store.indexNames.contains('year')) {
            // Add missing index
            store.createIndex('year', 'year', { unique: false })
          }
        }
      })
    }
    
    request.onsuccess = () => {
      db = request.result
      resolve(db)
    }
    
    request.onerror = () => {
      reject(request.error)
    }
  })
}

/**
 * Save items to IndexedDB
 * @param {string} type - 'art', 'camp', or 'event'
 * @param {string} year - Year as string
 * @param {Array} items - Array of items to store
 */
export async function saveToCache(type, year, items) {
  try {
    console.log(`Saving ${items.length} ${type}s for year ${year} to cache`)
    const database = await openDb()
    
    // First transaction: delete old items
    const deleteTx = database.transaction(type, 'readwrite')
    const deleteStore = deleteTx.objectStore(type)
    
    if (deleteStore.indexNames.contains('year')) {
      const yearIndex = deleteStore.index('year')
      const range = IDBKeyRange.only(parseInt(year))
      const deleteRequest = yearIndex.openCursor(range)
      
      const deletePromise = new Promise((resolve) => {
        let deletedCount = 0
        deleteRequest.onsuccess = (e) => {
          const cursor = e.target.result
          if (cursor) {
            deleteStore.delete(cursor.primaryKey)
            deletedCount++
            cursor.continue()
          } else {
            // No more items to delete
            resolve(deletedCount)
          }
        }
        deleteRequest.onerror = () => resolve(0)
      })
      
      // Wait for deletion to complete
      await new Promise((resolve, reject) => {
        deleteTx.oncomplete = () => resolve()
        deleteTx.onerror = () => reject(deleteTx.error)
      })
    }
    
    // Second transaction: add new items
    const addTx = database.transaction(type, 'readwrite')
    const addStore = addTx.objectStore(type)
    
    items.forEach((item) => {
      // Ensure year is stored as number for consistency
      addStore.put({ ...item, year: parseInt(year) })
    })
    
    return new Promise((resolve, reject) => {
      addTx.oncomplete = () => {
        console.log(`Successfully cached ${items.length} ${type}s for year ${year}`)
        resolve()
      }
      addTx.onerror = () => {
        console.error(`Failed to cache ${type}s:`, addTx.error)
        reject(addTx.error)
      }
    })
  } catch (err) {
    console.error('Failed to save to cache:', err)
    throw err
  }
}

/**
 * Get items from IndexedDB
 * @param {string} type - 'art', 'camp', or 'event'
 * @param {string} year - Year as string
 * @returns {Promise<Array>} Array of items
 */
export async function getFromCache(type, year) {
  try {
    const database = await openDb()
    const tx = database.transaction(type, 'readonly')
    const store = tx.objectStore(type)
    
    // Check if the year index exists
    if (store.indexNames.contains('year')) {
      // Use the index for efficient querying
      const yearIndex = store.index('year')
      const range = IDBKeyRange.only(parseInt(year))
      
      return new Promise((resolve, reject) => {
        const request = yearIndex.getAll(range)
        request.onsuccess = () => {
          const results = request.result
          if (results.length > 0) {
            console.log(`Retrieved ${results.length} cached ${type}s for year ${year}`)
          }
          resolve(results)
        }
        request.onerror = () => reject(request.error)
      })
    } else {
      // Fallback: get all items and filter by year
      return new Promise((resolve, reject) => {
        const request = store.getAll()
        request.onsuccess = () => {
          const allItems = request.result
          const filteredItems = allItems.filter(item => item.year === parseInt(year))
          if (filteredItems.length > 0) {
            console.log(`Retrieved ${filteredItems.length} cached ${type}s for year ${year} (no index)`)
          }
          resolve(filteredItems)
        }
        request.onerror = () => reject(request.error)
      })
    }
  } catch (err) {
    console.warn('Failed to read from cache:', err)
    return []
  }
}

/**
 * Clear all cached data
 */
export async function clearCache() {
  try {
    const database = await openDb()
    const tx = database.transaction(STORE_NAMES, 'readwrite')
    
    STORE_NAMES.forEach(storeName => {
      tx.objectStore(storeName).clear()
    })
    
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => {
        console.log('Cache cleared')
        resolve()
      }
      tx.onerror = () => reject(tx.error)
    })
  } catch (err) {
    console.warn('Failed to clear cache:', err)
  }
}

/**
 * Get cache statistics
 */
export async function getCacheStats() {
  try {
    const database = await openDb()
    const stats = {}
    
    for (const storeName of STORE_NAMES) {
      const tx = database.transaction(storeName, 'readonly')
      const store = tx.objectStore(storeName)
      const countRequest = store.count()
      
      await new Promise((resolve) => {
        countRequest.onsuccess = () => {
          stats[storeName] = countRequest.result
          resolve()
        }
      })
    }
    
    return stats
  } catch (err) {
    console.warn('Failed to get cache stats:', err)
    return {}
  }
}