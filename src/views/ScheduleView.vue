 <template>
  <div class="view-container">
    <section id="schedule-section" class="view">
    <h2>My Schedule</h2>
    
    <div class="schedule-controls">
      <div class="day-selector">
        <BaseButton 
          v-for="day in days" 
          :key="day.date"
          @click="selectedDay = day.date"
          variant="secondary"
          :active="selectedDay === day.date"
          :uppercase="false"
          class="day-btn"
        >
          {{ day.label }}
        </BaseButton>
      </div>
      
      <BaseButton @click="clearDaySchedule" variant="secondary" :uppercase="false" class="clear-btn" v-if="hasEventsOnDay">
        Clear {{ formatDayLabel(selectedDay) }}
      </BaseButton>
    </div>
    
    <div class="schedule-timeline">
      <div v-if="!hasEventsOnDay" class="empty-state">
        <p>No events scheduled for {{ formatDayLabel(selectedDay) }}</p>
        <p class="hint">Add events from the Events list or camp detail pages</p>
      </div>
      
      <div v-else class="timeline">
        <div 
          v-for="event in dayEvents" 
          :key="event.scheduleId"
          class="scheduled-event"
          :style="getEventStyle(event)"
        >
          <div class="event-time">{{ formatEventTime(event) }}</div>
          <div class="event-content">
            <h4>{{ event.title }}</h4>
            <small>{{ event.location }}</small>
            <div v-if="event.conflict" class="conflict-warning">
              ⚠️ Conflicts with other events
            </div>
          </div>
          <BaseButton 
            @click="removeFromSchedule(event.scheduleId)"
            variant="ghost"
            icon="✕"
            size="sm"
            :uppercase="false"
            class="remove-btn"
          />
        </div>
      </div>
    </div>
    
    <div class="schedule-stats">
      <h3>Schedule Overview</h3>
      <div class="stats-grid">
        <div class="stat">
          <strong>{{ totalEvents }}</strong>
          <span>Total Events</span>
        </div>
        <div class="stat">
          <strong>{{ uniqueCamps }}</strong>
          <span>Different Camps</span>
        </div>
        <div class="stat">
          <strong>{{ totalHours }}h</strong>
          <span>Time Planned</span>
        </div>
        <div class="stat conflicts" v-if="conflictCount > 0">
          <strong>{{ conflictCount }}</strong>
          <span>Conflicts</span>
        </div>
      </div>
    </div>
    
    <div class="export-controls">
      <BaseButton @click="exportSchedule" variant="secondary" :uppercase="false" class="export-btn">
        📤 Export Schedule
      </BaseButton>
      <BaseButton @click="shareSchedule" variant="secondary" :uppercase="false" class="share-btn">
        🔗 Share Schedule
      </BaseButton>
    </div>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import BaseButton from '../components/ui/BaseButton.vue'

const route = useRoute()
const year = computed(() => route.params.year || localStorage.getItem('selectedYear') || '2025')

const SCHEDULE_KEY = 'bm_schedule'

// Days of Burning Man (typically late August to early September)
const days = ref([
  { date: '2025-08-25', label: 'Mon 8/25' },
  { date: '2025-08-26', label: 'Tue 8/26' },
  { date: '2025-08-27', label: 'Wed 8/27' },
  { date: '2025-08-28', label: 'Thu 8/28' },
  { date: '2025-08-29', label: 'Fri 8/29' },
  { date: '2025-08-30', label: 'Sat 8/30' },
  { date: '2025-08-31', label: 'Sun 8/31' },
  { date: '2025-09-01', label: 'Mon 9/1' }
])

const selectedDay = ref(days.value[0].date)
const schedule = ref({})

// Load schedule from localStorage
const loadSchedule = () => {
  const saved = localStorage.getItem(SCHEDULE_KEY)
  if (saved) {
    schedule.value = JSON.parse(saved)
  }
}

// Save schedule to localStorage
const saveSchedule = () => {
  localStorage.setItem(SCHEDULE_KEY, JSON.stringify(schedule.value))
}

// Get events for selected day
const dayEvents = computed(() => {
  const events = schedule.value[selectedDay.value] || []
  // Sort by start time
  return events.sort((a, b) => {
    const timeA = new Date(a.startTime).getTime()
    const timeB = new Date(b.startTime).getTime()
    return timeA - timeB
  })
})

