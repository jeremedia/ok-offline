/**
 * useCampEditor - Reactive Camp Management Composable
 * Provides comprehensive camp data management with change detection and batch operations
 */

import { ref, reactive, computed, readonly, watch } from 'vue'
import { 
  getThemeCamp, updateThemeCamp,
  updateTeamMember, addTeamMember, updateTeamMembers as updateTeamMembersApi,
  updatePersonalSpace, deletePersonalSpace,
  updateMapPlacement, addMapPlacement, deleteMapPlacement,
  batchUpdateMapPlacements
} from '@/services/campService'
import { useToast } from '@/composables/useToast'

/**
 * Change detection types
 */
const CHANGE_TYPES = {
  CAMP_INFO: 'camp_info',
  TEAM_MEMBER: 'team_member',
  PERSONAL_SPACE: 'personal_space',
  MAP_PLACEMENT: 'map_placement'
}

/**
 * Entity field definitions for change detection
 */
const ENTITY_FIELDS = {
  [CHANGE_TYPES.CAMP_INFO]: [
    'name', 'description', 'website', 'facebook', 'camp_type', 
    'expected_population', 'bm_address', 'is_active'
  ],
  [CHANGE_TYPES.TEAM_MEMBER]: [
    'first_name', 'last_name', 'playa_name', 'email', 'phone', 'role',
    'arrival_date', 'departure_date', 'emergency_contact_name', 'emergency_contact_phone',
    'dietary_restrictions', 'skills', 'is_verified'
  ],
  [CHANGE_TYPES.PERSONAL_SPACE]: [
    'space_type', 'width', 'depth', 'height', 'is_confirmed'
  ],
  [CHANGE_TYPES.MAP_PLACEMENT]: [
    'x_position', 'y_position', 'z_position', 'rotation',
    'width', 'depth', 'height', 'is_confirmed', 'gltf_model_id', 'assigned_to_id'
  ]
}

/**
 * Main composable function
 */
