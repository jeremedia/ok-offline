#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  console.error('OPENAI_API_KEY environment variable is required');
  process.exit(1);
}

const publicDir = path.join(__dirname, '..', 'public');
const imagesDir = path.join(publicDir, 'images');

// Ensure directories exist
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
}

async function generateImage(prompt, size, filename) {
  console.log(`Generating ${filename}...`);
  
  const data = JSON.stringify({
    model: "dall-e-3",
    prompt: prompt,
    n: 1,
    size: size,
    quality: "standard",
    style: "vivid"
  });

  const options = {
    hostname: 'api.openai.com',
    port: 443,
    path: '/v1/images/generations',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Length': data.length
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', async () => {
        try {
          const response = JSON.parse(responseData);
          
          if (response.error) {
            throw new Error(response.error.message);
          }

          const imageUrl = response.data[0].url;
          
          // Download the image
          const file = fs.createWriteStream(path.join(imagesDir, filename));
          
          https.get(imageUrl, (response) => {
            response.pipe(file);
            
            file.on('finish', () => {
              file.close();
              console.log(`✓ ${filename} generated successfully`);
              resolve();
            });
          }).on('error', (err) => {
            fs.unlink(path.join(imagesDir, filename), () => {});
            reject(err);
          });
          
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(data);
    req.end();
  });
}

// Icon prompt focused on app functionality
const iconPrompt = `A minimalist, modern app icon for "OK OFFLINE", a Progressive Web App for Burning Man. 
Design elements: 
- Clean, geometric design with high contrast
- Desert/playa aesthetic with dusty beige and burnt orange colors
- Subtle reference to Black Rock City's radial street layout
- "OK" text integrated stylistically
- Works well at small sizes
- Flat design suitable for PWA icon
Style: Modern, minimal, technical, desert-themed`;

// OG/Twitter card prompt with more context
const socialPrompt = `A social media preview image for "OK OFFLINE", a Progressive Web App for Burning Man attendees.
Design elements:
- Wide banner format with "OK OFFLINE" prominently displayed
- Black Rock City's iconic radial street pattern as background
- Desert playa texture and colors (dusty beige, burnt orange, deep sunset hues)
- Subtle tech/digital elements suggesting offline functionality
- Include tagline: "Your offline guide to the playa"
- Modern, clean typography
- Berkeley Mono inspired aesthetic
Style: Desert tech, modern minimalism, Burning Man aesthetic`;

async function generateAllImages() {
  try {
    // Generate app icons (DALL-E 3 only supports 1024x1024 square)
    await generateImage(iconPrompt, "1024x1024", "icon-1024.png");
    
    // Generate social media images (DALL-E 3 supports 1024x1792 or 1792x1024)
    await generateImage(socialPrompt, "1792x1024", "og-image.png");
    
    console.log('\n✅ All images generated successfully!');
    console.log('\nNext steps:');
    console.log('1. Use an image editor to resize icon-1024.png to create:');
    console.log('   - icon-192.png (192x192)');
    console.log('   - icon-512.png (512x512)');
    console.log('2. Use an image editor to crop og-image.png to create:');
    console.log('   - og-image-1200x630.png (for Open Graph)');
    console.log('   - twitter-card-1200x600.png (for Twitter)');
    console.log('3. Update manifest.json with icon paths');
    console.log('4. Update index.html with OG/Twitter meta tags');
    
  } catch (error) {
    console.error('Error generating images:', error.message);
    process.exit(1);
  }
}

generateAllImages();