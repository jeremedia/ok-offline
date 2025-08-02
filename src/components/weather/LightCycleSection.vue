<template>
  <div class="light-cycle">
    <div class="cycle-grid">
      <!-- Active Cycle with Countdowns -->
      <div class="cycle-section active">
        <h4>{{ isNighttime ? 'Morning Light' : 'Evening Light' }}</h4>
        <div class="countdown-grid">
          <div 
            v-for="countdown in countdowns" 
            :key="countdown.name"
            class="countdown-card"
          >
            <div class="countdown-icon">{{ countdown.icon }}</div>
            <div class="countdown-info">
              <div class="countdown-name">{{ countdown.name }}</div>
              <div class="countdown-time">{{ countdown.countdown }}</div>
              <div class="countdown-desc">{{ countdown.description }}</div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Next Cycle Countdowns -->
      <div class="cycle-section">
        <h4>{{ isNighttime ? 'Next Evening' : 'Next Morning' }}</h4>
        <div class="countdown-grid">
          <div 
            v-for="event in nextCycleEvents" 
            :key="event.name"
            class="countdown-card"
          >
            <div class="countdown-icon">{{ event.icon }}</div>
            <div class="countdown-info">
              <div class="countdown-name">{{ event.name }}</div>
              <div class="countdown-time">{{ event.countdown }}</div>
              <div class="countdown-desc">{{ event.description }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  twilightTimes: {
    type: Object,
    required: true
  },
  sunTimes: {
    type: Object,
    default: null
  },
  forecastDays: {
    type: Array,
    default: () => []
  }
})

// Current time that updates every second
const currentTime = ref(new Date())
let countdownInterval = null

// Check if it's nighttime
const isNighttime = computed(() => {
  const hour = currentTime.value.getHours()
  return hour < 6 || hour > 20
})

// Helper to parse time string to Date object
const parseTime = (timeStr) => {
  if (!timeStr) return null
  
  // Handle ISO 8601 timestamps from Apple Weather API
  if (timeStr.includes('T') && timeStr.includes('Z')) {
    return new Date(timeStr)
  }
  
  // Handle AM/PM format for fallback sun times
  const today = new Date()
  const [time, period] = timeStr.split(/(?=[AP]M)/)
  let [hours, minutes] = time.trim().split(':')
  hours = parseInt(hours)
  minutes = parseInt(minutes)
  
  if (period === 'PM' && hours !== 12) hours += 12
  if (period === 'AM' && hours === 12) hours = 0
  
  const date = new Date(today.getFullYear(), today.getMonth(), today.getDate(), hours, minutes)
  return date
}

