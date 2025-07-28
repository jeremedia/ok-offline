# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

OK-OFFLINE is a multi-service ecosystem for Burning Man participants providing offline-first tools for navigation, weather monitoring, AI-powered search, and future playa wisdom sharing. This is the top-level project coordination repository containing three main directories:

- **frontend/** - Vue 3 + Vite PWA (offline-first Burning Man guide) - v3.9.1 in production
- **api/** - Rails 8 API service (weather data, vector search, and future features)
- **project-management/** - Documentation and cross-service coordination

## Development Commands

### Frontend (Vue 3 PWA)
```bash
cd frontend
npm install          # Install dependencies
npm run dev -- --host 0.0.0.0 --port 8005  # Start dev server on port 8005
npm run build        # Build for production
npm run preview      # Preview production build
```

### Backend API (Rails 8)
```bash
cd api
bundle install       # Install Ruby dependencies
rails db:setup       # Create and setup database
rails db -c "CREATE EXTENSION IF NOT EXISTS vector;"  # Enable pgvector
rails server -b 0.0.0.0 -p 3555  # Start Rails server on port 3555

# For vector search (requires OPENAI_API_KEY in .env):
rails search:import[2024]  # Import and index Burning Man data
rails search:stats        # Check indexing status
```

## Architecture Overview

### Frontend Service (Vue 3 PWA)
- **Purpose**: Offline-first Progressive Web App for Burning Man participants
- **Tech Stack**: Vue 3, Vite, Vue Router, Leaflet, IndexedDB
- **Key Features**: 
  - Interactive maps with GIS data and accurate camp placement
  - AI-powered search with three modes (Keyword, Semantic, Smart)
  - Offline data sync for camps/art/events
  - Personal schedule builder and favorites
  - Weather/dust forecast integration
  - Emergency contacts storage
  - URL parameters for shareable searches
- **Primary Platform**: Mobile-optimized for use by Burning Man participants on-playa
- **Data Storage**: IndexedDB for offline functionality, LocalStorage for preferences
- **Deployment**: Static hosting at https://offline.oknotok.com

### Backend API Service (Rails 8)
- **Purpose**: API service for weather data, vector search, and future community features
- **Tech Stack**: Rails 8 API mode, PostgreSQL with pgvector, OpenAI integration
- **Current Features**: 
  - Weather: Apple WeatherKit + OpenWeatherMap (✅ Production)
  - Vector Search: AI-powered semantic search (✅ Production)
  - Entity Extraction: Automatic theme/location detection (✅ Production)
  - Search Analytics: Usage tracking and metrics (✅ Production)
- **Future Features**: Playa wisdom sharing, user accounts, content moderation
- **Authentication**: API keys (weather, OpenAI), future JWT for user features

## Working with This Repository

### Service-Specific Development
- **Frontend work**: Navigate to `frontend/` and use the comprehensive CLAUDE.md there
- **API work**: Navigate to `api/` for Rails development
- **Cross-service coordination**: Use this top-level directory

### Multi-Service Features
When implementing features spanning both services:
1. Plan architecture changes at this level
2. Update API endpoints first (api/)
3. Update frontend integration (frontend/)
4. Test cross-origin requests and CORS configuration
5. Coordinate deployment of both services

### Key Integration Points
- **CORS**: Rails API configured for frontend domain (100.104.170.10:8005 dev, offline.oknotok.com prod)
- **Weather API**: POST `/api/v1/weather/current` with lat/lon payload
- **Vector Search API**: 
  - POST `/api/v1/search/vector` - Semantic search
  - POST `/api/v1/search/hybrid` - Combined search
  - POST `/api/v1/search/suggest` - Autocomplete
- **API Proxy**: Currently proxied through frontend domain in production
- **Future Wisdom API**: RESTful endpoints for community content sharing

## Development Workflow

### Environment Setup
```bash
# Frontend development (running on port 8005 with Tailscale IP)
cd frontend && npm run dev -- --host 0.0.0.0 --port 8005

# API development (port 3555 with Tailscale IP)
cd api && rails server -b 0.0.0.0 -p 3555

# Both services can run simultaneously for integration testing
```

### Testing Integration
- Frontend makes requests to `http://100.104.170.10:3555/api/v1/`
- CORS must be properly configured for cross-origin requests
- Test offline functionality by stopping API service
- Verify PWA features work without backend connectivity

## Technology Decisions

### Why This Architecture
- **Offline-First**: Critical for Burning Man's limited connectivity
- **Vue 3 PWA**: Mature ecosystem, excellent offline support
- **Rails API**: Rapid development, robust ecosystem
- **Separate Services**: Independent deployment, technology flexibility

### Data Flow
1. **Frontend**: Syncs data through Settings page only (explicit user action)
2. **API**: Provides real-time weather data and future community features
3. **Offline**: Frontend works completely offline once data is synced
4. **Storage**: IndexedDB for large datasets, LocalStorage for preferences

## Common Development Patterns

### Adding Cross-Service Features
1. Define API endpoints in Rails first
2. Add service integration in Vue frontend
3. Handle offline/online states gracefully
4. Implement proper error handling and loading states
5. Test both connected and offline scenarios

### Debugging Integration Issues
- **CORS**: Check Rails `config/initializers/cors.rb` and browser dev tools
- **API Calls**: Monitor Rails logs in `api/log/development.log`
- **Frontend Errors**: Use browser dev tools and Vue dev tools
- **Offline Behavior**: Test with airplane mode or stopped API service

## Security Considerations

- **API Keys**: Environment variables only, never committed to git
- **CORS**: Properly configured for production domains
- **Local Storage**: No sensitive data in browser storage
- **HTTPS**: Required for PWA features and geolocation in production

## Deployment

### Frontend
- Automatic deployment via GitHub Actions to https://offline.oknotok.com
- Semantic versioning based on commit messages
- Zero-downtime deployments using Caddy server

### API
- Docker containerization (planned)
- PostgreSQL database
- Separate staging and production environments

## Current Project Status (July 2025)

### Completed Features ✅
1. **Frontend PWA** - v3.9.1 in production at https://offline.oknotok.com
2. **Weather Integration** - Multi-source weather with fallbacks
3. **Vector Search** - AI-powered search with 750+ indexed items
4. **GIS Integration** - Accurate camp placement at intersections
5. **Mobile UX** - Enhanced list controls and navigation

### Known Issues 🐛
- Double-scrolling on some mobile devices (Issue #11)
- API needs dedicated hosting (currently proxied)

### Next Priorities 🚀
1. **API Production Deployment** - Move from proxy to dedicated hosting
2. **Mobile UX Fixes** - Resolve double-scrolling issue
3. **Play Wisdom Feature** - Photo/audio/text capture and sharing

## Project Context

This ecosystem serves Burning Man participants who need reliable tools in Black Rock City's harsh environment with limited connectivity. Every feature must work offline once data is synced, prioritizing reliability over real-time features.

Created by Jeremy Roush and brought to you by Mr. OK of OKNOTOK.