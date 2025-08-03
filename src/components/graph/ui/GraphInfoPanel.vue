<!-- GraphInfoPanel.vue - Display selected node information -->
<!-- This component shows detailed information about a selected node in the graph -->
<!-- It allows users to explore connections and close the panel -->
<template>
  <div v-if="selectedNode" class="info-panel">
    <h3>{{ selectedNode.label }}</h3>
    
    <div class="info-details">
      <!-- Pool information with color badge -->
      <p>
        <strong>Pool:</strong> 
        <span 
          class="pool-badge" 
          :style="{ backgroundColor: getPoolColor(selectedNode.pool) }"
        >
          {{ selectedNode.pool }}
        </span>
      </p>
      
      <!-- Occurrence count if available -->
      <p v-if="selectedNode.originalSize">
        <strong>Occurrences:</strong> 
        {{ selectedNode.originalSize.toLocaleString() }}
      </p>
      
      <!-- Distance from center (for entity neighborhood view) -->
      <p v-if="selectedNode.distance !== undefined">
        <strong>Distance from center:</strong> 
        {{ selectedNode.distance }}
      </p>
      
      <!-- Special badge for center node -->
      <p v-if="selectedNode.isCenter">
        <strong>Role:</strong> 
        <span class="center-badge">Search Center</span>
      </p>
    </div>
    
    <div class="info-actions">
      <!-- Explore connections button (not shown in entity mode) -->
      <button 
        v-if="viewMode !== 'entity'" 
        @click="$emit('search-for-entity')" 
        class="action-btn"
      >
        Explore Connections
      </button>
      
      <!-- Close button -->
      <button @click="$emit('close')" class="close-btn">
        Close
      </button>
    </div>
  </div>
</template>

<script>
import { knowledgeGraphService } from '../../../services/knowledgeGraphService.js';

export default {
  name: 'GraphInfoPanel',
  
  props: {
    // The currently selected node object
    selectedNode: {
      type: Object,
      default: null
    },
    
    // Current view mode to control button visibility
    viewMode: {
      type: String,
      default: 'clusters'
    }
  },
  
  emits: ['search-for-entity', 'close'],
  
  methods: {
    // Get the color for a pool from the service
    getPoolColor(poolName) {
      return knowledgeGraphService.getPoolColor(poolName);
    }
  }
};
</script>

<style scoped>
.info-panel {
  position: absolute;
  top: 1rem;
  right: 1rem;
  width: 300px;
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border-medium);
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 100;
}

.info-panel h3 {
  margin: 0 0 1rem 0;
  font-size: 1.25rem;
  color: var(--color-accent);
  border-bottom: 1px solid var(--color-border-light);
  padding-bottom: 0.75rem;
}

/* Info details section */
.info-details {
  margin: 1rem 0;
}

.info-details p {
  margin: 0.75rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: var(--color-text-secondary);
}

.info-details p strong {
  color: var(--color-text-primary);
  font-weight: 600;
}

/* Pool badge styling */
.pool-badge {
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: capitalize;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

/* Center badge for search center nodes */
.center-badge {
  background: var(--color-error);
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
}

/* Action buttons */
.info-actions {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 1rem;
}

.info-actions button {
  padding: 0.5rem 1rem;
  background: var(--color-bg-header);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border-medium);
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 600;
  transition: all 0.2s ease;
  width: 100%;
}

.info-actions button:hover {
  background: var(--color-primary);
  border-color: var(--color-primary);
}

.action-btn {
  background: var(--color-primary) !important;
  border-color: var(--color-primary) !important;
}

.action-btn:hover {
  background: var(--color-accent) !important;
  border-color: var(--color-accent) !important;
}

.close-btn {
  background: transparent !important;
  color: var(--color-text-secondary) !important;
}

.close-btn:hover {
  background: var(--color-bg-base) !important;
  color: var(--color-text-primary) !important;
}

/* Mobile optimizations */
@media (max-width: 768px) {
  .info-panel {
    top: 0.5rem;
    right: 0.5rem;
    left: 0.5rem;
    width: auto;
    max-width: 350px;
    margin: 0 auto;
  }
}
</style>