<template>
  <div class="tab-content maps-content">
    <h2>Map & GIS Settings</h2>
    
    <div class="maps-section">
      <h3>🗺️ Map Information</h3>
      <p>
        Explore detailed Black Rock City geographic information and mapping features.
      </p>
      
      <router-link to="/settings/map" class="maps-link">
        🔍 View Detailed Map Information →
      </router-link>
      
      <div class="maps-info">
        <h4>What you'll find:</h4>
        <ul>
          <li><strong>BRC Geometry</strong> - City dimensions, street layout, and orientation facts</li>
          <li><strong>GIS Data Sources</strong> - Information about streets, boundaries, and points of interest</li>
          <li><strong>Technical Details</strong> - Coordinate systems, data formats, and update schedules</li>
          <li><strong>Fun Facts</strong> - Interesting details about Black Rock City's unique urban design</li>
        </ul>
      </div>
    </div>

    <div class="maps-section">
      <h3>🧭 Map Controls</h3>
      <p>
        The map view includes advanced controls for exploring Black Rock City:
      </p>
      <ul>
        <li><strong>Layer Toggles</strong> - Show/hide streets, city blocks, trash fence, and points of interest</li>
        <li><strong>City Alignment</strong> - Rotate the map to align gate at bottom, temple at top</li>
        <li><strong>Base Map Toggle</strong> - Show/hide satellite imagery for better visibility</li>
        <li><strong>Interactive Legend</strong> - Understand what each symbol and color represents</li>
      </ul>
    </div>

    <div class="maps-section">
      <h3>📍 GIS Data Features</h3>
      <div class="gis-features-grid">
        <div class="gis-feature">
          <h4>🛣️ Street Network</h4>
          <p>Complete street layout including radial streets (2:00-10:00) and circular avenues (Esplanade-L)</p>
        </div>
        
        <div class="gis-feature">
          <h4>🚧 City Boundary</h4>
          <p>Trash fence perimeter defining the official city limits and safety boundary</p>
        </div>
        
        <div class="gis-feature">
          <h4>🏗️ City Blocks</h4>
          <p>Individual parcels showing camp placement and city organization</p>
        </div>
        
        <div class="gis-feature">
          <h4>📍 Points of Interest</h4>
          <p>Plazas, CPN locations, and other important community spaces</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
// Maps tab has no interactive functionality - it's purely informational
</script>

<style>
@import './settings-shared.css';
</style>

<style scoped>
/* Component-specific styles */
.maps-link {
  display: inline-block;
  background: var(--color-primary);
  color: var(--color-text-primary);
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  text-decoration: none;
  transition: background 0.2s;
  margin: 1rem 0;
  font-weight: 500;
}

.maps-link:hover {
  background: var(--color-primary-dark);
  text-decoration: none;
}

.maps-info {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--color-border-medium);
}
</style>