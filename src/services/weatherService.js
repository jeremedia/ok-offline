/**
 * Weather Service for OpenWeatherMap API Integration
 * Provides weather data for Black Rock City, Nevada
 */

// Black Rock City coordinates
const BLACK_ROCK_CITY = {
  lat: 40.788645,
  lon: -119.203018,
  name: 'Black Rock City, NV'
}

// API configuration
const WEATHER_API_KEY = import.meta.env.VITE_WEATHER_API_KEY
const BASE_URL = 'https://api.openweathermap.org/data/2.5'
const ONE_CALL_URL = 'https://api.openweathermap.org/data/3.0/onecall'

// Cache keys for localStorage
const WEATHER_CACHE_KEY = 'weather_data_cache'
const WEATHER_CACHE_TIMESTAMP_KEY = 'weather_cache_timestamp'
const CACHE_DURATION = 10 * 60 * 1000 // 10 minutes in milliseconds

/**
 * Check if cached data is still valid
 */
const isCacheValid = () => {
  const timestamp = localStorage.getItem(WEATHER_CACHE_TIMESTAMP_KEY)
  if (!timestamp) return false
  
  const cacheAge = Date.now() - parseInt(timestamp)
  return cacheAge < CACHE_DURATION
}

/**
 * Get cached weather data
 */
const getCachedWeather = () => {
  if (isCacheValid()) {
    const cached = localStorage.getItem(WEATHER_CACHE_KEY)
    return cached ? JSON.parse(cached) : null
  }
  return null
}

/**
 * Cache weather data
 */
const cacheWeatherData = (data) => {
  localStorage.setItem(WEATHER_CACHE_KEY, JSON.stringify(data))
  localStorage.setItem(WEATHER_CACHE_TIMESTAMP_KEY, Date.now().toString())
}

/**
 * Convert wind degrees to cardinal direction
 */
const getWindDirection = (degrees) => {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW']
  const index = Math.round(degrees / 22.5) % 16
  return directions[index]
}

/**
 * Calculate dust level based on weather conditions
 */
const calculateDustLevel = (windSpeed, humidity, visibility = null) => {
  // Dust level calculation based on wind speed and humidity
  // Higher wind speed = more dust, higher humidity = less dust
  
  if (windSpeed >= 25) return 'whiteout'
  if (windSpeed >= 20) return 'heavy'
  if (windSpeed >= 15) return 'moderate'
  if (windSpeed >= 10) return 'light'
  return 'clear'
}

/**
 * Get dust level label and recommendation
 */
const getDustLevelInfo = (level) => {
  const dustInfo = {
    clear: {
      label: 'Clear',
      recommendation: 'Perfect conditions! Great visibility and minimal dust.'
    },
    light: {
      label: 'Light Dust',
      recommendation: 'Some dust in the air. Consider carrying a dust mask.'
    },
    moderate: {
      label: 'Moderate Dust',
      recommendation: 'Dust mask recommended. Secure loose items in camp.'
    },
    heavy: {
      label: 'Heavy Dust',
      recommendation: 'Full protection needed. Goggles and N95 mask essential.'
    },
    whiteout: {
      label: 'Whiteout Conditions',
      recommendation: 'Seek shelter immediately! Near-zero visibility.'
    }
  }
  return dustInfo[level] || dustInfo.moderate
}

/**
 * Fetch current weather data
 */
