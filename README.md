# OK-OFFLINE Frontend PWA

[![Version](https://img.shields.io/badge/version-3.9.1-blue.svg)](https://github.com/jeremedia/ok-offline)
[![Status](https://img.shields.io/badge/status-production-green.svg)](https://offline.oknotok.com)
[![PWA](https://img.shields.io/badge/PWA-enabled-orange.svg)](https://offline.oknotok.com)

Offline-first Progressive Web App for Burning Man participants. Access camps, art installations, events, and essential tools without connectivity in Black Rock City.

🌐 **Live at**: [https://offline.oknotok.com](https://offline.oknotok.com)

## 🚀 Features

### Core Functionality
- **📱 Offline-First PWA** - Works completely offline once data is synced
- **🗺️ Interactive Maps** - Leaflet-based maps with BRC coordinates and GIS layers
- **🔍 AI-Powered Search** - Three modes: Keyword (offline), Semantic (AI), Smart (hybrid)
- **⭐ Favorites & Visits** - Track your favorite spots and places you've been
- **📅 Personal Schedule** - Build your burn schedule with conflict detection
- **🌡️ Weather & Dust** - Real-time conditions with Apple WeatherKit integration
- **🚨 Emergency Info** - Store medical info and contacts offline
- **📍 Location Services** - GPS integration for distance calculations

### Recent Updates (v3.9.1)
- ✅ AI-powered semantic search with three modes
- ✅ URL parameters for shareable search links (?q=query&mode=semantic)
- ✅ Enhanced mobile list controls with professional UX
- ✅ Improved camp location accuracy with GIS data
- ✅ 24-hour search result caching for performance
- ✅ Service worker improvements for better Safari compatibility

## 🛠️ Tech Stack

- **Vue 3** - Modern reactive framework with Composition API
- **Vite** - Lightning-fast build tool with HMR
- **Leaflet** - Interactive maps with rotation support
- **IndexedDB** - Offline data persistence
- **Service Workers** - PWA functionality and caching
- **Berkeley Mono** - Custom typography

## 📋 Prerequisites

- Node.js 18+
- npm or yarn
- Modern browser with PWA support

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/jeremedia/ok-offline.git
cd ok-offline

# Install dependencies
npm install

# Start development server (port 8005 with Tailscale IP)
npm run dev -- --host 0.0.0.0 --port 8005

# Build for production
npm run build

# Preview production build
npm run preview
```

## 🔧 Configuration

### Environment Variables
```bash
# Create .env file
cp .env.example .env

# Add your API keys (optional, for development)
VITE_BM_API_KEY=your_burning_man_api_key
VITE_WEATHER_API_KEY=your_openweather_key  # Not needed if using Rails API
```

### API Integration
The app connects to the OK-OFFLINE API service for weather data:
- Development: `http://100.104.170.10:3555/api/v1/`
- Production: `https://api.offline.oknotok.com/api/v1/` (planned)

## 📱 PWA Installation

1. Visit [https://offline.oknotok.com](https://offline.oknotok.com)
2. Click "Install" when prompted (or use browser menu)
3. App works fully offline once installed

## 🗂️ Data Management

### Syncing Data
1. Navigate to Settings (gear icon)
2. Select year (2024 or 2025)
3. Click "Sync All Data"
4. Wait for camps, art, and events to download
5. Data stored in IndexedDB for offline use

### Storage Requirements
- ~5MB for complete dataset
- ~2MB for app assets
- Unlimited local storage for favorites/notes

## 🗺️ Using the Map

- **Layers**: Toggle streets, blocks, plazas, trash fence
- **Markers**: Camps (blue), Art (red), Events (by time)
- **Navigation**: Pinch to zoom, drag to pan, rotate with two fingers
- **Location**: Enable GPS for distance calculations
- **Search**: Find locations by BRC address (e.g., "7:30 & E")

## 🔍 Search Features

- **Keyword Mode** - Traditional text search (works offline)
- **Semantic Mode** - AI understands meaning (e.g., "meditation" finds yoga camps)
- **Smart Mode** - Best of both approaches
- **URL Sharing** - Share searches with `?q=query&mode=semantic`
- **Suggestions** - Autocomplete as you type
- **Caching** - Results cached for 24 hours

## 📚 Documentation

- [Development Guide](docs/development/README.md) - Setup and contribution guidelines
- [Feature Documentation](docs/features/README.md) - Detailed feature explanations
- [Technical Architecture](docs/technical/ARCHITECTURE.md) - System design and decisions
- [UI/UX Guidelines](docs/development/UI_UX_GUIDELINES.md) - Design principles
- [API Documentation](docs/technical/API_INTEGRATION.md) - Backend integration

## 🐛 Known Issues

- Safari requires manual PWA update (increment SW version)
- Double-scrolling on some mobile devices (fix in progress)
- API currently proxied through frontend domain (dedicated hosting planned)

## 🤝 Contributing

This is an open-source project for the Burning Man community. Contributions welcome!

1. Check [open issues](https://github.com/jeremedia/ok-offline/issues)
2. Follow the [UI/UX Guidelines](docs/development/UI_UX_GUIDELINES.md)
3. Test on mobile devices (primary use case)
4. Ensure offline functionality isn't broken

## 📄 License

MIT License - See [LICENSE](LICENSE) file

## 🙏 Credits

- **Created by**: Jeremy Roush
- **Brought to you by**: Mr. OK of OKNOTOK
- **Data**: [Burning Man API](https://api.burningman.org)
- **Weather**: OpenWeatherMap & Apple WeatherKit
- **Maps**: Burning Man Innovate GIS

---

*Built with 💜 for the Burning Man community. See you in the dust! 🔥*