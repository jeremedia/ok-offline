// API configuration
export const API_KEY = import.meta.env.VITE_BM_API_KEY || 'demo_key'
export const API_BASE = '/api'

// Black Rock City coordinates (Golden Spike)
export const BRC_CENTER = [40.786958, -119.202994]

// Determine if we're in development environment
export const IS_DEV = import.meta.env.DEV || window.location.hostname === 'dev.offline.oknotok.com'

// API URLs configuration - use relative paths, Caddy handles proxying
export const API_URLS = {
  // Base API URL - all API calls go through proxy
  BASE: '',  // Empty for relative paths that get proxied
  
  // Vector search API
  VECTOR_API: '/api/v1',
  
  // Search analytics API  
  SEARCH_API: '',  // Empty string for root-relative paths
  
  // Tile API for map tile downloads
  TILES_API: '/api/v1/tiles'
}

// Debug configuration
// export const APP_DEBUG = import.meta.env.DEV || import.meta.env.VITE_DEBUG === 'true' && false

export const APP_DEBUG = false;