<template>
  <div class="view-container">
    <section id="dust-forecast-section" class="view">
    <div class="header-row">
      <h2>🌪️ BRC Weather & Dust</h2>
      <div class="header-actions">
        <button @click="refreshWeather" :disabled="isLoading" class="refresh-btn">
          <span :class="{ spinning: isLoading }">🔄</span>
          {{ isLoading ? 'Loading...' : 'Refresh' }}
        </button>
      </div>
    </div>
    
    <div v-if="error" class="error-message">
      <p>⚠️ {{ error }}</p>
      <button @click="refreshWeather" class="retry-btn">Try Again</button>
    </div>
    
    <div class="forecast-container" v-else>
      <!-- Loading State -->
      <div v-if="isLoading && !currentConditions" class="loading-state">
        <div class="loading-spinner"></div>
        <p>Fetching latest weather data...</p>
      </div>
      
      <!-- Current Conditions -->
      <div v-else-if="currentConditions" class="accordion-section">
        <div class="accordion-header" @click="toggleAccordion('currentConditions')">
          <h3>CURRENT CONDITIONS</h3>
          <span class="accordion-chevron" :class="{ rotated: !accordionState.currentConditions }">▼</span>
        </div>
        <div v-show="accordionState.currentConditions" class="current-conditions">
          <div class="conditions-header">
            <h3 class="desktop-only">Current Conditions</h3>
            <h3 class="mobile-only" v-html="formatCurrentDateMobile()"></h3>
            <div class="current-date desktop-only">{{ formatCurrentDate() }}</div>
          </div>
          <div class="condition-card">
          <div class="dust-level" :class="currentConditions.dustLevel">
            <span class="dust-icon">{{ getDustIcon(currentConditions.dustLevel) }}</span>
            <h4>{{ currentConditions.dustLabel }}</h4>
          </div>
          <div class="metrics">
            <div class="metric">
              <label>Temperature</label>
              <span>
                {{ currentConditions.temperature }}°F
                <small v-if="currentConditions.feelsLike !== currentConditions.temperature">
                  Feels {{ currentConditions.feelsLike }}°F
                </small>
              </span>
            </div>
            <div class="metric">
              <label>Wind</label>
              <span>{{ currentConditions.windSpeed }} mph {{ currentConditions.windDirection }}</span>
            </div>
            <div class="metric">
              <label>Humidity</label>
              <span>{{ currentConditions.humidity }}%</span>
            </div>
            <div class="metric">
              <label>Pressure</label>
              <span>{{ currentConditions.pressure }} hPa</span>
            </div>
            <div v-if="currentConditions.visibility" class="metric">
              <label>Visibility</label>
              <span>{{ currentConditions.visibility }} mi</span>
            </div>
            <div v-if="currentConditions.moonPhase" class="metric">
              <label>Moon Phase</label>
              <span>{{ currentConditions.moonPhase.phaseIcon }} {{ currentConditions.moonPhase.phaseName }}</span>
              <small v-if="currentConditions.moonPhase.moonrise">
                Rise: {{ currentConditions.moonPhase.moonrise }} • Set: {{ currentConditions.moonPhase.moonset }}
              </small>
            </div>
          </div>
          <p class="recommendation">{{ currentConditions.recommendation }}</p>
        </div>
      </div>
      
      <!-- Light Cycle Countdowns -->
      <div v-if="currentConditions && currentConditions.twilightTimes" class="accordion-section">
        <div class="accordion-header" @click="toggleAccordion('lightCycle')">
          <h3>LIGHT CYCLE</h3>
          <span class="accordion-chevron" :class="{ rotated: !accordionState.lightCycle }">▼</span>
        </div>
        <div v-show="accordionState.lightCycle" class="light-countdowns">
          <div class="countdown-grid">
              <div 
                v-for="countdown in getLightCycleCountdowns()" 
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
      </div>
          
      <div class="data-source">
            <small v-if="currentConditions.source === 'cache-expired'">
              ⚠️ Using cached data (offline)
            </small>
            <small v-else-if="currentConditions.source === 'cache'">
              📱 Cached data • Updated {{ formatUpdateTime(currentConditions.lastUpdated) }}
            </small>
            <small v-else-if="currentConditions.source === 'apple-api' || currentConditions.source === 'apple-cache-expired'">
              🍎 Apple WeatherKit • {{ formatUpdateTime(currentConditions.lastUpdated) }}
            </small>
            <small v-else>
              🌐 OpenWeatherMap • {{ formatUpdateTime(currentConditions.lastUpdated) }}
            </small>
          </div>
          
          <!-- Apple Weather Attribution -->
          <div v-if="currentConditions.source === 'apple-api' || currentConditions.source === 'apple-cache-expired'" class="apple-attribution">
            <small>
              <a href="https://developer.apple.com/weatherkit/data-source-attribution/" target="_blank" rel="noopener">
                Weather data provided by Apple WeatherKit
              </a>
            </small>
          </div>
      
      <!-- No Data State -->
      <div v-else class="no-data-state">
        <div class="no-data-content">
          <span class="no-data-icon">🌤️</span>
          <h3>Weather Data Unavailable!!</h3>
          <p>Waiting for weather data to load...</p>
          <button @click="refreshWeather" class="retry-btn">Try Loading Weather</button>
        </div>
      </div>
      
      <!-- 5-Day Forecast -->
      <div v-if="forecastDays && forecastDays.length" class="accordion-section">
        <div class="accordion-header" @click="toggleAccordion('forecast')">
          <h3>5-DAY FORECAST</h3>
          <span class="accordion-chevron" :class="{ rotated: !accordionState.forecast }">▼</span>
        </div>
        <div v-show="accordionState.forecast" class="forecast-days">
        <div v-if="isLoading && !forecastDays.length" class="loading-state">
          <div class="loading-spinner small"></div>
          <p>Loading forecast...</p>
        </div>
        <div v-else-if="forecastDays && forecastDays.length" class="forecast-grid">
          <div 
            v-for="day in forecastDays" 
            :key="day.dateIso" 
            class="forecast-day"
          >
            <h5>{{ day.dayName }}</h5>
            <span class="forecast-icon">{{ getDustIcon(day.dustLevel) }}</span>
            <p class="forecast-level">{{ day.dustLabel }}</p>
            <div class="temp-range">
              <span class="temp-high">{{ day.temperature.high }}°</span>
              <span class="temp-low">{{ day.temperature.low }}°</span>
            </div>
            <small>Wind: {{ day.windSpeed }} mph {{ day.windDirection }}</small>
            <small class="humidity">{{ day.humidity }}% humidity</small>
          </div>
        </div>
        </div>
      </div>
      
      <!-- Dust Protection Tips -->
      <div class="accordion-section">
        <div class="accordion-header" @click="toggleAccordion('dustTips')">
          <h3>DUST PROTECTION TIPS</h3>
          <span class="accordion-chevron" :class="{ rotated: !accordionState.dustTips }">▼</span>
        </div>
        <div v-show="accordionState.dustTips" class="dust-tips">
        <div class="tips-grid">
          <div class="tip-card">
            <h4>🥽 Eye Protection</h4>
            <p>Always wear goggles during dust storms. Regular sunglasses won't protect from fine playa dust.</p>
          </div>
          <div class="tip-card">
            <h4>😷 Breathing Protection</h4>
            <p>Use N95 masks or dust masks. Bandanas provide minimal protection against alkaline dust.</p>
          </div>
          <div class="tip-card">
            <h4>🧴 Skin Care</h4>
            <p>Apply vinegar solution (1:4 with water) to neutralize alkaline dust on skin.</p>
          </div>
          <div class="tip-card">
            <h4>🏕️ Camp Setup</h4>
            <p>Stake everything down! Secure loose items before dust storms hit.</p>
          </div>
        </div>
        </div>
      </div>
      
      <!-- Dust Level Scale -->
      <div class="accordion-section">
        <div class="accordion-header" @click="toggleAccordion('dustScale')">
          <h3>DUST LEVEL SCALE</h3>
          <span class="accordion-chevron" :class="{ rotated: !accordionState.dustScale }">▼</span>
        </div>
        <div v-show="accordionState.dustScale" class="dust-scale">
        <div class="scale-items">
          <div class="scale-item clear">
            <span>🌞</span>
            <strong>Clear</strong>
            <small>Minimal dust, great visibility</small>
          </div>
          <div class="scale-item light">
            <span>🌤️</span>
            <strong>Light Dust</strong>
            <small>Some haze, good visibility</small>
          </div>
          <div class="scale-item moderate">
            <span>🌫️</span>
            <strong>Moderate</strong>
            <small>Noticeable dust, mask recommended</small>
          </div>
          <div class="scale-item heavy">
            <span>🌪️</span>
            <strong>Heavy</strong>
            <small>Low visibility, full protection needed</small>
          </div>
          <div class="scale-item whiteout">
            <span>⚠️</span>
            <strong>Whiteout</strong>
            <small>Near-zero visibility, shelter immediately</small>
          </div>
        </div>
        </div>
      </div>
      
      <!-- Moon Phase Section (when available from Apple Weather) -->
      <div v-if="currentConditions && currentConditions.moonPhase" class="accordion-section">
        <div class="accordion-header" @click="toggleAccordion('moonPhase')">
          <h3>🌙 MOON PHASE</h3>
          <span class="accordion-chevron" :class="{ rotated: !accordionState.moonPhase }">▼</span>
        </div>
        <div v-show="accordionState.moonPhase" class="moon-phase-section">
        <div class="moon-phase-card">
          <div class="moon-display">
            <span class="moon-icon">{{ currentConditions.moonPhase.phaseIcon }}</span>
            <h4>{{ currentConditions.moonPhase.phaseName }}</h4>
          </div>
          <div class="moon-times" v-if="currentConditions.moonPhase.moonrise">
            <div class="moon-time">
              <label>Moonrise</label>
              <span>{{ currentConditions.moonPhase.moonrise }}</span>
            </div>
            <div class="moon-time">
              <label>Moonset</label>
              <span>{{ currentConditions.moonPhase.moonset }}</span>
            </div>
          </div>
          <p class="moon-info">
            Moon phases are crucial for navigation and activities at Burning Man. 
            <strong>{{ currentConditions.moonPhase.phaseName }}</strong> provides 
            {{ getMoonLightDescription(currentConditions.moonPhase.phase) }} for nighttime visibility.
          </p>
        </div>
        </div>
      </div>
      
      <!-- Global Apple Weather Attribution (when using Apple data) -->
      <div v-if="currentConditions && (currentConditions.source === 'apple-api' || currentConditions.source === 'apple-cache-expired' || currentConditions.moonPhase)" class="global-attribution">
        <small>
          <a href="https://developer.apple.com/weatherkit/data-source-attribution/" target="_blank" rel="noopener">
            Weather data provided by Apple WeatherKit
          </a>
        </small>
      </div>
    </div>
    </div>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { getCurrentWeatherRobust, getWeatherForecastRobust, getSunTimesRobust } from '../services/weatherServiceCombined'
