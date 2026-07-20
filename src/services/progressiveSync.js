import { getFromCache } from './storage'
import { syncType, getSyncMetadata } from './staticDataSync'
import tileDownloader from './tileDownloader'

/**
 * Progressive sync service that prioritizes essential data first
 * and provides fine-grained progress feedback
 */

export class ProgressiveSync {
  constructor() {
    this.isActive = false
    this.currentStep = null
    this.progress = {
      current: 0,
      total: 0,
      percentage: 0,
      stage: '',
      details: ''
    }
    this.callbacks = {
      onProgress: () => {},
      onStageChange: () => {},
      onComplete: () => {},
      onError: () => {},
      onCountUpdate: () => {}
    }
  }

  /**
   * Set progress callbacks
   */
  setCallbacks(callbacks) {
    this.callbacks = { ...this.callbacks, ...callbacks }
  }

  /**
   * Sync data with prioritized loading strategy
   * Downloads the selected season. Historical seasons remain available through
   * the year selector and are cached only when the user selects/syncs them.
   */
  async syncWithPriority(currentYear) {
    if (this.isActive) {
      throw new Error('Sync already in progress')
    }

    this.isActive = true
    const years = [String(currentYear)]
    const types = ['camp', 'art', 'event']
    
    this.progress.total = types.length + 3
    this.progress.current = 0

    const results = {}

    try {
      // Stage 1 & 2: Sync current year data (camps, art, events)
      // Emit start event for current year
      this.callbacks.onStageChange(`${currentYear}_start`, `Starting ${currentYear} data download`)
      
      let currentYearCount = 0
      for (const type of types) {
        const priority = type === 'camp' ? 'high' : 'medium'
        const result = await this.syncStage(type, currentYear, `${currentYear} ${type}s`, priority)
        results[`${type}_${currentYear}`] = { success: true, priority: priority, count: result.count }
        currentYearCount += result.count
        
        // Emit count update with both individual type count and total
        this.callbacks.onCountUpdate(String(currentYear), currentYearCount, type, result.count)
        
        // Emit completion event in same format as other years
        this.callbacks.onStageChange(`${type}_${currentYear}_complete`, `${currentYear} ${type} data ready`)
        
        // Special event for camps ready
        if (type === 'camp') {
          this.callbacks.onStageChange('camps_ready', `${currentYear} camps ready - you can start exploring!`)
        }
      }
      
      // Emit completion for the entire year
      this.callbacks.onStageChange(`${currentYear}_complete`, `${currentYear} data complete`)

      // The published event snapshot is already safely enriched server-side.
      for (const year of years) {
        await this.enrichmentStage(year)
      }

      // Stage 5: Final optimizations
      await this.optimizationStage(currentYear)

      // Stage 6: Download map tiles for offline use
      await this.tileDownloadStage()

      this.progress.percentage = 100
      this.callbacks.onComplete(results)
      
      return results
    } catch (error) {
      this.callbacks.onError(error)
      throw error
    } finally {
      this.isActive = false
    }
  }

  /**
   * Quick sync for returning users - only sync missing or stale data
   */
  async quickSync(year) {
    const staleness = 24 * 60 * 60 * 1000 // 24 hours in ms
    const now = Date.now()
    const results = {}

    this.updateProgress('Checking for updates...', 0, 3)

    for (const type of ['camp', 'art', 'event']) {
      const metadata = getSyncMetadata(type, year)
      
      if (!metadata || (now - new Date(metadata.lastSync).getTime()) > staleness) {
        this.updateProgress(`Updating ${type}s...`, results.length, 3)
        try {
          results[type] = await syncType(type, year)
        } catch (error) {
          console.warn(`Failed to update ${type}s:`, error.message)
          results[type] = { success: false, error: error.message }
        }
      } else {
        results[type] = { success: true, cached: true }
      }
    }

    this.updateProgress('Updates complete', 3, 3)
    return results
  }

  /**
   * Sync a single stage with detailed progress
   */
  async syncStage(type, year, description, priority) {
    this.updateProgress(`Downloading ${description}...`, this.progress.current, this.progress.total)
    
    try {
      const result = await syncType(type, year)
      
      this.progress.current++
      this.updateProgress(`Processed ${result.count} ${type}s`, this.progress.current, this.progress.total)
      
      // Emit intermediate progress for high-priority items
      if (priority === 'high') {
        this.callbacks.onStageChange(`${type}_complete`, `${description} ready for use`)
      }
      
      return result
    } catch (error) {
      this.progress.current++
      throw new Error(`Failed to sync ${type}: ${error.message}`)
    }
  }

  /**
   * Enrichment stage - enhance data relationships
   */
  async enrichmentStage(year) {
    this.updateProgress('Validating published relationships...', this.progress.current, this.progress.total)
    
    // Notify when enrichment starts
    this.callbacks.onStageChange('enrichment_start', 'Validating published relationships')
    
    try {
      const events = await getFromCache('event', year)
      const enrichedCount = events.filter(event => event.enriched_location).length
      
      this.progress.current++
      this.updateProgress(`Validated ${enrichedCount} published event locations`, this.progress.current, this.progress.total)
      
    } catch (error) {
      this.progress.current++
      console.warn('Enrichment failed, continuing:', error.message)
    }
  }