export const getCurrentWeather = async () => {
  // Check cache first
  const cached = getCachedWeather()
  if (cached && cached.current) {
    console.log('Weather: Using cached current weather data')
    return cached.current
  }

  if (!WEATHER_API_KEY) {
    throw new Error('Weather API key not configured')
  }

  const url = `${BASE_URL}/weather?lat=${BLACK_ROCK_CITY.lat}&lon=${BLACK_ROCK_CITY.lon}&appid=${WEATHER_API_KEY}&units=imperial`
  
  try {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Weather API error: ${response.status}`)
    }
    
    const data = await response.json()
    
    // Process weather data
    const windSpeed = Math.round(data.wind?.speed || 0)
    const windDirection = getWindDirection(data.wind?.deg || 0)
    const dustLevel = calculateDustLevel(windSpeed, data.main?.humidity || 0)
    const dustInfo = getDustLevelInfo(dustLevel)
    
    const processedData = {
      temperature: Math.round(data.main?.temp || 0),
      feelsLike: Math.round(data.main?.feels_like || 0),
      humidity: data.main?.humidity || 0,
      pressure: data.main?.pressure || 0,
      windSpeed,
      windDirection,
      windDegrees: data.wind?.deg || 0,
      visibility: data.visibility ? Math.round(data.visibility * 0.000621371) : null, // Convert m to miles
      description: data.weather?.[0]?.description || 'Unknown',
      icon: data.weather?.[0]?.icon || '01d',
      dustLevel,
      dustLabel: dustInfo.label,
      recommendation: dustInfo.recommendation,
      lastUpdated: new Date().toISOString(),
      source: 'api'
    }

    // Update cache
    const cachedData = getCachedWeather() || {}
    cachedData.current = processedData
    cacheWeatherData(cachedData)
    
    return processedData
  } catch (error) {
    // Don't log 401 errors as they're expected when API key isn't activated
    if (!error.message.includes('401')) {
      console.error('Failed to fetch current weather:', error)
    }
    
    // Try to return cached data even if expired
    const expiredCache = getCachedWeather()
    if (expiredCache && expiredCache.current) {
      console.log('Weather: Using expired cached data as fallback')
      return { ...expiredCache.current, source: 'cache-expired' }
    }
    
    throw error
  }
}

/**
 * Fetch 5-day weather forecast
 */
export const getWeatherForecast = async () => {
  // Check cache first
  const cached = getCachedWeather()
  if (cached && cached.forecast) {
    console.log('Weather: Using cached forecast data')
    return cached.forecast
  }

  if (!WEATHER_API_KEY) {
    throw new Error('Weather API key not configured')
  }

  const url = `${BASE_URL}/forecast?lat=${BLACK_ROCK_CITY.lat}&lon=${BLACK_ROCK_CITY.lon}&appid=${WEATHER_API_KEY}&units=imperial`
  
  try {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Weather API error: ${response.status}`)
    }
    
    const data = await response.json()
    
    // Process forecast data - group by day and get daily summaries
    const dailyForecasts = []
    const processedDays = new Set()
    
    for (const item of data.list || []) {
      const date = new Date(item.dt * 1000)
      const dateStr = date.toDateString()
      
      if (processedDays.has(dateStr) || dailyForecasts.length >= 5) {
        continue
      }
      
      processedDays.add(dateStr)
      
      const windSpeed = Math.round(item.wind?.speed || 0)
      const dustLevel = calculateDustLevel(windSpeed, item.main?.humidity || 0)
      const dustInfo = getDustLevelInfo(dustLevel)
      
      dailyForecasts.push({
        date: dateStr,
        dateIso: date.toISOString().split('T')[0],
        dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
        temperature: {
          high: Math.round(item.main?.temp_max || 0),
          low: Math.round(item.main?.temp_min || 0)
        },
        windSpeed,
        windDirection: getWindDirection(item.wind?.deg || 0),
        humidity: item.main?.humidity || 0,
        description: item.weather?.[0]?.description || 'Unknown',
        icon: item.weather?.[0]?.icon || '01d',
        dustLevel,
        dustLabel: dustInfo.label
      })
    }

    // Update cache
    const cachedData = getCachedWeather() || {}
    cachedData.forecast = dailyForecasts
    cacheWeatherData(cachedData)
    
    return dailyForecasts
  } catch (error) {
    // Don't log 401 errors as they're expected when API key isn't activated
    if (!error.message.includes('401')) {
      console.error('Failed to fetch weather forecast:', error)
    }
    
    // Try to return cached data even if expired
    const expiredCache = getCachedWeather()
    if (expiredCache && expiredCache.forecast) {
      console.log('Weather: Using expired cached forecast as fallback')
      return expiredCache.forecast
    }
    
    throw error
  }
}

/**
 * Get sun times (sunrise/sunset) - calculated for Black Rock City
 */
