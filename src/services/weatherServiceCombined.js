/**
 * Combined Weather Service
 * Tries multiple weather APIs for maximum reliability
 * 1. OpenWeatherMap (primary)
 * 2. Apple WeatherKit (fallback via server proxy)
 * 3. Cached data (offline fallback)
 */

// Import individual services
import { 
  getCurrentWeather as getOpenWeatherCurrent, 
  getWeatherForecast as getOpenWeatherForecast,
  getSunTimes as getOpenWeatherSunTimes,
  getCacheStatus as getOpenWeatherCacheStatus,
  clearWeatherCache as clearOpenWeatherCache
} from './weatherService'

import {
  getCurrentWeatherFromApple,
  isAppleWeatherAvailable
} from './appleWeatherService'

// Black Rock City coordinates
const BLACK_ROCK_CITY = {
  lat: 40.788645,
  lon: -119.203018,
  name: 'Black Rock City, NV'
}

// Combined cache keys
const COMBINED_CACHE_KEY = 'combined_weather_cache'
const COMBINED_CACHE_TIMESTAMP_KEY = 'combined_weather_cache_timestamp'
const CACHE_DURATION = 10 * 60 * 1000 // 10 minutes

/**
 * Rails API endpoint for weather data
 */
const RAILS_WEATHER_API_URL = import.meta.env.DEV 
  ? 'http://100.104.170.10:3555/api/v1/weather/current'
  : '/api/v1/weather/current'

/**
 * Check if we should try Apple Weather as fallback
 */
const shouldTryAppleWeather = () => {
  // Always try Apple Weather since we have Jeremy's credentials hardcoded
  return isAppleWeatherAvailable()
}

/**
 * Fetch weather data from Apple WeatherKit via Rails API proxy
 */
const getAppleWeatherData = async () => {
  if (!shouldTryAppleWeather()) {
    throw new Error('Apple Weather not configured')
  }

  try {
    const response = await fetch(RAILS_WEATHER_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        latitude: BLACK_ROCK_CITY.lat,
        longitude: BLACK_ROCK_CITY.lon,
        dataSets: 'currentWeather,forecastDaily',
        timezone: 'America/Los_Angeles'
      })
    })

    if (!response.ok) {
      throw new Error(`Apple Weather proxy error: ${response.status}`)
    }

    const data = await response.json()
    
    // Convert Apple Weather data to our standard format
    const current = data.currentWeather
    if (!current) {
      throw new Error('No current weather data from Apple WeatherKit')
    }

    const windSpeed = Math.round((current.windSpeed || 0) * 2.237) // Convert m/s to mph
    const dustLevel = calculateDustLevel(windSpeed, (current.humidity || 0) * 100)
    const dustInfo = getDustLevelInfo(dustLevel)
    
    return {
      temperature: Math.round(convertKelvinToFahrenheit(current.temperature || 0)),
      feelsLike: Math.round(convertKelvinToFahrenheit(current.temperatureApparent || current.temperature || 0)),
      humidity: Math.round((current.humidity || 0) * 100),
      pressure: Math.round(current.pressure || 0),
      windSpeed,
      windDirection: getWindDirection(current.windDirection || 0),
      windDegrees: current.windDirection || 0,
      visibility: current.visibility ? Math.round(current.visibility * 0.000621371) : null,
      description: current.condition || 'Unknown',
      icon: mapAppleIconToStandard(current.conditionCode),
      dustLevel,
      dustLabel: dustInfo.label,
      recommendation: dustInfo.recommendation,
      lastUpdated: new Date().toISOString(),
      source: 'apple-api'
    }
  } catch (error) {
    console.error('Apple Weather proxy failed:', error)
    throw error
  }
}

/**
 * Helper functions
 */
const convertKelvinToFahrenheit = (kelvin) => {
  return (kelvin - 273.15) * 9/5 + 32
}

const getWindDirection = (degrees) => {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW']
  const index = Math.round(degrees / 22.5) % 16
  return directions[index]
}

const calculateDustLevel = (windSpeed, humidity) => {
  if (windSpeed >= 25) return 'whiteout'
  if (windSpeed >= 20) return 'heavy'
  if (windSpeed >= 15) return 'moderate'
  if (windSpeed >= 10) return 'light'
  return 'clear'
}

