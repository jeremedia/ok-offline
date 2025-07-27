import { saveToCache, getFromCache } from './storage'
import { syncType, getSyncMetadata } from './staticDataSync'

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
      onError: () => {}
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
   * Downloads all years (2023, 2024, 2025) with current year prioritized
   * Priority: Current year camps first, then all other data
   */
  async syncWithPriority(currentYear) {
    if (this.isActive) {
      throw new Error('Sync already in progress')
    }

    this.isActive = true
    const years = ['2023', '2024', '2025']
    const types = ['camp', 'art', 'event']
    
    // Calculate total steps: current year (3 types) + other years (6 types) + processing (3 stages)
    this.progress.total = 12 // 9 sync stages + 3 processing stages
    this.progress.current = 0

    const results = {}

    try {
      // Stage 1: Sync current year essential data first (camps for navigation)
      await this.syncStage('camp', currentYear, `${currentYear} Camps (Essential for navigation)`, 'high')
      results[`camp_${currentYear}`] = { success: true, priority: 'high' }
      this.callbacks.onStageChange('camps_ready', `${currentYear} camps ready - you can start exploring!`)

      // Stage 2: Sync current year art and events
      for (const type of ['art', 'event']) {
        await this.syncStage(type, currentYear, `${currentYear} ${type}s`, 'medium')
        results[`${type}_${currentYear}`] = { success: true, priority: 'medium' }
        this.callbacks.onStageChange(`${type}_complete`, `${currentYear} ${type} data ready`)
      }

      // Stage 3: Sync other years in background
      for (const year of years) {
        if (year === currentYear) continue // Already synced
        
        for (const type of types) {
          try {
            await this.syncStage(type, year, `${year} ${type}s`, 'low')
            results[`${type}_${year}`] = { success: true, priority: 'low' }
          } catch (error) {
            console.warn(`Failed to sync ${type} for ${year}:`, error)
            results[`${type}_${year}`] = { success: false, error: error.message }
          }
        }
      }

      // Stage 4: Enrich and optimize data for all years
      for (const year of years) {
        await this.enrichmentStage(year)
      }

      // Stage 5: Final optimizations
      await this.optimizationStage(currentYear)

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
    this.updateProgress('Enhancing data relationships...', this.progress.current, this.progress.total)
    
    try {
      // Get all cached data
      const [camps, art, events] = await Promise.all([
        getFromCache('camp', year),
        getFromCache('art', year),
        getFromCache('event', year)
      ])

      // Create efficient lookup maps
      const campMap = new Map(camps.map(camp => [camp.uid, camp]))
      const artMap = new Map(art.map(piece => [piece.uid, piece]))

      // Enrich events with location data
      let enrichedCount = 0
      const enrichedEvents = events.map(event => {
        if (event.hosted_by_camp && campMap.has(event.hosted_by_camp)) {
          const camp = campMap.get(event.hosted_by_camp)
          enrichedCount++
          return {
            ...event,
            camp_name: camp.name,
            enriched_location: camp.location_string
          }
        }
        
        if (event.hosted_by_art && artMap.has(event.hosted_by_art)) {
          const artPiece = artMap.get(event.hosted_by_art)
          enrichedCount++
          return {
            ...event,
            art_name: artPiece.name,
            enriched_location: artPiece.location_string
          }
        }
        
        return event
      })

      // Save enriched data
      await saveToCache('event', year, enrichedEvents)
      
      this.progress.current++
      this.updateProgress(`Enhanced ${enrichedCount} event locations`, this.progress.current, this.progress.total)
      
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