export function useCampEditor(campSlug) {
  const { showSuccess, showError } = useToast()
  
  // Core reactive state
  const campData = ref(null)
  const originalData = ref(null)
  const isLoading = ref(false)
  const isSaving = ref(false)
  const errors = reactive({
    camp: {},
    teamMembers: {},
    personalSpaces: {},
    mapPlacements: {}
  })
  
  // History for undo/redo
  const history = reactive({
    states: [],
    currentIndex: -1,
    maxStates: 20
  })
  
  // Computed properties
  const isDirty = computed(() => {
    if (!originalData.value || !campData.value) return false
    return JSON.stringify(originalData.value) !== JSON.stringify(campData.value)
  })
  
  const canUndo = computed(() => history.currentIndex > 0)
  const canRedo = computed(() => history.currentIndex < history.states.length - 1)
  
  // ================== Change Detection ==================
  
  /**
   * Detect changes in a specific entity type
   */
  const detectChanges = (entityType, original, current) => {
    const fields = ENTITY_FIELDS[entityType]
    if (!fields) return false
    
    return fields.some(field => {
      const origValue = original?.[field]
      const currValue = current?.[field]
      return JSON.stringify(origValue) !== JSON.stringify(currValue)
    })
  }
  
  /**
   * Get all changed entities with their change types
   */
  const getAllChanges = () => {
    if (!originalData.value || !campData.value) return []
    
    const changes = []
    
    // Camp info changes
    if (detectChanges(CHANGE_TYPES.CAMP_INFO, originalData.value, campData.value)) {
      changes.push({
        type: CHANGE_TYPES.CAMP_INFO,
        action: 'update',
        data: extractCampInfo(campData.value)
      })
    }
    
    // Team member changes
    const teamMemberChanges = detectTeamMemberChanges()
    changes.push(...teamMemberChanges)
    
    // Personal space changes
    const personalSpaceChanges = detectPersonalSpaceChanges()
    changes.push(...personalSpaceChanges)
    
    // Map placement changes
    const mapPlacementChanges = detectMapPlacementChanges()
    changes.push(...mapPlacementChanges)
    
    return changes
  }
  
  /**
   * Detect team member changes
   */
  const detectTeamMemberChanges = () => {
    const origMembers = originalData.value?.team_members || []
    const currMembers = campData.value?.team_members || []
    const changes = []
    
    // Check for updates
    currMembers.forEach(currMember => {
      const origMember = origMembers.find(m => m.id === currMember.id)
      
      if (origMember) {
        if (detectChanges(CHANGE_TYPES.TEAM_MEMBER, origMember, currMember)) {
          changes.push({
            type: CHANGE_TYPES.TEAM_MEMBER,
            action: 'update',
            id: currMember.id,
            data: currMember
          })
        }
      } else if (currMember.id?.toString().startsWith('new_')) {
        // New team member
        changes.push({
          type: CHANGE_TYPES.TEAM_MEMBER,
          action: 'create',
          data: currMember
        })
      }
    })
    
    // Check for deletions
    origMembers.forEach(origMember => {
      const stillExists = currMembers.some(m => m.id === origMember.id)
      if (!stillExists) {
        changes.push({
          type: CHANGE_TYPES.TEAM_MEMBER,
          action: 'delete',
          id: origMember.id
        })
      }
    })
    
    return changes
  }
  
  /**
   * Detect personal space changes (simplified for now)
   */
  const detectPersonalSpaceChanges = () => {
    // Personal spaces are nested in team members, so they're handled there
    return []
  }
  
  /**
   * Detect map placement changes
   */
  const detectMapPlacementChanges = () => {
    const origPlacements = originalData.value?.camp_map?.map_placements || []
    const currPlacements = campData.value?.camp_map?.map_placements || []
    const changes = []
    
    // Check for updates and creates
    currPlacements.forEach(currPlacement => {
      const origPlacement = origPlacements.find(p => p.id === currPlacement.id)
      
      if (origPlacement) {
        if (detectChanges(CHANGE_TYPES.MAP_PLACEMENT, origPlacement, currPlacement)) {
          changes.push({
            type: CHANGE_TYPES.MAP_PLACEMENT,
            action: 'update',
            id: currPlacement.id,
            data: currPlacement
          })
        }
      } else if (currPlacement.id?.toString().startsWith('new_')) {
        changes.push({
          type: CHANGE_TYPES.MAP_PLACEMENT,
          action: 'create',
          data: currPlacement
        })
      }
    })
    
    // Check for deletions
    origPlacements.forEach(origPlacement => {
      const stillExists = currPlacements.some(p => p.id === origPlacement.id)
      if (!stillExists) {
        changes.push({
          type: CHANGE_TYPES.MAP_PLACEMENT,
          action: 'delete',
          id: origPlacement.id
        })
      }
    })
    
    return changes
  }
  
  // ================== Data Management ==================
  
  /**
   * Load camp data
   */
  const loadCamp = async (useCache = true) => {
    if (!campSlug) return
    
    isLoading.value = true
    errors.camp = {}
    
    try {
      const data = await getThemeCamp(campSlug, useCache)
      campData.value = data
      originalData.value = JSON.parse(JSON.stringify(data))
      
      // Initialize history
      addToHistory(data)
      
    } catch (err) {
      errors.camp.load = err.message
      showError(`Failed to load camp data: ${err.message}`)
    } finally {
      isLoading.value = false
    }
  }
  
  /**
   * Extract camp info (excluding related entities)
   */
  const extractCampInfo = (data) => {
    const { team_members, camp_map, ...campInfo } = data
    return campInfo
  }
  
  /**
   * Save all changes with smart batching
   */
  const saveAll = async () => {
    if (!isDirty.value) {
      showError('No changes to save')
      return
    }
    
    isSaving.value = true
    const changes = getAllChanges()
    let savedCount = 0
    
    try {
      // Group changes by type for efficient processing
      const changesByType = changes.reduce((acc, change) => {
        if (!acc[change.type]) acc[change.type] = []
        acc[change.type].push(change)
        return acc
      }, {})
      
      // Execute saves in optimal order
      const savePromises = []
      
      // 1. Camp info first
      if (changesByType[CHANGE_TYPES.CAMP_INFO]) {
        const campChange = changesByType[CHANGE_TYPES.CAMP_INFO][0]
        savePromises.push(
          updateThemeCamp(campSlug, campChange.data).then(() => savedCount++)
        )
      }
      
      // 2. Team members in parallel
      if (changesByType[CHANGE_TYPES.TEAM_MEMBER]) {
        const teamMemberChanges = changesByType[CHANGE_TYPES.TEAM_MEMBER]
        const teamMemberPromises = teamMemberChanges.map(async change => {
          if (change.action === 'update') {
            await updateTeamMember(campSlug, change.id, change.data)
          } else if (change.action === 'create') {
            await addTeamMember(campSlug, change.data)
          }
          // TODO: Handle delete when implemented
          savedCount++
        })
        savePromises.push(...teamMemberPromises)
      }
      
      // 3. Map placements in parallel
      if (changesByType[CHANGE_TYPES.MAP_PLACEMENT]) {
        const placementChanges = changesByType[CHANGE_TYPES.MAP_PLACEMENT]
        const placementPromises = placementChanges.map(async change => {
          if (change.action === 'update') {
            await updateMapPlacement(campSlug, change.id, change.data)
          } else if (change.action === 'create') {
            await addMapPlacement(campSlug, change.data)
          } else if (change.action === 'delete') {
            await deleteMapPlacement(campSlug, change.id)
          }
          savedCount++
        })
        savePromises.push(...placementPromises)
      }
      
      // Execute all saves
      await Promise.all(savePromises)
      
      // CRITICAL: Reload fresh data from server after save
      // This ensures the UI shows the latest data and cache is properly refreshed
      // Use useCache=false to bypass cache and get latest server data
      await loadCamp(false)
      
      // Show success message
      const message = `${savedCount} change${savedCount !== 1 ? 's' : ''} saved successfully!`
      showSuccess(message)
      
    } catch (err) {
      showError(`Failed to save changes: ${err.message}`)
      throw err
    } finally {
      isSaving.value = false
    }
  }
  
  // ================== History Management ==================
  
  /**
   * Add state to history
   */
  const addToHistory = (state) => {
    // Remove any states after current index (when undoing then making new changes)
    history.states = history.states.slice(0, history.currentIndex + 1)
    
    // Add new state
    history.states.push(JSON.parse(JSON.stringify(state)))
    history.currentIndex++
    
    // Limit history size
    if (history.states.length > history.maxStates) {
      history.states = history.states.slice(-history.maxStates)
      history.currentIndex = history.states.length - 1
    }
  }
  
  /**
   * Undo last change
   */
  const undo = () => {
    if (!canUndo.value) return
    
    history.currentIndex--
    campData.value = JSON.parse(JSON.stringify(history.states[history.currentIndex]))
  }
  
  /**
   * Redo last undone change
   */
  const redo = () => {
    if (!canRedo.value) return
    
    history.currentIndex++
    campData.value = JSON.parse(JSON.stringify(history.states[history.currentIndex]))
  }
  
  // ================== Entity Helpers ==================
  
  /**
   * Add new team member
   */
  const addTeamMemberLocal = (memberData = {}) => {
    if (!campData.value) return
    
    const newMember = {
      id: `new_${Date.now()}`,
      first_name: '',
      last_name: '',
      playa_name: '',
      email: '',
      phone: '',
      role: 'veteran',
      arrival_date: '',
      departure_date: '',
      emergency_contact_name: '',
      emergency_contact_phone: '',
      dietary_restrictions: '',
      skills: '',
      is_verified: false,
      ...memberData
    }
    
    if (!campData.value.team_members) {
      campData.value.team_members = []
    }
    
    campData.value.team_members.push(newMember)
    addToHistory(campData.value)
    
    return newMember.id
  }
  
  /**
   * Remove team member
   */
  const removeTeamMember = (memberId) => {
    if (!campData.value?.team_members) return
    
    campData.value.team_members = campData.value.team_members.filter(
      member => member.id !== memberId
    )
    addToHistory(campData.value)
  }
  
  /**
   * Update team member data
   */
  const updateTeamMemberLocal = (memberId, updates) => {
    if (!campData.value?.team_members) return
    
    const memberIndex = campData.value.team_members.findIndex(m => m.id === memberId)
    if (memberIndex !== -1) {
      campData.value.team_members[memberIndex] = {
        ...campData.value.team_members[memberIndex],
        ...updates
      }
      addToHistory(campData.value)
    }
  }
  
  /**
   * Add map placement
   */
  const addMapPlacementLocal = (placementData = {}) => {
    if (!campData.value) return
    
    const newPlacement = {
      id: `new_${Date.now()}`,
      x_position: 0,
      y_position: 0,
      z_position: 0,
      rotation: 0,
      width: 10,
      depth: 10,
      height: 10,
      is_confirmed: false,
      gltf_model_id: null,
      assigned_to_id: null,
      ...placementData
    }
    
    if (!campData.value.camp_map) {
      campData.value.camp_map = { map_placements: [] }
    }
    if (!campData.value.camp_map.map_placements) {
      campData.value.camp_map.map_placements = []
    }
    
    campData.value.camp_map.map_placements.push(newPlacement)
    addToHistory(campData.value)
    
    return newPlacement.id
  }
  
  /**
   * Remove map placement
   */
  const removeMapPlacement = (placementId) => {
    if (!campData.value?.camp_map?.map_placements) return
    
    campData.value.camp_map.map_placements = campData.value.camp_map.map_placements.filter(
      placement => placement.id !== placementId
    )
    addToHistory(campData.value)
  }
  
  // ================== Validation ==================
  
  /**
   * Validate all data
   */
  const validate = () => {
    const validationErrors = {
      camp: {},
      teamMembers: {},
      personalSpaces: {},
      mapPlacements: {}
    }
    
    // Validate camp info
    if (!campData.value?.name?.trim()) {
      validationErrors.camp.name = 'Camp name is required'
    }
    
    // Validate team members
    if (campData.value?.team_members) {
      campData.value.team_members.forEach((member, index) => {
        const memberErrors = {}
        
        if (!member.first_name?.trim()) {
          memberErrors.first_name = 'First name is required'
        }
        if (!member.last_name?.trim()) {
          memberErrors.last_name = 'Last name is required'
        }
        if (!member.email?.trim()) {
          memberErrors.email = 'Email is required'
        } else if (!/\S+@\S+\.\S+/.test(member.email)) {
          memberErrors.email = 'Invalid email format'
        }
        
        if (Object.keys(memberErrors).length > 0) {
          validationErrors.teamMembers[member.id || index] = memberErrors
        }
      })
    }
    
    // Update errors
    Object.assign(errors, validationErrors)
    
    // Return true if no errors
    return Object.values(validationErrors).every(entityErrors => 
      Object.keys(entityErrors).length === 0
    )
  }
  
  /**
   * Clear all errors
   */
  const clearErrors = () => {
    errors.camp = {}
    errors.teamMembers = {}
    errors.personalSpaces = {}
    errors.mapPlacements = {}
  }
  
  // ================== Watchers ==================
  
  // Watch for changes and add to history
  watch(campData, (newData) => {
    if (newData && newData !== history.states[history.currentIndex]) {
      addToHistory(newData)
    }
  }, { deep: true })
  
  // ================== Public Interface ==================
  
  return {
    // Core state (readonly)
    campData: readonly(campData),
    originalData: readonly(originalData),
    
    // Status
    isLoading: readonly(isLoading),
    isSaving: readonly(isSaving),
    isDirty,
    
    // Errors
    errors: readonly(errors),
    
    // History
    canUndo,
    canRedo,
    
    // Core operations
    loadCamp,
    saveAll,
    validate,
    clearErrors,
    
    // History operations
    undo,
    redo,
    
    // Team member operations
    addTeamMember: addTeamMemberLocal,
    updateTeamMember: updateTeamMemberLocal,
    removeTeamMember,
    
    // Map placement operations
    addMapPlacement: addMapPlacementLocal,
    removeMapPlacement,
    
    // Change detection
    getAllChanges,
    
    // Direct access to reactive data for advanced use cases
    _campData: campData,
    _addToHistory: addToHistory
  }
}