const hasEventsOnDay = computed(() => dayEvents.value.length > 0)

// Check for conflicts
const checkConflicts = (events) => {
  events.forEach((event, index) => {
    event.conflict = false
    const eventStart = new Date(event.startTime).getTime()
    const eventEnd = new Date(event.endTime).getTime()
    
    for (let i = 0; i < events.length; i++) {
      if (i === index) continue
      
      const otherStart = new Date(events[i].startTime).getTime()
      const otherEnd = new Date(events[i].endTime).getTime()
      
      // Check if events overlap
      if ((eventStart >= otherStart && eventStart < otherEnd) ||
          (eventEnd > otherStart && eventEnd <= otherEnd) ||
          (eventStart <= otherStart && eventEnd >= otherEnd)) {
        event.conflict = true
        break
      }
    }
  })
}

// Add event to schedule (called from other components)
// Note: This is now handled by the schedule service instead

// Remove event from schedule
const removeFromSchedule = (scheduleId) => {
  const events = schedule.value[selectedDay.value] || []
  const index = events.findIndex(e => e.scheduleId === scheduleId)
  if (index !== -1) {
    events.splice(index, 1)
    if (events.length === 0) {
      delete schedule.value[selectedDay.value]
    } else {
      checkConflicts(events)
    }
    saveSchedule()
  }
}

// Clear all events for a day
const clearDaySchedule = () => {
  if (confirm(`Clear all events for ${formatDayLabel(selectedDay.value)}?`)) {
    delete schedule.value[selectedDay.value]
    saveSchedule()
  }
}

// Format day label
const formatDayLabel = (date) => {
  const day = days.value.find(d => d.date === date)
  return day ? day.label : date
}

// Format event time
const formatEventTime = (event) => {
  const start = new Date(event.startTime)
  const end = new Date(event.endTime)
  
  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    })
  }
  
  return `${formatTime(start)} - ${formatTime(end)}`
}

// Get event style for timeline positioning
const getEventStyle = (event) => {
  const start = new Date(event.startTime)
  const hours = start.getHours() + start.getMinutes() / 60
  const top = (hours - 8) * 60 // Start at 8 AM, 60px per hour
  
  const duration = (new Date(event.endTime) - start) / (1000 * 60 * 60) // hours
  const height = Math.max(duration * 60, 30) // Min height of 30px
  
  return {
    top: `${top}px`,
    height: `${height}px`
  }
}

// Calculate stats
const totalEvents = computed(() => {
  return Object.values(schedule.value).flat().length
})

const uniqueCamps = computed(() => {
  const camps = new Set()
  Object.values(schedule.value).flat().forEach(event => {
    if (event.campName) camps.add(event.campName)
  })
  return camps.size
})

const totalHours = computed(() => {
  let hours = 0
  Object.values(schedule.value).flat().forEach(event => {
    const duration = (new Date(event.endTime) - new Date(event.startTime)) / (1000 * 60 * 60)
    hours += duration
  })
  return Math.round(hours)
})

const conflictCount = computed(() => {
  let conflicts = 0
  Object.values(schedule.value).forEach(events => {
    checkConflicts(events)
    conflicts += events.filter(e => e.conflict).length
  })
  return conflicts
})

// Export schedule
const exportSchedule = () => {
  const data = {
    version: 1,
    year: year.value,
    schedule: schedule.value,
    exported: new Date().toISOString()
  }
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `burning-man-schedule-${year.value}.json`
  a.click()
  URL.revokeObjectURL(url)
}

// Share schedule
const shareSchedule = () => {
  const text = generateScheduleText()
  if (navigator.share) {
    navigator.share({
      title: `My Burning Man ${year.value} Schedule`,
      text: text
    })
  } else {
    // Copy to clipboard
    navigator.clipboard.writeText(text)
    alert('Schedule copied to clipboard!')
  }
}

const generateScheduleText = () => {
  let text = `My Burning Man ${year.value} Schedule\n\n`
  
  days.value.forEach(day => {
    const events = schedule.value[day.date] || []
    if (events.length > 0) {
      text += `${day.label}:\n`
      events.forEach(event => {
        text += `• ${formatEventTime(event)} - ${event.title} @ ${event.location}\n`
      })
      text += '\n'
    }
  })
  
  return text
}

