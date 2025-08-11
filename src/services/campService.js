/**
 * Camp Management Service - OKNOTOK 2025
 * Provides API integration for theme camp management, team coordination, and 3D mapping
 */

import { API_URLS } from '@/config'

// API configuration
const API_BASE_URL = API_URLS.VECTOR_API || 'http://100.104.170.10:3555/api/v1'

// Cache configuration
const CACHE_DURATION = 60 * 60 * 1000 // 1 hour for camp data
const CAMP_CACHE_KEY = 'camp_management_cache'
const CAMP_STATE_KEY = 'camp_management_state'

// Advanced caching with relationships
const CACHE_RELATIONSHIPS = {
  'theme_camp': ['team_members', 'camp_map', 'personal_spaces', 'schedule_items'],
  'team_members': ['personal_spaces', 'schedule_items'],
  'camp_map': ['map_placements'],
  'personal_spaces': ['team_members'],
  'map_placements': ['camp_map'],
  'schedule_items': ['team_members']
}

/**
 * Check if we're online and the API is available
 */
const isOnlineAndApiAvailable = async () => {
  // Simply trust navigator.onLine - if system says we're online, we're online
  return navigator.onLine
}

/**
 * Make authenticated API request
 */
const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  }
  
  const response = await fetch(url, config)
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Network error' }))
    throw new Error(error.error || `HTTP ${response.status}`)
  }
  
  return response.json()
}

/**
 * Smart cache invalidation with relationships
 */
const invalidateRelatedCaches = (entityType, campSlug) => {
  const related = CACHE_RELATIONSHIPS[entityType] || []
  related.forEach(relatedType => {
    cache.clear(`${relatedType}_${campSlug}`)
  })
}

/**
 * Cache management utilities
 */
const cache = {
  set: (key, data) => {
    const cached = {
      data,
      timestamp: Date.now()
    }
    localStorage.setItem(`${CAMP_CACHE_KEY}_${key}`, JSON.stringify(cached))
  },
  
  get: (key) => {
    const cached = localStorage.getItem(`${CAMP_CACHE_KEY}_${key}`)
    if (!cached) return null
    
    try {
      const { data, timestamp } = JSON.parse(cached)
      if (Date.now() - timestamp > CACHE_DURATION) {
        localStorage.removeItem(`${CAMP_CACHE_KEY}_${key}`)
        return null
      }
      return data
    } catch {
      return null
    }
  },
  
  clear: (key) => {
    if (key) {
      localStorage.removeItem(`${CAMP_CACHE_KEY}_${key}`)
    } else {
      // Clear all camp cache
      Object.keys(localStorage).forEach(k => {
        if (k.startsWith(CAMP_CACHE_KEY)) {
          localStorage.removeItem(k)
        }
      })
    }
  },
  
  // Smart cache invalidation
  invalidate: (entityType, campSlug) => {
    cache.clear(`${entityType}_${campSlug}`)
    invalidateRelatedCaches(entityType, campSlug)
  }
}

/**
 * Camp state management
 */
const state = {
  get: (key, defaultValue = null) => {
    try {
      const stored = localStorage.getItem(`${CAMP_STATE_KEY}_${key}`)
      return stored ? JSON.parse(stored) : defaultValue
    } catch {
      return defaultValue
    }
  },
  
  set: (key, value) => {
    localStorage.setItem(`${CAMP_STATE_KEY}_${key}`, JSON.stringify(value))
  },
  
  remove: (key) => {
    localStorage.removeItem(`${CAMP_STATE_KEY}_${key}`)
  }
}

// ==================== Theme Camp Management ====================

/**
 * Get all theme camps
 */
export const getThemeCamps = async (useCache = true) => {
  const cacheKey = 'theme_camps'
  
  // Try cache first if requested
  if (useCache) {
    const cached = cache.get(cacheKey)
    if (cached) return cached
  }
  
  // Check if online
  if (!(await isOnlineAndApiAvailable())) {
    const cached = cache.get(cacheKey)
    if (cached) return cached
    throw new Error('Unable to load camps - check your connection')
  }
  
  try {
    const camps = await apiRequest('/theme_camps')
    cache.set(cacheKey, camps)
    return camps
  } catch (error) {
    // Fallback to cache on error
    const cached = cache.get(cacheKey)
    if (cached) return cached
    throw error
  }
}