  /**
   * Optimization stage - prepare data for best performance
   */
  async optimizationStage(year) {
    this.updateProgress('Optimizing for offline use...', this.progress.current, this.progress.total)
    
    // Notify when optimization starts
    this.callbacks.onStageChange('optimization_start', 'Optimizing for offline use')
    
    try {
      // Pre-compute commonly used derived data
      const camps = await getFromCache('camp', year)
      const art = await getFromCache('art', year)
      
      // Create search indexes for faster searching
      const searchIndex = {
        camps: camps.map(camp => ({
          uid: camp.uid,
          searchText: `${camp.name} ${camp.description || ''} ${camp.hometown || ''}`.toLowerCase()
        })),
        art: art.map(piece => ({
          uid: piece.uid,
          searchText: `${piece.name} ${piece.description || ''} ${piece.artist || ''}`.toLowerCase()
        }))
      }
      
      // Cache search index
      localStorage.setItem(`search_index_${year}`, JSON.stringify(searchIndex))
      
      this.progress.current++
      this.updateProgress('Ready for offline use!', this.progress.current, this.progress.total)
      
    } catch (error) {
      this.progress.current++
      console.warn('Optimization failed, continuing:', error.message)
    }
  }

  /**
   * Tile download stage - download map tiles for offline use
   */
  async tileDownloadStage() {
    this.updateProgress('Preparing offline maps...', this.progress.current, this.progress.total)
    
    try {
      // Check if tiles are already downloaded
      const tilesAlreadyDownloaded = await tileDownloader.areTilesDownloaded()
      
      if (tilesAlreadyDownloaded) {
        this.progress.current++
        this.updateProgress('Map tiles already cached', this.progress.current, this.progress.total)
        this.callbacks.onStageChange('tiles_ready', 'Offline maps ready for use')
        return
      }
      
      // Always download tiles if they're missing
      // console.log('[ProgressiveSync] Tiles not found, will download them')
      
      this.callbacks.onStageChange('tiles_downloading', 'Downloading map tiles for offline use...')
      
      // Download tiles with progress tracking
      let lastReportedPercentage = 0
      await tileDownloader.downloadAllTiles((downloaded, total, percentage) => {
        // Only update progress every 5% to avoid too many updates
        if (percentage - lastReportedPercentage >= 5 || percentage === 100) {
          lastReportedPercentage = percentage
          
          // Different messages for ZIP download vs extraction
          let details
          if (percentage <= 50) {
            details = `Downloading map package: ${percentage * 2}%`
          } else {
            const extractPercent = (percentage - 50) * 2
            details = `Extracting map tiles: ${extractPercent}%`
          }
          
          // Keep the current stage progress, but update the details
          this.updateProgress(details, this.progress.current, this.progress.total)
        }
      })
      
      this.progress.current++
      this.updateProgress('Map tiles cached successfully!', this.progress.current, this.progress.total)
      this.callbacks.onStageChange('tiles_ready', 'Offline maps downloaded and ready')
      
    } catch (error) {
      console.error('Failed to download tiles:', error)
      this.progress.current++
      this.updateProgress('Map tiles download failed (can retry in settings)', this.progress.current, this.progress.total)
      this.callbacks.onStageChange('tiles_error', 'Map tiles failed - you can download them later in Settings')
    }
  }
  

  /**
   * Update progress and notify callbacks
   */
  updateProgress(details, current, total) {
    this.progress.current = current
    this.progress.total = total
    this.progress.percentage = Math.round((current / total) * 100)
    this.progress.details = details
    
    this.callbacks.onProgress(this.progress)
  }

  /**
   * Check what data exists and determine sync strategy
   */
  async assessDataStatus(year) {
    const status = {
      hasAnyData: false,
      hasEssentialData: false,
      isComplete: false,
      recommendations: []
    }

    const dataTypes = ['camp', 'art', 'event']
    const dataCounts = {}

    for (const type of dataTypes) {
      const cached = await getFromCache(type, year)
      const metadata = getSyncMetadata(type, year)
      
      dataCounts[type] = {
        count: cached?.length || 0,
        hasData: cached && cached.length > 0,
        lastSync: metadata?.lastSync
      }
    }

    // Assess overall status
    status.hasAnyData = Object.values(dataCounts).some(d => d.hasData)
    status.hasEssentialData = dataCounts.camp.hasData // Camps are essential
    status.isComplete = Object.values(dataCounts).every(d => d.hasData)

    // Generate recommendations
    if (!status.hasAnyData) {
      status.recommendations.push('full_sync')
    } else if (!status.hasEssentialData) {
      status.recommendations.push('sync_camps')
    } else if (!status.isComplete) {
      status.recommendations.push('sync_remaining')
    } else {
      status.recommendations.push('quick_sync')
    }

    return { status, dataCounts }
  }

  /**
   * Get current progress
   */
  getProgress() {
    return { ...this.progress }
  }

  /**
   * Cancel active sync
   */
  cancel() {
    this.isActive = false
    this.currentStep = null
  }
}

// Export singleton instance
export const progressiveSync = new ProgressiveSync()

// Convenience functions
export async function smartSync(year, callbacks = {}) {
  progressiveSync.setCallbacks(callbacks)
  
  const { status } = await progressiveSync.assessDataStatus(year)
  
  if (status.hasEssentialData) {
    return await progressiveSync.quickSync(year)
  } else {
    return await progressiveSync.syncWithPriority(year)
  }
}

export async function getDataStatus(year) {
  return await progressiveSync.assessDataStatus(year)
}
