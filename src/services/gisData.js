// GIS data service for loading and managing Burning Man geospatial data

const GIS_DATA_PATH = '/data/2025/gis/';

// Cache for loaded GIS data
const gisDataCache = {
  streetLines: null,
  trashFence: null,
  cpns: null,
  plazas: null,
  cityBlocks: null
};

// Load GeoJSON data from file
async function loadGeoJSON(filename) {
  try {
    const response = await fetch(`${GIS_DATA_PATH}${filename}`);
    if (!response.ok) {
      throw new Error(`Failed to load ${filename}: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error loading GIS data ${filename}:`, error);
    return null;
  }
}

// Load all GIS data
export async function loadAllGISData() {
  console.log('Loading GIS data...');
  
  const [streetLines, trashFence, cpns, plazas, cityBlocks] = await Promise.all([
    loadGeoJSON('street_lines.geojson'),
    loadGeoJSON('trash_fence.geojson'),
    loadGeoJSON('cpns.geojson'),
    loadGeoJSON('plazas.geojson'),
    loadGeoJSON('city_blocks.geojson')
  ]);

  gisDataCache.streetLines = streetLines;
  gisDataCache.trashFence = trashFence;
  gisDataCache.cpns = cpns;
  gisDataCache.plazas = plazas;
  gisDataCache.cityBlocks = cityBlocks;

  console.log('GIS data loaded:', {
    streetLines: streetLines?.features?.length || 0,
    trashFence: trashFence?.features?.length || 0,
    cpns: cpns?.features?.length || 0,
    plazas: plazas?.features?.length || 0,
    cityBlocks: cityBlocks?.features?.length || 0
  });

  return gisDataCache;
}

// Get street lines data
export function getStreetLines() {
  return gisDataCache.streetLines;
}

// Get trash fence boundary
export function getTrashFence() {
  return gisDataCache.trashFence;
}

// Get CPNs (Civic Plaza Network points)
export function getCPNs() {
  return gisDataCache.cpns;
}

// Get plaza data
export function getPlazas() {
  return gisDataCache.plazas;
}

// Get city blocks data
export function getCityBlocks() {
  return gisDataCache.cityBlocks;
}

// Find nearest street to a given coordinate
export function findNearestStreet(lat, lon) {
  const streetLines = getStreetLines();
  if (!streetLines || !streetLines.features) return null;

  let nearestStreet = null;
  let minDistance = Infinity;

  streetLines.features.forEach(feature => {
    if (!feature.geometry || !feature.geometry.coordinates) return;

    // Calculate distance to line segment
    const coords = feature.geometry.coordinates;
    for (let i = 0; i < coords.length - 1; i++) {
      const distance = distanceToLineSegment(
        lon, lat,
        coords[i][0], coords[i][1],
        coords[i + 1][0], coords[i + 1][1]
      );

      if (distance < minDistance) {
        minDistance = distance;
        nearestStreet = {
          name: feature.properties.name,
          type: feature.properties.type,
          distance: distance
        };
      }
    }
  });

  return nearestStreet;
}

// Calculate distance from point to line segment
function distanceToLineSegment(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  
  if (dx === 0 && dy === 0) {
    // It's a point, not a line segment
    return Math.sqrt((px - x1) ** 2 + (py - y1) ** 2);
  }

  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy)));
  const nearestX = x1 + t * dx;
  const nearestY = y1 + t * dy;
  
  return Math.sqrt((px - nearestX) ** 2 + (py - nearestY) ** 2);
}

// Check if a point is inside the trash fence
export function isInsideTrashFence(lat, lon) {
  const trashFence = getTrashFence();
  if (!trashFence || !trashFence.features || !trashFence.features[0]) return false;

  const polygon = trashFence.features[0].geometry.coordinates[0];
  return isPointInPolygon(lon, lat, polygon);
}

// Point in polygon algorithm
function isPointInPolygon(x, y, polygon) {
  let inside = false;
  
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0], yi = polygon[i][1];
    const xj = polygon[j][0], yj = polygon[j][1];
    
    const intersect = ((yi > y) !== (yj > y))
      && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    
    if (intersect) inside = !inside;
  }
  
  return inside;
}

// Get GIS layer styles for Leaflet
export const gisStyles = {
  streetLines: {
    radial: {
      color: '#666666',
      weight: 2,
      opacity: 0.8
    },
    arc: {
      color: '#888888',
      weight: 2,
      opacity: 0.8
    }
  },
  trashFence: {
    color: '#ff0000',
    weight: 3,
    opacity: 0.8,
    fillOpacity: 0,
    dashArray: '10, 5'
  },
  cityBlocks: {
    color: '#444444',
    weight: 1,
    opacity: 0.5,
    fillOpacity: 0.1,
    fillColor: '#222222'
  }
};

// Initialize GIS data on module load
let gisDataPromise = null;

export function initializeGISData() {
  if (!gisDataPromise) {
    gisDataPromise = loadAllGISData();
  }
  return gisDataPromise;
}