import { useToast } from '../composables/useToast'

const { showError, showSuccess, showWarning } = useToast()

// Reactive state
const currentConditions = ref(null)
const forecastDays = ref([])
const sunTimes = ref(null)
const isLoading = ref(false)
const error = ref(null)
const currentTime = ref(new Date())

// Accordion state with localStorage persistence
const accordionState = ref({
  currentConditions: true,
  forecast: true,
  lightCycle: true,
  moonPhase: true,
  dustScale: false,
  dustTips: false
})

// Auto-refresh interval
let autoRefreshInterval = null
let countdownInterval = null
const AUTO_REFRESH_INTERVAL = 15 * 60 * 1000 // 15 minutes

const getDustIcon = (level) => {
  const icons = {
    clear: '🌞',
    light: '🌤️',
    moderate: '🌫️',
    heavy: '🌪️',
    whiteout: '⚠️'
  }
  return icons[level] || '🌫️'
}

const formatUpdateTime = (timestamp) => {
  if (!timestamp) return 'Unknown'
  
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now - date
  const diffMins = Math.floor(diffMs / 60000)
  
  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  
  return date.toLocaleDateString()
}

const formatCurrentDate = () => {
  const now = new Date()
  const options = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
    timeZone: 'America/Los_Angeles' // PST/PDT for Black Rock City
  }
  return now.toLocaleDateString('en-US', options).replace(' at ', ' @ ')
}

