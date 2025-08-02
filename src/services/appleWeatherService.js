/**
 * Apple WeatherKit Service
 * Provides weather data using Apple's WeatherKit API as a fallback
 * Requires Apple Developer credentials and JWT authentication
 */

// Black Rock City coordinates
const BLACK_ROCK_CITY = {
  lat: 40.788645,
  lon: -119.203018,
  name: 'Black Rock City, NV'
}

// Rails API endpoint for Apple WeatherKit proxy
const RAILS_WEATHER_API = import.meta.env.DEV 
  ? 'http://100.104.170.10:3555/api/v1/weather/current'
  : '/api/v1/weather/current'

// Cache keys
const APPLE_WEATHER_CACHE_KEY = 'apple_weather_data_cache'
const APPLE_WEATHER_CACHE_TIMESTAMP_KEY = 'apple_weather_cache_timestamp'
const CACHE_DURATION = 10 * 60 * 1000 // 10 minutes

/**
 * Check if cached Apple Weather data is still valid
 */
const isAppleCacheValid = () => {
  const timestamp = localStorage.getItem(APPLE_WEATHER_CACHE_TIMESTAMP_KEY)
  if (!timestamp) return false
  
  const cacheAge = Date.now() - parseInt(timestamp)
  return cacheAge < CACHE_DURATION
}

/**
 * Get cached Apple Weather data
 */
const getCachedAppleWeather = () => {
  if (isAppleCacheValid()) {
    const cached = localStorage.getItem(APPLE_WEATHER_CACHE_KEY)
    return cached ? JSON.parse(cached) : null
  }
  return null
}

/**
 * Cache Apple Weather data
 */
const cacheAppleWeatherData = (data) => {
  localStorage.setItem(APPLE_WEATHER_CACHE_KEY, JSON.stringify(data))
  localStorage.setItem(APPLE_WEATHER_CACHE_TIMESTAMP_KEY, Date.now().toString())
}


/**
 * Convert Apple Weather condition codes to our dust levels
 */
const convertAppleConditionToDustLevel = (conditionCode, windSpeed) => {
  // Apple weather condition codes mapping
  // This would need to be refined based on actual Apple condition codes
  if (windSpeed >= 25) return 'whiteout'
  if (windSpeed >= 20) return 'heavy'
  if (windSpeed >= 15) return 'moderate'
  if (windSpeed >= 10) return 'light'
  return 'clear'
}

/**
 * Get dust level info
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
 * Fetch current weather from Apple WeatherKit
 */