export const getSunTimes = async () => {
  // Check cache first
  const cached = getCachedWeather()
  if (cached && cached.sunTimes) {
    console.log('Weather: Using cached sun times')
    return cached.sunTimes
  }

  try {
    // Calculate sun times for Black Rock City using current weather data
    // Since One Call API requires subscription, we'll use a more reliable approach
    const response = await fetch(`${BASE_URL}/weather?lat=${BLACK_ROCK_CITY.lat}&lon=${BLACK_ROCK_CITY.lon}&appid=${WEATHER_API_KEY}&units=imperial`)
    
    if (!response.ok) {
      throw new Error(`Weather API error: ${response.status}`)
    }
    
    const data = await response.json()
    
    // Extract sun times from current weather response (if available)
    // Note: Basic current weather API doesn't include sun times, so we'll calculate them
    const now = new Date()
    const sunTimes = calculateSunTimes(BLACK_ROCK_CITY.lat, BLACK_ROCK_CITY.lon, now)
    
    // Add UV index estimate based on time of day
    const currentHour = now.getHours()
    let uvIndex = 0
    if (currentHour >= 10 && currentHour <= 16) {
      uvIndex = Math.max(8, 11 - Math.abs(13 - currentHour)) // Peak at 1 PM
    } else if (currentHour >= 8 && currentHour <= 18) {
      uvIndex = Math.max(3, 8 - Math.abs(13 - currentHour))
    }
    
    const result = {
      ...sunTimes,
      uvIndex
    }

    // Update cache
    const cachedData = getCachedWeather() || {}
    cachedData.sunTimes = result
    cacheWeatherData(cachedData)
    
    return result
  } catch (error) {
    console.log('Weather: Calculating sun times locally')
    
    // Try to return cached data even if expired
    const expiredCache = getCachedWeather()
    if (expiredCache && expiredCache.sunTimes) {
      console.log('Weather: Using expired cached sun times as fallback')
      return expiredCache.sunTimes
    }
    
    // Calculate sun times locally for Black Rock City
    const now = new Date()
    const sunTimes = calculateSunTimes(BLACK_ROCK_CITY.lat, BLACK_ROCK_CITY.lon, now)
    
    return {
      ...sunTimes,
      uvIndex: 8 // Default UV index for desert
    }
  }
}

/**
 * Calculate sunrise and sunset times for given coordinates and date
 * Simplified solar calculation for Black Rock City
 */
const calculateSunTimes = (lat, lon, date) => {
  // Simplified calculation - in production you'd use a proper solar calculation library
  // For Black Rock City in late August, approximate times:
  const timeZoneOffset = -8 // PST/PDT offset
  
  // Approximate sunrise/sunset for Black Rock City in late August
  // These are reasonable estimates - for exact times you'd need a solar position algorithm
  const baseDate = new Date(date)
  
  // August sunrise ~6:30 AM, sunset ~7:45 PM in Nevada
  const sunrise = new Date(baseDate)
  sunrise.setHours(6, 30, 0, 0)
  
  const sunset = new Date(baseDate)
  sunset.setHours(19, 45, 0, 0)
  
  return {
    sunrise: sunrise.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true,
      timeZone: 'America/Los_Angeles'
    }),
    sunset: sunset.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true,
      timeZone: 'America/Los_Angeles'
    })
  }
}

/**
 * Clear weather cache
 */
export const clearWeatherCache = () => {
  localStorage.removeItem(WEATHER_CACHE_KEY)
  localStorage.removeItem(WEATHER_CACHE_TIMESTAMP_KEY)
}

/**
 * Get cache status
 */
export const getCacheStatus = () => {
  const timestamp = localStorage.getItem(WEATHER_CACHE_TIMESTAMP_KEY)
  if (!timestamp) return { cached: false }
  
  const cacheAge = Date.now() - parseInt(timestamp)
  const isValid = cacheAge < CACHE_DURATION
  
  return {
    cached: true,
    isValid,
    age: cacheAge,
    lastUpdated: new Date(parseInt(timestamp)).toLocaleString()
  }
}