const formatCurrentDateMobile = () => {
  const now = new Date()
  const dateOptions = {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'America/Los_Angeles'
  }
  const timeOptions = {
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
    timeZone: 'America/Los_Angeles'
  }
  const dateStr = now.toLocaleDateString('en-US', dateOptions)
  const timeStr = now.toLocaleTimeString('en-US', timeOptions)
  return `${dateStr}<br>${timeStr}`
}

const formatSunTimes = () => {
  // Use Apple Weather twilight times if available, otherwise fallback to basic sun times
  const twilight = currentConditions.value?.twilightTimes
  
  if (twilight && twilight.sunrise && twilight.sunset) {
    // Format Apple Weather ISO timestamps to local time
    const sunrise = new Date(twilight.sunrise).toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      timeZone: 'America/Los_Angeles'
    }).replace(' AM', 'AM').replace(' PM', 'PM')
    
    const sunset = new Date(twilight.sunset).toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      timeZone: 'America/Los_Angeles' 
    }).replace(' AM', 'AM').replace(' PM', 'PM')
    
    return `${sunrise} - ${sunset}`
  }
  
  // Fallback to basic sun times
  if (!sunTimes.value) return ''
  const sunrise = sunTimes.value.sunrise.replace(' AM', 'AM').replace(' PM', 'PM')
  const sunset = sunTimes.value.sunset.replace(' AM', 'AM').replace(' PM', 'PM')
  return `${sunrise} - ${sunset}`
}

