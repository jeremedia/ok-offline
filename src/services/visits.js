/**
 * Visit tracking and notes service for camps, art, and events
 */

const VISITS_KEY = 'bm_visits'
const NOTES_KEY = 'bm_notes'

/**
 * Get all visits from localStorage
 */
function getAllVisits() {
  const data = localStorage.getItem(VISITS_KEY)
  return data ? JSON.parse(data) : {}
}

/**
 * Get all notes from localStorage
 */
function getAllNotes() {
  const data = localStorage.getItem(NOTES_KEY)
  return data ? JSON.parse(data) : {}
}

/**
 * Save visits to localStorage
 */
function saveVisits(visits) {
  localStorage.setItem(VISITS_KEY, JSON.stringify(visits))
}

/**
 * Save notes to localStorage
 */
function saveNotes(notes) {
  localStorage.setItem(NOTES_KEY, JSON.stringify(notes))
}

/**
 * Record a visit to a camp/art/event
 * @param {string} type - 'camp', 'art', or 'event'
 * @param {string} uid - The item's UID
 * @param {string} year - The year
 */
export function recordVisit(type, uid, year) {
  const visits = getAllVisits()
  const key = `${year}_${type}_${uid}`
  
  if (!visits[key]) {
    visits[key] = {
      firstVisit: new Date().toISOString(),
      lastVisit: new Date().toISOString(),
      count: 1
    }
  } else {
    visits[key].lastVisit = new Date().toISOString()
    visits[key].count++
  }
  
  saveVisits(visits)
  return visits[key]
}

/**
 * Get visit info for an item
 * @param {string} type - 'camp', 'art', or 'event'
 * @param {string} uid - The item's UID
 * @param {string} year - The year
 */
export function getVisitInfo(type, uid, year) {
  const visits = getAllVisits()
  const key = `${year}_${type}_${uid}`
  return visits[key] || null
}

/**
 * Save notes for an item
 * @param {string} type - 'camp', 'art', or 'event'
 * @param {string} uid - The item's UID
 * @param {string} year - The year
 * @param {string} notes - The notes text
 */
export function saveItemNotes(type, uid, year, notes) {
  const allNotes = getAllNotes()
  const key = `${year}_${type}_${uid}`
  
  if (notes && notes.trim()) {
    allNotes[key] = {
      notes: notes.trim(),
      lastUpdated: new Date().toISOString()
    }
  } else {
    // Delete empty notes
    delete allNotes[key]
  }
  
  saveNotes(allNotes)
}

/**
 * Get notes for an item
 * @param {string} type - 'camp', 'art', or 'event'
 * @param {string} uid - The item's UID
 * @param {string} year - The year
 */
export function getItemNotes(type, uid, year) {
  const allNotes = getAllNotes()
  const key = `${year}_${type}_${uid}`
  return allNotes[key]?.notes || ''
}

/**
 * Get all visited items for a year
 * @param {string} year - The year
 */
export function getVisitedItems(year) {
  const visits = getAllVisits()
  const visited = {
    camps: [],
    art: [],
    events: []
  }
  
  Object.keys(visits).forEach(key => {
    if (key.startsWith(`${year}_`)) {
      const [, type, uid] = key.split('_')
      const typeKey = type === 'camp' ? 'camps' : type === 'art' ? 'art' : 'events'
      visited[typeKey].push({
        uid,
        visitInfo: visits[key]
      })
    }
  })
  
  return visited
}

/**
 * Get stats for visits
 * @param {string} year - The year
 */
export function getVisitStats(year) {
  const visited = getVisitedItems(year)
  return {
    camps: visited.camps.length,
    art: visited.art.length,
    events: visited.events.length,
    total: visited.camps.length + visited.art.length + visited.events.length
  }
}

/**
 * Clear all visits and notes for a year
 * @param {string} year - The year
 */
export function clearVisitsAndNotes(year) {
  const visits = getAllVisits()
  const notes = getAllNotes()
  
  // Remove visits for the year
  Object.keys(visits).forEach(key => {
    if (key.startsWith(`${year}_`)) {
      delete visits[key]
    }
  })
  
  // Remove notes for the year
  Object.keys(notes).forEach(key => {
    if (key.startsWith(`${year}_`)) {
      delete notes[key]
    }
  })
  
  saveVisits(visits)
  saveNotes(notes)
}