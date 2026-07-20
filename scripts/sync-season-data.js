#!/usr/bin/env node

import { createHash, randomUUID } from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import seasonRegistry from '../config/seasons.json' with { type: 'json' }

const API_BASE_URL = 'https://api.burningman.org/api'
const GIS_REPOSITORY = 'https://raw.githubusercontent.com/burningmantech/innovate-GIS-data'
const PUBLIC_PHASES = ['content-public', 'camp-public', 'all-public']
const ALL_PHASES = [...PUBLIC_PHASES, 'private-locations']
const TYPE_CONFIG = {
  camp: {
    fileName: 'camps.json',
    required: ['uid', 'name', 'year'],
    allowed: ['accepting_campers', 'contact_email', 'description', 'hometown', 'images', 'landmark', 'location', 'location_string', 'name', 'uid', 'url', 'year']
  },
  art: {
    fileName: 'art.json',
    required: ['uid', 'name', 'year'],
    allowed: ['artist', 'category', 'contact_email', 'description', 'donation_link', 'guided_tours', 'hometown', 'images', 'location', 'location_string', 'name', 'needs_volunteers', 'program', 'self_guided_tour_map', 'uid', 'url', 'year']
  },
  event: {
    fileName: 'events.json',
    required: ['uid', 'title', 'year', 'occurrence_set'],
    allowed: ['all_day', 'check_location', 'contact', 'description', 'event_id', 'event_type', 'hosted_by_camp', 'located_at_art', 'occurrence_set', 'other_location', 'print_description', 'slug', 'title', 'uid', 'url', 'year']
  }
}
const SAFETY_FLOORS = seasonRegistry.defaults.safetyFloors
const EXPECTED_GEOMETRY = {
  city_blocks: ['Polygon', 'MultiPolygon'],
  cpns: ['Point'],
  dmz: ['Polygon', 'MultiPolygon'],
  plazas: ['Polygon', 'MultiPolygon'],
  street_lines: ['LineString', 'MultiLineString'],
  street_outlines: ['Polygon', 'MultiPolygon'],
  toilets: ['Polygon', 'MultiPolygon'],
  trash_fence: ['Polygon', 'MultiPolygon']
}

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DEFAULT_DATA_ROOT = path.resolve(__dirname, '..', 'public', 'data')

function parseArgs(argv) {
  const options = {
    year: seasonRegistry.currentYear,
    phase: 'content-public',
    output: DEFAULT_DATA_ROOT,
    now: new Date(),
    validateOnly: false,
    skipGis: false
  }

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]
    if (arg === '--validate-only') options.validateOnly = true
    else if (arg === '--skip-gis') options.skipGis = true
    else if (arg === '--year') options.year = argv[++index]
    else if (arg === '--phase') options.phase = argv[++index]
    else if (arg === '--output') options.output = path.resolve(argv[++index])
    else if (arg === '--now') options.now = new Date(argv[++index])
    else throw new Error(`Unknown argument: ${arg}`)
  }

  if (!seasonRegistry.seasons[options.year]) throw new Error(`Unsupported season: ${options.year}`)
  if (!ALL_PHASES.includes(options.phase)) throw new Error(`Invalid phase: ${options.phase}`)
  if (Number.isNaN(options.now.getTime())) throw new Error('Invalid --now timestamp')
  return options
}

function maximumPublicPhase(season, now) {
  if (now >= new Date(season.locationRelease.art)) return 'all-public'
  if (now >= new Date(season.locationRelease.camp)) return 'camp-public'
  return 'content-public'
}

export function assertPhaseAllowed(season, phase, now) {
  if (phase === 'private-locations') {
    if (now < new Date(season.locationRelease.developer)) {
      throw new Error(`Private location validation is embargoed until ${season.locationRelease.developer}`)
    }
    return
  }

  const maximum = maximumPublicPhase(season, now)
  if (PUBLIC_PHASES.indexOf(phase) > PUBLIC_PHASES.indexOf(maximum)) {
    throw new Error(`Phase ${phase} cannot be published before its official release; maximum is ${maximum}`)
  }
}

export async function fetchJson(url, headers = {}, { requireJsonContentType = true } = {}) {
  const response = await fetch(url, { headers, signal: AbortSignal.timeout(30000) })
  if (!response.ok) throw new Error(`${url} returned HTTP ${response.status}`)

  const contentType = response.headers.get('content-type') || ''
  if (requireJsonContentType && !contentType.toLowerCase().includes('json')) {
    throw new Error(`${url} returned unexpected Content-Type ${contentType || '(missing)'}`)
  }

  try {
    return await response.json()
  } catch (error) {
    throw new Error(`${url} returned invalid JSON: ${error.message}`)
  }
}

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize)
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map(key => [key, canonicalize(value[key])]))
  }
  return value
}

function canonicalJson(value) {
  return JSON.stringify(canonicalize(value))
}