// Light cycle countdown system
const getLightCycleCountdowns = () => {
  // Use twilight times from Apple Weather if available, otherwise use basic sun times
  const twilight = currentConditions.value?.twilightTimes || sunTimes.value
  if (!twilight) return []
  
  const now = currentTime.value
  const countdowns = []
  
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
      countdowns.push({
        name: 'Pure Light',
        description: 'Stars fade, trash fence parties wind down',
        time: times.astronomicalDawn,
        icon: '✨'
      })
    }
    if (times.civilDawn) {
      countdowns.push({
        name: 'Golden Hour',
        description: 'Perfect morning light begins',
        time: times.civilDawn,
        icon: '🌅'
      })
    }
    if (times.sunrise) {
      countdowns.push({
        name: 'Sunrise',
        description: 'Sun rises over the mountains',
        time: times.sunrise,
        icon: '☀️'
      })
    }
  } else {
    // Day: Show Golden Hour (evening), Sunset, Pure Dark
    if (times.civilDusk) {
      countdowns.push({
        name: 'Golden Hour',
        description: 'Magic hour photography time',
        time: times.civilDusk,
        icon: '🌇'
      })
    }
    if (times.sunset) {
      countdowns.push({
        name: 'Sunset',
        description: 'Sun sets behind the mountains',
        time: times.sunset,
        icon: '🌅'
      })
    }
    if (times.astronomicalDusk) {
      countdowns.push({
        name: 'Pure Dark',
        description: 'Trash fence parties begin!',
        time: times.astronomicalDusk,
        icon: '🌌'
      })
    }
  }
  
  // Filter out past events and format countdowns
  return countdowns
    .filter(event => event.time && event.time > now)
    .slice(0, 3) // Show max 3 countdowns
    .map(event => ({
      ...event,
      countdown: formatCountdown(event.time - now)
    }))
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

const getMoonLightDescription = (phase) => {
  if (!phase) return 'natural lighting'
  
  if (phase === 0 || phase === 1) {
    return 'minimal light - perfect for stargazing but bring extra lighting'
  } else if (phase > 0.4 && phase < 0.6) {
    return 'excellent natural lighting for nighttime activities'
  } else if (phase > 0.25 && phase < 0.75) {
    return 'good natural lighting for navigation'
  } else {
    return 'moderate lighting - headlamps recommended'
  }
}

const loadWeatherData = async (showLoadingSpinner = true) => {
  if (showLoadingSpinner) {
    isLoading.value = true
  }
  error.value = null

  try {
    // Load current conditions and forecast in parallel
    const [current, forecast, sun] = await Promise.allSettled([
      getCurrentWeatherRobust(),
      getWeatherForecastRobust(),
      getSunTimesRobust()
    ])

    // Handle current weather
    if (current.status === 'fulfilled') {
      currentConditions.value = current.value
    } else {
      console.error('Failed to load current weather:', current.reason)
      if (!currentConditions.value) {
        throw new Error('Failed to load current weather conditions')
      }
    }

    // Handle forecast
    if (forecast.status === 'fulfilled') {
      forecastDays.value = forecast.value
    } else {
      console.error('Failed to load forecast:', forecast.reason)
      showWarning('Failed to load 5-day forecast')
    }

    // Handle sun times
    if (sun.status === 'fulfilled') {
      sunTimes.value = sun.value
    } else {
      console.error('Failed to load sun times:', sun.reason)
      // Sun times are optional, don't show error
    }

    // Show success message for manual refreshes
    if (!showLoadingSpinner && current.status === 'fulfilled') {
      const source = current.value.source
      if (source === 'api') {
        showSuccess('Weather data updated')
      } else if (source === 'cache') {
        showSuccess('Using cached weather data')
      } else if (source === 'cache-expired') {
        showWarning('Using offline weather data')
      }
    }

  } catch (err) {
    console.error('Weather data error:', err)
    error.value = err.message || 'Failed to load weather data'
    
    if (showLoadingSpinner) {
      showError(error.value)
    }
  } finally {
    isLoading.value = false
  }
}

