const OFFICIAL_INFRASTRUCTURE_GIS_START_YEAR = 2026

// App labels intentionally remain stable while the official GIS CPN labels may
// change between seasons (for example, Station 3 became ESD Station 3 in 2026).
export const INFRASTRUCTURE_CPN_ALIASES = Object.freeze({
  'The Man': ['The Man'],
  'Center Camp': ['Center Camp', 'Center Camp Plaza'],
  Temple: ['The Temple'],
  Airport: ['Airport'],
  Rampart: ['Rampart'],
  'Station 3': ['ESD Station 3', 'Station 3'],
  'Station 6': ['ESD Station 6', 'Station 6'],
  'Station 9': ['ESD Station 9', 'Station 9'],
  'Ranger HQ': ['Ranger HQ'],
  'Ranger Station Berlin': ['Ranger Station Berlin'],
  'Ranger Station Tokyo': ['Ranger Station Tokyo'],
  'DPW Depot': ['DPW Depot', 'Department of Public Works'],
  DMZ: ['Deep-Playa Music Zone (DMZ)', 'DMZ'],
  'Hell Station': ['Hell Station'],
  'Arctica Center Camp': ['Arctica Center Camp'],
  'Ice Cubed (Arctica 3)': ['Ice Cubed Arctica 3'],
  'Ice Nine (Arctica 9)': ['Ice Nine Arctica'],
  'Point 1': ['Point 1'],
  'Point 2': ['Point 2'],
  'Point 3': ['Point 3'],
  'Point 4': ['Point 4'],
  'Point 5': ['Point 5']
})

const ITEM_LOCATION_NAMES = Object.freeze({
  'the-man': { primary: 'The Man' },
  temple: { primary: 'Temple' },
  'center-camp': { primary: 'Center Camp' },
  airport: { primary: 'Airport' },
  medical: {
    primary: 'Rampart',
    locations: {
      'Rampart (Main)': 'Rampart',
      'Station 3': 'Station 3',
      'Station 6': 'Station 6',
      'Station 9': 'Station 9'
    }
  },
  rangers: {
    primary: 'Ranger HQ',
    locations: {
      'Ranger HQ': 'Ranger HQ',
      'Ranger Station Berlin': 'Ranger Station Berlin',
      'Ranger Station Tokyo': 'Ranger Station Tokyo'
    }
  },
  dpw: { primary: 'DPW Depot' },
  arctica: {
    primary: 'Arctica Center Camp',
    locations: {
      'Arctica Center Camp': 'Arctica Center Camp',
      'Ice Cubed (Arctica 3)': 'Ice Cubed (Arctica 3)',
      'Ice Nine (Arctica 9)': 'Ice Nine (Arctica 9)'
    }
  },
  dmz: { primary: 'DMZ' },
  'hell-station': { primary: 'Hell Station' },
  perimeter: {
    primary: 'Point 1',
    locations: {
      'Point 1': 'Point 1',
      'Point 2': 'Point 2',
      'Point 3': 'Point 3',
      'Point 4': 'Point 4',
      'Point 5': 'Point 5'
    }
  }
})

const normalizeName = value => String(value || '').trim().replace(/\s+/g, ' ').toLowerCase()

export function findCPNCoordinates(cpnData, infrastructureName) {
  const aliases = INFRASTRUCTURE_CPN_ALIASES[infrastructureName] || [infrastructureName]
  const features = cpnData?.features || []
  const feature = aliases.reduce((match, alias) => match || features.find(candidate => {
    const name = candidate?.properties?.NAME ?? candidate?.properties?.name
    return candidate?.geometry?.type === 'Point' && normalizeName(name) === normalizeName(alias)
  }), null)
  const coordinates = feature?.geometry?.coordinates

  if (!Array.isArray(coordinates) || coordinates.length < 2 ||
      !Number.isFinite(coordinates[0]) || !Number.isFinite(coordinates[1])) {
    return null
  }

  // GeoJSON stores longitude first; Leaflet expects latitude first.
  return [coordinates[1], coordinates[0]]
}

export function resolveInfrastructureCoordinates({ cpnData, infrastructureName, year, fallback = null }) {
  const officialCoordinates = findCPNCoordinates(cpnData, infrastructureName)
  if (officialCoordinates) return officialCoordinates

  // From 2026 onward, a missing official CPN means "location unavailable".
  // Never put a prior season's service or fence point on the current map.
  return Number(year) >= OFFICIAL_INFRASTRUCTURE_GIS_START_YEAR ? null : fallback
}

export function getInfrastructureCPNNames() {
  return new Set(Object.values(INFRASTRUCTURE_CPN_ALIASES).flat())
}

export function applyOfficialInfrastructureLocations(items, cpnData, year) {
  return items.map(item => {
    const locationConfig = ITEM_LOCATION_NAMES[item.id]
    if (!locationConfig) return item

    const coordinates = resolveInfrastructureCoordinates({
      cpnData,
      infrastructureName: locationConfig.primary,
      year,
      fallback: item.coordinates
    })

    const locations = item.locations?.map(location => {
      const infrastructureName = locationConfig.locations?.[location.name]
      if (!infrastructureName) return location

      return {
        ...location,
        coordinates: resolveInfrastructureCoordinates({
          cpnData,
          infrastructureName,
          year,
          fallback: location.coordinates
        })
      }
    }).filter(location => Array.isArray(location.coordinates))

    return {
      ...item,
      coordinates,
      ...(item.locations ? { locations } : {})
    }
  })
}
