// GIS data service for loading and managing Burning Man geospatial data

// Default to 2025 but allow year override
let currentYear = 2025;

// Cache for loaded GIS data (per year)
const gisDataCache = {
  2023: {
    streetLines: null,
    trashFence: null,
    cpns: null,
    plazas: null,
    cityBlocks: null,
    toilets: null,
    streetOutlines: null,
  },
  2024: {
    streetLines: null,
    trashFence: null,
    cpns: null,
    plazas: null,
    cityBlocks: null,
    toilets: null,
    streetOutlines: null,
  },
  2025: {
    streetLines: null,
    trashFence: null,
    cpns: null,
    plazas: null,
    cityBlocks: null,
    toilets: null,
    streetOutlines: null,
  }
};

// Loading state
const loadingState = {
  isLoading: false,
  error: null,
  loadedLayers: new Set()
};

// Set the current year for GIS data loading
export function setGISYear(year) {
  if (gisDataCache[year]) {
    currentYear = year;
    return true;
  }
  console.warn(`GIS data not available for year ${year}`);
  return false;
}

// Get the current GIS year
export function getGISYear() {
  return currentYear;
}

// Load GeoJSON data from file
async function loadGeoJSON(filename, year = currentYear) {
  try {
    const gisDataPath = `/data/${year}/gis/`;
    const response = await fetch(`${gisDataPath}${filename}`);
    if (!response.ok) {
      throw new Error(`Failed to load ${filename}: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error loading GIS data ${filename} for year ${year}:`, error);
    return null;
  }
}

// Load all GIS data
export async function loadAllGISData(year = currentYear) {
  if (loadingState.isLoading) {
    console.log('GIS data is already loading...');
    return gisDataCache[year];
  }
  
  // Check if data already loaded for this year
  const yearCache = gisDataCache[year];
  if (!yearCache) {
    console.error(`No cache structure for year ${year}`);
    return null;
  }
  
  if (yearCache.streetLines && loadingState.loadedLayers.has(`${year}-streetLines`)) {
    console.log(`GIS data already loaded for year ${year}`);
    return yearCache;
  }

  loadingState.isLoading = true;
  loadingState.error = null;
  loadingState.loadedLayers.clear();

  console.log(`Loading GIS data for year ${year}...`);
  
  try {
    // Check if GIS data exists for this year
    if (year === 2023) {
      console.log(`No GIS data available for year ${year}, using 2024 data as fallback`);
      // For 2023, copy 2024 data as a fallback
      const data2024 = await loadAllGISData(2024);
      if (data2024) {
        yearCache.streetLines = data2024.streetLines;
        yearCache.trashFence = data2024.trashFence;
        yearCache.cpns = data2024.cpns;
        yearCache.plazas = data2024.plazas;
        yearCache.cityBlocks = data2024.cityBlocks;
        yearCache.toilets = data2024.toilets;
        yearCache.streetOutlines = data2024.streetOutlines;
        
        // Mark as loaded for 2023
        if (data2024.streetLines) loadingState.loadedLayers.add('2023-streetLines');
        if (data2024.trashFence) loadingState.loadedLayers.add('2023-trashFence');
        if (data2024.cpns) loadingState.loadedLayers.add('2023-cpns');
        if (data2024.plazas) loadingState.loadedLayers.add('2023-plazas');
        if (data2024.cityBlocks) loadingState.loadedLayers.add('2023-cityBlocks');
        if (data2024.toilets) loadingState.loadedLayers.add('2023-toilets');
        if (data2024.streetOutlines) loadingState.loadedLayers.add('2023-streetOutlines');
      }
      loadingState.isLoading = false;
      return yearCache;
    }
    
    // Load files with consistent naming conventions (all years use lowercase with underscores)
    const fileNames = {
      streetLines: 'street_lines.geojson',
      trashFence: 'trash_fence.geojson',
      cpns: 'cpns.geojson',
      plazas: 'plazas.geojson',
      cityBlocks: 'city_blocks.geojson',
      toilets: 'toilets.geojson',
      streetOutlines: 'street_outlines.geojson'
    };
    
    const [streetLines, trashFence, cpns, plazas, cityBlocks, toilets, streetOutlines] = await Promise.all([
      loadGeoJSON(fileNames.streetLines, year),
      loadGeoJSON(fileNames.trashFence, year),
      loadGeoJSON(fileNames.cpns, year),
      loadGeoJSON(fileNames.plazas, year),
      loadGeoJSON(fileNames.cityBlocks, year),
      fileNames.toilets ? loadGeoJSON(fileNames.toilets, year) : Promise.resolve(null),
      fileNames.streetOutlines ? loadGeoJSON(fileNames.streetOutlines, year) : Promise.resolve(null)
    ]);

    yearCache.streetLines = streetLines;
    yearCache.trashFence = trashFence;
    yearCache.cpns = cpns;
    yearCache.plazas = plazas;
    yearCache.cityBlocks = cityBlocks;
    yearCache.toilets = toilets;
    yearCache.streetOutlines = streetOutlines;

    // Track loaded layers with year prefix
    if (streetLines) loadingState.loadedLayers.add(`${year}-streetLines`);
    if (trashFence) loadingState.loadedLayers.add(`${year}-trashFence`);
    if (cpns) loadingState.loadedLayers.add(`${year}-cpns`);
    if (plazas) loadingState.loadedLayers.add(`${year}-plazas`);
    if (cityBlocks) loadingState.loadedLayers.add(`${year}-cityBlocks`);
    if (toilets) loadingState.loadedLayers.add(`${year}-toilets`);
    if (streetOutlines) loadingState.loadedLayers.add(`${year}-streetOutlines`);

    console.log('GIS data loaded:', {
      streetLines: streetLines?.features?.length || 0,
      trashFence: trashFence?.features?.length || 0,
      cpns: cpns?.features?.length || 0,
      plazas: plazas?.features?.length || 0,
      cityBlocks: cityBlocks?.features?.length || 0,
      toilets: toilets?.features?.length || 0,
      streetOutlines: streetOutlines?.features?.length || 0
    });

    return yearCache;
  } catch (error) {
    loadingState.error = error;
    console.error('Failed to load GIS data:', error);
    throw error;
  } finally {
    loadingState.isLoading = false;
  }
}

// Get street lines data
export function getStreetLines(year = currentYear) {
  return gisDataCache[year]?.streetLines || null;
}

// Get trash fence boundary
export function getTrashFence(year = currentYear) {
  return gisDataCache[year]?.trashFence || null;
}

// Get CPNs (Civic Plaza Network points)
export function getCPNs(year = currentYear) {
  return gisDataCache[year]?.cpns || null;
}

// Get plaza data
export function getPlazas(year = currentYear) {
  return gisDataCache[year]?.plazas || null;
}

// Get city blocks data
export function getCityBlocks(year = currentYear) {
  return gisDataCache[year]?.cityBlocks || null;
}

// Get toilets data
export function getToilets(year = currentYear) {
  return gisDataCache[year]?.toilets || null;
}

// Get street outlines data
export function getStreetOutlines(year = currentYear) {
  return gisDataCache[year]?.streetOutlines || null;
}


// Get loading state
export function getLoadingState() {
  return {
    isLoading: loadingState.isLoading,
    error: loadingState.error,
    loadedLayers: Array.from(loadingState.loadedLayers)
  };
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

// Helper function to get CSS variable values for JavaScript
const getCSSColor = (varName) => {
  if (typeof document !== 'undefined') {
    return getComputedStyle(document.documentElement).getPropertyValue(varName).trim()
  }
  return varName // Fallback for server-side rendering
}

// Get GIS layer styles for Leaflet
export const gisStyles = {
  streetLines: {
    radial: {
      color: getCSSColor('--color-text-disabled'),
      weight: 2,
      opacity: 0.8
    },
    arc: {
      color: getCSSColor('--color-text-muted'),
      weight: 2,
      opacity: 0.8
    }
  },
  trashFence: {
    color: getCSSColor('--color-danger'),
    weight: 3,
    opacity: 0.8,
    fillOpacity: 0,
    dashArray: '10, 5'
  },
  cityBlocks: {
    color: getCSSColor('--color-border'),
    weight: 1,
    opacity: 0.5,
    fillOpacity: 0.1,
    fillColor: getCSSColor('--color-bg-base')
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