export const getCurrentWeatherFromApple = async () => {
  // Check cache first
  const cached = getCachedAppleWeather()
  if (cached && cached.current) {
    console.log('Apple Weather: Using cached current weather data')
    return cached.current
  }

  try {
    // Debug logging
    console.log('🔧 Environment DEV:', import.meta.env.DEV)
    console.log('🔧 API Endpoint:', RAILS_WEATHER_API)
    
    // Call Rails API proxy for Apple Weather data
    const response = await fetch(RAILS_WEATHER_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        latitude: BLACK_ROCK_CITY.lat,
        longitude: BLACK_ROCK_CITY.lon,
        dataSets: 'currentWeather,forecastDaily,forecastHourly',
        timezone: 'America/Los_Angeles'
      })
    })

    if (!response.ok) {
      throw new Error(`Apple Weather API error: ${response.status}`)
    }

    const data = await response.json()
    
    // Log full response for exploration (only in development)
    if (import.meta.env.DEV) {
      console.log('🌤️ Full Apple Weather Response:', JSON.stringify(data, null, 2))
      localStorage.setItem('apple_weather_full_response', JSON.stringify(data, null, 2))
      console.log('💾 Full response saved to localStorage as "apple_weather_full_response"')
    }
    
    // Process Apple Weather data
    const current = data.currentWeather
    if (!current) {
      throw new Error('No current weather data from Apple WeatherKit')
    }

    const windSpeed = Math.round((current.windSpeed || 0) * 2.237) // Convert m/s to mph
    const dustLevel = convertAppleConditionToDustLevel(current.conditionCode, windSpeed)
    const dustInfo = getDustLevelInfo(dustLevel)
    
    // Extract moon phase and twilight data if available
    let moonPhase = null
    let twilightTimes = null
    
    console.log('Apple Weather response structure:', {
      hasForecastDaily: !!data.forecastDaily,
      hasDays: !!(data.forecastDaily && data.forecastDaily.days),
      daysLength: data.forecastDaily && data.forecastDaily.days ? data.forecastDaily.days.length : 0,
      firstDay: data.forecastDaily && data.forecastDaily.days && data.forecastDaily.days[0] ? Object.keys(data.forecastDaily.days[0]) : []
    })
    
    if (data.forecastDaily && data.forecastDaily.days && data.forecastDaily.days[0]) {
      const today = data.forecastDaily.days[0]
      console.log('Today forecast data keys:', Object.keys(today))
      
      // Extract moon phase data
      if (today.moonPhase !== undefined) {
        moonPhase = {
          phase: today.moonPhase,
          phaseName: getMoonPhaseName(today.moonPhase),
          phaseIcon: getMoonPhaseIcon(today.moonPhase),
          moonrise: today.moonrise ? formatAppleTime(today.moonrise) : null,
          moonset: today.moonset ? formatAppleTime(today.moonset) : null
        }
        console.log('🌙 Moon phase extracted:', moonPhase)
      }
      
      // Extract twilight/sun times - try various possible field names
      const possibleSunFields = [
        'sunrise', 'sunriseTime', 'sunRise',
        'sunset', 'sunsetTime', 'sunSet',
        'civilTwilightStart', 'civilTwilightBegin', 'civilDawnStart',
        'civilTwilightEnd', 'civilTwilightFinish', 'civilDuskEnd',
        'nauticalTwilightStart', 'nauticalTwilightBegin', 'nauticalDawnStart',
        'nauticalTwilightEnd', 'nauticalTwilightFinish', 'nauticalDuskEnd',
        'astronomicalTwilightStart', 'astronomicalTwilightBegin', 'astronomicalDawnStart',
        'astronomicalTwilightEnd', 'astronomicalTwilightFinish', 'astronomicalDuskEnd',
        'solarNoon'
      ]
      
      const foundSunFields = {}
      possibleSunFields.forEach(field => {
        if (today[field] !== undefined) {
          foundSunFields[field] = today[field]
        }
      })
      
      console.log('🌅 Found sun/twilight fields:', foundSunFields)
      
      // Create twilight times object with found data
      if (Object.keys(foundSunFields).length > 0) {
        twilightTimes = {
          sunrise: today.sunrise ? formatAppleTime(today.sunrise) : 
                   today.sunriseTime ? formatAppleTime(today.sunriseTime) : 
                   today.sunRise ? formatAppleTime(today.sunRise) : null,
          sunset: today.sunset ? formatAppleTime(today.sunset) : 
                  today.sunsetTime ? formatAppleTime(today.sunsetTime) : 
                  today.sunSet ? formatAppleTime(today.sunSet) : null,
          civilTwilightStart: today.civilTwilightStart ? formatAppleTime(today.civilTwilightStart) : 
                              today.civilTwilightBegin ? formatAppleTime(today.civilTwilightBegin) : null,
          civilTwilightEnd: today.civilTwilightEnd ? formatAppleTime(today.civilTwilightEnd) : 
                            today.civilTwilightFinish ? formatAppleTime(today.civilTwilightFinish) : null,
          nauticalTwilightStart: today.nauticalTwilightStart ? formatAppleTime(today.nauticalTwilightStart) : null,
          nauticalTwilightEnd: today.nauticalTwilightEnd ? formatAppleTime(today.nauticalTwilightEnd) : null,
          astronomicalTwilightStart: today.astronomicalTwilightStart ? formatAppleTime(today.astronomicalTwilightStart) : null,
          astronomicalTwilightEnd: today.astronomicalTwilightEnd ? formatAppleTime(today.astronomicalTwilightEnd) : null,
          solarNoon: today.solarNoon ? formatAppleTime(today.solarNoon) : null
        }
        console.log('🌅 Twilight times extracted:', twilightTimes)
      }
    } else {
      console.log('⚠️ No forecast daily data or days array')
    }

    const processedData = {
      temperature: Math.round((current.temperature - 273.15) * 9/5 + 32), // Convert K to F
      feelsLike: Math.round((current.temperatureApparent - 273.15) * 9/5 + 32),
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
      moonPhase,
      twilightTimes,
      lastUpdated: new Date().toISOString(),
      source: 'apple-api'
    }

    // Update cache
    const cachedData = getCachedAppleWeather() || {}
    cachedData.current = processedData
    cacheAppleWeatherData(cachedData)
    
    return processedData
  } catch (error) {
    console.error('Failed to fetch Apple Weather data:', error)
    
    // Try to return cached data even if expired
    const expiredCache = getCachedAppleWeather()
    if (expiredCache && expiredCache.current) {
      console.log('Apple Weather: Using expired cached data as fallback')
      return { ...expiredCache.current, source: 'apple-cache-expired' }
    }
    
    throw error
  }
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
 * Map Apple weather icons to standard icons
 */
