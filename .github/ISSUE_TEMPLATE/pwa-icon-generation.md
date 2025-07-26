---
name: PWA Icon Generation Documentation
about: Process for generating PWA icons and social media images
title: '[DOCS] PWA Icon and Social Media Image Generation Process'
labels: documentation, enhancement
assignees: ''

---

## Overview

This issue documents the process for generating PWA icons and social media images for OK-OFFLINE using the OpenAI DALL-E 3 API. This process was successfully used to create all required app icons and social preview images.

## Prerequisites

- Node.js installed
- OpenAI API key with DALL-E 3 access
- `sharp` npm package for image processing

## Process Steps

### 1. Set Environment Variable

```bash
export OPENAI_API_KEY="your-openai-api-key"
```

### 2. Install Dependencies

```bash
npm install sharp --save-dev
```

### 3. Generate Base Images

Run the image generation script:

```bash
node scripts/generate-pwa-images.js
```

This script:
- Uses DALL-E 3 to generate a 1024x1024 app icon
- Uses DALL-E 3 to generate a 1792x1024 social media banner
- Saves images to `/public/images/`

**Generated files:**
- `icon-1024.png` - Base app icon
- `og-image.png` - Base social media image

### 4. Process and Resize Images

Run the image processing script:

```bash
node scripts/process-images.js
```

This script creates all required sizes:
- **App Icons:**
  - `icon-192.png` (PWA manifest)
  - `icon-512.png` (PWA manifest)
  - `icon-32.png` (favicon)
  - `icon-16.png` (favicon)
  - `apple-touch-icon.png` (180x180 for iOS)

- **Social Media Images:**
  - `og-image-1200x630.png` (Open Graph)
  - `twitter-card-1200x600.png` (Twitter Cards)
  - `social-square-1200x1200.png` (other platforms)

### 5. Update Configuration Files

#### manifest.json
Update icon paths to include `/images/` directory:
```json
"icons": [
  {
    "src": "/images/icon-192.png",
    "sizes": "192x192",
    "type": "image/png",
    "purpose": "any maskable"
  },
  {
    "src": "/images/icon-512.png",
    "sizes": "512x512",
    "type": "image/png",
    "purpose": "any maskable"
  }
]
```

#### index.html
Add favicon links and social media meta tags:
```html
<!-- Favicon -->
<link rel="icon" type="image/png" sizes="32x32" href="/images/icon-32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/images/icon-16.png">
<link rel="apple-touch-icon" sizes="180x180" href="/images/apple-touch-icon.png">

<!-- Open Graph Meta Tags -->
<meta property="og:image" content="https://offline.oknotok.com/images/og-image-1200x630.png">
<!-- ... other OG tags ... -->

<!-- Twitter Card Meta Tags -->
<meta name="twitter:image" content="https://offline.oknotok.com/images/twitter-card-1200x600.png">
<!-- ... other Twitter tags ... -->
```

## Image Design Specifications

### App Icon (DALL-E 3 Prompt)
```
A minimalist, modern app icon for "OK OFFLINE", a Progressive Web App for Burning Man. 
Design elements: 
- Clean, geometric design with high contrast
- Desert/playa aesthetic with dusty beige and burnt orange colors
- Subtle reference to Black Rock City's radial street layout
- "OK" text integrated stylistically
- Works well at small sizes
- Flat design suitable for PWA icon
Style: Modern, minimal, technical, desert-themed
```

### Social Media Images (DALL-E 3 Prompt)
```
A social media preview image for "OK OFFLINE", a Progressive Web App for Burning Man attendees.
Design elements:
- Wide banner format with "OK OFFLINE" prominently displayed
- Black Rock City's iconic radial street pattern as background
- Desert playa texture and colors (dusty beige, burnt orange, deep sunset hues)
- Subtle tech/digital elements suggesting offline functionality
- Include tagline: "Your offline guide to the playa"
- Modern, clean typography
- Berkeley Mono inspired aesthetic
Style: Desert tech, modern minimalism, Burning Man aesthetic
```

## Regeneration Instructions

To regenerate icons with a different design:

1. Modify the prompts in `scripts/generate-pwa-images.js`
2. Delete existing images: `rm -rf public/images/*.png`
3. Run the generation process again (steps 3-4 above)
4. Verify all meta tags and manifest paths are correct

## Notes

- DALL-E 3 limitations: Only generates 1024x1024, 1024x1792, or 1792x1024 sizes
- The `sharp` library handles all resizing and cropping
- Images are optimized for web use
- Consider running images through additional optimization tools for production

## Future Improvements

- [ ] Add image optimization step (TinyPNG, ImageOptim)
- [ ] Generate additional icon sizes for different platforms
- [ ] Create dark mode variants
- [ ] Add automated testing to verify all images exist
- [ ] Consider generating seasonal/event-specific variants

## Related Files

- `/scripts/generate-pwa-images.js` - OpenAI API image generation
- `/scripts/process-images.js` - Image resizing and processing
- `/public/manifest.json` - PWA manifest configuration
- `/index.html` - Meta tags and favicon links