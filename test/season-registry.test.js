import { describe, expect, it } from 'vitest'
import {
  CURRENT_YEAR,
  SEASON_DEFAULTS,
  SUPPORTED_YEARS,
  canPublishLocation,
  getMaximumPublicLocationPhase,
  getSeason,
  getSeasonDays,
  isBasemapAvailable,
  isBasemapVisibleByDefault
} from '../src/config/seasons.js'

describe('canonical season policy', () => {
  it('defines 2026 as current while retaining historical seasons', () => {
    expect(CURRENT_YEAR).toBe('2026')
    expect(SUPPORTED_YEARS).toEqual(['2026', '2025', '2024', '2023'])
    expect(SEASON_DEFAULTS).toMatchObject({ newInstallYear: '2026', releasePhase: 'content-public' })
    expect(getSeason('2026').timezone).toBe('America/Los_Angeles')
  })

  it('generates all nine official event days', () => {
    const days = getSeasonDays('2026')
    expect(days).toHaveLength(9)
    expect(days[0].date).toBe('2026-08-30')
    expect(days.at(-1).date).toBe('2026-09-07')
  })

  it('keeps camp and art publication gates independent', () => {
    const beforeCamp = new Date('2026-08-22T23:59:59-07:00')
    const campRelease = new Date('2026-08-23T00:00:00-07:00')
    const artRelease = new Date('2026-08-30T00:00:00-07:00')

    expect(getMaximumPublicLocationPhase('2026', beforeCamp)).toBe('content-public')
    expect(canPublishLocation('camp', '2026', beforeCamp)).toBe(false)
    expect(canPublishLocation('camp', '2026', campRelease)).toBe(true)
    expect(canPublishLocation('art', '2026', campRelease)).toBe(false)
    expect(canPublishLocation('art', '2026', artRelease)).toBe(true)
  })

  it('keeps the legacy raster basemap off until a season publishes one', () => {
    expect(isBasemapAvailable('2026')).toBe(false)
    expect(isBasemapVisibleByDefault('2026')).toBe(false)
    expect(isBasemapAvailable('2025')).toBe(true)
    expect(isBasemapVisibleByDefault('2025')).toBe(true)
  })
})
