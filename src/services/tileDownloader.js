import L from 'leaflet'
import 'leaflet.offline'

// Black Rock City bounding box from trash fence coordinates
const BRC_BOUNDS = {
  north: 40.807,
  south: 40.764,
  east: -119.176,
  west: -119.233
}

// Zoom levels to download (12-17 for city overview to detailed street view)
const ZOOM_LEVELS = {
  min: 12,
  max: 17
}

// Tile server URL template
const TILE_URL_TEMPLATE = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'

// Database version - bump this to force upgrade
const DB_VERSION = 3

class TileDownloader {
  constructor() {
    this.downloadProgress = null
    this.isDownloading = false
    this.totalTiles = 0
    this.downloadedTiles = 0
    // console.log('[TileDownloader] Service initialized')
  }

  /**
   * Calculate total number of tiles needed for BRC area
   */
  calculateTileCount() {
    const bounds = L.latLngBounds(
      [BRC_BOUNDS.south, BRC_BOUNDS.west],
      [BRC_BOUNDS.north, BRC_BOUNDS.east]
    )
    
    let totalTiles = 0
    for (let zoom = ZOOM_LEVELS.min; zoom <= ZOOM_LEVELS.max; zoom++) {
      const tileCount = this.getTileCountForBounds(bounds, zoom)
      totalTiles += tileCount
    }
    
    return totalTiles
  }
  
  /**
   * Calculate number of tiles for bounds at zoom level
   */
  getTileCountForBounds(bounds, zoom) {
    const min = bounds.getSouthWest()
    const max = bounds.getNorthEast()
    
    const minTilePoint = this.latLngToTilePoint(min.lat, min.lng, zoom)
    const maxTilePoint = this.latLngToTilePoint(max.lat, max.lng, zoom)
    
    const width = Math.abs(maxTilePoint.x - minTilePoint.x) + 1
    const height = Math.abs(maxTilePoint.y - minTilePoint.y) + 1
    
    return width * height
  }
  