/**
 * Get single theme camp by slug
 */
export const getThemeCamp = async (slug, useCache = true) => {
  const cacheKey = `theme_camp_${slug}`
  
  if (useCache) {
    const cached = cache.get(cacheKey)
    if (cached) return cached
  }
  
  if (!(await isOnlineAndApiAvailable())) {
    const cached = cache.get(cacheKey)
    if (cached) return cached
    throw new Error('Unable to load camp details - check your connection')
  }
  
  try {
    const camp = await apiRequest(`/theme_camps/${slug}`)
    cache.set(cacheKey, camp)
    return camp
  } catch (error) {
    const cached = cache.get(cacheKey)
    if (cached) return cached
    throw error
  }
}

/**
 * Create new theme camp
 */
export const createThemeCamp = async (campData) => {
  if (!(await isOnlineAndApiAvailable())) {
    throw new Error('Cannot create camp while offline')
  }
  
  const camp = await apiRequest('/theme_camps', {
    method: 'POST',
    body: JSON.stringify({ theme_camp: campData })
  })
  
  // Clear camps cache to force refresh
  cache.clear('theme_camps')
  
  return camp
}

/**
 * Update theme camp
 */
export const updateThemeCamp = async (slug, campData) => {
  if (!(await isOnlineAndApiAvailable())) {
    throw new Error('Cannot update camp while offline')
  }
  
  const camp = await apiRequest(`/theme_camps/${slug}`, {
    method: 'PUT',
    body: JSON.stringify({ theme_camp: campData })
  })
  
  // Clear relevant caches
  cache.clear(`theme_camp_${slug}`)
  cache.clear('theme_camps')
  
  return camp
}

// ==================== Team Member Management ====================

/**
 * Get team members for a camp
 */
export const getTeamMembers = async (campSlug, useCache = true) => {
  const cacheKey = `team_members_${campSlug}`
  
  if (useCache) {
    const cached = cache.get(cacheKey)
    if (cached) return cached
  }
  
  if (!(await isOnlineAndApiAvailable())) {
    const cached = cache.get(cacheKey)
    if (cached) return cached
    throw new Error('Unable to load team members - check your connection')
  }
  
  try {
    const members = await apiRequest(`/theme_camps/${campSlug}/team_members`)
    cache.set(cacheKey, members)
    return members
  } catch (error) {
    const cached = cache.get(cacheKey)
    if (cached) return cached
    throw error
  }
}

/**
 * Add team member to camp
 */
export const addTeamMember = async (campSlug, memberData) => {
  if (!(await isOnlineAndApiAvailable())) {
    throw new Error('Cannot add team member while offline')
  }
  
  const member = await apiRequest(`/theme_camps/${campSlug}/team_members`, {
    method: 'POST',
    body: JSON.stringify({ team_member: memberData })
  })
  
  // Smart cache invalidation
  cache.invalidate('team_members', campSlug)
  
  return member
}

/**
 * Clean team member data for API (only send permitted fields)
 */
const cleanTeamMemberData = (memberData) => {
  const allowedFields = [
    'first_name', 'last_name', 'playa_name', 'email', 'role', 'phone', 'skills',
    'arrival_date', 'departure_date', 'emergency_contact_name', 'emergency_contact_phone',
    'dietary_restrictions', 'is_verified', 'photo'
  ]
  
  const cleanData = {}
  allowedFields.forEach(field => {
    if (memberData[field] !== undefined) {
      cleanData[field] = memberData[field]
    }
  })
  
  // Handle emergency_contact field mapping if needed
  if (memberData.emergency_contact && !cleanData.emergency_contact_name) {
    cleanData.emergency_contact_name = memberData.emergency_contact
  }
  
  return cleanData
}

/**
 * Update team member
 */
export const updateTeamMember = async (campSlug, memberId, memberData) => {
  if (!(await isOnlineAndApiAvailable())) {
    throw new Error('Cannot update team member while offline')
  }
  
  // Clean the data to only include permitted fields
  const cleanData = cleanTeamMemberData(memberData)
  
  const member = await apiRequest(`/theme_camps/${campSlug}/team_members/${memberId}`, {
    method: 'PUT',
    body: JSON.stringify({ team_member: cleanData })
  })
  
  // Smart cache invalidation
  cache.invalidate('team_members', campSlug)
  
  return member
}

