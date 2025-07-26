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

// Apple WeatherKit configuration - using Jeremy's credentials
const APPLE_WEATHER_CONFIG = {
  baseUrl: 'https://weatherkit.apple.com/api/v1',
  teamId: '7SWYPA4YZ5',
  serviceId: 'com.zinod.slackbot',
  keyId: '9XG6YW4RKV',
  privateKey: `-----BEGIN PRIVATE KEY-----
MIGTAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBHkwdwIBAQQguV2j2ReWGNbmmpHm
j4OJtSxFpZoLeytxZFWl8ye7KjWgCgYIKoZIzj0DAQehRANCAAS/QUicJKRG+szG
4kpmpMTk/LcctflXUyD9HHvhTYPszHkDd+XeZRUfftduNTfrWb6CL5Ua8ee+6H/s
wGiY+eKN
-----END PRIVATE KEY-----`,
  timezone: 'America/Los_Angeles',
  language: 'en'
}

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
 * Create JWT token for Apple WeatherKit authentication
 */
const createAppleJWT = async () => {
  const { teamId, serviceId, keyId, privateKey } = APPLE_WEATHER_CONFIG
  
  if (!privateKey) {
    throw new Error('Apple WeatherKit private key not configured')
  }

  try {
    // Import JOSE library for JWT creation
    const { SignJWT, importPKCS8 } = await import('jose')
    
    const now = Math.floor(Date.now() / 1000)
    const exp = now + 3600 // 1 hour expiration

    // Import the private key
    const privateKeyObject = await importPKCS8(privateKey, 'ES256')

    // Create and sign the JWT
    const jwt = await new SignJWT({
      iss: teamId,
      iat: now,
      exp: exp,
      sub: serviceId
    })
    .setProtectedHeader({
      alg: 'ES256',
      kid: keyId,
      id: `${teamId}.${serviceId}`
    })
    .sign(privateKeyObject)

    return jwt
  } catch (error) {
    console.error('Apple WeatherKit JWT generation failed:', error)
    throw new Error(`Apple WeatherKit authentication failed: ${error.message}`)
  }
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
    // Generate JWT token
    const token = await createAppleJWT()
    
    const { baseUrl, language, timezone } = APPLE_WEATHER_CONFIG
    
    // Build URL with query parameters - include moon data
    const params = new URLSearchParams({
      dataSets: 'currentWeather,forecastDaily,forecastHourly',
      timezone: timezone
    })
    const url = `${baseUrl}/weather/${language}/${BLACK_ROCK_CITY.lat}/${BLACK_ROCK_CITY.lon}?${params}`
    
    console.log('Apple WeatherKit URL:', url)
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`Apple Weather API error: ${response.status}`)
    }

    const data = await response.json()
    
    // Process Apple Weather data
    const current = data.currentWeather
    if (!current) {
      throw new Error('No current weather data from Apple WeatherKit')
    }

    const windSpeed = Math.round((current.windSpeed || 0) * 2.237) // Convert m/s to mph
    const dustLevel = convertAppleConditionToDustLevel(current.conditionCode, windSpeed)
    const dustInfo = getDustLevelInfo(dustLevel)
    
    // Extract moon phase data if available
    let moonPhase = null
    if (data.forecastDaily && data.forecastDaily.days && data.forecastDaily.days[0]) {
      const today = data.forecastDaily.days[0]
      if (today.moonPhase !== undefined) {
        moonPhase = {
          phase: today.moonPhase,
          phaseName: getMoonPhaseName(today.moonPhase),
          phaseIcon: getMoonPhaseIcon(today.moonPhase),
          moonrise: today.moonrise ? formatMoonTime(today.moonrise) : null,
          moonset: today.moonset ? formatMoonTime(today.moonset) : null
        }
      }
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
 * Format moon rise/set times
 */
const formatMoonTime = (timestamp) => {
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
 * Check if Apple WeatherKit is available
 */
export const isAppleWeatherAvailable = () => {
  const { teamId, serviceId, keyId, privateKey } = APPLE_WEATHER_CONFIG
  return !!(teamId && serviceId && keyId && privateKey)
}

/**
 * Clear Apple Weather cache
 */
export const clearAppleWeatherCache = () => {
  localStorage.removeItem(APPLE_WEATHER_CACHE_KEY)
  localStorage.removeItem(APPLE_WEATHER_CACHE_TIMESTAMP_KEY)
}