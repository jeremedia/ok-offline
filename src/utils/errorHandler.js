// User-friendly error messages for common scenarios

export class AppError extends Error {
  constructor(message, code, userMessage) {
    super(message)
    this.code = code
    this.userMessage = userMessage || message
  }
}

// Error message mapping
const errorMessages = {
  // Network errors
  'NETWORK_ERROR': 'Unable to connect. Please check your internet connection.',
  'API_ERROR': 'Unable to reach the Burning Man API. Please try again later.',
  'TIMEOUT': 'Request timed out. Please try again.',
  
  // Storage errors
  'QUOTA_EXCEEDED': 'Storage limit reached. Try clearing some old data.',
  'STORAGE_ERROR': 'Unable to save data. Please check your device storage.',
  'DB_ERROR': 'Database error. Please refresh the page.',
  
  // Data errors
  'NO_DATA': 'No data available. Please sync data in settings.',
  'INVALID_DATA': 'Invalid data received. Please try syncing again.',
  'SYNC_FAILED': 'Sync failed. Please check your connection and try again.',
  
  // Location errors
  'LOCATION_DENIED': 'Location access denied. Please enable location services.',
  'LOCATION_UNAVAILABLE': 'Location unavailable. Please try again.',
  'LOCATION_TIMEOUT': 'Location request timed out. Please try again.',
  
  // Generic
  'UNKNOWN': 'Something went wrong. Please try again.'
}

export function getErrorMessage(error) {
  // Check if it's our custom error
  if (error instanceof AppError) {
    return error.userMessage
  }
  
  // Check for known error patterns
  if (error.message) {
    const message = error.message.toLowerCase()
    
    // Network errors
    if (message.includes('network') || message.includes('fetch')) {
      return errorMessages.NETWORK_ERROR
    }
    
    // Storage errors
    if (message.includes('quota')) {
      return errorMessages.QUOTA_EXCEEDED
    }
    
    // API errors
    if (message.includes('api') || message.includes('401') || message.includes('403')) {
      return errorMessages.API_ERROR
    }
  }
  
  // Check error codes
  if (error.code && errorMessages[error.code]) {
    return errorMessages[error.code]
  }
  
  // Default
  return errorMessages.UNKNOWN
}

export function handleError(error, context) {
  console.error(`Error in ${context}:`, error)
  
  // Log to console with full details in development
  if (import.meta.env.DEV) {
    console.error('Full error details:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
      context
    })
  }
  
  return getErrorMessage(error)
}