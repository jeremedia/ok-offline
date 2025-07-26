/**
 * Schedule management service for personal event scheduling
 */

const SCHEDULE_KEY = 'bm_schedule'

/**
 * Load schedule from localStorage
 */
export function loadSchedule() {
  const saved = localStorage.getItem(SCHEDULE_KEY)
  return saved ? JSON.parse(saved) : {}
}

/**
 * Save schedule to localStorage
 */
export function saveSchedule(schedule) {
  localStorage.setItem(SCHEDULE_KEY, JSON.stringify(schedule))
}

/**
 * Add an event to the schedule
 * @param {Object} event - The event to add
 * @param {Object} occurrence - The specific occurrence to schedule
 * @returns {boolean} - Whether the event was added successfully
 */
export function addEventToSchedule(event, occurrence) {
  try {
    const schedule = loadSchedule()
    
    const scheduleEvent = {
      scheduleId: Date.now() + Math.random(), // Unique ID for this scheduled instance
      eventId: event.uid,
      title: event.title,
      location: event.enriched_location || event.other_location || 'Unknown location',
      startTime: occurrence.start_time,
      endTime: occurrence.end_time,
      eventType: event.event_type?.label || 'Event',
      campName: event.camp_name
    }
    
    const dayKey = occurrence.start_time.split('T')[0]
    
    if (!schedule[dayKey]) {
      schedule[dayKey] = []
    }
    
    // Check if this exact event occurrence is already scheduled
    const isDuplicate = schedule[dayKey].some(e => 
      e.eventId === event.uid && 
      e.startTime === occurrence.start_time
    )
    
    if (isDuplicate) {
      return false // Event already scheduled
    }
    
    schedule[dayKey].push(scheduleEvent)
    saveSchedule(schedule)
    return true
  } catch (error) {
    console.error('Error adding event to schedule:', error)
    return false
  }
}

/**
 * Remove an event from the schedule
 * @param {string} eventId - The event UID
 * @param {string} startTime - The occurrence start time
 * @returns {boolean} - Whether the event was removed
 */
export function removeEventFromSchedule(eventId, startTime) {
  try {
    const schedule = loadSchedule()
    const dayKey = startTime.split('T')[0]
    
    if (!schedule[dayKey]) return false
    
    const initialLength = schedule[dayKey].length
    schedule[dayKey] = schedule[dayKey].filter(e => 
      !(e.eventId === eventId && e.startTime === startTime)
    )
    
    if (schedule[dayKey].length === 0) {
      delete schedule[dayKey]
    }
    
    saveSchedule(schedule)
    return schedule[dayKey]?.length !== initialLength
  } catch (error) {
    console.error('Error removing event from schedule:', error)
    return false
  }
}

/**
 * Check if an event occurrence is scheduled
 * @param {string} eventId - The event UID
 * @param {string} startTime - The occurrence start time
 * @returns {boolean} - Whether the event is scheduled
 */
export function isEventScheduled(eventId, startTime) {
  const schedule = loadSchedule()
  const dayKey = startTime.split('T')[0]
  
  if (!schedule[dayKey]) return false
  
  return schedule[dayKey].some(e => 
    e.eventId === eventId && 
    e.startTime === startTime
  )
}

/**
 * Get all scheduled events
 * @returns {Object} - The full schedule object
 */
export function getSchedule() {
  return loadSchedule()
}

/**
 * Get scheduled events for a specific day
 * @param {string} date - The date in YYYY-MM-DD format
 * @returns {Array} - Array of scheduled events for that day
 */
export function getScheduleForDay(date) {
  const schedule = loadSchedule()
  return schedule[date] || []
}

/**
 * Get schedule statistics
 * @returns {Object} - Statistics about the schedule
 */
export function getScheduleStats() {
  const schedule = loadSchedule()
  const allEvents = Object.values(schedule).flat()
  
  const uniqueCamps = new Set()
  let totalHours = 0
  
  allEvents.forEach(event => {
    if (event.campName) uniqueCamps.add(event.campName)
    
    const start = new Date(event.startTime)
    const end = new Date(event.endTime)
    const duration = (end - start) / (1000 * 60 * 60) // hours
    totalHours += duration
  })
  
  return {
    totalEvents: allEvents.length,
    uniqueCamps: uniqueCamps.size,
    totalHours: Math.round(totalHours),
    daysWithEvents: Object.keys(schedule).length
  }
}