export function validateCollection(type, records, year) {
  const config = TYPE_CONFIG[type]
  if (!Array.isArray(records)) throw new Error(`${type} response must be an array`)
  if (records.length < SAFETY_FLOORS[type]) {
    throw new Error(`${type} count ${records.length} is below safety floor ${SAFETY_FLOORS[type]}`)
  }

  records.forEach((record, index) => {
    if (!record || typeof record !== 'object' || Array.isArray(record)) {
      throw new Error(`${type}[${index}] must be an object`)
    }
    for (const field of config.required) {
      const value = record[field]
      if (value === undefined || value === null || value === '') {
        throw new Error(`${type}[${index}] is missing required field ${field}`)
      }
    }
    if (Number(record.year) !== Number(year)) {
      throw new Error(`${type}[${index}] has year ${record.year}; expected ${year}`)
    }
    const unknown = Object.keys(record).filter(key => !config.allowed.includes(key))
    if (unknown.length > 0) throw new Error(`${type}[${index}] has unknown fields: ${unknown.join(', ')}`)

    if (type === 'event') {
      if (!Array.isArray(record.occurrence_set) || record.occurrence_set.length === 0) {
        throw new Error(`event ${record.uid} has no occurrences`)
      }
      record.occurrence_set.forEach(occurrence => {
        if (!occurrence.start_time || !occurrence.end_time) {
          throw new Error(`event ${record.uid} has an incomplete occurrence`)
        }
        if (new Date(occurrence.start_time) >= new Date(occurrence.end_time)) {
          throw new Error(`event ${record.uid} has an invalid occurrence range`)
        }
      })
    }
  })
}

export function deduplicateEvents(events) {
  const byUid = new Map()
  let duplicateRows = 0

  for (const event of events) {
    const existing = byUid.get(event.uid)
    if (!existing) {
      byUid.set(event.uid, event)
      continue
    }
    if (canonicalJson(existing) !== canonicalJson(event)) {
      throw new Error(`Event UID ${event.uid} has divergent duplicate payloads`)
    }
    duplicateRows += 1
  }

  return { events: [...byUid.values()], duplicateRows }
}

function hasLocation(record) {
  return Boolean(record.location || (record.location_string && !['TBD', 'Unknown'].includes(record.location_string)))
}

export function sanitizeAndEnrich({ camps, art, events }, phase) {
  const campLocationsPublic = phase === 'camp-public' || phase === 'all-public'
  const artLocationsPublic = phase === 'all-public'
  const publishedCamps = structuredClone(camps)
  const publishedArt = structuredClone(art)

  if (!campLocationsPublic) {
    publishedCamps.forEach(record => {
      delete record.location
      delete record.location_string
    })
  }
  if (!artLocationsPublic) {
    publishedArt.forEach(record => {
      delete record.location
      delete record.location_string
    })
  }

  const campByUid = new Map(publishedCamps.map(record => [record.uid, record]))
  const artByUid = new Map(publishedArt.map(record => [record.uid, record]))
  const publishedEvents = structuredClone(events).map(event => {
    delete event.enriched_location
    delete event.camp_name
    delete event.art_name

    const camp = event.hosted_by_camp ? campByUid.get(event.hosted_by_camp) : null
    if (camp && campLocationsPublic && hasLocation(camp)) {
      event.camp_name = camp.name
      event.enriched_location = camp.location_string
    }

    const artPiece = event.located_at_art ? artByUid.get(event.located_at_art) : null
    if (!event.enriched_location && artPiece && artLocationsPublic && hasLocation(artPiece)) {
      event.art_name = artPiece.name
      event.enriched_location = artPiece.location_string
    }
    return event
  })

  return { camps: publishedCamps, art: publishedArt, events: publishedEvents }
}

function referenceReport(camps, art, events) {
  const campUids = new Set(camps.map(record => record.uid))
  const artUids = new Set(art.map(record => record.uid))
  return {
    missingCampReferences: [...new Set(events.map(event => event.hosted_by_camp).filter(Boolean).filter(uid => !campUids.has(uid)))],
    missingArtReferences: [...new Set(events.map(event => event.located_at_art).filter(Boolean).filter(uid => !artUids.has(uid)))]
  }
}

function sha256(content) {
  return createHash('sha256').update(content).digest('hex')
}

async function fetchGis(season) {
  const revision = season.map.gisRevision
  const entries = []
  for (const file of season.map.gisFiles) {
    const url = `${GIS_REPOSITORY}/${revision}/${season.year}/GeoJSON/${file}.geojson`
    // GitHub serves pinned .geojson files as text/plain. The BM API calls keep
    // strict JSON content-type validation so an HTML auth/fallback response can
    // never become a published season snapshot.
    const data = await fetchJson(url, {}, { requireJsonContentType: false })
    if (data?.type !== 'FeatureCollection' || !Array.isArray(data.features) || data.features.length === 0) {
      throw new Error(`${file}.geojson is not a non-empty FeatureCollection`)
    }
    const unexpected = [...new Set(data.features.map(feature => feature?.geometry?.type))]
      .filter(type => !EXPECTED_GEOMETRY[file].includes(type))
    if (unexpected.length > 0) throw new Error(`${file}.geojson has unexpected geometry: ${unexpected.join(', ')}`)
    entries.push({ file: `${file}.geojson`, data })
  }
  return entries
}

