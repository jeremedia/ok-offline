import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { getFromCache } from '../services/storage'
import { syncYear, syncType } from '../services/staticDataSync'
import { useToast } from './useToast'

export function useAutoSync() {
  const router = useRouter()
  const { showInfo, showSuccess, showError } = useToast()
  const syncing = ref(false)
  const showSyncDialog = ref(false)
  
  /**
   * Check if data exists for the given type and year
   * If not, show dialog and auto-sync
   */
  const checkAndAutoSync = async (type, year) => {
    try {
      // Check if we have cached data
      const cachedItems = await getFromCache(type, year)
      
      if (!cachedItems || cachedItems.length === 0) {
        // No data found - show dialog and auto-sync
        showSyncDialog.value = true
        syncing.value = true
        
        showInfo(`No ${type} data found for ${year}. Syncing now...`)
        
        // Sync the specific type and year
        const result = await syncType(type, year)
        
        if (result.success) {
          showSuccess(`Synced ${result.count} ${type}s for ${year}`)
          showSyncDialog.value = false
          syncing.value = false
          
          // Reload the current route to refresh the data
          router.go(0)
        } else {
          throw new Error(result.error || 'Sync failed')
        }
      }
      
      return true
    } catch (error) {
      console.error('Auto-sync error:', error)
      showError(`Failed to sync ${type} data: ${error.message}`)
      syncing.value = false
      showSyncDialog.value = false
      
      // Redirect to settings as fallback
      router.push('/settings')
      return false
    }
  }
  
  /**
   * Check if any data exists at all
   * If not, sync all data for the default year
   */
  const checkAndAutoSyncAll = async (year = '2024') => {
    try {
      // Check if we have any data
      const camps = await getFromCache('camp', year)
      const art = await getFromCache('art', year)
      const events = await getFromCache('event', year)
      
      if ((!camps || camps.length === 0) && 
          (!art || art.length === 0) && 
          (!events || events.length === 0)) {
        // No data at all - sync everything
        showSyncDialog.value = true
        syncing.value = true
        
        showInfo(`Welcome! Syncing Burning Man ${year} data...`)
        
        const results = await syncYear(year)
        
        // Check if at least one type synced successfully
        const successCount = Object.values(results)
          .filter(r => r.success)
          .reduce((sum, r) => sum + r.count, 0)
        
        if (successCount > 0) {
          showSuccess(`Synced ${successCount} items total`)
          showSyncDialog.value = false
          syncing.value = false
          
          // Reload the current route
          router.go(0)
        } else {
          throw new Error('No data could be synced')
        }
      }
      
      return true
    } catch (error) {
      console.error('Auto-sync all error:', error)
      showError(`Failed to sync data: ${error.message}`)
      syncing.value = false
      showSyncDialog.value = false
      
      // Redirect to settings as fallback
      router.push('/settings')
      return false
    }
  }
  
  return {
    syncing,
    showSyncDialog,
    checkAndAutoSync,
    checkAndAutoSyncAll
  }
}