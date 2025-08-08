/**
 * Image caching service for offline support
 * Stores camp images in IndexedDB for true offline access
 */

const IMAGE_DB_NAME = 'ok-offline-images'
const IMAGE_DB_VERSION = 1
const IMAGE_STORE_NAME = 'images'
const METADATA_STORE_NAME = 'metadata'

// Cache settings
const MAX_CACHE_SIZE = 100 * 1024 * 1024 // 100MB default
const CACHE_KEY = 'image_cache_size'

let imageDb = null

/**
 * Open the image database
 */
function openImageDb() {
  return new Promise((resolve, reject) => {
    if (imageDb) {
      resolve(imageDb)
      return
    }

    const request = indexedDB.open(IMAGE_DB_NAME, IMAGE_DB_VERSION)

    request.onupgradeneeded = (e) => {
      const db = e.target.result

      // Create image store if it doesn't exist
      if (!db.objectStoreNames.contains(IMAGE_STORE_NAME)) {
        const imageStore = db.createObjectStore(IMAGE_STORE_NAME, { keyPath: 'url' })
        imageStore.createIndex('campId', 'campId', { unique: false })
        imageStore.createIndex('timestamp', 'timestamp', { unique: false })
      }

      // Create metadata store for cache management
      if (!db.objectStoreNames.contains(METADATA_STORE_NAME)) {
        db.createObjectStore(METADATA_STORE_NAME, { keyPath: 'key' })
      }
    }

    request.onsuccess = () => {
      imageDb = request.result
      resolve(imageDb)
    }

    request.onerror = () => {
      reject(request.error)
    }
  })
}

/**
 * Get current cache size
 */
export async function getCacheSize() {
  const stored = localStorage.getItem(CACHE_KEY)
  return stored ? parseInt(stored, 10) : 0
}

/**
 * Update cache size
 */
function updateCacheSize(delta) {
  const current = getCacheSize()
  const newSize = Math.max(0, current + delta)
  localStorage.setItem(CACHE_KEY, newSize.toString())
  return newSize
}

/**
 * Convert image URL to blob
 */
async function fetchImageAsBlob(url) {
  try {
    const response = await fetch(url)
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    return await response.blob()
  } catch (error) {
    console.error('Failed to fetch image:', error)
    throw error
  }
}

/**
 * Store image in IndexedDB
 */
async function storeImage(url, campId, blob) {
  const db = await openImageDb()
  const transaction = db.transaction([IMAGE_STORE_NAME], 'readwrite')
  const store = transaction.objectStore(IMAGE_STORE_NAME)

  const imageData = {
    url,
    campId,
    blob,
    size: blob.size,
    type: blob.type,
    timestamp: Date.now()
  }

  return new Promise((resolve, reject) => {
    const request = store.put(imageData)
    
    request.onsuccess = () => {
      updateCacheSize(blob.size)
      resolve(imageData)
    }
    
    request.onerror = () => {
      reject(request.error)
    }
  })
}

/**
 * Get image from IndexedDB
 */
async function getStoredImage(url) {
  const db = await openImageDb()
  const transaction = db.transaction([IMAGE_STORE_NAME], 'readonly')
  const store = transaction.objectStore(IMAGE_STORE_NAME)

  return new Promise((resolve, reject) => {
    const request = store.get(url)
    
    request.onsuccess = () => {
      resolve(request.result)
    }
    
    request.onerror = () => {
      reject(request.error)
    }
  })
}

/**
 * Load image with caching
 * Returns a blob URL that can be used in img src
 */
export async function loadImage(url, campId) {
  if (!url) return null

  try {
    // Check if image is already cached
    const cached = await getStoredImage(url)
    if (cached && cached.blob) {
      // Return blob URL for cached image
      return URL.createObjectURL(cached.blob)
    }

    // Not cached, fetch from network
    const blob = await fetchImageAsBlob(url)
    
    // Check cache size before storing
    const currentSize = await getCacheSize()
    if (currentSize + blob.size <= MAX_CACHE_SIZE) {
      // Store in cache for offline use
      await storeImage(url, campId, blob)
    }

    // Return blob URL
    return URL.createObjectURL(blob)
  } catch (error) {
    console.error('Error loading image:', error)
    return null
  }
}

