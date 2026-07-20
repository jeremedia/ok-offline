#!/usr/bin/env node

import { createHash } from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import seasons from '../config/seasons.json' with { type: 'json' }

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function parseArgs(argv) {
  const options = { year: seasons.currentYear, phase: null, root: path.resolve(__dirname, '..', 'public', 'data') }
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index]
    if (argument === '--year') options.year = argv[++index]
    else if (argument === '--phase') options.phase = argv[++index]
    else if (argument === '--root') options.root = path.resolve(argv[++index])
    else throw new Error(`Unknown argument: ${argument}`)
  }
  if (!seasons.seasons[options.year]) throw new Error(`Unsupported season ${options.year}`)
  return options
}

function sha256(content) {
  return createHash('sha256').update(content).digest('hex')
}

function hasPlacement(record) {
  return Object.hasOwn(record, 'location') || Object.hasOwn(record, 'location_string')
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

async function readJson(file) {
  const content = await fs.readFile(file, 'utf8')
  return { content, value: JSON.parse(content) }
}

export async function verifySeasonArtifact(options) {
  const directory = path.join(options.root, options.year)
  const { value: metadata } = await readJson(path.join(directory, 'metadata.json'))
  const phase = options.phase || metadata.phase
  assert(metadata.year === options.year, `metadata year ${metadata.year} does not match ${options.year}`)
  assert(metadata.phase === phase, `metadata phase ${metadata.phase} does not match ${phase}`)

  const collections = {}
  for (const [type, file] of Object.entries({ camps: 'camps.json', art: 'art.json', events: 'events.json' })) {
    const { content, value } = await readJson(path.join(directory, file))
    assert(Array.isArray(value), `${file} is not an array`)
    assert(metadata.hashes[file] === sha256(content), `${file} hash does not match metadata`)
    assert(value.length === metadata.publishedCounts[type], `${file} count does not match metadata`)
    assert(new Set(value.map(record => record.uid)).size === value.length, `${file} contains duplicate UIDs`)
    collections[type] = value
  }

  const season = seasons.seasons[options.year]
  for (const gisFile of season.map.gisFiles) {
    const relative = `gis/${gisFile}.geojson`
    const { content, value } = await readJson(path.join(directory, relative))
    assert(value?.type === 'FeatureCollection' && Array.isArray(value.features) && value.features.length > 0, `${relative} is invalid`)
    assert(metadata.hashes[relative] === sha256(content), `${relative} hash does not match metadata`)
  }

  const campPublic = phase === 'camp-public' || phase === 'all-public'
  const artPublic = phase === 'all-public'
  if (!campPublic) assert(collections.camps.every(record => !hasPlacement(record)), 'camp placement leaked before August 23')
  if (!artPublic) assert(collections.art.every(record => !hasPlacement(record)), 'art placement leaked before August 30')

  const camps = new Map(collections.camps.map(record => [record.uid, record]))
  const art = new Map(collections.art.map(record => [record.uid, record]))
  for (const event of collections.events) {
    if (!event.enriched_location) continue
    const camp = event.hosted_by_camp ? camps.get(event.hosted_by_camp) : null
    const artPiece = event.located_at_art ? art.get(event.located_at_art) : null
    const allowedCampLocation = campPublic && camp?.location_string
    const allowedArtLocation = artPublic && artPiece?.location_string
    assert(
      event.enriched_location === allowedCampLocation || (!allowedCampLocation && event.enriched_location === allowedArtLocation),
      `event ${event.uid} has enrichment from an unpublished or incorrect host relation`
    )
  }
  if (!campPublic && !artPublic) {
    assert(collections.events.every(event => !event.enriched_location), 'event enrichment leaked in content-public phase')
  }
  if (campPublic && !artPublic) {
    assert(collections.events.every(event => !event.enriched_location || camps.get(event.hosted_by_camp)?.location_string === event.enriched_location), 'art enrichment leaked in camp-public phase')
  }

  const locationCounts = {
    camp: collections.camps.filter(hasPlacement).length,
    art: collections.art.filter(hasPlacement).length,
    enrichedEvents: collections.events.filter(event => event.enriched_location).length
  }
  assert(JSON.stringify(locationCounts) === JSON.stringify(metadata.publishedLocationCounts), 'published location counts do not match metadata')

  return {
    year: options.year,
    phase,
    counts: metadata.publishedCounts,
    locations: locationCounts,
    gisRevision: metadata.source.gisRevision
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  verifySeasonArtifact(parseArgs(process.argv.slice(2)))
    .then(result => process.stdout.write(`${JSON.stringify(result, null, 2)}\n`))
    .catch(error => {
      process.stderr.write(`Artifact verification failed: ${error.message}\n`)
      process.exitCode = 1
    })
}
