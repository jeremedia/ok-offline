<template>
  <div class="tab-content features-content">
    <h2>Features</h2>
    
    <div class="feature-section">
      <h3>🗺️ Interactive Map</h3>
      <ul>
        <li>View camps, art installations, and events on an interactive map</li>
        <li>Toggle different map layers (streets, blocks, plazas)</li>
        <li>Search by BRC address (e.g., "7:30 & E")</li>
        <li>Professional map rotation with city alignment</li>
      </ul>
    </div>
    
    <div class="feature-section">
      <h3>📍 Location Services</h3>
      <ul>
        <li>Find your current location on the map</li>
        <li>Calculate distances to camps and art</li>
        <li>Sort listings by proximity</li>
      </ul>
    </div>
    
    <div class="feature-section">
      <h3>⭐ Favorites & Schedule</h3>
      <ul>
        <li>Star your favorite camps, art, and events</li>
        <li>Build a personal event schedule</li>
        <li>Get conflict warnings for overlapping events</li>
        <li>Track which camps and art you've visited</li>
      </ul>
    </div>
    
    <div class="feature-section">
      <h3>🔍 Smart Search</h3>
      <ul>
        <li>Search across all camps, art, and events</li>
        <li>Filter by type, sector, or event category</li>
        <li>Sort by name, location, or distance</li>
      </ul>
    </div>
    
    <div class="feature-section">
      <h3>📱 Offline First</h3>
      <ul>
        <li>Works completely offline once data is synced</li>
        <li>Progressive Web App - install on your device</li>
        <li>Optimized for mobile use on the playa</li>
        <li>Battery-efficient design</li>
      </ul>
    </div>
    
    <div class="feature-section">
      <h3>🌪️ Weather & Dust</h3>
      <ul>
        <li>Real-time weather conditions</li>
        <li>5-day forecast with temperature ranges</li>
        <li>Smart dust level predictions</li>
        <li>UV index and protection recommendations</li>
      </ul>
    </div>
    
    <div class="keyboard-shortcuts">
      <h3>⌨️ Keyboard Shortcuts</h3>
      <table>
        <tbody>
          <tr><td><kbd>1</kbd></td><td>Go to Map</td></tr>
          <tr><td><kbd>2</kbd></td><td>Go to Camps</td></tr>
          <tr><td><kbd>3</kbd></td><td>Go to Art</td></tr>
          <tr><td><kbd>4</kbd></td><td>Go to Events</td></tr>
          <tr><td><kbd>5</kbd></td><td>Go to Search</td></tr>
          <tr><td><kbd>6</kbd></td><td>Go to Schedule</td></tr>
          <tr><td><kbd>7</kbd></td><td>Go to Dust Forecast</td></tr>
          <tr><td><kbd>F</kbd></td><td>Toggle Favorites</td></tr>
          <tr><td><kbd>L</kbd></td><td>Toggle Layers (Map)</td></tr>
          <tr><td><kbd>/</kbd></td><td>Show Shortcuts</td></tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
// Features tab has no interactive functionality - it's purely informational
</script>

<style>
@import './settings-shared.css';
</style>

<style scoped>
/* Component-specific styles */
.feature-section ul {
  margin-left: 0;
  padding-left: 0;
  list-style: none;
}

.feature-section li {
  position: relative;
  padding-left: 1.25rem;
}

.feature-section li::before {
  content: "•";
  position: absolute;
  left: 0;
  color: var(--color-gold);
}

.keyboard-shortcuts table {
  width: 100%;
  border-collapse: collapse;
}

.keyboard-shortcuts td {
  padding: 0.5rem;
  border-bottom: 1px solid #444;
}

.keyboard-shortcuts kbd {
  background: #444;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-family: 'Berkeley Mono', monospace;
  font-size: 0.9rem;
}
</style>