const getDustLevelInfo = (level) => {
  const dustInfo = {
    clear: { label: 'Clear', recommendation: 'Perfect conditions! Great visibility and minimal dust.' },
    light: { label: 'Light Dust', recommendation: 'Some dust in the air. Consider carrying a dust mask.' },
    moderate: { label: 'Moderate Dust', recommendation: 'Dust mask recommended. Secure loose items in camp.' },
    heavy: { label: 'Heavy Dust', recommendation: 'Full protection needed. Goggles and N95 mask essential.' },
    whiteout: { label: 'Whiteout Conditions', recommendation: 'Seek shelter immediately! Near-zero visibility.' }
  }
  return dustInfo[level] || dustInfo.moderate
}

/**
 * Get moon phase icon from phase name
 */
const getMoonPhaseIconFromName = (phaseName) => {
  if (!phaseName) return '🌑'
  
  const phase = phaseName.toLowerCase()
  if (phase.includes('new')) return '🌑' // New Moon
  if (phase.includes('waxing') && phase.includes('crescent')) return '🌒' // Waxing Crescent
  if (phase.includes('first') && phase.includes('quarter')) return '🌓' // First Quarter
  if (phase.includes('waxing') && phase.includes('gibbous')) return '🌔' // Waxing Gibbous
  if (phase.includes('full')) return '🌕' // Full Moon
  if (phase.includes('waning') && phase.includes('gibbous')) return '🌖' // Waning Gibbous
  if (phase.includes('last') && phase.includes('quarter')) return '🌗' // Last Quarter
  if (phase.includes('waning') && phase.includes('crescent')) return '🌘' // Waning Crescent
  return '🌑' // Default
}

/**
 * Weather history for trends
 */
const WEATHER_HISTORY_KEY = 'weather_history'
const MAX_HISTORY_ITEMS = 24 // Keep 24 hours of data

/**
 * Save weather data point to history
 */
const saveWeatherToHistory = (weatherData) => {
  try {
    const history = JSON.parse(localStorage.getItem(WEATHER_HISTORY_KEY) || '[]')
    
    // Add timestamp if not present
    const dataPoint = {
      ...weatherData,
      timestamp: weatherData.lastUpdated || new Date().toISOString()
    }
    
    // Add to beginning of array
    history.unshift(dataPoint)
    
    // Keep only last 24 items
    if (history.length > MAX_HISTORY_ITEMS) {
      history.splice(MAX_HISTORY_ITEMS)
    }
    
    localStorage.setItem(WEATHER_HISTORY_KEY, JSON.stringify(history))
  } catch (error) {
    console.error('Failed to save weather history:', error)
  }
}

/**
 * Calculate trends by comparing current values with previous
 */
const calculateTrends = (currentData) => {
  try {
    const history = JSON.parse(localStorage.getItem(WEATHER_HISTORY_KEY) || '[]')
    
    // Need at least 2 data points for trends
    if (history.length < 2) {
      return null
    }
    
    // Get the previous data point (not the most recent, which might be current)
    const previousData = history.find(item => 
      new Date(item.timestamp).getTime() < new Date(currentData.lastUpdated).getTime() - 5 * 60 * 1000 // At least 5 minutes old
    )
    
    if (!previousData) {
      return null
    }
    
    return {
      temperature: currentData.temperature - previousData.temperature,
      humidity: currentData.humidity - previousData.humidity,
      windSpeed: currentData.windSpeed - previousData.windSpeed,
      visibility: currentData.visibility && previousData.visibility 
        ? currentData.visibility - previousData.visibility 
        : null
    }
  } catch (error) {
    console.error('Failed to calculate trends:', error)
    return null
  }
}

const mapAppleIconToStandard = (conditionCode) => {
  const iconMap = {
    'Clear': '01d', 'MostlyClear': '02d', 'PartlyCloudy': '03d',
    'MostlyCloudy': '04d', 'Cloudy': '04d', 'Fog': '50d',
    'WindyVariant': '50d', 'Windy': '50d'
  }
  return iconMap[conditionCode] || '01d'
}

/**
 * Get current weather with fallback strategy
 */
