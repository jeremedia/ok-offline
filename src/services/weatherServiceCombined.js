/**
 * Weather client for the server-owned provider chain.
 *
 * Provider credentials never enter the PWA. Rails uses OpenWeather first,
 * WeatherKit second, and a labeled stale response when both providers fail.
 */
import { CURRENT_YEAR, SUPPORTED_YEARS, getSeason } from '../config/seasons'

const RAILS_WEATHER_API_URL = '/api/v1/weather/current'
const CLIENT_CACHE_PREFIX = 'ok_offline_weather'
const CLIENT_STALE_TTL = 7 * 24 * 60 * 60 * 1000

let pendingRequest = null

function selectedYear() {
  const storedYear = globalThis.localStorage?.getItem('selectedYear')
  return storedYear && /^\d{4}$/.test(storedYear) ? storedYear : CURRENT_YEAR
}

function cacheKey(year) {
  return `${CLIENT_CACHE_PREFIX}_${year}`
}

function readClientCache(year) {
  try {
    const raw = globalThis.localStorage?.getItem(cacheKey(year))
    if (!raw) return null
    const cached = JSON.parse(raw)
    const ageMs = Date.now() - new Date(cached.cachedAt).getTime()
    if (!Number.isFinite(ageMs) || ageMs > CLIENT_STALE_TTL) return null
    return { ...cached, ageSeconds: Math.max(0, Math.round(ageMs / 1000)) }
  } catch {
    return null
  }
}

function writeClientCache(year, payload) {
  globalThis.localStorage?.setItem(cacheKey(year), JSON.stringify({
    ...payload,
    cachedAt: new Date().toISOString()
  }))
}

function windDirection(degrees) {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW']
  return directions[Math.round((Number(degrees) || 0) / 22.5) % directions.length]
}

function dustInfo(level) {
  const normalized = level === 'minimal' ? 'clear' : level === 'severe' ? 'whiteout' : level
  const details = {
    clear: ['Clear', 'Perfect conditions! Great visibility and minimal dust.'],
    light: ['Light Dust', 'Some dust in the air. Consider carrying a dust mask.'],
    moderate: ['Moderate Dust', 'Dust mask recommended. Secure loose items in camp.'],
    heavy: ['Heavy Dust', 'Full protection needed. Goggles and N95 mask essential.'],
    whiteout: ['Whiteout Conditions', 'Seek shelter immediately! Near-zero visibility.'],
    unknown: ['Unknown', 'Weather conditions are currently unavailable.']
  }
  const [label, recommendation] = details[normalized] || details.unknown
  return { level: normalized || 'unknown', label, recommendation }
}

function weatherIcon(condition) {
  const value = String(condition || '').toLowerCase()
  if (value.includes('clear')) return '01d'
  if (value.includes('cloud')) return '04d'
  if (value.includes('rain') || value.includes('storm')) return '10d'
  if (value.includes('snow')) return '13d'
  if (value.includes('fog') || value.includes('haze') || value.includes('smoke')) return '50d'
  return '01d'
}

function moonPhaseIcon(phaseName) {
  const phase = String(phaseName || '').toLowerCase()
  if (phase.includes('waxing crescent')) return '🌒'
  if (phase.includes('first quarter')) return '🌓'
  if (phase.includes('waxing gibbous')) return '🌔'
  if (phase.includes('full')) return '🌕'
  if (phase.includes('waning gibbous')) return '🌖'
  if (phase.includes('last quarter')) return '🌗'
  if (phase.includes('waning crescent')) return '🌘'
  return '🌑'
}

