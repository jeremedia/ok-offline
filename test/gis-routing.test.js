import fs from 'node:fs'
import { beforeAll, describe, expect, it } from 'vitest'
import { setGISLayerData, setGISYear } from '../src/services/gisData.js'
import { findStreetIntersectionFromGIS } from '../src/utils/geocoding.js'
import { AddressBasedNetworkBuilder } from '../src/services/routing/addressBasedNetworkBuilder.js'
import { BRCPathfinder } from '../src/services/routing/pathfinder.js'

const gisRoot = new URL('../public/data/2026/gis/', import.meta.url)
let streetLines
let network
let builder

beforeAll(async () => {
  streetLines = JSON.parse(fs.readFileSync(new URL('street_lines.geojson', gisRoot), 'utf8'))
  setGISLayerData(2026, 'streetLines', streetLines)
  setGISYear(2026)
  builder = new AddressBasedNetworkBuilder()
  network = await builder.buildAddressBasedNetwork({ streetLines })
})

describe('official 2026 GIS routing', () => {
  it('loads all eight non-empty official FeatureCollections with allowed geometry', () => {
    const expected = {
      city_blocks: ['Polygon', 'MultiPolygon'],
      cpns: ['Point'],
      dmz: ['Polygon', 'MultiPolygon'],
      plazas: ['Polygon', 'MultiPolygon'],
      street_lines: ['LineString', 'MultiLineString'],
      street_outlines: ['Polygon', 'MultiPolygon'],
      toilets: ['Polygon', 'MultiPolygon'],
      trash_fence: ['Polygon', 'MultiPolygon']
    }

    for (const [name, allowedGeometry] of Object.entries(expected)) {
      const collection = JSON.parse(fs.readFileSync(new URL(`${name}.geojson`, gisRoot), 'utf8'))
      expect(collection.type).toBe('FeatureCollection')
      expect(collection.features.length).toBeGreaterThan(0)
      expect(collection.features.every(feature => allowedGeometry.includes(feature.geometry?.type))).toBe(true)
    }
  })

  it('resolves representative physical and quarter-hour intersections from GIS geometry', () => {
    // Quarter-hour paths physically begin at F in this pinned revision.
    for (const [clock, avenue] of [['3:30', 'A'], ['9:00', 'C'], ['3:15', 'F']]) {
      const coordinate = findStreetIntersectionFromGIS(clock, avenue)
      expect(coordinate).toHaveLength(2)
      expect(coordinate[0]).toBeGreaterThan(40)
      expect(coordinate[1]).toBeLessThan(-119)
    }
  })

  it('builds a positive connected cross-sector route for walking and biking', async () => {
    const start = builder.findNodeByAddress('3:30 & A')
    const finish = builder.findNodeByAddress('9:00 & C')
    expect(start).toBeTruthy()
    expect(finish).toBeTruthy()
    expect(network.nodes.size).toBeGreaterThan(100)
    expect(network.edges.size).toBeGreaterThan(100)
    expect([...network.edges.values()].every(edge => edge.distance > 0 && edge.walkTime > 0 && edge.bikeTime > 0)).toBe(true)

    const pathfinder = new BRCPathfinder(network)
    const walking = await pathfinder.findRoute(start.coordinates, finish.coordinates, 'walking')
    const biking = await pathfinder.findRoute(start.coordinates, finish.coordinates, 'biking')
    expect(walking?.distance).toBeGreaterThan(0)
    expect(walking?.duration).toBeGreaterThan(0)
    expect(biking?.distance).toBeGreaterThan(0)
    expect(biking?.duration).toBeGreaterThan(0)
    expect(biking.duration).toBeLessThan(walking.duration)
  })
})