const formatCountdown = (milliseconds) => {
  const hours = Math.floor(milliseconds / (1000 * 60 * 60))
  const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((milliseconds % (1000 * 60)) / 1000)
  
  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`
  } else if (minutes > 0) {
    return `${minutes}m ${seconds}s`
  } else {
    return `${seconds}s`
  }
}

// Compute countdowns
const countdowns = computed(() => {
  const twilight = props.twilightTimes || props.sunTimes
  if (!twilight) return []
  
  const now = currentTime.value
  const results = []
  
  // Get all light transition times
  const times = {
    astronomicalDawn: parseTime(twilight.astronomicalTwilightStart),
    civilDawn: parseTime(twilight.civilTwilightStart), // Golden Hour start
    sunrise: parseTime(twilight.sunrise),
    sunset: parseTime(twilight.sunset),
    civilDusk: parseTime(twilight.civilTwilightEnd), // Golden Hour end
    astronomicalDusk: parseTime(twilight.astronomicalTwilightEnd) // Pure Dark
  }
  
  // Determine current phase and next events
  const currentHour = now.getHours()
  const isNighttime = currentHour < 6 || currentHour > 20 // Rough night hours
  
  if (isNighttime) {
    // Night: Show Pure Light, Golden Hour (morning), Sunrise
    if (times.astronomicalDawn) {
      results.push({
        name: 'First Light',
        description: 'Stars fade, trash fence parties wind down',
        time: times.astronomicalDawn,
        icon: '✨'
      })
    }
    if (times.civilDawn) {
      results.push({
        name: 'Golden Hour',
        description: 'Perfect morning light begins',
        time: times.civilDawn,
        icon: '🌅'
      })
    }
    if (times.sunrise) {
      results.push({
        name: 'Sunrise',
        description: 'Sun appears over the mountains',
        time: times.sunrise,
        icon: '☀️'
      })
    }
  } else {
    // Day: Show Golden Hour (evening), Sunset, Pure Dark
    // Evening golden hour is approximately 1 hour before sunset
    if (times.sunset) {
      const goldenHour = new Date(times.sunset)
      goldenHour.setHours(goldenHour.getHours() - 1)
      results.push({
        name: 'Golden Hour',
        description: 'Magic hour photography time',
        time: goldenHour,
        icon: '🌅'
      })
      
      results.push({
        name: 'Sunset',
        description: 'Sun sets behind the mountains',
        time: times.sunset,
        icon: '🌇'
      })
    }
    if (times.astronomicalDusk) {
      results.push({
        name: 'Pure Dark',
        description: 'Trash fence parties begin!',
        time: times.astronomicalDusk,
        icon: '🌌'
      })
    }
  }
  
  // Filter out past events and format countdowns
  return results
    .filter(event => event.time && event.time > now)
    .slice(0, 3) // Show max 3 countdowns
    .map(event => ({
      ...event,
      countdown: formatCountdown(event.time - now)
    }))
})

// Format time for display
const formatTime = (date) => {
  if (!date) return ''
  const options = { hour: 'numeric', minute: '2-digit' }
  return date.toLocaleTimeString('en-US', options)
}

// Compute next cycle events (opposite of current)
const nextCycleEvents = computed(() => {
  const twilight = props.twilightTimes || props.sunTimes
  if (!twilight) return []
  
  const now = currentTime.value
  const times = {
    astronomicalDawn: parseTime(twilight.astronomicalTwilightStart),
    civilDawn: parseTime(twilight.civilTwilightStart),
    sunrise: parseTime(twilight.sunrise),
    sunset: parseTime(twilight.sunset),
    civilDusk: parseTime(twilight.civilTwilightEnd),
    astronomicalDusk: parseTime(twilight.astronomicalTwilightEnd)
  }
  
  // If it's nighttime, show tomorrow evening's events
  if (isNighttime.value) {
    const events = []
    if (times.sunset) {
      // Golden hour is 1 hour before sunset
      const tomorrowGolden = new Date(times.sunset)
      tomorrowGolden.setDate(tomorrowGolden.getDate() + 1)
      tomorrowGolden.setHours(tomorrowGolden.getHours() - 1)
      events.push({
        name: 'Golden Hour',
        description: 'Tomorrow evening\'s magic hour',
        time: tomorrowGolden,
        icon: '🌅',
        countdown: formatCountdown(tomorrowGolden - now)
      })
      
      const tomorrowSunset = new Date(times.sunset)
      tomorrowSunset.setDate(tomorrowSunset.getDate() + 1)
      events.push({
        name: 'Sunset',
        description: 'Tomorrow\'s sunset',
        time: tomorrowSunset,
        icon: '🌇',
        countdown: formatCountdown(tomorrowSunset - now)
      })
    }
    if (times.astronomicalDusk) {
      const tomorrow = new Date(times.astronomicalDusk)
      tomorrow.setDate(tomorrow.getDate() + 1)
      events.push({
        name: 'Pure Dark',
        description: 'Tomorrow night begins',
        time: tomorrow,
        icon: '🌌',
        countdown: formatCountdown(tomorrow - now)
      })
    }
    return events
  } else {
    // Daytime: show tomorrow morning's events
    const events = []
    if (times.astronomicalDawn) {
      const tomorrow = new Date(times.astronomicalDawn)
      tomorrow.setDate(tomorrow.getDate() + 1)
      events.push({
        name: 'First Light',
        description: 'Tomorrow\'s first light',
        time: tomorrow,
        icon: '✨',
        countdown: formatCountdown(tomorrow - now)
      })
    }
    if (times.civilDawn) {
      const tomorrow = new Date(times.civilDawn)
      tomorrow.setDate(tomorrow.getDate() + 1)
      events.push({
        name: 'Golden Hour',
        description: 'Tomorrow morning\'s golden hour',
        time: tomorrow,
        icon: '🌅',
        countdown: formatCountdown(tomorrow - now)
      })
    }
    if (times.sunrise) {
      const tomorrow = new Date(times.sunrise)
      tomorrow.setDate(tomorrow.getDate() + 1)
      events.push({
        name: 'Sunrise',
        description: 'Tomorrow\'s sunrise',
        time: tomorrow,
        icon: '☀️',
        countdown: formatCountdown(tomorrow - now)
      })
    }
    return events
  }
})

// Start countdown timer
onMounted(() => {
  countdownInterval = setInterval(() => {
    currentTime.value = new Date()
  }, 1000)
})

// Clean up interval
onUnmounted(() => {
  if (countdownInterval) {
    clearInterval(countdownInterval)
  }
})
</script>

<style scoped>
.light-cycle {
  padding: 1rem 1.5rem;
}

.cycle-grid {
  display: grid;
  gap: 2rem;
  grid-template-columns: 1fr 1fr;
}

.cycle-section {
  min-width: 0;
}

.cycle-section h4 {
  margin: 0 0 1rem 0;
  color: var(--color-text-primary);
  font-size: 1rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* Active countdown section */
.countdown-grid {
  display: grid;
  gap: 1rem;
  grid-template-columns: 1fr;
}

.countdown-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.5rem 1rem;
  background: var(--color-bg-header);
  border-radius: 6px;
  border: 1px solid var(--color-border-light);
}

.countdown-icon {
  font-size: 1.5rem;
  width: 40px;
  text-align: center;
  flex-shrink: 0;
  transform: scale(2);
}

.countdown-info {
  flex: 1;
}

.countdown-name {
  font-weight: 600;
  color: var(--color-text-primary);
  font-size: 0.95rem;
  margin-bottom: 0.25rem;
}

.countdown-time {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--color-accent);
  margin-bottom: 0.25rem;
}

.countdown-desc {
  font-size: 0.8rem;
  color: var(--color-text-muted);
  line-height: 1.3;
  display: none;
}

/* Mobile adjustments */
body.mobile-device .cycle-grid {
  grid-template-columns: 1fr;
  gap: 1.5rem;
}

body.mobile-device .countdown-grid {
  gap: 0.75rem;
}

body.mobile-device .countdown-card {
  padding: 0.375rem 0.75rem;
}

body.mobile-device .countdown-icon {
  font-size: 1.25rem;
  width: 32px;
  transform: scale(2);
}

body.mobile-device .countdown-name {
  font-size: 0.9rem;
}

body.mobile-device .countdown-time {
  font-size: 1rem;
}

body.mobile-device .countdown-desc {
  font-size: 0.75rem;
}
</style>