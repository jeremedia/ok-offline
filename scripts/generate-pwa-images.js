#!/usr/bin/env node

// Usage: node generate-pwa-images.js [model]
// model: 'gpt-image-1' (default) or 'dall-e-3'
// Example: node generate-pwa-images.js dall-e-3

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import OpenAI from 'openai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  console.error('OPENAI_API_KEY environment variable is required');
  process.exit(1);
}

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY
});

const publicDir = path.join(__dirname, '..', 'public');
const imagesDir = path.join(publicDir, 'images');

// Ensure directories exist
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
}

// Helper function to encode image to base64
function encodeImage(filePath) {
  const imageBuffer = fs.readFileSync(filePath);
  return imageBuffer.toString('base64');
}

async function generateIconWithReference(model = 'gpt-image-1') {
  console.log(`Generating icon-1024.png with ${model} using logo reference...`);
  
  // Read the OKNOTOK logo as reference
  const logoPath = path.join(__dirname, '..', '..', 'api', 'public', 'ok_logos', 'oknotok_circle_mark.png');
  const logoBase64 = encodeImage(logoPath);
  
  const iconPrompt = `Create a minimalist app icon for "OK OFFLINE", a Progressive Web App for Burning Man. Use the provided OKNOTOK logo as the primary visual element. 

Design requirements:
- Keep the circular red "OK" logo design from the reference image
- Add subtle desert/playa texture or gradient to the background
- Ensure the design works well as an app icon at small sizes
- Maintain the bold, geometric style of the original logo
- Consider adding a subtle dust or sand texture overlay
- Keep the red color prominent but can adjust shade for better app icon visibility
- The icon should be modern, clean, and immediately recognizable`;

  try {
    if (model === 'gpt-image-1') {
      // Use Responses API for gpt-image-1
      const response = await openai.responses.create({
        model: "gpt-4.1",
        input: [
          {
            role: "user",
            content: [
              { type: "input_text", text: iconPrompt },
              {
                type: "input_image",
                image_url: `data:image/png;base64,${logoBase64}`,
              }
            ],
          }
        ],
        tools: [{ 
          type: "image_generation",
          size: "1024x1024",
          quality: "high",
          background: "transparent"
        }],
      });

      const imageData = response.output
        .filter((output) => output.type === "image_generation_call")
        .map((output) => output.result);

      if (imageData.length > 0) {
        const imageBase64 = imageData[0];
        fs.writeFileSync(path.join(imagesDir, 'icon-1024.png'), Buffer.from(imageBase64, 'base64'));
        console.log('✓ icon-1024.png generated successfully');
      }
    } else {
      // Use Image API for other models
      const result = await openai.images.generate({
        model: model,
        prompt: iconPrompt,
        n: 1,
        size: "1024x1024",
        quality: model === 'dall-e-3' ? 'standard' : 'high',
        style: model === 'dall-e-3' ? 'vivid' : undefined
      });

      const imageUrl = result.data[0].url;
      const response = await fetch(imageUrl);
      const buffer = Buffer.from(await response.arrayBuffer());
      fs.writeFileSync(path.join(imagesDir, 'icon-1024.png'), buffer);
      console.log('✓ icon-1024.png generated successfully');
    }
  } catch (error) {
    throw new Error(`Icon generation failed: ${error.message}`);
  }
}

async function generateSocialImageWithReference(model = 'gpt-image-1') {
  console.log(`Generating og-image.png with ${model} using design references...`);
  
  // Read both reference images
  const logoPath = path.join(__dirname, '..', '..', 'api', 'public', 'ok_logos', 'oknotok_circle_mark.png');
  const ogDefaultPath = path.join(publicDir, 'images', 'og-default.png');
  
  const logoBase64 = encodeImage(logoPath);
  const ogDefaultBase64 = encodeImage(ogDefaultPath);
  
  const socialPrompt = `Create a social media preview image for "OK OFFLINE", a Progressive Web App for Burning Man attendees. Use the provided images as references:

1. The OKNOTOK circular logo (red OK in circle) should be prominently featured
2. The dark background style from the og-default.png should be maintained
3. Include "OK-OFFLINE" text in the same bold white font style as shown
4. Add "BRC OFFLINE 2025" subtitle
5. Include the coordinates "40.7864° N, 119.2065° W" at the bottom

Design requirements:
- Wide banner format suitable for social media
- Dark background (#0a0a0a or similar)
- Desert/playa aesthetic with subtle dust particle effects
- The red OKNOTOK logo should be the focal point on the right side
- Typography should match the bold, technical style of the reference
- Add subtle radial street pattern of Black Rock City as background texture
- Modern, minimalist design that captures the offline-first nature of the app`;

  try {
    const size = model === 'gpt-image-1' ? "1536x1024" : "1792x1024";
    
    if (model === 'gpt-image-1') {
      // Use Responses API for gpt-image-1
      const response = await openai.responses.create({
        model: "gpt-4.1",
        input: [
          {
            role: "user",
            content: [
              { type: "input_text", text: socialPrompt },
              {
                type: "input_image",
                image_url: `data:image/png;base64,${ogDefaultBase64}`,
              },
              {
                type: "input_image",
                image_url: `data:image/png;base64,${logoBase64}`,
              }
            ],
          }
        ],
        tools: [{ 
          type: "image_generation",
          size: size,
          quality: "high",
          background: "opaque"
        }],
      });

      const imageData = response.output
        .filter((output) => output.type === "image_generation_call")
        .map((output) => output.result);

      if (imageData.length > 0) {
        const imageBase64 = imageData[0];
        fs.writeFileSync(path.join(imagesDir, 'og-image.png'), Buffer.from(imageBase64, 'base64'));
        console.log('✓ og-image.png generated successfully');
      }
    } else {
      // Use Image API for other models (without image references)
      const result = await openai.images.generate({
        model: model,
        prompt: socialPrompt + "\n\nNote: Create this image based on the description since DALL-E cannot use image references.",
        n: 1,
        size: size,
        quality: model === 'dall-e-3' ? 'standard' : 'high',
        style: model === 'dall-e-3' ? 'vivid' : undefined
      });

      const imageUrl = result.data[0].url;
      const response = await fetch(imageUrl);
      const buffer = Buffer.from(await response.arrayBuffer());
      fs.writeFileSync(path.join(imagesDir, 'og-image.png'), buffer);
      console.log('✓ og-image.png generated successfully');
    }
  } catch (error) {
    throw new Error(`Social image generation failed: ${error.message}`);
  }
}

async function generateAllImages() {
  try {
    // Use gpt-image-1 by default, or allow switching via command line argument
    const model = process.argv[2] || 'gpt-image-1';
    console.log(`Using model: ${model}\n`);
    
    // Generate app icon with logo reference
    await generateIconWithReference(model);
    
    // Generate social media image with design references
    await generateSocialImageWithReference(model);
    
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