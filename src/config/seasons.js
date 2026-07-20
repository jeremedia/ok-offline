import registry from '../../config/seasons.json'

export const CURRENT_YEAR = registry.currentYear
export const SUPPORTED_YEARS = Object.freeze([...registry.supportedYears])
export const SEASON_DEFAULTS = Object.freeze(registry.defaults)
export const SEASONS = Object.freeze(registry.seasons)

export function getSeason(year = CURRENT_YEAR) {
  const season = SEASONS[String(year)]
  if (!season) throw new Error(`Unsupported OK-OFFLINE season: ${year}`)
  return season
}

export function isSupportedYear(year) {
  return SUPPORTED_YEARS.includes(String(year))
}

export function getSeasonCenter(year = CURRENT_YEAR) {
  return [...getSeason(year).map.center]
}

export function getSeasonDays(year = CURRENT_YEAR) {
  const { eventStart, eventEnd, timezone } = getSeason(year)
  const dates = []
  const cursor = new Date(`${eventStart}T12:00:00Z`)
  const end = new Date(`${eventEnd}T12:00:00Z`)

  while (cursor <= end) {
    const iso = cursor.toISOString().slice(0, 10)
    const label = new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      month: 'numeric',
      day: 'numeric',
      timeZone: timezone
    }).format(cursor)
    dates.push({ date: iso, label })
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  }

  return dates
}

export function getMaximumPublicLocationPhase(year = CURRENT_YEAR, now = new Date()) {
  const release = getSeason(year).locationRelease
  if (now >= new Date(release.art)) return 'all-public'
  if (now >= new Date(release.camp)) return 'camp-public'
  return 'content-public'
}

export function canPublishLocation(type, year = CURRENT_YEAR, now = new Date()) {
  const release = getSeason(year).locationRelease
  if (type === 'camp') return now >= new Date(release.camp)
  if (type === 'art') return now >= new Date(release.art)
  return false
}

export default registry
