import assert from 'node:assert/strict'
import test from 'node:test'
import {
  assertPhaseAllowed,
  deduplicateEvents,
  fetchJson,
  sanitizeAndEnrich,
  syncSeason,
  validateCollection
} from '../scripts/sync-season-data.js'

const season = {
  locationRelease: {
    developer: '2026-08-09T00:00:00-07:00',
    camp: '2026-08-23T00:00:00-07:00',
    art: '2026-08-30T00:00:00-07:00'
  }
}

function event(uid = 'event-1', overrides = {}) {
  return {
    uid,
    title: `Event ${uid}`,
    year: 2026,
    occurrence_set: [{ start_time: '2026-08-30T17:00:00-07:00', end_time: '2026-08-30T18:00:00-07:00' }],
    ...overrides
  }
}

function validCollections(eventOverrides = {}) {
  return {
    camps: Array.from({ length: 1000 }, (_, index) => ({ uid: `camp-${index}`, name: `Camp ${index}`, year: 2026 })),
    art: Array.from({ length: 250 }, (_, index) => ({ uid: `art-${index}`, name: `Art ${index}`, year: 2026 })),
    events: Array.from({ length: 1800 }, (_, index) => event(`event-${index}`, index === 0 ? eventOverrides : {}))
  }
}

function options(overrides = {}) {
  return {
    year: '2026',
    phase: 'content-public',
    now: new Date('2026-07-20T12:00:00Z'),
    output: '/tmp/not-written',
    validateOnly: true,
    skipGis: true,
    ...overrides
  }
}

test('public phases cannot exceed the official date gate', () => {
  assert.doesNotThrow(() => assertPhaseAllowed(season, 'content-public', new Date('2026-07-20T12:00:00Z')))
  assert.throws(
    () => assertPhaseAllowed(season, 'camp-public', new Date('2026-08-22T23:59:59-07:00')),
    /cannot be published/
  )
  assert.doesNotThrow(() => assertPhaseAllowed(season, 'camp-public', new Date(season.locationRelease.camp)))
  assert.throws(
    () => assertPhaseAllowed(season, 'all-public', new Date('2026-08-29T23:59:59-07:00')),
    /cannot be published/
  )
})

test('private validation cannot run before the developer release', () => {
  assert.throws(
    () => assertPhaseAllowed(season, 'private-locations', new Date('2026-08-08T23:59:59-07:00')),
    /embargoed/
  )
  assert.doesNotThrow(() => assertPhaseAllowed(season, 'private-locations', new Date(season.locationRelease.developer)))
})

test('exact event duplicates deduplicate and divergent payloads fail closed', () => {
  const first = event()
  const result = deduplicateEvents([first, structuredClone(first)])
  assert.equal(result.events.length, 1)
  assert.equal(result.duplicateRows, 1)
  assert.throws(() => deduplicateEvents([first, event('event-1', { title: 'Changed' })]), /divergent/)
})

test('location phases strip and reveal camp and art independently', () => {
  const source = {
    camps: [{ uid: 'camp-1', name: 'Camp', year: 2026, location: { string: '3:30 & A' }, location_string: '3:30 & A' }],
    art: [{ uid: 'art-1', name: 'Art', year: 2026, location: { string: 'Deep Playa' }, location_string: 'Deep Playa' }],
    events: [
      event('camp-event', { hosted_by_camp: 'camp-1' }),
      event('art-event', { located_at_art: 'art-1' })
    ]
  }

  const content = sanitizeAndEnrich(source, 'content-public')
  assert.equal(content.camps[0].location_string, undefined)
  assert.equal(content.art[0].location_string, undefined)
  assert.equal(content.events[0].enriched_location, undefined)

  const camp = sanitizeAndEnrich(source, 'camp-public')
  assert.equal(camp.camps[0].location_string, '3:30 & A')
  assert.equal(camp.art[0].location_string, undefined)
  assert.equal(camp.events[0].enriched_location, '3:30 & A')
  assert.equal(camp.events[1].enriched_location, undefined)

  const all = sanitizeAndEnrich(source, 'all-public')
  assert.equal(all.art[0].location_string, 'Deep Playa')
  assert.equal(all.events[1].enriched_location, 'Deep Playa')
})

test('schema drift fails instead of being silently published', () => {
  const camps = Array.from({ length: 1000 }, (_, index) => ({
    uid: `camp-${index}`,
    name: `Camp ${index}`,
    year: 2026,
    unexpected_secret: 'nope'
  }))
  assert.throws(() => validateCollection('camp', camps, '2026'), /unknown fields/)
})

test('invalid event occurrences fail validation', () => {
  const events = Array.from({ length: 1800 }, (_, index) => event(`event-${index}`))
  events[100].occurrence_set[0].end_time = events[100].occurrence_set[0].start_time
  assert.throws(() => validateCollection('event', events, '2026'), /invalid occurrence range/)
})

test('HTTP, authentication, and HTML fallback responses fail closed', { concurrency: false }, async () => {
  const originalFetch = globalThis.fetch
  try {
    globalThis.fetch = async () => new Response('{"error":"unauthorized"}', {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    })
    await assert.rejects(() => fetchJson('https://example.test/camp'), /HTTP 401/)

    globalThis.fetch = async () => new Response('<!doctype html><title>SPA</title>', {
      status: 200,
      headers: { 'Content-Type': 'text/html' }
    })
    await assert.rejects(() => fetchJson('https://example.test/camp'), /unexpected Content-Type text\/html/)

    globalThis.fetch = async () => new Response('not-json', {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
    await assert.rejects(() => fetchJson('https://example.test/camp'), /invalid JSON/)
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('empty and incomplete collections fail their safety and schema gates', () => {
  assert.throws(() => validateCollection('camp', [], '2026'), /below safety floor/)
  const { camps } = validCollections()
  delete camps[10].name
  assert.throws(() => validateCollection('camp', camps, '2026'), /missing required field name/)
})

test('dangling references remain unlinked and are reported as warnings', async () => {
  const collections = validCollections({ hosted_by_camp: 'missing-camp' })
  const fetcher = async url => {
    if (url.includes('/camp?')) return collections.camps
    if (url.includes('/art?')) return collections.art
    return collections.events
  }

  const result = await syncSeason(options(), { apiKey: 'test-only', fetchJson: fetcher })
  assert.deepEqual(result.missingCampReferences, ['missing-camp'])
  assert.deepEqual(result.missingArtReferences, [])
})

test('an atomic writer failure is propagated and never reported as success', async () => {
  const collections = validCollections()
  const fetcher = async url => {
    if (url.includes('/camp?')) return collections.camps
    if (url.includes('/art?')) return collections.art
    return collections.events
  }
  let writes = 0
  const failingWriter = async () => {
    writes += 1
    throw new Error('simulated atomic rename failure')
  }

  await assert.rejects(
    () => syncSeason(options({ validateOnly: false }), {
      apiKey: 'test-only',
      fetchJson: fetcher,
      writeSnapshot: failingWriter
    }),
    /simulated atomic rename failure/
  )
  assert.equal(writes, 1)
})
