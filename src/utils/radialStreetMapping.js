/**
 * Radial Street Mapping - BRC Street Extension Database
 * 
 * Defines which radial streets physically extend to which avenues in Black Rock City.
 * Critical for distinguishing between physical intersections and addressing conventions.
 * 
 * Key Insight: "7:15" means two different things in BRC:
 * 1. As STREET: Physical infrastructure (only exists F avenue outward)
 * 2. As ADDRESS: Convention meaning "halfway between 7:00 and 7:30" (inner avenues)
 */

/**
 * Radial street extension data - which streets reach which avenues
 * Based on BRC's physical street layout where quarter-hour streets only exist
 * from Avenue F outward to provide access in the wider city blocks.
 */
const RADIAL_STREET_REACH = {
  // Hour streets (exist from Esplanade to L)
  '2:00': { innerLimit: 'Esplanade', outerLimit: 'L' },
  '2:30': { innerLimit: 'Esplanade', outerLimit: 'L' },
  '3:00': { innerLimit: 'Esplanade', outerLimit: 'L' },
  '3:30': { innerLimit: 'Esplanade', outerLimit: 'L' },
  '4:00': { innerLimit: 'Esplanade', outerLimit: 'L' },
  '4:30': { innerLimit: 'Esplanade', outerLimit: 'L' },
  '5:00': { innerLimit: 'Esplanade', outerLimit: 'L' },
  '5:30': { innerLimit: 'Esplanade', outerLimit: 'L' },
  '6:00': { innerLimit: 'Esplanade', outerLimit: 'L' },
  '6:30': { innerLimit: 'Esplanade', outerLimit: 'L' },
  '7:00': { innerLimit: 'Esplanade', outerLimit: 'L' },
  '7:30': { innerLimit: 'Esplanade', outerLimit: 'L' },
  '8:00': { innerLimit: 'Esplanade', outerLimit: 'L' },
  '8:30': { innerLimit: 'Esplanade', outerLimit: 'L' },
  '9:00': { innerLimit: 'Esplanade', outerLimit: 'L' },
  '9:30': { innerLimit: 'Esplanade', outerLimit: 'L' },
  '10:00': { innerLimit: 'Esplanade', outerLimit: 'L' },

  // Quarter-hour streets (only exist F outward for wider city blocks)
  '2:15': { innerLimit: 'F', outerLimit: 'L' },
  '2:45': { innerLimit: 'F', outerLimit: 'L' },
  '3:15': { innerLimit: 'F', outerLimit: 'L' },
  '3:45': { innerLimit: 'F', outerLimit: 'L' },
  '4:15': { innerLimit: 'F', outerLimit: 'L' },
  '4:45': { innerLimit: 'F', outerLimit: 'L' },
  '5:15': { innerLimit: 'F', outerLimit: 'L' },
  '5:45': { innerLimit: 'F', outerLimit: 'L' },
  '6:15': { innerLimit: 'F', outerLimit: 'L' },
  '6:45': { innerLimit: 'F', outerLimit: 'L' },
  '7:15': { innerLimit: 'F', outerLimit: 'L' },
  '7:45': { innerLimit: 'F', outerLimit: 'L' },
  '8:15': { innerLimit: 'F', outerLimit: 'L' },
  '8:45': { innerLimit: 'F', outerLimit: 'L' },
  '9:15': { innerLimit: 'F', outerLimit: 'L' },
  '9:45': { innerLimit: 'F', outerLimit: 'L' }
}

/**
 * Avenue distance ordering from center
 * Used to determine if an avenue is inner or outer relative to street limits
 */
const AVENUE_ORDER = [
  'Esplanade', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'
]

/**
 * Get the avenue index (distance from center)
 * @param {string} avenue - Avenue letter or name
 * @returns {number} Index in AVENUE_ORDER, or -1 if not found
 */
export function getAvenueIndex(avenue) {
  // Handle both letter and full names
  const normalizedAvenue = avenue.toUpperCase()
  
  // Direct lookup first
  let index = AVENUE_ORDER.indexOf(normalizedAvenue)
  if (index !== -1) return index
  
  // Try as avenue letter
  index = AVENUE_ORDER.indexOf(normalizedAvenue)
  if (index !== -1) return index
  
  // Try converting from theme name to letter (if needed)
  // This would require integration with avenueMapping.js
  return -1
}

/**
 * Check if a radial street physically extends to reach a specific avenue
 * @param {string} clockTime - Radial street time (e.g., "7:15")
 * @param {string} avenue - Avenue letter or name (e.g., "E")
 * @returns {boolean} True if physical intersection exists
 */
