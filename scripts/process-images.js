#!/usr/bin/env node

import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const imagesDir = path.join(__dirname, '..', 'public', 'images');

async function processImages() {
  try {
    // Check if source images exist
    const icon1024Path = path.join(imagesDir, 'icon-1024.png');
    const ogImagePath = path.join(imagesDir, 'og-image.png');
    
    if (!fs.existsSync(icon1024Path)) {
      console.error('icon-1024.png not found. Run generate-pwa-images.js first.');
      process.exit(1);
    }
    
    if (!fs.existsSync(ogImagePath)) {
      console.error('og-image.png not found. Run generate-pwa-images.js first.');
      process.exit(1);
    }
    
    // Generate app icons
    console.log('Generating app icons...');
    
    await sharp(icon1024Path)
      .resize(192, 192)
      .toFile(path.join(imagesDir, 'icon-192.png'));
    console.log('✓ icon-192.png created');
    
    await sharp(icon1024Path)
      .resize(512, 512)
      .toFile(path.join(imagesDir, 'icon-512.png'));
    console.log('✓ icon-512.png created');
    
    // Generate smaller icons for favicon
    await sharp(icon1024Path)
      .resize(32, 32)
      .toFile(path.join(imagesDir, 'icon-32.png'));
    console.log('✓ icon-32.png created');
    
    await sharp(icon1024Path)
      .resize(16, 16)
      .toFile(path.join(imagesDir, 'icon-16.png'));
    console.log('✓ icon-16.png created');
    
    // Generate apple-touch-icon
    await sharp(icon1024Path)
      .resize(180, 180)
      .toFile(path.join(imagesDir, 'apple-touch-icon.png'));
    console.log('✓ apple-touch-icon.png created');
    
    // Process social media images
    console.log('\nGenerating social media images...');
    
    // Get dimensions of og-image
    const metadata = await sharp(ogImagePath).metadata();
    console.log(`Original image dimensions: ${metadata.width}x${metadata.height}`);
    
    // Open Graph image (1200x630) - center crop
    await sharp(ogImagePath)
      .resize(1200, 630, {
        fit: 'cover',
        position: 'center'
      })
      .toFile(path.join(imagesDir, 'og-image-1200x630.png'));
    console.log('✓ og-image-1200x630.png created');
    
    // Twitter Card image (1200x600) - center crop
    await sharp(ogImagePath)
      .resize(1200, 600, {
        fit: 'cover',
        position: 'center'
      })
      .toFile(path.join(imagesDir, 'twitter-card-1200x600.png'));
    console.log('✓ twitter-card-1200x600.png created');
    
    // Also create a square version for other social media
    await sharp(ogImagePath)
      .resize(1200, 1200, {
        fit: 'cover',
        position: 'center'
      })
      .toFile(path.join(imagesDir, 'social-square-1200x1200.png'));
    console.log('✓ social-square-1200x1200.png created');
    
    console.log('\n✅ All images processed successfully!');
    
  } catch (error) {
    console.error('Error processing images:', error);
    process.exit(1);
  }
}

processImages();