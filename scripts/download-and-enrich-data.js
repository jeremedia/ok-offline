#!/usr/bin/env node

/**
 * Downloads data from Burning Man API and enriches events with location data
 * 
 * Usage:
 *   BM_API_KEY=your_api_key node scripts/download-and-enrich-data.js
 * 
 * Or set the API key in your environment:
 *   export BM_API_KEY=your_api_key
 *   node scripts/download-and-enrich-data.js
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const API_BASE_URL = 'https://api.burningman.org/api';
const API_KEY = process.env.BM_API_KEY || 'your_api_key_here';
const YEARS = ['2023', '2024', '2025'];
const TYPES = ['camp', 'art', 'event'];

// Helper to fetch data from API
async function fetchFromAPI(type, year) {
  const url = `${API_BASE_URL}/${type}?year=${year}`;
  console.log(`Fetching ${type}s for ${year} from ${url}`);
  
  try {
    const response = await fetch(url, {
      headers: {
        'X-API-Key': API_KEY
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.error(`Failed to fetch ${type}s for ${year}:`, err.message);
    return [];
  }
}

// Enrich events with location data from camps and art
function enrichEvents(events, camps, art) {
  console.log(`Enriching ${events.length} events with location data`);
  
  // Create lookup maps
  const campMap = new Map(camps.map(camp => [camp.uid, camp]));
  const artMap = new Map(art.map(piece => [piece.uid, piece]));
  
  let enrichedCount = 0;
  
  const enrichedEvents = events.map(event => {
    // If event already has a location, keep it
    if (event.location && event.location_string) {
      return event;
    }
    
    // Look up the camp or art that hosts this event
    if (event.hosted_by_camp) {
      const camp = campMap.get(event.hosted_by_camp);
      if (camp && camp.location_string) {
        enrichedCount++;
        return {
          ...event,
          camp_name: camp.name,
          enriched_location: camp.location_string
        };
      }
    }
    
    if (event.hosted_by_art) {
      const artPiece = artMap.get(event.hosted_by_art);
      if (artPiece && artPiece.location_string) {
        enrichedCount++;
        return {
          ...event,
          art_name: artPiece.name,
          enriched_location: artPiece.location_string
        };
      }
    }
    
    // No location found, return as-is
    return event;
  });
  
  console.log(`Enriched ${enrichedCount} events with location data`);
  return enrichedEvents;
}

// Main function
async function main() {
  const dataDir = path.join(__dirname, '..', 'public', 'data');
  
  // Ensure data directory exists
  await fs.mkdir(dataDir, { recursive: true });
  
  for (const year of YEARS) {
    console.log(`\n=== Processing ${year} ===`);
    const yearDir = path.join(dataDir, year);
    await fs.mkdir(yearDir, { recursive: true });
    
    // Fetch all data for this year
    const [camps, art, events] = await Promise.all([
      fetchFromAPI('camp', year),
      fetchFromAPI('art', year),
      fetchFromAPI('event', year)
    ]);
    
    console.log(`Fetched: ${camps.length} camps, ${art.length} art, ${events.length} events`);
    
    // Ensure each item has a year
    const campsWithYear = camps.map(item => ({ ...item, year: parseInt(year) }));
    const artWithYear = art.map(item => ({ ...item, year: parseInt(year) }));
    const eventsWithYear = events.map(item => ({ ...item, year: parseInt(year) }));
    
    // Enrich events with location data
    const enrichedEvents = enrichEvents(eventsWithYear, campsWithYear, artWithYear);
    
    // Save to files
    await fs.writeFile(
      path.join(yearDir, 'camps.json'),
      JSON.stringify(campsWithYear, null, 2)
    );
    
    await fs.writeFile(
      path.join(yearDir, 'art.json'),
      JSON.stringify(artWithYear, null, 2)
    );
    
    await fs.writeFile(
      path.join(yearDir, 'events.json'),
      JSON.stringify(enrichedEvents, null, 2)
    );
    
    console.log(`Saved enriched data for ${year}`);
    
    // Add metadata file
    const metadata = {
      year,
      downloadedAt: new Date().toISOString(),
      counts: {
        camps: campsWithYear.length,
        art: artWithYear.length,
        events: enrichedEvents.length,
        enrichedEvents: enrichedEvents.filter(e => e.enriched_location).length
      },
      source: 'Burning Man Public API',
      enriched: true
    };
    
    await fs.writeFile(
      path.join(yearDir, 'metadata.json'),
      JSON.stringify(metadata, null, 2)
    );
  }
  
  console.log('\n✅ All data downloaded and enriched successfully!');
}

// Run the script
main().catch(console.error);