/**
 * Update multiple team members efficiently
 */
export const updateTeamMembers = async (campSlug, teamMembers) => {
  if (!(await isOnlineAndApiAvailable())) {
    throw new Error('Cannot update team members while offline')
  }
  
  const updatePromises = teamMembers.map(member => 
    updateTeamMember(campSlug, member.id, member)
  )
  
  const updatedMembers = await Promise.all(updatePromises)
  return updatedMembers
}

// ==================== Personal Space Management ====================

/**
 * Get personal space for team member
 */
export const getPersonalSpace = async (campSlug, memberId, useCache = true) => {
  const cacheKey = `personal_space_${campSlug}_${memberId}`
  
  if (useCache) {
    const cached = cache.get(cacheKey)
    if (cached) return cached
  }
  
  if (!(await isOnlineAndApiAvailable())) {
    const cached = cache.get(cacheKey)
    if (cached) return cached
    throw new Error('Unable to load personal space - check your connection')
  }
  
  try {
    const space = await apiRequest(`/theme_camps/${campSlug}/team_members/${memberId}/personal_space`)
    cache.set(cacheKey, space)
    return space
  } catch (error) {
    const cached = cache.get(cacheKey)
    if (cached) return cached
    throw error
  }
}

/**
 * Create or update personal space
 */
export const updatePersonalSpace = async (campSlug, memberId, spaceData) => {
  if (!(await isOnlineAndApiAvailable())) {
    throw new Error('Cannot update personal space while offline')
  }
  
  const space = await apiRequest(`/theme_camps/${campSlug}/team_members/${memberId}/personal_space`, {
    method: 'POST',
    body: JSON.stringify({ personal_space: spaceData })
  })
  
  cache.invalidate('personal_spaces', campSlug)
  cache.clear(`personal_space_${campSlug}_${memberId}`)
  
  return space
}

/**
 * Delete personal space
 */
export const deletePersonalSpace = async (campSlug, memberId) => {
  if (!(await isOnlineAndApiAvailable())) {
    throw new Error('Cannot delete personal space while offline')
  }
  
  await apiRequest(`/theme_camps/${campSlug}/team_members/${memberId}/personal_space`, {
    method: 'DELETE'
  })
  
  cache.invalidate('personal_spaces', campSlug)
  cache.clear(`personal_space_${campSlug}_${memberId}`)
}

/**
 * Get all personal spaces for camp
 */
export const getAllPersonalSpaces = async (campSlug, useCache = true) => {
  const cacheKey = `personal_spaces_${campSlug}`
  
  if (useCache) {
    const cached = cache.get(cacheKey)
    if (cached) return cached
  }
  
  try {
    // Get team members with their personal spaces
    const teamMembers = await getTeamMembers(campSlug, useCache)
    const spaces = teamMembers
      .filter(member => member.personal_space)
      .map(member => ({ ...member.personal_space, member_name: `${member.first_name} ${member.last_name}` }))
    
    cache.set(cacheKey, spaces)
    return spaces
  } catch (error) {
    const cached = cache.get(cacheKey)
    if (cached) return cached
    throw error
  }
}

// ==================== Camp Map Management ====================

/**
 * Get camp map with placements
 */
export const getCampMap = async (campSlug, useCache = true) => {
  const cacheKey = `camp_map_${campSlug}`
  
  if (useCache) {
    const cached = cache.get(cacheKey)
    if (cached) return cached
  }
  
  if (!(await isOnlineAndApiAvailable())) {
    const cached = cache.get(cacheKey)
    if (cached) return cached
    throw new Error('Unable to load camp map - check your connection')
  }
  
  try {
    const map = await apiRequest(`/theme_camps/${campSlug}/map`)
    cache.set(cacheKey, map)
    return map
  } catch (error) {
    const cached = cache.get(cacheKey)
    if (cached) return cached
    throw error
  }
}

/**
 * Get camp map statistics
 */
