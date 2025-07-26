/*
 * app.js
 *
 * This script powers the Burning Man 2025 offline guide.  It handles
 * initialization of the Leaflet map, navigation between map and list
 * views, retrieval and storage of data from the Burning Man Public API
 * using IndexedDB and basic interactive features like selecting an item
 * to highlight it on the map.
 *
 * To use the API you must request an API key from Burning Man as
 * described on innovate.burningman.org.  Once you have your key,
 * replace the placeholder below with your key.  Data returned by the
 * API is cached locally so that subsequent loads work even without
 * internet connectivity.  Geospatial overlays are loaded from
 * example.geojson but you should replace that file with the official
 * GeoJSON datasets for streets, plazas and other features once they
 * become available【483168084542937†L124-L144】.
 */

// Insert your personal API key here.  Without a valid key, calls to
// the Burning Man API will fail and only cached data (if any) will be
// available.  See https://api.burningman.org/request for details.
const apiKey = '19b5320c7af94665aa17fa0e6daaf10b';

let map;
let markersLayer;
let detailMap;
let detailMarker;

document.addEventListener('DOMContentLoaded', () => {
  initMap();
  setupNavigation();
  setupYearSelector();
  setupSortSelector();
  setupRouting();
  // Handle initial route
  handleRoute();
});

/**
 * Set up URL routing
 */
function setupRouting() {
  // Handle browser back/forward
  window.addEventListener('popstate', handleRoute);
}

/**
 * Parse the current URL and return route info
 * @returns {Object} Route information
 */
function parseRoute() {
  const path = window.location.pathname;
  const parts = path.split('/').filter(p => p);
  
  console.log('Parsing route:', path, 'Parts:', parts);
  
  // Default route
  if (parts.length === 0) {
    return { year: getSelectedYear(), view: 'map' };
  }
  
  // Parse year (should be first part)
  const year = parts[0];
  const view = parts[1] || 'map';
  const itemId = parts[2];
  
  const route = { year, view, itemId };
  console.log('Parsed route:', route);
  
  return route;
}

/**
 * Handle route changes
 */
async function handleRoute() {
  const route = parseRoute();
  
  // If no year in URL, redirect to default
  if (!route.year || !['2023', '2024', '2025'].includes(route.year)) {
    const defaultYear = getSelectedYear();
    window.history.replaceState({}, '', `/${defaultYear}/map`);
    await handleRoute();
    return;
  }
  
  // Update year selector if different
  const yearSelector = document.getElementById('year-selector');
  if (yearSelector.value !== route.year) {
    yearSelector.value = route.year;
    localStorage.setItem('selectedYear', route.year);
  }
  
  // Handle different views
  switch (route.view) {
    case 'map':
      showView('map');
      break;
    case 'camps':
    case 'art':
    case 'events':
      showView('list');
      const type = route.view.slice(0, -1); // Remove 's' from end
      await displayList(type);
      
      // If there's an item ID, find and show it in detail view
      if (route.itemId) {
        // Wait a bit for the list to load if needed
        if (currentListData.length === 0) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        const item = currentListData.find(i => 
          (i.uid === route.itemId) || 
          (getItemName(i).toLowerCase().replace(/\s+/g, '-') === route.itemId)
        );
        
        if (item) {
          console.log(`Showing ${type}:`, item);
          showDetailView(item, type);
          
          // Also highlight in list if visible
          highlightItemInList(item);
        } else {
          console.log(`Item not found: ${route.itemId}`);
        }
      }
      break;
    default:
      // Default to map view
      const year = route.year || getSelectedYear();
      window.history.replaceState({}, '', `/${year}/map`);
      showView('map');
  }
}

/**
 * Navigate to a new route
 * @param {string} path The path to navigate to
 */
function navigateTo(path) {
  console.log('Navigating to:', path);
  window.history.pushState({}, '', path);
  handleRoute();
}

/**
 * Get URL-safe version of a name
 * @param {string} name 
 * @returns {string}
 */