onMounted(() => {
  loadSchedule()
  
  // Update year-specific days if needed
  if (year.value === '2024') {
    days.value = [
      { date: '2024-08-26', label: 'Mon 8/26' },
      { date: '2024-08-27', label: 'Tue 8/27' },
      { date: '2024-08-28', label: 'Wed 8/28' },
      { date: '2024-08-29', label: 'Thu 8/29' },
      { date: '2024-08-30', label: 'Fri 8/30' },
      { date: '2024-08-31', label: 'Sat 8/31' },
      { date: '2024-09-01', label: 'Sun 9/1' },
      { date: '2024-09-02', label: 'Mon 9/2' }
    ]
  } else if (year.value === '2023') {
    days.value = [
      { date: '2023-08-28', label: 'Mon 8/28' },
      { date: '2023-08-29', label: 'Tue 8/29' },
      { date: '2023-08-30', label: 'Wed 8/30' },
      { date: '2023-08-31', label: 'Thu 8/31' },
      { date: '2023-09-01', label: 'Fri 9/1' },
      { date: '2023-09-02', label: 'Sat 9/2' },
      { date: '2023-09-03', label: 'Sun 9/3' },
      { date: '2023-09-04', label: 'Mon 9/4' }
    ]
  }
  
  selectedDay.value = days.value[0].date
})
</script>

<style scoped>
.view-container {
  width: 100%;
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
}

#schedule-section {
  padding: 1rem;
  max-width: 1000px;
  margin: 0 auto;
  min-height: 100%;
}

h2 {
  color: var(--color-text-secondary);
  margin-bottom: 1.5rem;
}

.schedule-controls {
  margin-bottom: 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.day-selector {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}



.schedule-timeline {
  background: var(--color-bg-base);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 2rem;
  min-height: 400px;
}

.empty-state {
  text-align: center;
  padding: 3rem;
  color: var(--color-text-muted);
}

.empty-state .hint {
  margin-top: 0.5rem;
  font-size: 0.9rem;
  color: var(--color-text-disabled);
}

.timeline {
  position: relative;
  height: 1000px; /* 8 AM to midnight = 16 hours * 60px */
  background-image: repeating-linear-gradient(
    180deg,
    var(--color-bg-elevated),
    var(--color-bg-elevated) 59px,
    var(--color-border) 59px,
    var(--color-border) 60px
  );
}

.scheduled-event {
  position: absolute;
  left: 0;
  right: 0;
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-bg-active);
  border-radius: 4px;
  padding: 0.5rem;
  display: flex;
  gap: 0.5rem;
  transition: all 0.2s;
}

.scheduled-event:hover {
  background: var(--color-bg-header);
  border-color: var(--color-primary);
}

.event-time {
  font-size: 0.8rem;
  color: var(--color-text-muted);
  white-space: nowrap;
  min-width: 100px;
}

.event-content {
  flex: 1;
}

.event-content h4 {
  margin: 0;
  color: var(--color-text-primary);
  font-size: 0.95rem;
}

.event-content small {
  color: var(--color-text-muted);
}

.conflict-warning {
  color: var(--color-schedule-conflict);
  font-size: 0.8rem;
  margin-top: 0.25rem;
}

.remove-btn {
  color: var(--color-text-muted);
  font-size: 1.2rem;
}

.remove-btn:hover {
  color: var(--color-schedule-conflict);
}

.schedule-stats {
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 2rem;
}

.schedule-stats h3 {
  color: var(--color-text-secondary);
  margin-bottom: 1rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 1rem;
}

.stat {
  text-align: center;
}

.stat strong {
  display: block;
  font-size: 1.5rem;
  color: var(--color-text-primary);
}

.stat span {
  font-size: 0.9rem;
  color: var(--color-text-muted);
}

.stat.conflicts strong {
  color: var(--color-schedule-conflict);
}

.export-controls {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

.export-btn, .share-btn {
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
}

@media (max-width: 768px) {
  .day-selector {
    justify-content: center;
  }
  
  .schedule-controls {
    justify-content: center;
  }
}
</style>