export const getCampMapStats = async (campSlug) => {
  if (!(await isOnlineAndApiAvailable())) {
    throw new Error('Cannot load map stats while offline')
  }
  
  return await apiRequest(`/theme_camps/${campSlug}/map/stats`)
}

/**
 * Create or update camp map
 */
export const updateCampMap = async (campSlug, mapData) => {
  if (!(await isOnlineAndApiAvailable())) {
    throw new Error('Cannot update camp map while offline')
  }
  
  const map = await apiRequest(`/theme_camps/${campSlug}/map`, {
    method: 'POST',
    body: JSON.stringify({ camp_map: mapData })
  })
  
  cache.clear(`camp_map_${campSlug}`)
  
  return map
}

/**
 * Add placement to camp map
 */
export const addMapPlacement = async (campSlug, placementData) => {
  if (!(await isOnlineAndApiAvailable())) {
    throw new Error('Cannot add placement while offline')
  }
  
  const placement = await apiRequest(`/theme_camps/${campSlug}/map/placements`, {
    method: 'POST',
    body: JSON.stringify({ map_placement: placementData })
  })
  
  cache.clear(`camp_map_${campSlug}`)
  cache.clear(`theme_camp_${campSlug}`)
  
  return placement
}

/**
 * Update map placement
 */
export const updateMapPlacement = async (campSlug, placementId, placementData) => {
  if (!(await isOnlineAndApiAvailable())) {
    throw new Error('Cannot update placement while offline')
  }
  
  const placement = await apiRequest(`/theme_camps/${campSlug}/map/placements/${placementId}`, {
    method: 'PUT',
    body: JSON.stringify({ map_placement: placementData })
  })
  
  cache.clear(`camp_map_${campSlug}`)
  cache.clear(`theme_camp_${campSlug}`)
  
  return placement
}

/**
 * Delete map placement
 */
export const deleteMapPlacement = async (campSlug, placementId) => {
  if (!(await isOnlineAndApiAvailable())) {
    throw new Error('Cannot delete placement while offline')
  }
  
  await apiRequest(`/theme_camps/${campSlug}/map/placements/${placementId}`, {
    method: 'DELETE'
  })
  
  cache.clear(`camp_map_${campSlug}`)
  cache.clear(`theme_camp_${campSlug}`)
}

/**
 * Batch update map placements
 */
export const batchUpdateMapPlacements = async (campSlug, placements) => {
  if (!(await isOnlineAndApiAvailable())) {
    throw new Error('Cannot update placements while offline')
  }
  
  const updatePromises = placements.map(placement => {
    if (placement.id && placement.id.toString().startsWith('new_')) {
      // New placement - create
      const { id, ...data } = placement
      return addMapPlacement(campSlug, data)
    } else if (placement.id) {
      // Existing placement - update
      const { id, ...data } = placement
      return updateMapPlacement(campSlug, id, data)
    }
  })
  
  const results = await Promise.all(updatePromises)
  return results
}

// ==================== 3D Models Management ====================

/**
 * Get all available GLTF models
 */
export const getGltfModels = async (useCache = true) => {
  const cacheKey = 'gltf_models'
  
  if (useCache) {
    const cached = cache.get(cacheKey)
    if (cached) return cached
  }
  
  if (!(await isOnlineAndApiAvailable())) {
    const cached = cache.get(cacheKey)
    if (cached) return cached
    throw new Error('Unable to load 3D models - check your connection')
  }
  
  try {
    const models = await apiRequest('/gltf_models')
    cache.set(cacheKey, models)
    return models
  } catch (error) {
    const cached = cache.get(cacheKey)
    if (cached) return cached
    throw error
  }
}

/**
 * Get models by category
 */
export const getGltfModelsByCategory = async (category, useCache = true) => {
  const cacheKey = `gltf_models_${category}`
  
  if (useCache) {
    const cached = cache.get(cacheKey)
    if (cached) return cached
  }
  
  if (!(await isOnlineAndApiAvailable())) {
    const cached = cache.get(cacheKey)
    if (cached) return cached
    throw new Error('Unable to load 3D models - check your connection')
  }
  
  try {
    const models = await apiRequest(`/gltf_models/categories/${category}`)
    cache.set(cacheKey, models)
    return models
  } catch (error) {
    const cached = cache.get(cacheKey)
    if (cached) return cached
    throw error
  }
}