function urlSafeName(name) {
  return name.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Set up the year selector with localStorage persistence
 */
function setupYearSelector() {
  const yearSelector = document.getElementById('year-selector');
  
  // Load saved year from localStorage or from URL
  const route = parseRoute();
  if (route.year && ['2023', '2024', '2025'].includes(route.year)) {
    yearSelector.value = route.year;
    localStorage.setItem('selectedYear', route.year);
  } else {
    const savedYear = localStorage.getItem('selectedYear');
    if (savedYear) {
      yearSelector.value = savedYear;
    }
  }
  
  // Save year when changed and update URL
  yearSelector.addEventListener('change', (e) => {
    const newYear = e.target.value;
    localStorage.setItem('selectedYear', newYear);
    
    // Update URL with new year
    const route = parseRoute();
    if (route.view === 'map') {
      navigateTo(`/${newYear}/map`);
    } else if (['camps', 'art', 'events'].includes(route.view)) {
      navigateTo(`/${newYear}/${route.view}`);
    }
  });
}

/**
 * Initialise the Leaflet map and overlay local geodata.
 */
function initMap() {
  // centre on the Golden Spike coordinates published by Burning Man【483168084542937†L150-L156】
  const center = [40.786958, -119.202994];
  map = L.map('map', {
    center: center,
    zoom: 13,
    zoomControl: true
  });

  // A base tile layer.  This will only load if the user has connectivity.
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
    maxZoom: 19
  }).addTo(map);

  // Layer for dynamic markers
  markersLayer = L.layerGroup().addTo(map);

  // Load local geojson overlays.  Replace example.geojson with official
  // geojson files (street outlines, plazas, etc.) when available.
  fetch('example.geojson')
    .then((resp) => resp.json())
    .then((geojson) => {
      L.geoJSON(geojson, {
        style: {
          color: '#FF6600',
          weight: 2,
          fillOpacity: 0.1
        },
        onEachFeature: function (feature, layer) {
          if (feature.properties && feature.properties.name) {
            layer.bindPopup(feature.properties.name);
          }
        }
      }).addTo(map);
    })
    .catch((err) => {
      console.error('Error loading local geoJSON:', err);
    });
}

/**
 * Set up navigation buttons to toggle between views and load data.
 */
function setupNavigation() {
  const mapBtn = document.getElementById('view-map');
  const campsBtn = document.getElementById('view-camps');
  const artBtn = document.getElementById('view-art');
  const eventsBtn = document.getElementById('view-events');

  mapBtn.addEventListener('click', () => {
    const year = getSelectedYear();
    navigateTo(`/${year}/map`);
  });
  campsBtn.addEventListener('click', () => {
    const year = getSelectedYear();
    navigateTo(`/${year}/camps`);
  });
  artBtn.addEventListener('click', () => {
    const year = getSelectedYear();
    navigateTo(`/${year}/art`);
  });
  eventsBtn.addEventListener('click', () => {
    const year = getSelectedYear();
    navigateTo(`/${year}/events`);
  });
}

/**
 * Toggle between views.
 * @param {string} view Either 'map', 'list', or 'detail'
 */
function showView(view) {
  const mapSection = document.getElementById('map-section');
  const listSection = document.getElementById('list-section');
  const detailSection = document.getElementById('detail-section');
  
  // Hide all sections
  mapSection.classList.add('hidden');
  listSection.classList.add('hidden');
  detailSection.classList.add('hidden');
  
  // Show requested section
  if (view === 'map') {
    mapSection.classList.remove('hidden');
    setTimeout(() => {
      map.invalidateSize();
    }, 100);
  } else if (view === 'list') {
    listSection.classList.remove('hidden');
  } else if (view === 'detail') {
    detailSection.classList.remove('hidden');
    // Initialize detail map if needed
    if (detailMap) {
      setTimeout(() => {
        detailMap.invalidateSize();
      }, 100);
    }
  }
}

/**
 * Show detail view for an item
 * @param {Object} item The item to display
 * @param {string} type The type of item (camp, art, event)
 */
function showDetailView(item, type) {
  showView('detail');
  
  // Populate detail info
  const detailInfo = document.getElementById('detail-info');
  const name = getItemName(item);
  
  let html = `<h2>${name}</h2>`;
  
  // Add fields based on what's available
  if (item.description) {
    html += `<div class="detail-field">
      <label>Description</label>
      <div class="value">${item.description}</div>
    </div>`;
  }
  
  if (item.hometown) {
    html += `<div class="detail-field">
      <label>Hometown</label>
      <div class="value">${item.hometown}</div>
    </div>`;
  }
  
  if (item.location_string) {
    html += `<div class="detail-field">
      <label>Location</label>
      <div class="value">${item.location_string}</div>
    </div>`;
  }
  
  if (item.location && item.location.dimensions) {
    html += `<div class="detail-field">
      <label>Camp Size</label>
      <div class="value">${item.location.dimensions}</div>
    </div>`;
  }
  
  if (item.landmark) {
    html += `<div class="detail-field">
      <label>Landmark</label>
      <div class="value">${item.landmark}</div>
    </div>`;
  }
  
  if (item.url) {
    html += `<div class="detail-field">
      <label>Website</label>
      <div class="value"><a href="${item.url}" target="_blank" rel="noopener">${item.url}</a></div>
    </div>`;
  }
  
  if (item.contact_email) {
    html += `<div class="detail-field">
      <label>Contact</label>
      <div class="value"><a href="mailto:${item.contact_email}">${item.contact_email}</a></div>
    </div>`;
  }
  
  detailInfo.innerHTML = html;
  
  // Initialize or update detail map
  initDetailMap(item);
}

