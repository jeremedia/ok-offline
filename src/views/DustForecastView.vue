<template>
  <section id="dust-forecast-section" class="view">
    <div class="header-row">
      <h2>🌪️ Playa Weather & Dust</h2>
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
      <div v-else-if="currentConditions" class="current-conditions">
        <h3>Current Conditions for BRC</h3>
        <div class="current-date">{{ formatCurrentDate() }}</div>
        <div class="condition-card">
          <div class="dust-level" :class="currentConditions.dustLevel">
            <span class="dust-icon">{{ getDustIcon(currentConditions.dustLevel) }}</span>
            <h4>{{ currentConditions.dustLabel }}</h4>
          </div>
          <div class="metrics">
            <div class="metric">
              <label>Temperature</label>
              <span>{{ currentConditions.temperature }}°F</span>
              <small v-if="currentConditions.feelsLike !== currentConditions.temperature">
                Feels {{ currentConditions.feelsLike }}°F
              </small>
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
            <div v-if="sunTimes" class="metric">
              <label>Sun Times</label>
              <span>{{ sunTimes.sunrise }} - {{ sunTimes.sunset }}</span>
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
        </div>
      </div>
      
      <!-- No Data State -->
      <div v-else class="no-data-state">
        <div class="no-data-content">
          <span class="no-data-icon">🌤️</span>
          <h3>Weather Data Unavailable</h3>
          <p>Waiting for weather data to load...</p>
          <button @click="refreshWeather" class="retry-btn">Try Loading Weather</button>
        </div>
      </div>
      
      <!-- 5-Day Forecast -->
      <div class="forecast-days">
        <h3>5-Day Forecast</h3>
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
      
      <div class="dust-tips">
        <h3>Dust Protection Tips</h3>
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
      
      <div class="dust-scale">
        <h3>Dust Level Scale</h3>
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
      
      <!-- Moon Phase Section (when available from Apple Weather) -->
      <div v-if="currentConditions && currentConditions.moonPhase && currentConditions.source.includes('apple')" class="moon-phase-section">
        <h3>🌙 Moon Phase for Black Rock City</h3>
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
      
      <!-- Global Apple Weather Attribution (when using Apple data) -->
      <div v-if="currentConditions && (currentConditions.source === 'apple-api' || currentConditions.source === 'apple-cache-expired')" class="global-attribution">
        <small>
          <a href="https://developer.apple.com/weatherkit/data-source-attribution/" target="_blank" rel="noopener">
            Weather data provided by Apple WeatherKit
          </a>
        </small>
      </div>
    </div>
  </section>
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

// Auto-refresh interval
let autoRefreshInterval = null
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

onMounted(async () => {
  console.log('Dust forecast view mounted')
  await loadWeatherData()
  startAutoRefresh()
})

onUnmounted(() => {
  stopAutoRefresh()
})
</script>

<style scoped>
#dust-forecast-section {
  padding: 1rem;
  max-width: 1000px;
  margin: 0 auto;
}

.header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  gap: 1rem;
}

h2 {
  color: #ccc;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 0.5rem;
}

.refresh-btn {
  background: #2a2a2a;
  color: #ccc;
  border: 1px solid #444;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s;
}

.refresh-btn:hover:not(:disabled) {
  background: #8B0000;
  color: #fff;
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
  background: #2a1f1f;
  border: 1px solid #ff4444;
  border-radius: 8px;
  padding: 1.5rem;
  text-align: center;
  margin-bottom: 1.5rem;
}

.error-message p {
  color: #ff6666;
  margin: 0 0 1rem 0;
}

.retry-btn {
  background: #8B0000;
  color: #fff;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
}

.loading-state {
  text-align: center;
  padding: 2rem;
  color: #999;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #444;
  border-top: 3px solid #8B0000;
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
  border-top: 1px solid #333;
  text-align: center;
}

.data-source small {
  color: #999;
  font-size: 0.8rem;
}

.apple-attribution {
  margin-top: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1px solid #333;
  text-align: center;
}

.apple-attribution small {
  color: #999;
  font-size: 0.75rem;
}

.apple-attribution a {
  color: #666;
  text-decoration: none;
  transition: color 0.2s;
}

.apple-attribution a:hover {
  color: #999;
  text-decoration: underline;
}

.global-attribution {
  margin-top: 2rem;
  padding: 1rem;
  text-align: center;
  border-top: 1px solid #333;
  background: #1a1a1a;
}

.global-attribution small {
  color: #666;
  font-size: 0.75rem;
}

.global-attribution a {
  color: #666;
  text-decoration: none;
  transition: color 0.2s;
}

.global-attribution a:hover {
  color: #999;
  text-decoration: underline;
}

