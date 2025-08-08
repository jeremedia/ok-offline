# Capacitor Implementation Guide for OK-OFFLINE

## Quick Start

```bash
# From frontend directory
npm install @capacitor/core @capacitor/cli @capacitor/ios @capacitor/android
npx cap init "OK-OFFLINE" "com.oknotok.offline" --web-dir dist
npx cap add ios
npx cap add android
```

## Configuration Files

### 1. capacitor.config.ts
```typescript
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.oknotok.offline',
  appName: 'OK-OFFLINE',
  webDir: 'dist',
  server: {
    // Use https for Android to match PWA
    androidScheme: 'https',
    
    // iOS requires capacitor:// 
    iosScheme: 'capacitor',
    
    // Allow navigation to external URLs (weather API, etc)
    allowNavigation: [
      'https://offline.oknotok.com',
      'https://api.openweathermap.org',
      'https://burningman.widen.net' // Camp images
    ]
  },
  ios: {
    // Prevent rubber band scrolling
    scrollEnabled: false,
    
    // Allow keyboard to push view up
    keyboardResize: 'native',
    
    // Status bar
    statusBarStyle: 'dark'
  },
  android: {
    // Allow mixed content for HTTP images
    mixedContentMode: 'compatibility',
    
    // Keyboard behavior
    keyboardResize: 'native'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#1a1a1a',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true
    },
    Keyboard: {
      resize: 'native'
    }
  }
};

export default config;
```

### 2. Update package.json Scripts
```json
{
  "scripts": {
    // Existing scripts...
    "build:cap": "vite build && npx cap sync",
    "cap:ios": "npx cap open ios",
    "cap:android": "npx cap open android",
    "cap:serve": "npx cap serve",
    "cap:sync": "npx cap sync",
    "cap:update": "npx cap update"
  }
}
```

## Essential Plugins for OK-OFFLINE

### Core Plugins
```bash
# Navigation & System
npm install @capacitor/app           # App state, deep links
npm install @capacitor/browser       # Open external links
npm install @capacitor/status-bar    # iOS status bar control
npm install @capacitor/splash-screen # Native splash screen

# Data & Storage  
npm install @capacitor/filesystem    # File system access
npm install @capacitor/preferences   # Key-value storage
npm install @capacitor/network       # Network status

# User Features
npm install @capacitor/geolocation   # GPS location
npm install @capacitor/share         # Share functionality
npm install @capacitor/haptics       # Haptic feedback
npm install @capacitor/toast         # Native toasts

# Future Features
npm install @capacitor/camera        # Photo capture for wisdom
npm install @capacitor/push-notifications # Event reminders
```

## Code Modifications

### 1. Create Capacitor Service
```javascript
// src/services/capacitorService.js
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { Network } from '@capacitor/network';
import { Geolocation } from '@capacitor/geolocation';
import { StatusBar } from '@capacitor/status-bar';
import { Preferences } from '@capacitor/preferences';

class CapacitorService {
  constructor() {
    this.isNative = Capacitor.isNativePlatform();
    this.platform = Capacitor.getPlatform(); // 'ios', 'android', 'web'
  }

  async initialize() {
    if (!this.isNative) return;

    // Set status bar
    if (this.platform === 'ios') {
      await StatusBar.setStyle({ style: 'dark' });
      await StatusBar.setBackgroundColor({ color: '#1a1a1a' });
    }

    // Handle app state
    App.addListener('appStateChange', ({ isActive }) => {
      console.log('App state:', isActive ? 'foreground' : 'background');
      if (isActive) {
        // Refresh weather data if stale
        this.checkAndRefreshData();
      }
    });

    // Handle back button (Android)
    if (this.platform === 'android') {
      App.addListener('backButton', () => {
        // Custom back button handling
        if (window.location.pathname === '/2025') {
          App.exitApp();
        } else {
          window.history.back();
        }
      });
    }
  }

  // Network status
  async getNetworkStatus() {
    if (this.isNative) {
      return await Network.getStatus();
    }
    return { connected: navigator.onLine };
  }

  // GPS with permissions
  async getCurrentPosition() {
    if (this.isNative) {
      // Request permissions
      const permissions = await Geolocation.requestPermissions();
      if (permissions.location === 'granted') {
        return await Geolocation.getCurrentPosition({
          enableHighAccuracy: true,
          timeout: 10000
        });
      }
      throw new Error('Location permission denied');
    }
    
    // Fallback to web API
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        position => resolve(position),
        error => reject(error),
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });
  }

  // Native storage (more reliable than localStorage)
  async getPreference(key) {
    if (this.isNative) {
      const { value } = await Preferences.get({ key });
      return value;
    }
    return localStorage.getItem(key);
  }

  async setPreference(key, value) {
    if (this.isNative) {
      await Preferences.set({ key, value });
    } else {
      localStorage.setItem(key, value);
    }
  }
}

export const capacitorService = new CapacitorService();
```

### 2. Update Main App Entry
```javascript
// src/main.js
import { capacitorService } from './services/capacitorService';

// Initialize Capacitor before Vue
capacitorService.initialize().then(() => {
  // Create Vue app
  const app = createApp(App);
  
  // Add to global properties
  app.config.globalProperties.$capacitor = capacitorService;
  
  // Mount app
  app.mount('#app');
});
```