/**
 * Initialize the detail map
 * @param {Object} item 
 */
function initDetailMap(item) {
  // Golden Spike coordinates as fallback
  const center = [40.786958, -119.202994];
  
  if (!detailMap) {
    // Create the map for first time
    detailMap = L.map('detail-map', {
      center: center,
      zoom: 14,
      zoomControl: true
    });
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(detailMap);
  }
  
  // Clear existing marker
  if (detailMarker) {
    detailMap.removeLayer(detailMarker);
  }
  
  // Try to get location
  const loc = item.location || item.loc || item.position;
  let hasLocation = false;
  
  if (loc) {
    let lat = null;
    let lon = null;
    if (Array.isArray(loc)) {
      lon = loc[0];
      lat = loc[1];
    } else if (typeof loc === 'object') {
      lat = loc.lat || loc.latitude;
      lon = loc.lon || loc.lng || loc.longitude;
    }
    
    if (lat !== undefined && lon !== undefined && lat !== null && lon !== null) {
      detailMarker = L.marker([lat, lon]).addTo(detailMap);
      detailMap.setView([lat, lon], 16);
      hasLocation = true;
    }
  }
  
  // If no location, show center with a note
  if (!hasLocation) {
    detailMap.setView(center, 13);
    // Add a marker at center with note
    detailMarker = L.marker(center).addTo(detailMap);
    detailMarker.bindPopup('Black Rock City Center<br><em>Camp location not available</em>').openPopup();
  }
}

// Set up back button
document.addEventListener('DOMContentLoaded', () => {
  const backBtn = document.getElementById('back-to-list');
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      // Navigate back to the list URL
      const route = parseRoute();
      const year = route.year || getSelectedYear();
      const listType = route.view || 'camps';
      navigateTo(`/${year}/${listType}`);
    });
  }
});

/**
 * Get the currently selected year from the dropdown
 * @returns {string} The selected year
 */
function getSelectedYear() {
  const yearSelector = document.getElementById('year-selector');
  return yearSelector.value;
}

// Store current list data globally for re-sorting
let currentListData = [];
let currentListType = '';

/**
 * Set up the sort selector
 */
function setupSortSelector() {
  const sortSelector = document.getElementById('sort-selector');
  
  sortSelector.addEventListener('change', () => {
    if (currentListData.length > 0) {
      renderList(currentListData, currentListType);
    }
  });
}

/**
 * Get the name field for an item based on its type
 * @param {Object} item 
 * @returns {string}
 */
function getItemName(item) {
  return item.name || item.title || item.camp || item.artist || 'Unnamed';
}

/**
 * Get the location string for an item
 * @param {Object} item 
 * @returns {string}
 */
function getItemLocation(item) {
  // Try various location formats
  if (item.location_string) return item.location_string;
  if (item.location && typeof item.location === 'object') {
    const loc = item.location;
    if (loc.frontage && loc.intersection) {
      return `${loc.frontage} & ${loc.intersection}`;
    }
  }
  if (item.address) return item.address;
  return 'Unknown location';
}

/**
 * Sort items based on selected criteria
 * @param {Array} items 
 * @param {string} sortBy 
 * @returns {Array}
 */
function sortItems(items, sortBy) {
  const sorted = [...items];
  
  if (sortBy === 'name') {
    sorted.sort((a, b) => {
      const nameA = getItemName(a).toLowerCase();
      const nameB = getItemName(b).toLowerCase();
      return nameA.localeCompare(nameB);
    });
  } else if (sortBy === 'location') {
    sorted.sort((a, b) => {
      const locA = getItemLocation(a).toLowerCase();
      const locB = getItemLocation(b).toLowerCase();
      return locA.localeCompare(locB);
    });
  }
  
  return sorted;
}

/**
 * Highlight an item in the list
 * @param {Object} item 
 */
function highlightItemInList(item) {
  const listItems = document.querySelectorAll('#items-list li');
  listItems.forEach(li => {
    if (li.dataset.uid === item.uid) {
      li.classList.add('highlighted');
      li.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      li.classList.remove('highlighted');
    }
  });
}

/**
 * Render the list with current sort settings
 * @param {Array} items 
 * @param {string} type 
 */
