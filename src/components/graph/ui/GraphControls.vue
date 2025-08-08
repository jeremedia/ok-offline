<!--
GraphControls.vue - Knowledge Graph Controls Component

Extracted from main KnowledgeGraph.vue as part of decomposition effort.
Handles all user interface controls for the knowledge graph:
- View mode selection (clusters/pool/entity)
- Pool selection dropdown (when in pool mode)
- Entity search input (when in entity mode)  
- Camera controls (zoom, reset, smooth layout, fullscreen)

Props:
- viewMode: Current view mode ('clusters', 'pool', 'entity')
- selectedPool: Currently selected pool name
- entitySearch: Current entity search term
- isFullscreen: Whether graph is in fullscreen mode
- loading: Whether graph is currently loading (affects button states)

Emits:
- update:viewMode, update:selectedPool, update:entitySearch: v-model updates
- view-mode-change: When view mode changes (triggers data reload)
- load-pool-graph: When pool selection changes  
- load-entity-neighborhood: When entity search is performed
- zoom-to-fit, reset-view, start-smooth-layout, toggle-fullscreen: Camera controls

Usage:
<GraphControls
  v-model:view-mode="viewMode"
  v-model:selected-pool="selectedPool" 
  v-model:entity-search="entitySearch"
  :is-fullscreen="isFullscreen"
  :loading="loading"
  @view-mode-change="onViewModeChange"
  @load-pool-graph="loadPoolGraph"
  @load-entity-neighborhood="loadEntityNeighborhood"
  @zoom-to-fit="zoomToFit"
  @reset-view="resetView"
  @start-smooth-layout="startSmoothLayout"
  @toggle-fullscreen="toggleFullscreen"
/>
-->
<template>
  <!-- Header with integrated controls -->
  <header class="app-header">
    <h1 class="graph-title">Seven Pools Knowledge Graph</h1>
    
    <div class="graph-controls">
      <div class="control-group">
        <label>View Mode:</label>
        <select 
          :value="viewMode" 
          @change="$emit('update:viewMode', $event.target.value); $emit('view-mode-change')"
          :disabled="loading"
        >
          <option value="clusters">Pool Overview</option>
          <option value="pool">Single Pool</option>
          <option value="entity">Entity Neighborhood</option>
        </select>
      </div>
      
      <div v-if="viewMode === 'pool'" class="control-group">
        <label>Pool:</label>
        <select 
          :value="selectedPool" 
          @change="$emit('update:selectedPool', $event.target.value); $emit('load-pool-graph')"
          :disabled="loading"
        >
          <option value="manifest">Manifest</option>
          <option value="experience">Experience</option>
          <option value="relational">Relational</option>
          <option value="practical">Practical</option>
          <option value="idea">Idea/Philosophical</option>
          <option value="evolutionary">Evolutionary</option>
          <option value="emanation">Emanation</option>
        </select>
      </div>
      
      <div v-if="viewMode === 'entity'" class="control-group">
        <label>Entity:</label>
        <input 
          :value="entitySearch"
          @input="$emit('update:entitySearch', $event.target.value)"
          @keyup.enter="$emit('load-entity-neighborhood')"
          placeholder="Enter entity name..."
          :disabled="loading"
        >
        <button 
          @click="$emit('load-entity-neighborhood')"
          :disabled="loading || !entitySearch.trim()"
        >
          Search
        </button>
      </div>
      
      <div class="control-group">
        <button @click="$emit('zoom-to-fit')" :disabled="loading">
          Zoom to Fit
        </button>
        <button @click="$emit('reset-view')" :disabled="loading">
          Reset View
        </button>
        <button 
          v-if="viewMode === 'clusters'" 
          @click="$emit('start-smooth-layout')"
          :disabled="loading"
        >
          Smooth Layout
        </button>
        <button @click="$emit('toggle-fullscreen')" :disabled="loading">
          {{ isFullscreen ? 'Exit Fullscreen' : 'Fullscreen' }}
        </button>
      </div>
    </div>
  </header>
</template>

<script>
export default {
  name: 'GraphControls',
  
  props: {
    /**
     * Current view mode - determines which controls are visible
     */
    viewMode: {
      type: String,
      default: 'clusters',
      validator: (value) => ['clusters', 'pool', 'entity'].includes(value)
    },
    
    /**
     * Currently selected pool (when in pool view mode)
     */
    selectedPool: {
      type: String,
      default: 'experience',
      validator: (value) => ['manifest', 'experience', 'relational', 'practical', 'idea', 'evolutionary', 'emanation'].includes(value)
    },
    
    /**
     * Current entity search term (when in entity view mode)
     */
    entitySearch: {
      type: String,
      default: ''
    },
    
    /**
     * Whether the graph is currently in fullscreen mode
     */
    isFullscreen: {
      type: Boolean,
      default: false
    },
    
    /**
     * Whether the graph is currently loading (disables controls)
     */
    loading: {
      type: Boolean,
      default: false
    }
  },
  
  emits: [
    // v-model update events
    'update:viewMode',
    'update:selectedPool', 
    'update:entitySearch',
    
    // Action events
    'view-mode-change',
    'load-pool-graph',
    'load-entity-neighborhood',
    'zoom-to-fit',
    'reset-view',
    'start-smooth-layout',
    'toggle-fullscreen'
  ]
};
</script>

<style scoped>
/* Header and controls styling */
.app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: var(--bg-primary);
  border-bottom: 1px solid var(--border-color);
  flex-wrap: wrap;
  gap: 1rem;
}

.graph-title {
  color: var(--text-primary);
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
}

.graph-controls {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.control-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.control-group label {
  color: var(--text-secondary);
  font-weight: 500;
  white-space: nowrap;
}

.control-group select,
.control-group input {
  padding: 0.5rem;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background: var(--bg-secondary);
  color: var(--text-primary);
  font-size: 0.9rem;
}

.control-group select:disabled,
.control-group input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.control-group button {
  padding: 0.5rem 1rem;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background: var(--bg-secondary);
  color: var(--text-primary);
  cursor: pointer;
  transition: background-color 0.2s;
  font-size: 0.9rem;
  white-space: nowrap;
}

.control-group button:hover:not(:disabled) {
  background: var(--bg-hover);
}

.control-group button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .app-header {
    flex-direction: column;
    align-items: stretch;
  }
  
  .graph-controls {
    flex-direction: column;
    align-items: stretch;
    gap: 0.75rem;
  }
  
  .control-group {
    justify-content: space-between;
  }
}
</style>