const refreshWeather = async () => {
  await loadWeatherData(false)
}

const startAutoRefresh = () => {
  // Clear any existing interval
  if (autoRefreshInterval) {
    clearInterval(autoRefreshInterval)
  }
  
  // Set up auto-refresh every 15 minutes
  autoRefreshInterval = setInterval(() => {
    console.log('Auto-refreshing weather data...')
    loadWeatherData(false)
  }, AUTO_REFRESH_INTERVAL)
}

const stopAutoRefresh = () => {
  if (autoRefreshInterval) {
    clearInterval(autoRefreshInterval)
    autoRefreshInterval = null
  }
}

const startCountdownTimer = () => {
  // Clear any existing interval
  if (countdownInterval) {
    clearInterval(countdownInterval)
  }
  
  // Update current time every second
  countdownInterval = setInterval(() => {
    currentTime.value = new Date()
  }, 1000)
}

const stopCountdownTimer = () => {
  if (countdownInterval) {
    clearInterval(countdownInterval)
    countdownInterval = null
  }
}

// Accordion state management
const ACCORDION_STATE_KEY = 'weather_accordion_state'

const loadAccordionState = () => {
  const saved = localStorage.getItem(ACCORDION_STATE_KEY)
  if (saved) {
    try {
      accordionState.value = { ...accordionState.value, ...JSON.parse(saved) }
    } catch (e) {
      console.error('Failed to load accordion state:', e)
    }
  }
}

const saveAccordionState = () => {
  localStorage.setItem(ACCORDION_STATE_KEY, JSON.stringify(accordionState.value))
}

const toggleAccordion = (section) => {
  accordionState.value[section] = !accordionState.value[section]
  saveAccordionState()
}

onMounted(async () => {
  console.log('Dust forecast view mounted')
  loadAccordionState()
  await loadWeatherData()
  startAutoRefresh()
  startCountdownTimer()
})

onUnmounted(() => {
  stopAutoRefresh()
  stopCountdownTimer()
})
</script>

<style scoped>
.view-container {
  width: 100%;
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
}

#dust-forecast-section {
  padding: 1rem;
  max-width: 1000px;
  margin: 0 auto;
  min-height: 100%;
}

.header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  gap: 1rem;
}

h2 {
  color: var(--color-text-secondary);
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 0.5rem;
}

.refresh-btn {
  background: var(--color-bg-elevated);
  color: var(--color-text-secondary);
  border: 1px solid var(--color-border-medium);
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s;
}

.refresh-btn:hover:not(:disabled) {
  background: var(--color-primary);
  color: var(--color-text-primary);
}

.refresh-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.error-message {
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-error);
  border-radius: 8px;
  padding: 1.5rem;
  text-align: center;
  margin-bottom: 1.5rem;
}

.error-message p {
  color: var(--color-error);
  margin: 0 0 1rem 0;
}

.retry-btn {
  background: var(--color-primary);
  color: var(--color-text-primary);
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
}

.loading-state {
  text-align: center;
  padding: 2rem;
  color: var(--color-text-muted);
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--color-border-medium);
  border-top: 3px solid var(--color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

.loading-spinner.small {
  width: 20px;
  height: 20px;
  border-width: 2px;
}

.data-source {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--color-border-light);
  text-align: center;
}

.data-source small {
  color: var(--color-text-muted);
  font-size: 0.8rem;
}

.apple-attribution {
  margin-top: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1px solid var(--color-border-light);
  text-align: center;
}

.apple-attribution small {
  color: var(--color-text-muted);
  font-size: 0.75rem;
}

.apple-attribution a {
  color: var(--color-text-disabled);
  text-decoration: none;
  transition: color 0.2s;
}

.apple-attribution a:hover {
  color: var(--color-text-muted);
  text-decoration: underline;
}

.global-attribution {
  margin-top: 2rem;
  padding: 1rem;
  text-align: center;
  border-top: 1px solid var(--color-border-light);
  background: var(--color-bg-base);
}