/**
 * Get model categories
 */
export const getGltfModelCategories = async (useCache = true) => {
  const cacheKey = 'gltf_model_categories'
  
  if (useCache) {
    const cached = cache.get(cacheKey)
    if (cached) return cached
  }
  
  try {
    const models = await getGltfModels(useCache)
    const categories = [...new Set(models.map(model => model.category))].sort()
    cache.set(cacheKey, categories)
    return categories
  } catch (error) {
    const cached = cache.get(cacheKey)
    if (cached) return cached
    throw error
  }
}

/**
 * Search models by name/description
 */
export const searchGltfModels = async (query, category = null) => {
  const models = category 
    ? await getGltfModelsByCategory(category)
    : await getGltfModels()
    
  const searchTerm = query.toLowerCase()
  return models.filter(model => 
    model.name.toLowerCase().includes(searchTerm) ||
    (model.description && model.description.toLowerCase().includes(searchTerm))
  )
}

// ==================== Schedule Management ====================

/**
 * Get schedule items for a camp
 */
export const getScheduleItems = async (campSlug, options = {}) => {
  const { useCache = true, category, date, startDate, endDate, includeInactive = false } = options
  
  // Build cache key with options
  const optionsKey = JSON.stringify({ category, date, startDate, endDate, includeInactive })
  const cacheKey = `schedule_items_${campSlug}_${btoa(optionsKey)}`
  
  if (useCache) {
    const cached = cache.get(cacheKey)
    if (cached) return cached
  }
  
  if (!(await isOnlineAndApiAvailable())) {
    const cached = cache.get(cacheKey)
    if (cached) return cached
    throw new Error('Unable to load schedule items - check your connection')
  }
  
  try {
    // Build query parameters
    const params = new URLSearchParams()
    if (category) params.append('category', category)
    if (date) params.append('date', date)
    if (startDate) params.append('start_date', startDate)
    if (endDate) params.append('end_date', endDate)
    if (includeInactive) params.append('include_inactive', 'true')
    
    const queryString = params.toString()
    const endpoint = `/theme_camps/${campSlug}/schedule_items${queryString ? `?${queryString}` : ''}`
    
    const items = await apiRequest(endpoint)
    cache.set(cacheKey, items)
    return items
  } catch (error) {
    const cached = cache.get(cacheKey)
    if (cached) return cached
    throw error
  }
}

/**
 * Get single schedule item
 */
export const getScheduleItem = async (campSlug, itemId, useCache = true) => {
  const cacheKey = `schedule_item_${campSlug}_${itemId}`
  
  if (useCache) {
    const cached = cache.get(cacheKey)
    if (cached) return cached
  }
  
  if (!(await isOnlineAndApiAvailable())) {
    const cached = cache.get(cacheKey)
    if (cached) return cached
    throw new Error('Unable to load schedule item - check your connection')
  }
  
  try {
    const item = await apiRequest(`/theme_camps/${campSlug}/schedule_items/${itemId}`)
    cache.set(cacheKey, item)
    return item
  } catch (error) {
    const cached = cache.get(cacheKey)
    if (cached) return cached
    throw error
  }
}

/**
 * Create new schedule item
 */
export const createScheduleItem = async (campSlug, itemData, teamMemberIds = []) => {
  if (!(await isOnlineAndApiAvailable())) {
    throw new Error('Cannot create schedule item while offline')
  }
  
  const payload = {
    camp_schedule_item: itemData
  }
  
  if (teamMemberIds.length > 0) {
    payload.team_member_ids = teamMemberIds
  }
  
  const item = await apiRequest(`/theme_camps/${campSlug}/schedule_items`, {
    method: 'POST',
    body: JSON.stringify(payload)
  })
  
  // Clear relevant caches
  cache.invalidate('schedule_items', campSlug)
  cache.clear(`theme_camp_${campSlug}`)
  
  return item
}

/**
 * Update schedule item
 */
