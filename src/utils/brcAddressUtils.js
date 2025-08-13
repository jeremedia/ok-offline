/**
 * BRC Address Utilities - Shared address parsing and validation
 * 
 * Core utilities for working with Black Rock City addresses that don't
 * depend on geocoding, to avoid circular imports.
 */

/**
 * Check if a string is an avenue letter (A-L)
 */
function isAvenueLetter(str) {
  return /^[A-L]$/.test(str.toUpperCase())
}

/**
 * Parse a BRC address string into components
 * @param {string} address - e.g., "7:30 & E", "Esplanade & 3:00", "3:30 & Atwood"
 * @returns {object} { clock: '7:30', avenue: 'E' }
 */
export function parseBRCAddress(address) {
  if (!address || typeof address !== 'string') return null
  
  // Split by common separators
  const parts = address.split(/\s*[&,]\s*/).map(p => p.trim())
  
  if (parts.length !== 2) return null
  
  // Identify which part is clock and which is avenue
  let clock = null
  let avenue = null
  
  for (const part of parts) {
    if (/^\d{1,2}:\d{2}$/.test(part)) {
      clock = part
    } else {
      // Could be avenue letter, theme name, or "Esplanade"
      avenue = part
    }
  }
  
  if (!clock || !avenue) return null
  
  return { clock, avenue }
}

/**
 * Calculate distance between two lat/lon points (in feet)
 * Extracted from geocoding.js to avoid circular imports
 */
export function calculateDistance(coord1, coord2) {
  const [lat1, lon1] = coord1
  const [lat2, lon2] = coord2
  
  // Haversine formula
  const R = 20925524.9 // Earth radius in feet
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2)
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  const distance = R * c
  
  return Math.round(distance)
}

/**
 * Validate a BRC address format
 * @param {string} address - BRC address to validate
 * @returns {object} Validation result
 */
export function validateBRCAddress(address) {
  const result = {
    valid: false,
    parsed: null,
    errors: []
  }
  
  const parsed = parseBRCAddress(address)
  if (!parsed) {
    result.errors.push('Unable to parse address format')
    return result
  }
  
  const { clock, avenue } = parsed
  
  // Validate clock time format
  const [hourStr, minuteStr] = clock.split(':')
  const hour = parseInt(hourStr)
  const minute = parseInt(minuteStr)
  
  if (hour < 2 || hour > 10) {
    result.errors.push(`Invalid hour: ${hour} (must be 2-10)`)
  }
  
  if (![0, 15, 30, 45].includes(minute)) {
    result.errors.push(`Invalid minute: ${minute} (must be 00, 15, 30, or 45)`)
  }
  
  // Validate avenue
  if (!isAvenueLetter(avenue) && avenue !== 'Esplanade' && !/^[A-Za-z\s]+$/.test(avenue)) {
    result.errors.push(`Invalid avenue: ${avenue}`)
  }
  
  result.valid = result.errors.length === 0
  result.parsed = parsed
  
  return result
}

/**
 * Normalize a BRC address to standard format
 * @param {string} address - BRC address
 * @returns {string|null} Normalized address or null if invalid
 */
export function normalizeBRCAddress(address) {
  const parsed = parseBRCAddress(address)
  if (!parsed) return null
  
  const { clock, avenue } = parsed
  
  // Normalize clock time (ensure leading zero for single digit hours)
  const [hour, minute] = clock.split(':')
  const normalizedClock = `${hour.padStart(1, '0')}:${minute}`
  
  // Normalize avenue (uppercase single letters)
  const normalizedAvenue = isAvenueLetter(avenue) ? avenue.toUpperCase() : avenue
  
  return `${normalizedClock} & ${normalizedAvenue}`
}

/**
 * Get all possible BRC clock times
 * @returns {string[]} Array of valid clock times
 */
export function getAllClockTimes() {
  const times = []
  
  for (let hour = 2; hour <= 10; hour++) {
    times.push(`${hour}:00`)
    times.push(`${hour}:15`)
    times.push(`${hour}:30`)
    times.push(`${hour}:45`)
  }
  
  return times
}

/**
 * Get all possible BRC avenue names
 * @returns {string[]} Array of valid avenue names
 */
export function getAllAvenueNames() {
  return ['Esplanade', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L']
}

/**
 * Check if a clock time is a quarter-hour (15 or 45 minutes)
 * @param {string} clockTime - Clock time (e.g., "7:15")
 * @returns {boolean} True if quarter-hour
 */
export function isQuarterHour(clockTime) {
  const minute = parseInt(clockTime.split(':')[1])
  return minute === 15 || minute === 45
}

/**
 * Check if a clock time is an hour/half-hour (00 or 30 minutes)
 * @param {string} clockTime - Clock time (e.g., "7:00")
 * @returns {boolean} True if hour/half-hour
 */
export function isHourOrHalfHour(clockTime) {
  const minute = parseInt(clockTime.split(':')[1])
  return minute === 0 || minute === 30
}