/**
 * Preload images for a camp
 */
export async function preloadCampImages(camp) {
  if (!camp.images || !Array.isArray(camp.images)) return []

  const results = []
  for (const image of camp.images) {
    if (image.thumbnail_url) {
      try {
        const blobUrl = await loadImage(image.thumbnail_url, camp.uid)
        results.push({ ...image, blobUrl })
      } catch (error) {
        console.error(`Failed to preload image for camp ${camp.uid}:`, error)
        results.push({ ...image, error: true })
      }
    }
  }
  return results
}

/**
 * Clear image cache
 */
export async function clearImageCache() {
  const db = await openImageDb()
  const transaction = db.transaction([IMAGE_STORE_NAME], 'readwrite')
  const store = transaction.objectStore(IMAGE_STORE_NAME)

  return new Promise((resolve, reject) => {
    const request = store.clear()
    
    request.onsuccess = () => {
      localStorage.setItem(CACHE_KEY, '0')
      resolve()
    }
    
    request.onerror = () => {
      reject(request.error)
    }
  })
}

/**
 * Get cache statistics
 */
export async function getCacheStats() {
  const db = await openImageDb()
  const transaction = db.transaction([IMAGE_STORE_NAME], 'readonly')
  const store = transaction.objectStore(IMAGE_STORE_NAME)

  return new Promise((resolve, reject) => {
    const countRequest = store.count()
    
    countRequest.onsuccess = () => {
      resolve({
        count: countRequest.result,
        size: getCacheSize(),
        maxSize: MAX_CACHE_SIZE
      })
    }
    
    countRequest.onerror = () => {
      reject(countRequest.error)
    }
  })
}

/**
 * Remove old images (LRU cache management)
 */
export async function pruneImageCache(maxAge = 30 * 24 * 60 * 60 * 1000) { // 30 days
  const db = await openImageDb()
  const transaction = db.transaction([IMAGE_STORE_NAME], 'readwrite')
  const store = transaction.objectStore(IMAGE_STORE_NAME)
  const index = store.index('timestamp')
  
  const cutoffTime = Date.now() - maxAge
  const range = IDBKeyRange.upperBound(cutoffTime)
  
  return new Promise((resolve, reject) => {
    let deletedCount = 0
    let deletedSize = 0
    
    const cursorRequest = index.openCursor(range)
    
    cursorRequest.onsuccess = (event) => {
      const cursor = event.target.result
      if (cursor) {
        deletedSize += cursor.value.size || 0
        store.delete(cursor.value.url)
        deletedCount++
        cursor.continue()
      } else {
        // Update cache size
        updateCacheSize(-deletedSize)
        resolve({ deletedCount, deletedSize })
      }
    }
    
    cursorRequest.onerror = () => {
      reject(cursorRequest.error)
    }
  })
}

/**
 * Check if image is cached
 */
export async function isImageCached(url) {
  const cached = await getStoredImage(url)
  return !!cached
}

/**
 * Get all cached images for a camp
 */
export async function getCampImages(campId) {
  const db = await openImageDb()
  const transaction = db.transaction([IMAGE_STORE_NAME], 'readonly')
  const store = transaction.objectStore(IMAGE_STORE_NAME)
  const index = store.index('campId')

  return new Promise((resolve, reject) => {
    const request = index.getAll(campId)
    
    request.onsuccess = () => {
      const images = request.result.map(img => ({
        url: img.url,
        blobUrl: URL.createObjectURL(img.blob),
        type: img.type,
        cached: true
      }))
      resolve(images)
    }
    
    request.onerror = () => {
      reject(request.error)
    }
  })
}