export const getCurrentWeatherRobust = async () => {
  const errors = []
  
  // 1. Try Rails API proxy first (which uses Apple WeatherKit)
  try {
    console.log('Trying Rails API proxy for Apple WeatherKit...')
    const response = await fetch(RAILS_WEATHER_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        latitude: BLACK_ROCK_CITY.lat,
        longitude: BLACK_ROCK_CITY.lon
      })
    })

    if (!response.ok) {
      throw new Error(`Rails API error: ${response.status}`)
    }

    const result = await response.json()
    const data = result.data
    
    // Log full response for exploration (only in development)
    if (import.meta.env.DEV) {
      console.log('🌤️ Full Rails/Apple Weather Response:', JSON.stringify(result, null, 2))
      localStorage.setItem('rails_apple_weather_full_response', JSON.stringify(result, null, 2))
      console.log('💾 Full response saved to localStorage as "rails_apple_weather_full_response"')
    }
    
    // Extract twilight times if available
    let twilightTimes = null
    console.log('🔍 Looking for twilight data in response structure...')
    console.log('🔍 Available data keys:', Object.keys(data))
    
    // Check if the Rails API has sun/twilight data at the root level
    if (data.sunrise || data.sunset || data.civilTwilight) {
      console.log('🌅 Found sun/twilight data at root level')
      twilightTimes = {
        sunrise: data.sunrise || null,
        sunset: data.sunset || null,
        civilTwilightStart: data.civilTwilightStart || null,
        civilTwilightEnd: data.civilTwilightEnd || null,
        nauticalTwilightStart: data.nauticalTwilightStart || null,
        nauticalTwilightEnd: data.nauticalTwilightEnd || null,
        astronomicalTwilightStart: data.astronomicalTwilightStart || null,
        astronomicalTwilightEnd: data.astronomicalTwilightEnd || null
      }
    } else {
      console.log('❌ No sun/twilight data found in Rails API response')
      console.log('💡 Rails API may need to be updated to include forecastDaily data')
    }
    
    // Convert Rails API response to our standard format
    const windSpeed = Math.round(data.windSpeed || 0)
    const dustInfo = getDustLevelInfo(data.dustLevel || 'clear')
    
    const weatherData = {
      temperature: Math.round(data.temperature || 0),
      feelsLike: Math.round(data.feelsLike || 0),
      humidity: Math.round(data.humidity || 0),
      pressure: Math.round(data.pressure || 0),
      windSpeed,
      windDirection: getWindDirection(data.windDirection || 0),
      windDegrees: data.windDirection || 0,
      visibility: data.visibility ? Math.round(data.visibility) : null,
      description: data.conditionDescription || data.condition || 'Unknown',
      icon: mapAppleIconToStandard(data.condition),
      dustLevel: data.dustLevel || 'clear',
      dustLabel: dustInfo.label,
      recommendation: dustInfo.recommendation,
      moonPhase: data.moonPhase ? {
        phase: data.moonPhase.phase || null,
        phaseName: data.moonPhase.phase || 'Unknown',
        phaseIcon: getMoonPhaseIconFromName(data.moonPhase.phase),
        illumination: data.moonPhase.illumination || null,
        daysUntilNewMoon: data.moonPhase.daysUntilNewMoon || null
      } : null,
      twilightTimes,
      lastUpdated: result.meta?.lastUpdated || new Date().toISOString(),
      source: 'rails-apple-api'
    }
    
    // Save to history and calculate trends
    saveWeatherToHistory(weatherData)
    const trends = calculateTrends(weatherData)
    
    console.log('✅ Rails API (Apple WeatherKit) succeeded')
    return { ...weatherData, trends }
  } catch (error) {
    console.log('❌ Rails API failed:', error.message)
    errors.push(`Rails API: ${error.message}`)
  }
  
  // 2. Try OpenWeatherMap as fallback
  try {
    console.log('Trying OpenWeatherMap API as fallback...')
    const data = await getOpenWeatherCurrent()
    // Save to history and calculate trends
    saveWeatherToHistory(data)
    const trends = calculateTrends(data)
    
    console.log('✅ OpenWeatherMap succeeded')
    return { ...data, trends }
  } catch (error) {
    // Only log non-401 errors to reduce console noise
    if (!error.message.includes('401')) {
      console.log('❌ OpenWeatherMap failed:', error.message)
    } else {
      console.log('⏳ OpenWeatherMap API key still activating...')
    }
    errors.push(`OpenWeatherMap: ${error.message}`)
  }

  // 3. Try Apple Weather directly as last resort (this will likely fail due to CORS)
  if (shouldTryAppleWeather()) {
    try {
      console.log('Trying Apple WeatherKit API directly as final fallback...')
      const data = await getCurrentWeatherFromApple()
      // Save to history and calculate trends
      saveWeatherToHistory(data)
      const trends = calculateTrends(data)
      
      console.log('✅ Apple WeatherKit direct succeeded')
      return { ...data, trends }
    } catch (error) {
      console.log('❌ Apple WeatherKit direct failed:', error.message)
      errors.push(`Apple Weather direct: ${error.message}`)
    }
  }

  // 4. All APIs failed - throw combined error
  const combinedError = new Error(`All weather services failed: ${errors.join(', ')}`)
  combinedError.errors = errors
  throw combinedError
}