.global-attribution small {
  color: var(--color-text-disabled);
  font-size: 0.75rem;
}

.global-attribution a {
  color: var(--color-text-disabled);
  text-decoration: none;
  transition: color 0.2s;
}

.global-attribution a:hover {
  color: var(--color-text-muted);
  text-decoration: underline;
}

.moon-phase-section {
  padding: 1.5rem;
}


.moon-phase-card {
  background: var(--color-bg-elevated);
  border-radius: 8px;
  padding: 1.5rem;
}

.moon-display {
  text-align: center;
  margin-bottom: 1.5rem;
}

.moon-icon {
  font-size: 3rem;
  display: block;
  margin-bottom: 0.5rem;
}

.moon-display h4 {
  color: var(--color-text-primary);
  margin: 0;
  font-size: 1.25rem;
}

.moon-times {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.moon-time {
  text-align: center;
  padding: 0.75rem;
  background: var(--color-bg-header);
  border-radius: 4px;
}

.moon-time label {
  display: block;
  color: var(--color-text-muted);
  font-size: 0.9rem;
  margin-bottom: 0.25rem;
}

.moon-time span {
  color: var(--color-text-primary);
  font-weight: bold;
}

.moon-info {
  color: var(--color-text-secondary);
  margin: 0;
  font-size: 0.9rem;
  line-height: 1.5;
  text-align: center;
}

.moon-info strong {
  color: var(--color-text-primary);
}

.no-data-state {
  background: var(--color-bg-base);
  border: 1px solid var(--color-border-medium);
  border-radius: 8px;
  padding: 3rem 1.5rem;
  text-align: center;
}

.no-data-content {
  max-width: 400px;
  margin: 0 auto;
}

.no-data-icon {
  font-size: 3rem;
  display: block;
  margin-bottom: 1rem;
}

.no-data-state h3 {
  color: var(--color-text-primary);
  margin-bottom: 0.5rem;
}

.no-data-state p {
  color: var(--color-text-muted);
  margin-bottom: 1.5rem;
}

.forecast-container {
  display: grid;
  gap: 2rem;
}

.current-conditions {
  padding: 0;
}

.conditions-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  padding: 0.75rem 0.75rem 0.5rem 0.75rem;
}

.conditions-header h3 {
  color: var(--color-text-primary);
  margin: 0;
  text-transform: uppercase;
}

.current-date {
  color: var(--color-text-muted);
  font-size: 0.9rem;
  margin: 0;
}

/* Mobile/Desktop visibility using body-level classes */
body.mobile-device .desktop-only {
  display: none;
}

body.mobile-device .mobile-only {
  display: block;
}

body.mobile-device .conditions-header {
  justify-content: center;
}

body.mobile-device .conditions-header h3 {
  text-align: center;
}

body.desktop-device .desktop-only {
  display: block;
}

body.desktop-device .mobile-only {
  display: none;
}

/* Mobile-specific dust level styling */
body.mobile-device .dust-level {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
}

body.mobile-device .dust-icon {
  font-size: 6rem;
  line-height: 1;
  margin-bottom: 0;
}

body.mobile-device .dust-level h4 {
  margin: 0;
}

/* Mobile-specific metrics styling */
body.mobile-device .metrics {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.75rem;
}

body.mobile-device .metric {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  align-items: center;
  text-align: left;
}

body.mobile-device .metric label {
  margin: 0;
  text-align: right;
  text-transform: uppercase;
}

body.mobile-device .metric span {
  text-align: left;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  white-space: nowrap;
}

body.mobile-device .metric small {
  display: inline;
  margin: 0;
  white-space: nowrap;
}

.condition-card {
  background: var(--color-bg-elevated);
  border-radius: 0 0 8px 8px;
  padding: 1.5rem;
}

.dust-level {
  text-align: center;
  margin-bottom: 1.5rem;
}

.dust-icon {
  font-size: 3rem;
  display: block;
  margin-bottom: 0.5rem;
}

.dust-level h4 {
  color: var(--color-text-primary);
  margin: 0;
  font-size: 1.5rem;
}

.dust-level.clear { color: var(--color-dust-clear); }
.dust-level.light { color: var(--color-dust-light); }
.dust-level.moderate { color: var(--color-dust-moderate); }
.dust-level.heavy { color: var(--color-dust-heavy); }
.dust-level.whiteout { color: var(--color-dust-whiteout); }