.moon-phase-section {
  background: #1a1a1a;
  border: 1px solid #444;
  border-radius: 8px;
  padding: 0 1.5rem 1.5rem 1.5rem;
  margin-top: 2rem;
}

.moon-phase-section h3 {
  color: #fff;
  margin: 1.5rem 0 1rem 0;
}

.moon-phase-card {
  background: #2a2a2a;
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
  color: #fff;
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
  background: #333;
  border-radius: 4px;
}

.moon-time label {
  display: block;
  color: #999;
  font-size: 0.9rem;
  margin-bottom: 0.25rem;
}

.moon-time span {
  color: #fff;
  font-weight: bold;
}

.moon-info {
  color: #ccc;
  margin: 0;
  font-size: 0.9rem;
  line-height: 1.5;
  text-align: center;
}

.moon-info strong {
  color: #fff;
}

.no-data-state {
  background: #1a1a1a;
  border: 1px solid #444;
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
  color: #fff;
  margin-bottom: 0.5rem;
}

.no-data-state p {
  color: #999;
  margin-bottom: 1.5rem;
}

.forecast-container {
  display: grid;
  gap: 2rem;
}

.current-conditions {
  background: #1a1a1a;
  border: 1px solid #444;
  border-radius: 8px;
  padding: 0 1.5rem 1.5rem 1.5rem;
}

.current-conditions h3 {
  color: #fff;
  margin: 1.5rem 0 0.5rem 0;
}

.current-date {
  color: #999;
  font-size: 0.9rem;
  margin-bottom: 1.5rem;
}

.condition-card {
  background: #2a2a2a;
  border-radius: 8px;
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
  color: #fff;
  margin: 0;
  font-size: 1.5rem;
}

.dust-level.clear { color: #4CAF50; }
.dust-level.light { color: #FFC107; }
.dust-level.moderate { color: #FF9800; }
.dust-level.heavy { color: #FF5722; }
.dust-level.whiteout { color: #F44336; }

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
  color: #999;
  font-size: 0.9rem;
  margin-bottom: 0.25rem;
}

.metric span {
  color: #fff;
  font-size: 1.1rem;
  font-weight: bold;
}

.metric small {
  display: block;
  color: #999;
  font-size: 0.8rem;
  margin-top: 0.25rem;
}

.recommendation {
  color: #ccc;
  text-align: center;
  margin: 0;
  padding: 1rem;
  background: #333;
  border-radius: 4px;
}

.forecast-days {
  background: #1a1a1a;
  border: 1px solid #444;
  border-radius: 8px;
  padding: 0 1.5rem 1.5rem 1.5rem;
}

.forecast-days h3 {
  color: #fff;
  margin: 1.5rem 0 1rem 0;
}

.forecast-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 1rem;
}

.forecast-day {
  background: #2a2a2a;
  border: 1px solid #444;
  border-radius: 8px;
  padding: 1rem;
  text-align: center;
}

.forecast-day h5 {
  color: #fff;
  margin: 0 0 0.5rem 0;
}

.forecast-icon {
  font-size: 2rem;
  display: block;
  margin: 0.5rem 0;
}

.forecast-level {
  color: #ccc;
  margin: 0.5rem 0;
}

.forecast-day small {
  color: #999;
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
  color: #fff;
  font-weight: bold;
}

.temp-low {
  color: #999;
}

.humidity {
  font-size: 0.8rem !important;
}

.dust-tips {
  background: #1a1a1a;
  border: 1px solid #444;
  border-radius: 8px;
  padding: 0 1.5rem 1.5rem 1.5rem;
}

.dust-tips h3 {
  color: #fff;
  margin: 1.5rem 0 1rem 0;
}

.tips-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}

.tip-card {
  background: #2a2a2a;
  border: 1px solid #444;
  border-radius: 8px;
  padding: 1rem;
}

.tip-card h4 {
  color: #fff;
  margin: 0 0 0.5rem 0;
}

.tip-card p {
  color: #ccc;
  margin: 0;
  font-size: 0.9rem;
}

.dust-scale {
  background: #1a1a1a;
  border: 1px solid #444;
  border-radius: 8px;
  padding: 0 1.5rem 1.5rem 1.5rem;
}

.dust-scale h3 {
  color: #fff;
  margin: 1.5rem 0 1rem 0;
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
  background: #2a2a2a;
  border-radius: 4px;
}

.scale-item span {
  font-size: 1.5rem;
}

.scale-item strong {
  color: #fff;
}

.scale-item small {
  color: #999;
  text-align: right;
}

.scale-item.clear { border-left: 4px solid #4CAF50; }
.scale-item.light { border-left: 4px solid #FFC107; }
.scale-item.moderate { border-left: 4px solid #FF9800; }
.scale-item.heavy { border-left: 4px solid #FF5722; }
.scale-item.whiteout { border-left: 4px solid #F44336; }

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