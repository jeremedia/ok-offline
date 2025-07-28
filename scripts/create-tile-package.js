#!/usr/bin/env node

/**
 * Script to download OSM tiles for Black Rock City and package them as a ZIP
 * This should be run on the API server to create the tile package
 * 
 * Usage: node create-tile-package.js
 */

import https from 'https'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import JSZip from 'jszip'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Black Rock City bounds
const BRC_BOUNDS = {
  north: 40.807,
  south: 40.764,
  east: -119.176,
  west: -119.233
}

// Zoom levels to download
const ZOOM_LEVELS = { min: 12, max: 17 }

// Calculate tile coordinates
function latLngToTilePoint(lat, lng, zoom) {
  const x = Math.floor((lng + 180) / 360 * Math.pow(2, zoom))
  const y = Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom))
  return { x, y }
}

// Download a single tile
function downloadTile(z, x, y) {
  return new Promise((resolve, reject) => {
    const subdomains = ['a', 'b', 'c']
    const s = subdomains[Math.abs(x + y) % subdomains.length]
    const url = `https://${s}.tile.openstreetmap.org/${z}/${x}/${y}.png`
    
    https.get(url, {
      headers: {
        'User-Agent': 'OK-OFFLINE Burning Man App (contact@example.com)'
      }
    }, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download tile: ${response.statusCode}`))
        return
      }
      
      const chunks = []
      response.on('data', chunk => chunks.push(chunk))
      response.on('end', () => resolve(Buffer.concat(chunks)))
    }).on('error', reject)
  })
}

// Main function
async function createTilePackage() {
  console.log('Creating tile package for Black Rock City...')
  
  const zip = new JSZip()
  let totalTiles = 0
  let downloadedTiles = 0
  
  // Calculate total tiles
  for (let zoom = ZOOM_LEVELS.min; zoom <= ZOOM_LEVELS.max; zoom++) {
    const minTile = latLngToTilePoint(BRC_BOUNDS.south, BRC_BOUNDS.west, zoom)
    const maxTile = latLngToTilePoint(BRC_BOUNDS.north, BRC_BOUNDS.east, zoom)
    
    const width = Math.abs(maxTile.x - minTile.x) + 1
    const height = Math.abs(maxTile.y - minTile.y) + 1
    totalTiles += width * height
  }
  
  console.log(`Total tiles to download: ${totalTiles}`)
  
  // Download tiles
  for (let zoom = ZOOM_LEVELS.min; zoom <= ZOOM_LEVELS.max; zoom++) {
    const minTile = latLngToTilePoint(BRC_BOUNDS.south, BRC_BOUNDS.west, zoom)
    const maxTile = latLngToTilePoint(BRC_BOUNDS.north, BRC_BOUNDS.east, zoom)
    
    for (let x = minTile.x; x <= maxTile.x; x++) {
      for (let y = maxTile.y; y <= minTile.y; y++) {
        try {
          const tileData = await downloadTile(zoom, x, y)
          zip.file(`tiles/${zoom}/${x}/${y}.png`, tileData)
          downloadedTiles++
          
          if (downloadedTiles % 10 === 0) {
            console.log(`Progress: ${downloadedTiles}/${totalTiles} (${Math.round(downloadedTiles/totalTiles*100)}%)`)
          }
          
          // Rate limit to avoid being blocked
          await new Promise(resolve => setTimeout(resolve, 100))
        } catch (error) {
          console.error(`Failed to download tile ${zoom}/${x}/${y}:`, error.message)
        }
      }
    }
  }
  
  console.log('Generating ZIP file...')
  
  // Generate ZIP
  const content = await zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 9 }
  })
  
  // Save ZIP file
  const outputPath = path.join(__dirname, '..', 'public', 'tiles-package.zip')
  fs.writeFileSync(outputPath, content)
  
  const stats = fs.statSync(outputPath)
  const fileSizeMB = (stats.size / 1024 / 1024).toFixed(2)
  
  console.log(`✅ Tile package created: ${outputPath}`)
  console.log(`   Size: ${fileSizeMB} MB`)
  console.log(`   Tiles: ${downloadedTiles}/${totalTiles}`)
}

// Run the script
createTilePackage().catch(console.error)