.metrics {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 1rem;
  margin-bottom: 1rem;
}

.metric {
  text-align: center;
}

.metric label {
  display: block;
  color: var(--color-text-muted);
  font-size: 0.9rem;
  margin-bottom: 0.25rem;
}

.metric span {
  color: var(--color-text-primary);
  font-size: 1.1rem;
  font-weight: bold;
}

.metric small {
  display: block;
  color: var(--color-text-muted);
  font-size: 0.8rem;
  margin-top: 0.25rem;
}

.recommendation {
  color: var(--color-text-secondary);
  text-align: center;
  margin: 0;
  padding: 1rem;
  background: var(--color-bg-header);
  border-radius: 4px;
}

/* Light Cycle Countdowns */
.light-countdowns {
  padding: 1.5rem;
}


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

.forecast-days {
  padding: 1.5rem;
}


.forecast-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 1rem;
}

.forecast-day {
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border-medium);
  border-radius: 8px;
  padding: 1rem;
  text-align: center;
}

.forecast-day h5 {
  color: var(--color-text-primary);
  margin: 0 0 0.5rem 0;
}

.forecast-icon {
  font-size: 2rem;
  display: block;
  margin: 0.5rem 0;
}

.forecast-level {
  color: var(--color-text-secondary);
  margin: 0.5rem 0;
}

.forecast-day small {
  color: var(--color-text-muted);
  display: block;
  margin-top: 0.25rem;
}

.temp-range {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  margin: 0.5rem 0;
}

.temp-high {
  color: var(--color-text-primary);
  font-weight: bold;
}

.temp-low {
  color: var(--color-text-muted);
}

.humidity {
  font-size: 0.8rem !important;
}

/* Accordion Styles */
.accordion-section {
  background: var(--color-bg-base);
  border: 1px solid var(--color-border-medium);
  border-radius: 8px;
  margin-bottom: 1rem;
  overflow: hidden;
}

.accordion-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  cursor: pointer;
  user-select: none;
  background: var(--color-bg-header);
  border-bottom: 1px solid var(--color-border-light);
  transition: background-color 0.2s ease;
}

.accordion-header:hover {
  background: var(--color-bg-elevated);
}

.accordion-header h3 {
  margin: 0;
  color: var(--color-text-primary);
  font-size: 1.1rem;
  font-weight: 600;
}

.accordion-chevron {
  font-size: 1rem;
  color: var(--color-text-secondary);
  transition: transform 0.3s ease;
}

.accordion-chevron.rotated {
  transform: rotate(-180deg);
}

.dust-tips {
  padding: 1.5rem;
}


.tips-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}

.tip-card {
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border-medium);
  border-radius: 8px;
  padding: 1rem;
}

.tip-card h4 {
  color: var(--color-text-primary);
  margin: 0 0 0.5rem 0;
}

.tip-card p {
  color: var(--color-text-secondary);
  margin: 0;
  font-size: 0.9rem;
}

.dust-scale {
  padding: 1.5rem;
}


.scale-items {
  display: grid;
  gap: 0.75rem;
}

.scale-item {
  display: grid;
  grid-template-columns: 3rem 1fr 2fr;
  align-items: center;
  padding: 0.75rem;
  background: var(--color-bg-elevated);
  border-radius: 4px;
}

.scale-item span {
  font-size: 1.5rem;
}

.scale-item strong {
  color: var(--color-text-primary);
}

.scale-item small {
  color: var(--color-text-muted);
  text-align: right;
}

.scale-item.clear { border-left: 4px solid var(--color-dust-clear); }
.scale-item.light { border-left: 4px solid var(--color-dust-light); }
.scale-item.moderate { border-left: 4px solid var(--color-dust-moderate); }
.scale-item.heavy { border-left: 4px solid var(--color-dust-heavy); }
.scale-item.whiteout { border-left: 4px solid var(--color-dust-whiteout); }

@media (max-width: 768px) {
  .header-row {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
  }
  
  .header-actions {
    justify-content: center;
  }
  
  .metrics {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .tips-grid {
    grid-template-columns: 1fr;
  }
  
  .scale-item {
    grid-template-columns: 3rem 1fr;
  }
  
  .scale-item small {
    grid-column: 2;
    text-align: left;
    margin-top: 0.25rem;
  }
}

@media (max-width: 480px) {
  .metrics {
    grid-template-columns: 1fr;
  }
  
  .forecast-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>