  /**
   * Convert lat/lng to tile coordinates
   */
  latLngToTilePoint(lat, lng, zoom) {
    const x = Math.floor((lng + 180) / 360 * Math.pow(2, zoom))
    const y = Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom))
    return { x, y }
  }

  /**
   * Check if tiles are already downloaded
   */
  async areTilesDownloaded() {
    // console.log('[TileDownloader] Checking if tiles are already downloaded...')
    try {
      const tileCount = await this.getStoredTileCount()
      const requiredTileCount = this.calculateTileCount()
      
      // console.log(`[TileDownloader] Stored tiles: ${tileCount}, Required: ${requiredTileCount}`)
      
      // Check if we have a reasonable percentage of tiles
      // Allow for some missing tiles due to failed downloads
      const hasEnoughTiles = tileCount >= (requiredTileCount * 0.9)
      // console.log(`[TileDownloader] Has enough tiles: ${hasEnoughTiles}`)
      
      return hasEnoughTiles
    } catch (error) {
      console.error('[TileDownloader] Error checking tile storage:', error)
      return false
    }
  }
  
  /**
   * Get count of stored tiles
   */
  async getStoredTileCount() {
    return new Promise((resolve) => {
      const request = indexedDB.open('leaflet.offline', DB_VERSION)
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result
        if (!db.objectStoreNames.contains('tileStore')) {
          db.createObjectStore('tileStore', { keyPath: 'key' })
        }
      }
      
      request.onsuccess = (event) => {
        const db = event.target.result
        if (!db.objectStoreNames.contains('tileStore')) {
          resolve(0)
          return
        }
        
        const transaction = db.transaction(['tileStore'], 'readonly')
        const objectStore = transaction.objectStore('tileStore')
        const countRequest = objectStore.count()
        
        countRequest.onsuccess = () => {
          const count = countRequest.result
          db.close()
          resolve(count)
        }
        
        countRequest.onerror = () => {
          db.close()
          resolve(0)
        }
      }
      
      request.onerror = () => {
        resolve(0)
      }
    })
  }

  /**
   * Download all tiles for BRC area
   * @param {Function} progressCallback - Called with (downloaded, total, percentage)
   */
  async downloadAllTiles(progressCallback = null) {
    // console.log('[TileDownloader] downloadAllTiles called')
    
    if (this.isDownloading) {
      // console.log('[TileDownloader] Download already in progress')
      return
    }

    this.isDownloading = true
    this.downloadedTiles = 0
    
    try {
      // Initialize database first
      await this.initializeDatabase()
      
      const bounds = L.latLngBounds(
        [BRC_BOUNDS.south, BRC_BOUNDS.west],
        [BRC_BOUNDS.north, BRC_BOUNDS.east]
      )

      // Collect all tile URLs
      const allTileUrls = []
      for (let zoom = ZOOM_LEVELS.min; zoom <= ZOOM_LEVELS.max; zoom++) {
        const tiles = this.getTileUrlsForBounds(bounds, zoom)
        allTileUrls.push(...tiles)
      }
      
      // Now download all the tiles
      return await this.downloadAllTilesImpl(allTileUrls, progressCallback)
    } catch (error) {
      console.error('[TileDownloader] Download error:', error)
      this.isDownloading = false
      throw error
    }
  }
  
  /**
   * Get tile URLs for bounds at zoom level
   */
  getTileUrlsForBounds(bounds, zoom) {
    const urls = []
    const min = bounds.getSouthWest()
    const max = bounds.getNorthEast()
    
    const minTile = this.latLngToTilePoint(min.lat, min.lng, zoom)
    const maxTile = this.latLngToTilePoint(max.lat, max.lng, zoom)
    
    for (let x = minTile.x; x <= maxTile.x; x++) {
      for (let y = maxTile.y; y <= minTile.y; y++) {
        const subdomains = ['a', 'b', 'c']
        const s = subdomains[Math.abs(x + y) % subdomains.length]
        const url = TILE_URL_TEMPLATE
          .replace('{s}', s)
          .replace('{z}', zoom)
          .replace('{x}', x)
          .replace('{y}', y)
        
        urls.push({
          url,
          key: `${zoom}-${x}-${y}`,
          z: zoom,
          x,
          y
        })
      }
    }
    
    return urls
  }
  
  /**
   * Download all tiles implementation
   */
  async downloadAllTilesImpl(allTileUrls, progressCallback) {
    this.totalTiles = allTileUrls.length
    // console.log(`[TileDownloader] Starting download of ${this.totalTiles} tiles for Black Rock City`)

    // Download tiles in batches to avoid overwhelming the browser
    const BATCH_SIZE = 10
    const batches = []
    
    for (let i = 0; i < allTileUrls.length; i += BATCH_SIZE) {
      batches.push(allTileUrls.slice(i, i + BATCH_SIZE))
    }

    try {
      for (const batch of batches) {
        await Promise.all(
          batch.map(async (tileInfo) => {
            try {
              await this.downloadAndStoreTile(tileInfo)
              this.downloadedTiles++
              
              const percentage = Math.round((this.downloadedTiles / this.totalTiles) * 100)
              // console.log(`[TileDownloader] Progress: ${this.downloadedTiles}/${this.totalTiles} (${percentage}%)`)
              
              if (progressCallback) {
                progressCallback(this.downloadedTiles, this.totalTiles, percentage)
              }
            } catch (error) {
              console.error(`Failed to download tile: ${tileInfo.url}`, error)
              // Continue with other tiles even if one fails
            }
          })
        )
        
        // Small delay between batches to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100))
      }

      // console.log(`[TileDownloader] Completed downloading ${this.downloadedTiles} of ${this.totalTiles} tiles`)
      
    } catch (error) {
      console.error('Error during tile download:', error)
    } finally {
      this.isDownloading = false
    }

    return {
      success: this.downloadedTiles > 0,
      downloaded: this.downloadedTiles,
      total: this.totalTiles,
      percentage: Math.round((this.downloadedTiles / this.totalTiles) * 100)
    }
  }

  /**
   * Download and store a single tile
   */
  async downloadAndStoreTile(tileInfo) {
    const response = await fetch(tileInfo.url, {
      mode: 'cors',
      credentials: 'omit'
    })
    
    if (!response.ok) {
      throw new Error(`Failed to fetch tile: ${response.status}`)
    }
    
    const blob = await response.blob()
    
    return new Promise((resolve, reject) => {
      // console.log('[TileDownloader] Opening IndexedDB for tile storage')
      const request = indexedDB.open('leaflet.offline', DB_VERSION)
      
      request.onupgradeneeded = (event) => {
        // console.log('[TileDownloader] Database upgrade needed in downloadAndStoreTile')
        // console.log('[TileDownloader] Old version:', event.oldVersion, 'New version:', event.newVersion)
        const db = event.target.result
        if (!db.objectStoreNames.contains('tileStore')) {
          // console.log('[TileDownloader] Creating tileStore object store')
          db.createObjectStore('tileStore', { keyPath: 'key' })
        } else {
          // console.log('[TileDownloader] tileStore already exists')
        }
      }
      
      request.onsuccess = (event) => {
        const db = event.target.result
        // console.log('[TileDownloader] Database opened for tile storage, version:', db.version)
        // console.log('[TileDownloader] Object stores:', Array.from(db.objectStoreNames))
        
        // Check if the object store exists
        if (!db.objectStoreNames.contains('tileStore')) {
          console.error('[TileDownloader] tileStore not found! Available stores:', Array.from(db.objectStoreNames))
          db.close()
          reject(new Error('tileStore object store not found'))
          return
        }
        
        const transaction = db.transaction(['tileStore'], 'readwrite')
        const objectStore = transaction.objectStore('tileStore')
        
        const tileData = {
          key: tileInfo.key,
          url: tileInfo.url,
          blob: blob,
          timestamp: Date.now()
        }
        
        const putRequest = objectStore.put(tileData)
        
        putRequest.onsuccess = () => {
          db.close()
          resolve()
        }
        
        putRequest.onerror = () => {
          db.close()
          reject(new Error('Failed to store tile'))
        }
        
        transaction.onerror = () => {
          db.close()
          reject(new Error('Transaction failed'))
        }
      }
      
      request.onerror = () => {
        reject(new Error('Failed to open IndexedDB'))
      }
    })
  }
  
  /**
   * Initialize the database properly
   */
  async initializeDatabase() {
    return new Promise((resolve, reject) => {
      // console.log('[TileDownloader] Initializing database')
      const request = indexedDB.open('leaflet.offline', DB_VERSION)
      
      request.onupgradeneeded = (event) => {
        // console.log('[TileDownloader] Database upgrade/creation needed')
        const db = event.target.result
        
        // Delete old object stores if they exist
        const objectStoreNames = Array.from(db.objectStoreNames)
        objectStoreNames.forEach(name => {
          if (name !== 'tileStore') {
            db.deleteObjectStore(name)
          }
        })
        
        // Create tileStore if it doesn't exist
        if (!db.objectStoreNames.contains('tileStore')) {
          // console.log('[TileDownloader] Creating tileStore object store')
          db.createObjectStore('tileStore', { keyPath: 'key' })
        }
      }
      
      request.onsuccess = (event) => {
        const db = event.target.result
        // console.log('[TileDownloader] Database initialized, version:', db.version)
        db.close()
        resolve()
      }
      
      request.onerror = (event) => {
        console.error('[TileDownloader] Database initialization error:', event)
        reject(new Error('Failed to initialize database'))
      }
    })
  }

  /**
   * Clear all downloaded tiles
   */
  async clearTiles() {
    try {
      const request = indexedDB.deleteDatabase('leaflet.offline')
      
      return new Promise((resolve) => {
        request.onsuccess = () => {
          // console.log('Tile database cleared')
          resolve(true)
        }
        
        request.onerror = () => {
          console.error('Failed to clear tile database')
          resolve(false)
        }
      })
    } catch (error) {
      console.error('Error clearing tiles:', error)
      return false
    }
  }

  /**
   * Get storage statistics
   */
  async getStorageStats() {
    try {
      const storedTiles = await this.getStoredTileCount()
      const requiredTileCount = this.calculateTileCount()
      
      return {
        storedTiles: storedTiles,
        requiredTiles: requiredTileCount,
        percentage: Math.round((storedTiles / requiredTileCount) * 100),
        estimatedSize: Math.round((storedTiles * 30) / 1024) // Estimate 30KB per tile, result in MB
      }
    } catch (error) {
      console.error('Error getting storage stats:', error)
      return {
        storedTiles: 0,
        requiredTiles: this.calculateTileCount(),
        percentage: 0,
        estimatedSize: 0
      }
    }
  }
}

export default new TileDownloader()