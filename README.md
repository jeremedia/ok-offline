# OK-OFFLINE

An offline-first Progressive Web App for Burning Man that lets you browse camps, art installations, and events without connectivity.

## Features

- 📱 **Offline-First PWA** - Works without internet once data is synced
- 🗺️ **Interactive Map** - View camps, art, and events with precise street-corner accuracy
- 📍 **Navigation-Ready Positioning** - Camps placed at exact intersections using GIS data
- 📅 **Personal Schedule Builder** - Plan your burn with conflict detection
- ⭐ **Favorites & Visit Tracking** - Mark favorites and track where you've been
- 🚨 **Emergency Contacts** - Store important medical info and contacts offline
- 🌪️ **Dust Forecast** - Check playa weather conditions
- 🔍 **Smart Search** - Search across all camps, art, and events
- 📍 **Location Services** - Find distances to camps from your current location
- 🎨 **Custom Map Styling** - Year-specific street visualization with distinctive red/black theme
- 🧭 **Year-Aware Geocoding** - Handles changing avenue names across different years

## Getting Started

### Development

1. Clone the repository:
```bash
git clone https://github.com/jeremedia/ok-offline.git
cd ok-offline
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:8000`

### Building for Production

```bash
npm run build
npm run preview
```

## Usage

1. **First Time Setup**: Click on "OK-OFFLINE" header to access settings
2. **Sync Data**: Click "Sync Now" for the year you want to download
3. **Browse Offline**: Once synced, all data is available offline

## API Configuration

The app uses the Burning Man Public API. You'll need to update the API key in `src/config.js` if the current one expires.

## Tech Stack

- **Vue 3** - Frontend framework with Composition API
- **Vite** - Build tool and dev server
- **Vue Router** - Client-side routing
- **Leaflet** - Interactive maps
- **IndexedDB** - Offline data storage
- **Service Workers** - PWA functionality

## License

MIT License - See LICENSE file for details

## Acknowledgments

- Data provided by the [Burning Man Public API](https://api.burningman.org)
- Map data from Burning Man Innovate GIS
- Brought to you by Mr. OK of OKNOTOK