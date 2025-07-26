# OK-OFFLINE v2.0.0 - Major Security & Integration Update

## 🔒 Security-First Architecture Overhaul

This major release represents a complete security transformation of OK-OFFLINE's weather integration system. We've eliminated all client-side API credentials and implemented a secure Rails backend proxy, ensuring your Burning Man experience remains safe and reliable.

## 🚨 Breaking Changes

**This release requires the Rails backend service to be running for weather features.**

- **API Credentials Removed**: All hardcoded API keys have been removed from the frontend
- **Backend Dependency**: Weather features now require the companion Rails API service
- **Development Workflow**: Local development now uses Vite proxy to Rails backend on port 3020

## ✨ What's New

### 🛡️ Security Improvements
- **Zero Client-Side Credentials**: No more API keys exposed in browser JavaScript
- **Secure Proxy Architecture**: All weather API calls routed through Rails backend
- **Apple WeatherKit JWT**: Server-side authentication for premium weather data
- **CORS Protection**: Proper cross-origin request handling for production

### 🌤️ Enhanced Weather Integration
- **Dual-Source Weather**: Apple WeatherKit primary with OpenWeatherMap fallback
- **Rails API Proxy**: Secure `/api/v1/weather/current` endpoint integration
- **Moon Phase Data**: Accurate lunar information for playa navigation
- **Professional GIS Data**: Updated airport coordinates and map rotation
- **Robust Error Handling**: Graceful fallbacks when services are unavailable

### 🔧 Development Experience
- **Vite Proxy Configuration**: Seamless local development with Rails backend
- **Port Updates**: Dev server now runs on port 8005 for proxy compatibility
- **Hot Reload**: Live development with backend integration testing
- **Clear Logging**: Enhanced debugging for weather service integration

## 🏗️ Architecture Changes

### Before (v1.x)
```
Frontend → Direct API Calls → Weather Services
         ❌ Exposed credentials
         ❌ CORS limitations
         ❌ Security vulnerabilities
```

### After (v2.0)
```
Frontend → Rails Proxy → Weather Services
         ✅ Secure credentials
         ✅ CORS compliant
         ✅ Production ready
```

## 🚀 Getting Started

### Prerequisites
1. **Rails Backend**: You must run the companion `ok-offline-api` service
2. **Port Configuration**: Rails backend on port 3020, frontend on port 8005

### Development Setup
```bash
# Terminal 1: Start Rails backend
cd ../api
rails server -p 3020

# Terminal 2: Start Vue frontend
cd frontend
npm run dev  # Runs on port 8005 with proxy
```

### Production Deployment
- Frontend deploys independently as PWA
- Backend provides weather API proxy
- CORS configured for `offline.oknotok.com`

## 🛠️ Migration Guide

### For Developers
1. **Update Development Workflow**: Always run Rails backend for weather features
2. **Remove Local API Keys**: No longer needed in `.env` files
3. **Test Proxy Integration**: Verify `/api/v1/weather/current` endpoint responds
4. **Update CORS Settings**: Configure Rails for your production domain

### For Users
- **Automatic Update**: PWA will update automatically
- **Offline Support**: Still works completely offline once synced
- **Enhanced Reliability**: Better weather data with multiple fallbacks

## 📊 Performance & Reliability

- **Faster Weather Loading**: Server-side caching reduces API calls
- **Better Error Recovery**: Multiple fallback strategies implemented
- **Offline Resilience**: Cached data ensures functionality without connectivity
- **Production Stability**: Secure architecture ready for scale

## 🐛 Bug Fixes

- Fixed CORS issues preventing Apple WeatherKit integration
- Resolved console errors from failed API authentication
- Corrected airport GIS coordinates for accurate positioning
- Eliminated template reference errors in weather displays

## 🔮 What's Next

This secure foundation enables future features:
- User accounts and personalization
- Community wisdom sharing
- Enhanced offline synchronization
- Advanced weather modeling

## 🙏 Acknowledgments

This release completes Phase 1 of the OK-OFFLINE ecosystem, delivering on our promise of secure, reliable, offline-first tools for Burning Man participants.

**Created by Jeremy Roush and brought to you by Mr. OK of OKNOTOK.**

---

## Technical Details

### API Endpoints
- `POST /api/v1/weather/current` - Current weather with dust forecast
- Payload: `{ latitude: 40.788645, longitude: -119.203018 }`
- Response: Standardized weather object with dust level calculations

### Security Features
- Server-side JWT generation for Apple WeatherKit
- Environment-based API key management
- Proper CORS headers for production domains
- No sensitive data in client-side storage

### Offline Capabilities
- Complete app functionality without internet
- Weather data cached for offline use
- Manual sync control through Settings
- Emergency contacts stored locally

Ready for the playa! 🔥🏜️