/**
 * Get weather forecast with fallback
 */
export const getWeatherForecastRobust = async () => {
  const errors = []
  
  // 1. Try Rails API proxy first (which uses Apple WeatherKit)
  try {
    console.log('Trying Rails API proxy for forecast...')
    const response = await fetch(RAILS_WEATHER_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        latitude: BLACK_ROCK_CITY.lat,
        longitude: BLACK_ROCK_CITY.lon
      })
    })

    if (!response.ok) {
      throw new Error(`Rails API error: ${response.status}`)
    }

    const result = await response.json()
    const forecast = result.data.forecast || []
    
    // Convert Rails API forecast to our standard format
    const dailyForecasts = forecast.map(day => {
      const date = new Date(day.date)
      const windSpeed = Math.round(day.windSpeed || 15) // Default for forecast
      const dustLevel = calculateDustLevel(windSpeed, day.humidity || 30)
      const dustInfo = getDustLevelInfo(dustLevel)
      
      return {
        date: date.toDateString(),
        dateIso: date.toISOString().split('T')[0],
        dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
        temperature: {
          high: Math.round(day.temperatureMax || 0),
          low: Math.round(day.temperatureMin || 0)
        },
        windSpeed,
        windDirection: 'W', // Default as not provided in forecast
        humidity: Math.round(day.humidity || 0),
        description: day.conditionDescription || day.condition || 'Unknown',
        icon: mapAppleIconToStandard(day.condition),
        dustLevel,
        dustLabel: dustInfo.label,
        precipitationProbability: day.precipitationProbability || 0
      }
    })
    
    console.log('✅ Rails API forecast succeeded')
    return dailyForecasts
  } catch (error) {
    console.log('❌ Rails API forecast failed:', error.message)
    errors.push(`Rails API: ${error.message}`)
  }
  
  // 2. Try OpenWeatherMap as fallback
  try {
    console.log('Trying OpenWeatherMap forecast as fallback...')
    return await getOpenWeatherForecast()
  } catch (error) {
    console.error('❌ OpenWeatherMap forecast failed:', error)
    errors.push(`OpenWeatherMap: ${error.message}`)
    
    // Throw combined error
    const combinedError = new Error(`All forecast services failed: ${errors.join(', ')}`)
    combinedError.errors = errors
    throw combinedError
  }
}

/**
 * Get sun times with fallback
 */
export const getSunTimesRobust = async () => {
  try {
    return await getOpenWeatherSunTimes()
  } catch (error) {
    console.error('Sun times failed:', error)
    // Return fallback sun times for Black Rock City
    return {
      sunrise: '6:30 AM',
      sunset: '7:45 PM',
      uvIndex: 8
    }
  }
}

/**
 * Clear all weather caches
 */
export const clearAllWeatherCaches = () => {
  clearOpenWeatherCache()
  localStorage.removeItem(COMBINED_CACHE_KEY)
  localStorage.removeItem(COMBINED_CACHE_TIMESTAMP_KEY)
}

/**
 * Get weather service status
 */
export const getWeatherServiceStatus = () => {
  const openWeatherKey = import.meta.env.VITE_WEATHER_API_KEY
  const appleWeatherEnabled = shouldTryAppleWeather()
  const openWeatherCache = getOpenWeatherCacheStatus()

  return {
    openWeather: {
      available: !!openWeatherKey,
      configured: !!openWeatherKey,
      cache: openWeatherCache
    },
    appleWeather: {
      available: appleWeatherEnabled,
      configured: appleWeatherEnabled,
      cache: { cached: false } // Would implement if using Apple Weather
    },
    fallbackStrategy: [
      'OpenWeatherMap API',
      ...(appleWeatherEnabled ? ['Apple WeatherKit'] : []),
      'Cached data'
    ]
  }
}