export function isPhysicalIntersection(clockTime, avenue) {
  const streetData = RADIAL_STREET_REACH[clockTime]
  if (!streetData) {
    return false
  }
  
  const avenueIndex = getAvenueIndex(avenue)
  if (avenueIndex === -1) {
    return false
  }
  
  const innerIndex = getAvenueIndex(streetData.innerLimit)
  const outerIndex = getAvenueIndex(streetData.outerLimit)
  
  const hasPhysicalIntersection = avenueIndex >= innerIndex && avenueIndex <= outerIndex
  
  return hasPhysicalIntersection
}

/**
 * Get the radial street extension data for a given clock time
 * @param {string} clockTime - Radial street time (e.g., "7:15")
 * @returns {object|null} Street reach data or null if not found
 */
export function getRadialStreetReach(clockTime) {
  return RADIAL_STREET_REACH[clockTime] || null
}

/**
 * Get all quarter-hour street times (for convention address interpolation)
 * @returns {string[]} Array of quarter-hour times like ["2:15", "2:45", ...]
 */
export function getQuarterHourStreets() {
  return Object.keys(RADIAL_STREET_REACH).filter(time => 
    time.includes(':15') || time.includes(':45')
  )
}

/**
 * Get all hour street times (for anchor points in interpolation)
 * @returns {string[]} Array of hour times like ["2:00", "3:00", ...]
 */
export function getHourStreets() {
  return Object.keys(RADIAL_STREET_REACH).filter(time => 
    time.includes(':00') || time.includes(':30')
  )
}

/**
 * Debug function to analyze a specific address
 * @param {string} clockTime - Radial street time
 * @param {string} avenue - Avenue letter or name
 */
export function debugAddressMapping(clockTime, avenue) {
  console.log(`🔬 BRC Address Debug: ${clockTime} & ${avenue}`)
  
  const streetData = getRadialStreetReach(clockTime)
  const avenueIndex = getAvenueIndex(avenue)
  const isPhysical = isPhysicalIntersection(clockTime, avenue)
  
  console.log('Street Data:', streetData)
  console.log('Avenue Index:', avenueIndex)
  console.log('Physical Intersection:', isPhysical)
  console.log('Resolution Strategy:', isPhysical ? 'GIS Lookup' : 'Interpolation')
  
  if (!isPhysical && streetData) {
    const isQuarterHour = clockTime.includes(':15') || clockTime.includes(':45')
    if (isQuarterHour) {
      const hour = parseInt(clockTime.split(':')[0])
      const minute = clockTime.split(':')[1]
      const isFirstQuarter = minute === '15'
      
      const anchorHour1 = isFirstQuarter ? `${hour}:00` : `${hour}:30`
      const anchorHour2 = isFirstQuarter ? `${hour}:30` : `${hour + 1}:00`
      
      console.log(`📐 Interpolation needed between ${anchorHour1} & ${avenue} and ${anchorHour2} & ${avenue}`)
    }
  }
}

/**
 * Validate the street mapping data for consistency
 * @returns {object} Validation results
 */
export function validateStreetMapping() {
  const errors = []
  const warnings = []
  
  // Check that all streets have valid avenue limits
  Object.entries(RADIAL_STREET_REACH).forEach(([street, data]) => {
    const innerIndex = getAvenueIndex(data.innerLimit)
    const outerIndex = getAvenueIndex(data.outerLimit)
    
    if (innerIndex === -1) {
      errors.push(`Invalid inner limit "${data.innerLimit}" for street ${street}`)
    }
    if (outerIndex === -1) {
      errors.push(`Invalid outer limit "${data.outerLimit}" for street ${street}`)
    }
    if (innerIndex >= outerIndex) {
      errors.push(`Invalid range for street ${street}: inner (${innerIndex}) >= outer (${outerIndex})`)
    }
  })
  
  // Check that quarter-hour streets start at F
  getQuarterHourStreets().forEach(street => {
    const data = RADIAL_STREET_REACH[street]
    if (data.innerLimit !== 'F') {
      warnings.push(`Quarter-hour street ${street} should start at F, but starts at ${data.innerLimit}`)
    }
  })
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
    stats: {
      totalStreets: Object.keys(RADIAL_STREET_REACH).length,
      hourStreets: getHourStreets().length,
      quarterHourStreets: getQuarterHourStreets().length
    }
  }
}

// Export the complete mapping for advanced use cases
export { RADIAL_STREET_REACH, AVENUE_ORDER }