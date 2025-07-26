#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
  const years = ['2023', '2024', '2025'];
  
  for (const year of years) {
    console.log(`\n=== Processing ${year} ===`);
    const yearDir = path.join(dataDir, year);
    
    try {
      // Load existing data
      const [camps, art, events] = await Promise.all([
        fs.readFile(path.join(yearDir, 'camps.json'), 'utf-8').then(JSON.parse),
        fs.readFile(path.join(yearDir, 'art.json'), 'utf-8').then(JSON.parse),
        fs.readFile(path.join(yearDir, 'events.json'), 'utf-8').then(JSON.parse)
      ]);
      
      console.log(`Loaded: ${camps.length} camps, ${art.length} art, ${events.length} events`);
      
      // Skip if already enriched
      const alreadyEnriched = events.some(e => e.enriched_location);
      if (alreadyEnriched) {
        console.log('Events already enriched, skipping...');
        continue;
      }
      
      // Enrich events with location data
      const enrichedEvents = enrichEvents(events, camps, art);
      
      // Create backup
      await fs.writeFile(
        path.join(yearDir, 'events-original.json'),
        JSON.stringify(events, null, 2)
      );
      
      // Save enriched events
      await fs.writeFile(
        path.join(yearDir, 'events.json'),
        JSON.stringify(enrichedEvents, null, 2)
      );
      
      console.log(`Saved enriched events for ${year}`);
      
    } catch (err) {
      console.error(`Error processing ${year}:`, err.message);
    }
  }
  
  console.log('\n✅ All data enriched successfully!');
}

// Run the script
main().catch(console.error);