const mapAppleIconToStandard = (conditionCode) => {
  // This would need to be refined based on actual Apple condition codes
  const iconMap = {
    'Clear': '01d',
    'MostlyClear': '02d',
    'PartlyCloudy': '03d',
    'MostlyCloudy': '04d',
    'Cloudy': '04d',
    'Fog': '50d',
    'WindyVariant': '50d',
    'Windy': '50d'
  }
  return iconMap[conditionCode] || '01d'
}

/**
 * Get moon phase name from Apple's phase value (0-1)
 */
const getMoonPhaseName = (phase) => {
  // Apple returns moon phase as 0-1 value
  if (phase === 0 || phase === 1) return 'New Moon'
  if (phase < 0.25) return 'Waxing Crescent'
  if (phase === 0.25) return 'First Quarter'
  if (phase < 0.5) return 'Waxing Gibbous'
  if (phase === 0.5) return 'Full Moon'
  if (phase < 0.75) return 'Waning Gibbous'
  if (phase === 0.75) return 'Last Quarter'
  return 'Waning Crescent'
}

/**
 * Get moon phase icon/emoji
 */
const getMoonPhaseIcon = (phase) => {
  // Apple returns moon phase as 0-1 value
  if (phase === 0 || phase === 1) return '🌑' // New Moon
  if (phase < 0.25) return '🌒' // Waxing Crescent
  if (phase === 0.25) return '🌓' // First Quarter
  if (phase < 0.5) return '🌔' // Waxing Gibbous
  if (phase === 0.5) return '🌕' // Full Moon
  if (phase < 0.75) return '🌖' // Waning Gibbous
  if (phase === 0.75) return '🌗' // Last Quarter
  return '🌘' // Waning Crescent
}

/**
 * Format Apple Weather timestamp (works for sun, moon, twilight times)
 */
const formatAppleTime = (timestamp) => {
  if (!timestamp) return null
  
  const date = new Date(timestamp * 1000)
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'America/Los_Angeles'
  })
}

/**
 * Get Apple Weather forecast
 */
export const getAppleWeatherForecast = async () => {
  // For brevity, this would follow a similar pattern to getCurrentWeatherFromApple
  // but process the forecastDaily data from the Apple WeatherKit response
  throw new Error('Apple Weather forecast not yet implemented')
}

/**
 * Check if Apple WeatherKit is available via Rails API
 */
export const isAppleWeatherAvailable = () => {
  // Apple Weather is now available through Rails API proxy
  return true
}

/**
 * Clear Apple Weather cache
 */
export const clearAppleWeatherCache = () => {
  localStorage.removeItem(APPLE_WEATHER_CACHE_KEY)
  localStorage.removeItem(APPLE_WEATHER_CACHE_TIMESTAMP_KEY)
}