function renderList(items, type) {
  const listElem = document.getElementById('items-list');
  const sortSelector = document.getElementById('sort-selector');
  const sortBy = sortSelector.value;
  
  const sortedItems = sortItems(items, sortBy);
  
  listElem.innerHTML = '';
  sortedItems.forEach((item) => {
    const li = document.createElement('li');
    const name = getItemName(item);
    const location = getItemLocation(item);
    
    // Add data attribute for finding the item later
    li.dataset.uid = item.uid || '';
    
    // Show name and location
    li.innerHTML = `<strong>${name}</strong><br><small>${location}</small>`;
    
    li.addEventListener('click', () => {
      // Log full item data to console
      console.log(`Full ${type} data:`, item);
      
      // Update URL to include the item
      const year = getSelectedYear();
      const itemId = item.uid || urlSafeName(name);
      navigateTo(`/${year}/${type}s/${itemId}`);
    });
    
    listElem.appendChild(li);
  });
}

/**
 * Retrieve data from the API or IndexedDB and render a list.
 * @param {string} type One of 'art', 'camp' or 'event'.
 */
async function displayList(type) {
  const listElem = document.getElementById('items-list');
  listElem.innerHTML = '<li>Loading…</li>';
  try {
    const items = await loadData(type);
    
    if (!items || items.length === 0) {
      listElem.innerHTML = `<li>No ${type}s available.</li>`;
      return;
    }
    
    // Store data globally for re-sorting
    currentListData = items;
    currentListType = type;
    
    // Render with current sort
    renderList(items, type);
  } catch (err) {
    listElem.innerHTML = `<li>Error loading ${type}s.</li>`;
    console.error(err);
  }
}

/**
 * Show a selected item on the map by placing a marker and focusing
 * the view.  Accepts art, camp or event objects as returned by
 * the API.  The Burning Man API uses a `location` field with
 * `lat` and `lon` properties for geocoded items.
 * @param {Object} item
 */
function showOnMap(item) {
  showView('map');
  // Clear any existing markers
  markersLayer.clearLayers();
  const loc = item.location || item.loc || item.position;
  if (loc) {
    let lat = null;
    let lon = null;
    if (Array.isArray(loc)) {
      // [lon, lat]
      lon = loc[0];
      lat = loc[1];
    } else if (typeof loc === 'object') {
      lat = loc.lat || loc.latitude;
      lon = loc.lon || loc.lng || loc.longitude;
    }
    if (lat !== undefined && lon !== undefined) {
      const marker = L.marker([lat, lon]).addTo(markersLayer);
      const name = item.name || item.title || 'Unknown';
      const desc = item.description || item.slogan || '';
      marker.bindPopup(`<strong>${name}</strong><br>${desc}`);
      map.setView([lat, lon], 16);
      return;
    }
  }
  // If no location data, just centre on default and alert the user
  alert('Selected item has no location information.');
}

/**
 * Load data for a given type (art, camp, event) from IndexedDB or
 * fall back to the Burning Man Public API.  Data is cached locally
 * for offline use.
 * @param {string} type 'art', 'camp' or 'event'
 * @returns {Promise<Array>} Array of objects
 */
async function loadData(type) {
  const year = getSelectedYear();
  // Attempt to read from the cache first - include year in cache key
  const cacheKey = `${type}-${year}`;
  try {
    const cached = await getFromStore(cacheKey);
    if (cached && cached.length > 0) {
      return cached;
    }
  } catch (err) {
    console.warn('IndexedDB not available or failed to read:', err);
  }
  // No cached data – fetch from the API
  // Use local proxy to avoid CORS issues
  const endpoint = `http://localhost:8001/api/${type}?year=${year}`;
  const headers = {
    'X-API-Key': apiKey
  };
  const resp = await fetch(endpoint, { headers });
  if (!resp.ok) {
    throw new Error(`Failed to fetch ${type}: ${resp.status}`);
  }
  const data = await resp.json();
  // Persist to IndexedDB with year-specific key
  try {
    await saveToStore(cacheKey, Array.isArray(data) ? data : [data]);
  } catch (err) {
    console.warn('Failed to save to IndexedDB:', err);
  }
  return data;
}

/* IndexedDB helper functions */
function openDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('bm2025-db', 1);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      ['art', 'camp', 'event'].forEach((storeName) => {
        if (!db.objectStoreNames.contains(storeName)) {
          db.createObjectStore(storeName, { keyPath: 'uid' });
        }
      });
    };
    request.onsuccess = () => {
      resolve(request.result);
    };
    request.onerror = () => {
      reject(request.error);
    };
  });
}

async function saveToStore(storeName, data) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    data.forEach((item) => store.put(item));
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function getFromStore(storeName) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}