export const updateScheduleItem = async (campSlug, itemId, itemData, teamMemberIds = null) => {
  if (!(await isOnlineAndApiAvailable())) {
    throw new Error('Cannot update schedule item while offline')
  }
  
  const payload = {
    camp_schedule_item: itemData
  }
  
  if (teamMemberIds !== null) {
    payload.team_member_ids = teamMemberIds
  }
  
  const item = await apiRequest(`/theme_camps/${campSlug}/schedule_items/${itemId}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  })
  
  // Clear relevant caches
  cache.invalidate('schedule_items', campSlug)
  cache.clear(`schedule_item_${campSlug}_${itemId}`)
  cache.clear(`theme_camp_${campSlug}`)
  
  return item
}

/**
 * Delete schedule item
 */
export const deleteScheduleItem = async (campSlug, itemId) => {
  if (!(await isOnlineAndApiAvailable())) {
    throw new Error('Cannot delete schedule item while offline')
  }
  
  await apiRequest(`/theme_camps/${campSlug}/schedule_items/${itemId}`, {
    method: 'DELETE'
  })
  
  // Clear relevant caches
  cache.invalidate('schedule_items', campSlug)
  cache.clear(`schedule_item_${campSlug}_${itemId}`)
  cache.clear(`theme_camp_${campSlug}`)
}

/**
 * Assign team members to schedule item
 */
export const assignMembersToScheduleItem = async (campSlug, itemId, memberAssignments) => {
  if (!(await isOnlineAndApiAvailable())) {
    throw new Error('Cannot assign members while offline')
  }
  
  const payload = {
    team_member_ids: memberAssignments.map(a => a.member_id),
    assignments: {}
  }
  
  // Build assignments object with notes
  memberAssignments.forEach(assignment => {
    if (assignment.notes) {
      payload.assignments[assignment.member_id] = assignment.notes
    }
  })
  
  const result = await apiRequest(`/theme_camps/${campSlug}/schedule_items/${itemId}/assign_members`, {
    method: 'POST',
    body: JSON.stringify(payload)
  })
  
  // Clear relevant caches
  cache.invalidate('schedule_items', campSlug)
  cache.clear(`schedule_item_${campSlug}_${itemId}`)
  
  return result
}

/**
 * Remove team member from schedule item
 */
export const unassignMemberFromScheduleItem = async (campSlug, itemId, memberId) => {
  if (!(await isOnlineAndApiAvailable())) {
    throw new Error('Cannot unassign member while offline')
  }
  
  const result = await apiRequest(`/theme_camps/${campSlug}/schedule_items/${itemId}/unassign_member/${memberId}`, {
    method: 'DELETE'
  })
  
  // Clear relevant caches
  cache.invalidate('schedule_items', campSlug)
  cache.clear(`schedule_item_${campSlug}_${itemId}`)
  
  return result
}

/**
 * Check for schedule conflicts
 */
export const checkScheduleConflicts = async (campSlug, startDatetime, endDatetime, teamMemberIds) => {
  if (!(await isOnlineAndApiAvailable())) {
    throw new Error('Cannot check conflicts while offline')
  }
  
  const params = new URLSearchParams({
    start_datetime: startDatetime,
    end_datetime: endDatetime
  })
  
  teamMemberIds.forEach(id => params.append('team_member_ids[]', id))
  
  return await apiRequest(`/theme_camps/${campSlug}/schedule_items/conflicts?${params.toString()}`)
}

/**
 * Get schedule items by category
 */
export const getScheduleItemsByCategory = async (campSlug, category, useCache = true) => {
  return getScheduleItems(campSlug, { useCache, category })
}

/**
 * Get schedule items for date range
 */
export const getScheduleItemsForDateRange = async (campSlug, startDate, endDate, useCache = true) => {
  return getScheduleItems(campSlug, { useCache, startDate, endDate })
}

/**
 * Get schedule items for specific date
 */
export const getScheduleItemsForDate = async (campSlug, date, useCache = true) => {
  return getScheduleItems(campSlug, { useCache, date })
}

/**
 * Batch operations for schedule items
 */
export const batchUpdateScheduleItems = async (campSlug, updates) => {
  if (!(await isOnlineAndApiAvailable())) {
    throw new Error('Cannot update schedule items while offline')
  }
  
  const updatePromises = updates.map(update => 
    updateScheduleItem(campSlug, update.id, update.data, update.team_member_ids)
  )
  
  const results = await Promise.all(updatePromises)
  return results
}

// ==================== Offline State Management ====================

/**
 * Check if camp management is available offline
 */
export const isAvailableOffline = (campSlug = null) => {
  if (campSlug) {
    return cache.get(`theme_camp_${campSlug}`) !== null
  }
  return cache.get('theme_camps') !== null
}

/**
 * Get offline status for camp management
 */
export const getOfflineStatus = () => {
  const camps = cache.get('theme_camps')
  const cacheKeys = Object.keys(localStorage).filter(k => k.startsWith(CAMP_CACHE_KEY))
  
  return {
    hasData: camps !== null,
    totalCachedItems: cacheKeys.length,
    lastSync: camps ? Math.max(...cacheKeys.map(k => {
      try {
        const cached = JSON.parse(localStorage.getItem(k))
        return cached.timestamp || 0
      } catch {
        return 0
      }
    })) : null
  }
}

/**
 * Force refresh all camp data
 */
export const refreshCampData = async (campSlug = null) => {
  if (campSlug) {
    cache.clear(`theme_camp_${campSlug}`)
    cache.clear(`team_members_${campSlug}`)
    cache.clear(`camp_map_${campSlug}`)
    return await getThemeCamp(campSlug, false)
  } else {
    cache.clear()
    return await getThemeCamps(false)
  }
}

/**
 * Clear all camp data and state
 */
export const clearAllCampData = () => {
  cache.clear()
  // Clear state but preserve user preferences
  const keysToPreserve = ['selected_camp_slug']
  Object.keys(localStorage).forEach(key => {
    if (key.startsWith(CAMP_STATE_KEY) && !keysToPreserve.some(k => key.includes(k))) {
      localStorage.removeItem(key)
    }
  })
}

// ==================== State Helpers ====================

/**
 * Get/set currently selected camp
 */
export const getSelectedCamp = () => state.get('selected_camp_slug')
export const setSelectedCamp = (slug) => state.set('selected_camp_slug', slug)

/**
 * Get/set user's role in camp
 */
export const getUserRole = (campSlug) => state.get(`user_role_${campSlug}`)
export const setUserRole = (campSlug, role) => state.set(`user_role_${campSlug}`, role)

/**
 * Check if user has permission for action
 */
export const hasPermission = (campSlug, action) => {
  const role = getUserRole(campSlug)
  const permissions = {
    camp_lead: ['edit_camp', 'manage_team', 'manage_map', 'manage_spaces'],
    veteran: ['manage_team', 'manage_spaces'],
    virgin: ['edit_profile'],
    day_visitor: ['view_only']
  }
  return permissions[role]?.includes(action) || false
}

// Default export for convenience
export default {
  // Theme camps
  getThemeCamps,
  getThemeCamp,
  createThemeCamp,
  updateThemeCamp,
  
  // Team members
  getTeamMembers,
  addTeamMember,
  updateTeamMember,
  updateTeamMembers,
  
  // Personal spaces
  getPersonalSpace,
  updatePersonalSpace,
  deletePersonalSpace,
  getAllPersonalSpaces,
  
  // Camp maps
  getCampMap,
  getCampMapStats,
  updateCampMap,
  addMapPlacement,
  updateMapPlacement,
  deleteMapPlacement,
  batchUpdateMapPlacements,
  
  // Schedule management
  getScheduleItems,
  getScheduleItem,
  createScheduleItem,
  updateScheduleItem,
  deleteScheduleItem,
  assignMembersToScheduleItem,
  unassignMemberFromScheduleItem,
  checkScheduleConflicts,
  getScheduleItemsByCategory,
  getScheduleItemsForDateRange,
  getScheduleItemsForDate,
  batchUpdateScheduleItems,
  
  // 3D models
  getGltfModels,
  getGltfModelsByCategory,
  getGltfModelCategories,
  searchGltfModels,
  
  // Offline utilities
  isAvailableOffline,
  getOfflineStatus,
  refreshCampData,
  clearAllCampData,
  
  // State management
  getSelectedCamp,
  setSelectedCamp,
  getUserRole,
  setUserRole,
  hasPermission
}