export async function writeSnapshot(dataRoot, year, snapshot, metadata, gisEntries) {
  await fs.mkdir(dataRoot, { recursive: true })
  const stage = path.join(dataRoot, `.${year}-stage-${randomUUID()}`)
  const destination = path.join(dataRoot, year)
  const backup = path.join(dataRoot, `.${year}-backup-${randomUUID()}`)
  await fs.mkdir(path.join(stage, 'gis'), { recursive: true })

  try {
    const files = {
      'camps.json': `${JSON.stringify(snapshot.camps, null, 2)}\n`,
      'art.json': `${JSON.stringify(snapshot.art, null, 2)}\n`,
      'events.json': `${JSON.stringify(snapshot.events, null, 2)}\n`
    }
    for (const [file, content] of Object.entries(files)) {
      await fs.writeFile(path.join(stage, file), content)
      metadata.hashes[file] = sha256(content)
    }
    for (const entry of gisEntries) {
      const content = `${JSON.stringify(entry.data)}\n`
      await fs.writeFile(path.join(stage, 'gis', entry.file), content)
      metadata.hashes[`gis/${entry.file}`] = sha256(content)
    }
    await fs.writeFile(path.join(stage, 'metadata.json'), `${JSON.stringify(metadata, null, 2)}\n`)

    let hadDestination = false
    try {
      await fs.rename(destination, backup)
      hadDestination = true
    } catch (error) {
      if (error.code !== 'ENOENT') throw error
    }

    try {
      await fs.rename(stage, destination)
      if (hadDestination) await fs.rm(backup, { recursive: true, force: true })
    } catch (error) {
      if (hadDestination) await fs.rename(backup, destination)
      throw error
    }
  } finally {
    await fs.rm(stage, { recursive: true, force: true })
    await fs.rm(backup, { recursive: true, force: true })
  }
}

export async function syncSeason(options, dependencies = {}) {
  const season = seasonRegistry.seasons[options.year]
  assertPhaseAllowed(season, options.phase, options.now)
  const apiKey = dependencies.apiKey ?? process.env.BM_API_KEY
  if (!apiKey) throw new Error('BM_API_KEY is required')
  const fetcher = dependencies.fetchJson ?? fetchJson
  const headers = { 'X-API-Key': apiKey }

  const [camps, art, eventRows] = await Promise.all(
    ['camp', 'art', 'event'].map(type => fetcher(`${API_BASE_URL}/${type}?year=${options.year}`, headers))
  )
  validateCollection('camp', camps, options.year)
  validateCollection('art', art, options.year)
  validateCollection('event', eventRows, options.year)

  const { events, duplicateRows } = deduplicateEvents(eventRows)
  const references = referenceReport(camps, art, events)
  const rawLocationCounts = {
    camp: camps.filter(hasLocation).length,
    art: art.filter(hasLocation).length
  }
  const report = {
    year: options.year,
    phase: options.phase,
    fetchedAt: options.now.toISOString(),
    sourceCounts: { camps: camps.length, art: art.length, eventRows: eventRows.length, uniqueEvents: events.length },
    duplicateEventRows: duplicateRows,
    rawLocationCounts,
    ...references
  }

  if (options.phase === 'private-locations') return report

  const snapshot = sanitizeAndEnrich({ camps, art, events }, options.phase)
  const gisEntries = options.skipGis ? [] : await (dependencies.fetchGis ?? fetchGis)(season)
  const metadata = {
    ...report,
    publishedCounts: { camps: snapshot.camps.length, art: snapshot.art.length, events: snapshot.events.length },
    publishedLocationCounts: {
      camp: snapshot.camps.filter(hasLocation).length,
      art: snapshot.art.filter(hasLocation).length,
      enrichedEvents: snapshot.events.filter(event => event.enriched_location).length
    },
    source: { api: API_BASE_URL, gisRepository: GIS_REPOSITORY, gisRevision: season.map.gisRevision },
    locationRelease: season.locationRelease,
    hashes: {}
  }

  if (!options.validateOnly) {
    await (dependencies.writeSnapshot ?? writeSnapshot)(options.output, options.year, snapshot, metadata, gisEntries)
  }
  return metadata
}

export async function runCli(argv = process.argv.slice(2)) {
  const options = parseArgs(argv)
  const result = await syncSeason(options)
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`)
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  runCli().catch(error => {
    process.stderr.write(`Season sync failed: ${error.message}\n`)
    process.exitCode = 1
  })
}
