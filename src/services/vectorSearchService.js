/**
 * Vector Search Service for Semantic and Hybrid Search
 * Integrates with Rails API backend for intelligent search capabilities
 */

// API configuration
const API_BASE_URL = import.meta.env.DEV 
  ? 'http://localhost:3555/api/v1' 
  : 'https://offline.oknotok.com/api/v1'

// Cache configuration
const CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 hours
const SEARCH_CACHE_KEY = 'vector_search_cache'
const PREFERENCES_KEY = 'vector_search_preferences'

/**
 * Check if we're online and the API is available
 */
const isOnlineAndApiAvailable = async () => {
  if (!navigator.onLine) return false
  
  try {
    const response = await fetch(`${API_BASE_URL}/search/analytics`, {
      method: 'GET',
      signal: AbortSignal.timeout(2000) // 2 second timeout
    })
    return response.ok
  } catch {
    return false
  }
}

/**
 * Cache management utilities
 */
const cache = {
  get(key) {
    try {
      const cached = localStorage.getItem(`${SEARCH_CACHE_KEY}_${key}`)
      if (!cached) return null
      
      const { data, timestamp } = JSON.parse(cached)
      const age = Date.now() - timestamp
      
      if (age > CACHE_DURATION) {
        this.remove(key)
        return null
      }
      
      return data
    } catch {
      return null
    }
  },
  
  set(key, data) {
    try {
      const cacheData = {
        data,
        timestamp: Date.now()
      }
      localStorage.setItem(`${SEARCH_CACHE_KEY}_${key}`, JSON.stringify(cacheData))
    } catch (error) {
      console.warn('Failed to cache vector search result:', error)
    }
  },
  
  remove(key) {
    localStorage.removeItem(`${SEARCH_CACHE_KEY}_${key}`)
  },
  
  clear() {
    const keys = Object.keys(localStorage)
    keys.forEach(key => {
      if (key.startsWith(SEARCH_CACHE_KEY)) {
        localStorage.removeItem(key)
      }
    })
  }
}

/**
 * User preferences management
 */
export const searchPreferences = {
  get() {
    try {
      const prefs = localStorage.getItem(PREFERENCES_KEY)
      return prefs ? JSON.parse(prefs) : {
        defaultMode: 'keyword',
        enableSemanticSearch: true,
        showSimilarityScores: true,
        cacheResults: true
      }
    } catch {
      return {
        defaultMode: 'keyword',
        enableSemanticSearch: true,
        showSimilarityScores: true,
        cacheResults: true
      }
    }
  },
  
  set(preferences) {
    try {
      localStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences))
    } catch (error) {
      console.warn('Failed to save search preferences:', error)
    }
  }
}

/**
 * Vector search implementation
 */
export const vectorSearch = async (query, options = {}) => {
  const {
    year = 2024,
    types = ['camp', 'art', 'event'],
    limit = 20,
    threshold = 0.7,
    useCache = true
  } = options
  
  // Generate cache key
  const cacheKey = `vector_${query}_${year}_${types.join(',')}_${limit}_${threshold}`
  
  // Check cache first
  if (useCache) {
    const cached = cache.get(cacheKey)
    if (cached) {
      return {
        ...cached,
        fromCache: true
      }
    }
  }
  
  // Check if API is available
  if (!(await isOnlineAndApiAvailable())) {
    throw new Error('Vector search requires internet connection')
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}/search/vector`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query,
        year,
        types,
        limit,
        threshold
      })
    })
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }
    
    const result = await response.json()
    
    // Cache successful results
    if (useCache && result.results?.length > 0) {
      cache.set(cacheKey, result)
    }
    
    return {
      ...result,
      fromCache: false
    }
  } catch (error) {
    console.error('Vector search error:', error)
    throw error
  }
}

/**
 * Hybrid search (vector + keyword)
 */
export const hybridSearch = async (query, options = {}) => {
  const {
    year = 2024,
    types = ['camp', 'art', 'event'],
    limit = 20,
    useCache = true
  } = options
  
  const cacheKey = `hybrid_${query}_${year}_${types.join(',')}_${limit}`
  
  if (useCache) {
    const cached = cache.get(cacheKey)
    if (cached) {
      return {
        ...cached,
        fromCache: true
      }
    }
  }
  
  if (!(await isOnlineAndApiAvailable())) {
    throw new Error('Hybrid search requires internet connection')
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}/search/hybrid`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query,
        year,
        types,
        limit
      })
    })
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }
    
    const result = await response.json()
    
    if (useCache && result.results?.length > 0) {
      cache.set(cacheKey, result)
    }
    
    return {
      ...result,
      fromCache: false
    }
  } catch (error) {
    console.error('Hybrid search error:', error)
    throw error
  }
}

/**
 * Entity-based search
 */
export const entitySearch = async (entities, options = {}) => {
  const {
    year = 2024,
    types = ['camp', 'art', 'event'],
    limit = 20,
    useCache = true
  } = options
  
  const cacheKey = `entity_${entities.join(',')}_${year}_${types.join(',')}_${limit}`
  
  if (useCache) {
    const cached = cache.get(cacheKey)
    if (cached) {
      return {
        ...cached,
        fromCache: true
      }
    }
  }
  
  if (!(await isOnlineAndApiAvailable())) {
    throw new Error('Entity search requires internet connection')
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}/search/entities`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        entities,
        year,
        types,
        limit
      })
    })
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }
    
    const result = await response.json()
    
    if (useCache && result.results?.length > 0) {
      cache.set(cacheKey, result)
    }
    
    return {
      ...result,
      fromCache: false
    }
  } catch (error) {
    console.error('Entity search error:', error)
    throw error
  }
}

/**
 * Search suggestions for autocomplete
 */
export const getSearchSuggestions = async (query, options = {}) => {
  const { useCache = true } = options
  
  if (!query || query.length < 2) return { suggestions: [] }
  
  const cacheKey = `suggest_${query}`
  
  if (useCache) {
    const cached = cache.get(cacheKey)
    if (cached) {
      return {
        ...cached,
        fromCache: true
      }
    }
  }
  
  if (!(await isOnlineAndApiAvailable())) {
    return { suggestions: [] }
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}/search/suggest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query })
    })
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }
    
    const result = await response.json()
    
    if (useCache && result.suggestions?.length > 0) {
      cache.set(cacheKey, result)
    }
    
    return {
      ...result,
      fromCache: false
    }
  } catch (error) {
    console.error('Suggestions error:', error)
    return { suggestions: [] }
  }
}

/**
 * Get search analytics (for debugging/optimization)
 */
export const getSearchAnalytics = async () => {
  if (!(await isOnlineAndApiAvailable())) {
    return null
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}/search/analytics`)
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }
    
    return await response.json()
  } catch (error) {
    console.error('Analytics error:', error)
    return null
  }
}

/**
 * Check if vector search is available
 */
export const isVectorSearchAvailable = async () => {
  return await isOnlineAndApiAvailable()
}

/**
 * Clear all cached search results
 */
export const clearSearchCache = () => {
  cache.clear()
}

// Export cache utilities for debugging
export { cache }