### 3. Update Geolocation Composable
```javascript
// src/composables/useGeolocation.js
import { capacitorService } from '@/services/capacitorService';

export function useGeolocation() {
  const getLocation = async () => {
    try {
      setLoading(true);
      
      // Use Capacitor service
      const position = await capacitorService.getCurrentPosition();
      
      coordinates.value = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
      };
      
      // Store in native preferences
      await capacitorService.setPreference(
        'userCoordinates', 
        JSON.stringify(coordinates.value)
      );
      
    } catch (err) {
      error.value = err.message;
    } finally {
      setLoading(false);
    }
  };
  
  return { coordinates, error, loading, getLocation };
}
```

### 4. Update Service Worker Detection
```javascript
// src/App.vue
import { capacitorService } from '@/services/capacitorService';

onMounted(() => {
  // Skip service worker registration on native
  if (!capacitorService.isNative && 'serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js');
  }
});
```

### 5. Handle External Links
```javascript
// src/components/ExternalLink.vue
<template>
  <a @click="openLink" :href="href">
    <slot />
  </a>
</template>

<script setup>
import { Browser } from '@capacitor/browser';
import { capacitorService } from '@/services/capacitorService';

const props = defineProps(['href']);

const openLink = async (e) => {
  if (capacitorService.isNative) {
    e.preventDefault();
    await Browser.open({ url: props.href });
  }
  // Web lets default behavior happen
};
</script>
```

## Platform-Specific Files

### iOS: Info.plist Additions
```xml
<!-- Location permission -->
<key>NSLocationWhenInUseUsageDescription</key>
<string>OK-OFFLINE needs your location to show nearby camps and calculate distances.</string>

<!-- Camera permission (future) -->
<key>NSCameraUsageDescription</key>
<string>OK-OFFLINE needs camera access to capture playa memories.</string>

<!-- Photo library (future) -->
<key>NSPhotoLibraryUsageDescription</key>
<string>OK-OFFLINE needs photo access to save and share playa memories.</string>

<!-- Allow HTTP (for some camp data) -->
<key>NSAppTransportSecurity</key>
<dict>
  <key>NSAllowsArbitraryLoads</key>
  <true/>
</dict>
```

### Android: AndroidManifest.xml
```xml
<!-- Permissions -->
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />

<!-- Allow HTTP -->
<application
  android:usesCleartextTraffic="true">
</application>
```

## Build & Deploy Process

### Development Workflow
```bash
# 1. Make changes to Vue app
npm run dev

# 2. Build and sync to native projects
npm run build:cap

# 3. Run on iOS Simulator
npm run cap:ios
# Then in Xcode: Product > Run (Cmd+R)

# 4. Run on Android Emulator  
npm run cap:android
# Then in Android Studio: Run > Run 'app'

# 5. Live reload during development
npx cap serve
# Update capacitor.config.ts temporarily:
# server: { url: 'http://YOUR_IP:3000' }
```

### Production Build
```bash
# iOS
1. npm run build:cap
2. npx cap open ios
3. In Xcode:
   - Select "Any iOS Device" as target
   - Product > Archive
   - Distribute App > App Store Connect

# Android
1. npm run build:cap
2. npx cap open android  
3. In Android Studio:
   - Build > Generate Signed Bundle/APK
   - Choose Android App Bundle
   - Upload to Play Console
```

## Testing Checklist

### Core Functionality
- [ ] Offline data sync works
- [ ] Maps load and display correctly
- [ ] GPS location services work
- [ ] Search (all three modes) functions
- [ ] Schedule and favorites persist
- [ ] Weather data loads

### Native Features
- [ ] App opens without splash screen delay
- [ ] Status bar matches app theme
- [ ] Back button works properly (Android)
- [ ] External links open in browser
- [ ] Keyboard doesn't cover inputs
- [ ] Scroll behavior feels native

### Performance
- [ ] Initial load <3 seconds
- [ ] Smooth scrolling (60fps)
- [ ] Map interactions responsive
- [ ] No memory leaks on navigation

## Common Issues & Solutions

### Issue: White screen on launch
```javascript
// Solution: Ensure all assets are relative paths
// vite.config.js
export default {
  base: './' // Important for Capacitor
}
```

### Issue: CORS errors with API calls
```javascript
// Solution: Update server URLs for native
const API_URL = capacitorService.isNative 
  ? 'https://offline.oknotok.com/api'  // Full URL for native
  : '/api';  // Proxy for web
```

### Issue: IndexedDB not persisting
```javascript
// Solution: Use Capacitor Preferences for critical data
await capacitorService.setPreference('lastSync', Date.now());
```

### Issue: iOS rubber band scrolling
```css
/* Solution: Add to global styles */
.app-container {
  position: fixed;
  overflow: hidden;
  -webkit-overflow-scrolling: touch;
}
```

## Optimization Tips

1. **Bundle critical assets**
   ```javascript
   // Copy essential data during build
   // capacitor.config.ts
   {
     ios: {
       copy: [{
         from: 'public/data/2025',
         to: 'data/2025'
       }]
     }
   }
   ```

2. **Lazy load heavy features**
   ```javascript
   // Don't load map until needed
   const MapView = () => import('./views/MapView.vue');
   ```

3. **Use native transitions**
   ```css
   /* Disable web transitions on native */
   .capacitor-ios .view-transition {
     transition: none !important;
   }
   ```

## Next Steps

1. Implement push notifications for event reminders
2. Add widget support (iOS 14+, Android 12+)
3. Implement app shortcuts for quick access
4. Add offline map tile bundling
5. Create automated build pipeline

---

*Implementation guide for OK-OFFLINE Capacitor integration*  
*Version: 1.0 - August 2025*