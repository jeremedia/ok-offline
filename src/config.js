// API configuration
export const API_KEY = import.meta.env.VITE_BM_API_KEY || 'demo_key'
export const API_BASE = '/api'

// Black Rock City coordinates (Golden Spike)
export const BRC_CENTER = [40.786958, -119.202994]

// Debug configuration
export const APP_DEBUG = import.meta.env.DEV || import.meta.env.VITE_DEBUG === 'true'