function normalizeResponse(result) {
  if (!result?.data || !result?.meta) throw new Error('Weather API returned an invalid response')
  const data = result.data
  const meta = result.meta
  const dust = dustInfo(data.dustLevel)

  return {
    current: {
      temperature: Math.round(Number(data.temperature) || 0),
      feelsLike: Math.round(Number(data.feelsLike) || 0),
      humidity: Math.round(Number(data.humidity) || 0),
      pressure: Math.round(Number(data.pressure) || 0),
      windSpeed: Math.round(Number(data.windSpeed) || 0),
      windDirection: windDirection(data.windDirection),
      windDegrees: Number(data.windDirection) || 0,
      visibility: data.visibility == null ? null : Math.round(Number(data.visibility)),
      description: data.conditionDescription || data.condition || 'Unknown',
      icon: weatherIcon(data.condition),
      dustLevel: dust.level,
      dustLabel: dust.label,
      recommendation: dust.recommendation,
      moonPhase: data.moonPhase ? {
        ...data.moonPhase,
        phaseName: data.moonPhase.phase || 'Unknown',
        phaseIcon: moonPhaseIcon(data.moonPhase.phase)
      } : null,
      lastUpdated: meta.lastUpdated || new Date().toISOString(),
      source: `rails-${meta.source || 'weather'}`,
      stale: Boolean(meta.stale),
      ageSeconds: meta.ageSeconds ?? null
    },
    forecast: (Array.isArray(data.forecast) ? data.forecast : []).map(day => {
      const date = new Date(day.date)
      return {
        date: Number.isNaN(date.getTime()) ? day.date : date.toDateString(),
        dateIso: Number.isNaN(date.getTime()) ? day.date : date.toISOString().slice(0, 10),
        dayName: Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString('en-US', { weekday: 'short' }),
        temperature: {
          high: Math.round(Number(day.temperatureMax) || 0),
          low: Math.round(Number(day.temperatureMin) || 0)
        },
        windSpeed: Math.round(Number(day.windSpeed) || 0),
        windDirection: windDirection(day.windDirection),
        humidity: Math.round(Number(day.humidity) || 0),
        description: day.conditionDescription || day.condition || 'Unknown',
        icon: weatherIcon(day.condition),
        precipitationProbability: Number(day.precipitationProbability) || 0
      }
    }),
    sun: {
      sunrise: data.sunrise || null,
      sunset: data.sunset || null,
      civilTwilightStart: data.civilTwilightStart || null,
      civilTwilightEnd: data.civilTwilightEnd || null,
      nauticalTwilightStart: data.nauticalTwilightStart || null,
      nauticalTwilightEnd: data.nauticalTwilightEnd || null,
      astronomicalTwilightStart: data.astronomicalTwilightStart || null,
      astronomicalTwilightEnd: data.astronomicalTwilightEnd || null
    },
    meta
  }
}

async function fetchWeather() {
  if (pendingRequest) return pendingRequest

  const year = selectedYear()
  const season = getSeason(year)
  const [latitude, longitude] = season.map.center

  pendingRequest = (async () => {
    try {
      const response = await fetch(RAILS_WEATHER_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ latitude, longitude, timezone: season.timezone, year })
      })
      if (!response.ok) throw new Error(`Weather API returned ${response.status}`)
      const payload = normalizeResponse(await response.json())
      writeClientCache(year, payload)
      return payload
    } catch (error) {
      const cached = readClientCache(year)
      if (!cached) throw error
      return {
        ...cached,
        current: {
          ...cached.current,
          source: 'client-cache',
          stale: true,
          ageSeconds: cached.ageSeconds
        },
        meta: {
          ...cached.meta,
          source: 'client-cache',
          stale: true,
          ageSeconds: cached.ageSeconds
        }
      }
    } finally {
      pendingRequest = null
    }
  })()

  return pendingRequest
}

export async function getCurrentWeatherRobust() {
  return (await fetchWeather()).current
}

export async function getWeatherForecastRobust() {
  return (await fetchWeather()).forecast
}

export async function getSunTimesRobust() {
  return (await fetchWeather()).sun
}

export function clearAllWeatherCaches() {
  for (const year of SUPPORTED_YEARS) {
    globalThis.localStorage?.removeItem(cacheKey(year))
  }
}

export function getWeatherServiceStatus() {
  const year = selectedYear()
  const cached = readClientCache(year)
  return {
    serverManaged: true,
    available: true,
    cache: cached ? { cached: true, ageSeconds: cached.ageSeconds } : { cached: false },
    fallbackStrategy: ['OpenWeather via Rails', 'Apple WeatherKit via Rails', 'Labeled stale server cache', 'Labeled PWA cache']
  }
}
