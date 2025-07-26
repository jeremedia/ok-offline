#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testEnrichment() {
  const dataDir = path.join(__dirname, '..', 'public', 'data', '2024');
  
  // Load the data
  const [campsData, artData, eventsData] = await Promise.all([
    fs.readFile(path.join(dataDir, 'camps.json'), 'utf-8').then(JSON.parse),
    fs.readFile(path.join(dataDir, 'art.json'), 'utf-8').then(JSON.parse),
    fs.readFile(path.join(dataDir, 'events.json'), 'utf-8').then(JSON.parse)
  ]);
  
  console.log(`Loaded: ${campsData.length} camps, ${artData.length} art, ${eventsData.length} events`);
  
  // Check if camps have location data
  const campsWithLocation = campsData.filter(c => c.location_string).length;
  console.log(`Camps with location_string: ${campsWithLocation}/${campsData.length}`);
  
  // Check if events are already enriched
  const eventsWithEnrichedLocation = eventsData.filter(e => e.enriched_location).length;
  const eventsWithLocation = eventsData.filter(e => e.location_string).length;
  console.log(`Events with enriched_location: ${eventsWithEnrichedLocation}/${eventsData.length}`);
  console.log(`Events with location_string: ${eventsWithLocation}/${eventsData.length}`);
  
  // Check event structure
  const sampleEvent = eventsData.find(e => e.hosted_by_camp);
  if (sampleEvent) {
    console.log('\nSample event with camp:');
    console.log(JSON.stringify(sampleEvent, null, 2));
  }
  
  // Test enrichment logic
  const campMap = new Map(campsData.map(camp => [camp.uid, camp]));
  let wouldBeEnriched = 0;
  
  eventsData.forEach(event => {
    if (!event.location_string && !event.enriched_location && event.hosted_by_camp) {
      const camp = campMap.get(event.hosted_by_camp);
      if (camp && camp.location_string) {
        wouldBeEnriched++;
      }
    }
  });
  
  console.log(`\nEvents that would be enriched: ${wouldBeEnriched}`);
}

testEnrichment().catch(console.error);