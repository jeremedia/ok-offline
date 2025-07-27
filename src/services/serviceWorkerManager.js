/**
 * Service Worker Manager
 * Provides interface for communicating with the enhanced service worker
 */

class ServiceWorkerManager {
  constructor() {
    this.registration = null
    this.isSupported = 'serviceWorker' in navigator
  }

  /**
   * Initialize service worker registration
   */
  async init() {
    if (!this.isSupported) {
      console.warn('Service Worker not supported')
      return false
    }

    try {
      this.registration = await navigator.serviceWorker.ready
      console.log('Service Worker ready')
      return true
    } catch (error) {
      console.error('Service Worker initialization failed:', error)
      return false
    }
  }

  /**
   * Pre-cache data files for faster onboarding
   * @param {string} year - Year to cache data for
   */
  async preCacheDataForYear(year) {
    if (!this.registration) return

    const dataFiles = [
      `/data/${year}/camps.json`,
      `/data/${year}/art.json`,
      `/data/${year}/events.json`
    ]

    await this.sendMessage({
      type: 'CACHE_DATA',
      data: dataFiles
    })

    console.log(`Pre-cached data for ${year}`)
  }

  /**
   * Clear specific cache
   * @param {string} cacheType - Type of cache to clear ('data', 'api', 'images', 'static')
   */
  async clearCache(cacheType) {
    if (!this.registration) return

    await this.sendMessage({
      type: 'CLEAR_CACHE',
      data: cacheType
    })

    console.log(`Cleared ${cacheType} cache`)
  }

  /**
   * Get cache status and sizes
   */
  async getCacheStatus() {
    if (!('storage' in navigator) || !('estimate' in navigator.storage)) {
      return { supported: false }
    }

    try {
      const estimate = await navigator.storage.estimate()
      const cacheNames = await caches.keys()
      
      const cacheDetails = await Promise.all(
        cacheNames.map(async name => {
          const cache = await caches.open(name)
          const keys = await cache.keys()
          return {
            name,
            entries: keys.length,
            urls: keys.map(req => req.url)
          }
        })
      )

      return {
        supported: true,
        quota: estimate.quota,
        usage: estimate.usage,
        usagePercent: Math.round((estimate.usage / estimate.quota) * 100),
        caches: cacheDetails
      }
    } catch (error) {
      console.error('Failed to get cache status:', error)
      return { supported: false, error: error.message }
    }
  }

  /**
   * Check if app can work offline
   */
  async checkOfflineCapability() {
    const cacheStatus = await this.getCacheStatus()
    
    if (!cacheStatus.supported) {
      return { ready: false, reason: 'Cache not supported' }
    }

    // Check for essential caches
    const hasStaticCache = cacheStatus.caches.some(cache => 
      cache.name.includes('static') && cache.entries > 0
    )
    
    const hasDataCache = cacheStatus.caches.some(cache => 
      cache.name.includes('data') && cache.entries > 0
    )

    if (!hasStaticCache) {
      return { ready: false, reason: 'App files not cached' }
    }

    if (!hasDataCache) {
      return { ready: false, reason: 'No data cached - sync required' }
    }

    return { 
      ready: true, 
      cacheCount: cacheStatus.caches.length,
      totalEntries: cacheStatus.caches.reduce((sum, cache) => sum + cache.entries, 0)
    }
  }

  /**
   * Optimize caches for current usage
   * @param {string} currentYear - Current year being used
   */
  async optimizeCaches(currentYear) {
    if (!this.registration) return

    try {
      // Get all cache names
      const cacheNames = await caches.keys()
      
      // Find old data caches for other years
      const currentYearPattern = `/data/${currentYear}/`
      const dataCache = cacheNames.find(name => name.includes('data'))
      
      if (dataCache) {
        const cache = await caches.open(dataCache)
        const requests = await cache.keys()
        
        // Remove data for years not currently in use
        const outdatedRequests = requests.filter(req => 
          req.url.includes('/data/') && !req.url.includes(currentYearPattern)
        )
        
        await Promise.all(
          outdatedRequests.map(req => cache.delete(req))
        )
        
        if (outdatedRequests.length > 0) {
          console.log(`Removed ${outdatedRequests.length} outdated data files`)
        }
      }
    } catch (error) {
      console.error('Cache optimization failed:', error)
    }
  }

  /**
   * Send message to service worker
   * @param {Object} message - Message to send
   */
  async sendMessage(message) {
    if (!this.registration || !this.registration.active) {
      throw new Error('Service Worker not active')
    }

    return new Promise((resolve, reject) => {
      const messageChannel = new MessageChannel()
      
      messageChannel.port1.onmessage = event => {
        if (event.data.error) {
          reject(new Error(event.data.error))
        } else {
          resolve(event.data)
        }
      }

      this.registration.active.postMessage(message, [messageChannel.port2])
      
      // Timeout after 5 seconds
      setTimeout(() => {
        reject(new Error('Service Worker message timeout'))
      }, 5000)
    })
  }

  /**
   * Register for background sync when network returns
   * @param {string} tag - Sync tag
   */
  async registerBackgroundSync(tag) {
    if (!this.registration || !('sync' in window.ServiceWorkerRegistration.prototype)) {
      console.warn('Background Sync not supported')
      return false
    }

    try {
      await this.registration.sync.register(tag)
      console.log(`Registered background sync: ${tag}`)
      return true
    } catch (error) {
      console.error('Failed to register background sync:', error)
      return false
    }
  }

  /**
   * Request persistent storage
   */
  async requestPersistentStorage() {
    if (!('storage' in navigator) || !('persist' in navigator.storage)) {
      return { supported: false }
    }

    try {
      const persistent = await navigator.storage.persist()
      return { 
        supported: true, 
        granted: persistent,
        message: persistent ? 'Storage will persist' : 'Storage may be cleared when space is low'
      }
    } catch (error) {
      return { supported: false, error: error.message }
    }
  }

  /**
   * Update service worker to latest version
   */
  async updateServiceWorker() {
    if (!this.registration) return false

    try {
      await this.registration.update()
      
      // If there's a waiting worker, activate it
      if (this.registration.waiting) {
        await this.sendMessage({ type: 'SKIP_WAITING' })
        return true
      }
      
      return false
    } catch (error) {
      console.error('Service Worker update failed:', error)
      return false
    }
  }
}

// Create and export singleton instance
export const serviceWorkerManager = new ServiceWorkerManager()

// Convenience functions
export async function initServiceWorker() {
  return await serviceWorkerManager.init()
}

export async function preCacheData(year) {
  return await serviceWorkerManager.preCacheDataForYear(year)
}

export async function checkOfflineReady() {
  return await serviceWorkerManager.checkOfflineCapability()
}

export async function optimizeForCurrentYear(year) {
  return await serviceWorkerManager.optimizeCaches(year)
}

export async function getCacheInfo() {
  return await serviceWorkerManager.getCacheStatus()
}