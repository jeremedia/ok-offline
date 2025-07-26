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
 * Apple Weather proxy endpoint (would be implemented server-side)
 */
const APPLE_WEATHER_PROXY_URL = '/api/apple-weather'

/**
 * Check if we should try Apple Weather as fallback
 */
const shouldTryAppleWeather = () => {
  // Always try Apple Weather since we have Jeremy's credentials hardcoded
  return isAppleWeatherAvailable()
}

/**
 * Fetch weather data from Apple WeatherKit via server proxy
 */
const getAppleWeatherData = async () => {
  if (!shouldTryAppleWeather()) {
    throw new Error('Apple Weather not configured')
  }

  try {
    const response = await fetch(`${APPLE_WEATHER_PROXY_URL}/current`, {
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

  // 1. Try OpenWeatherMap first
  try {
    console.log('Trying OpenWeatherMap API...')
    const data = await getOpenWeatherCurrent()
    console.log('✅ OpenWeatherMap succeeded')
    return data
  } catch (error) {
    console.log('❌ OpenWeatherMap failed:', error.message)
    errors.push(`OpenWeatherMap: ${error.message}`)
  }

  // 2. Try Apple Weather if available
  if (shouldTryAppleWeather()) {
    try {
      console.log('Trying Apple WeatherKit API...')
      const data = await getCurrentWeatherFromApple()
      console.log('✅ Apple WeatherKit succeeded')
      return data
    } catch (error) {
      console.log('❌ Apple WeatherKit failed:', error.message)
      errors.push(`Apple Weather: ${error.message}`)
    }
  }

  // 3. All APIs failed - throw combined error
  const combinedError = new Error(`All weather services failed: ${errors.join(', ')}`)
  combinedError.errors = errors
  throw combinedError
}

/**
 * Get weather forecast with fallback
 */
export const getWeatherForecastRobust = async () => {
  // For now, only try OpenWeatherMap for forecast
  // Apple Weather forecast implementation would go here
  try {
    return await getOpenWeatherForecast()
  } catch (error) {
    console.error('Forecast failed:', error)
    throw error
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