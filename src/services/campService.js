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

/**
 * Check if we're online and the API is available
 */
const isOnlineAndApiAvailable = async () => {
  if (!navigator.onLine) return false
  
  try {
    const response = await fetch(`${API_BASE_URL}/theme_camps`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(3000) // 3 second timeout
    })
    return response.ok
  } catch {
    return false
  }
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
  
  // Clear cache
  cache.clear(`team_members_${campSlug}`)
  
  return member
}

/**
 * Update team member
 */
export const updateTeamMember = async (campSlug, memberId, memberData) => {
  if (!(await isOnlineAndApiAvailable())) {
    throw new Error('Cannot update team member while offline')
  }
  
  const member = await apiRequest(`/theme_camps/${campSlug}/team_members/${memberId}`, {
    method: 'PUT',
    body: JSON.stringify({ team_member: memberData })
  })
  
  cache.clear(`team_members_${campSlug}`)
  
  return member
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
  
  cache.clear(`personal_space_${campSlug}_${memberId}`)
  cache.clear(`team_members_${campSlug}`)
  
  return space
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
  
  return placement
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
  
  // Personal spaces
  getPersonalSpace,
  updatePersonalSpace,
  
  // Camp maps
  getCampMap,
  getCampMapStats,
  updateCampMap,
  addMapPlacement,
  
  // 3D models
  getGltfModels,
  getGltfModelsByCategory,
  
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