<!--
EntityNeighborhoodGraph.vue - Entity Relationship Neighborhood Visualization

Displays the relationship network around a specific entity, showing
connected entities at various depths (1-hop, 2-hop neighbors).
Entities are arranged radially from the center entity to visualize
relationship distance and connection patterns.

This is a THIN component that extends BaseGraphView, providing only:
- Entity-centric data loading with depth control
- Radial layout hints for force algorithm
- Empty state handling when no entity selected
- Relationship strength visualization

Layout Strategy:
- Center entity fixed at origin
- 1-hop neighbors in inner ring
- 2-hop neighbors in outer ring
- Force layout with radial constraints
- Edge thickness shows relationship strength

Usage:
<EntityNeighborhoodGraph
  :data-loader="loadEntityNeighborhoodData"
  :entity-name="selectedEntity"
  :depth="2"
  @view-ready="onViewReady"
  @selection-change="onSelectionChange"
/>
-->
<template>
  <div class="entity-neighborhood-wrapper">
    <!-- Empty State - No entity selected -->
    <div v-if="!entityName || !entityName.trim()" class="empty-state">
      <div class="empty-icon">🔍</div>
      <h3 class="empty-title">No Entity Selected</h3>
      <p class="empty-message">
        Search for an entity above to explore its relationships
      </p>
    </div>
    
    <!-- Graph View - Entity selected -->
    <BaseGraphView
      v-else
      ref="baseView"
      view-type="entity-neighborhood"
      :data-loader="dataLoader"
      :layout-config="layoutConfig"
      :selection-config="selectionConfig"
      :data-loader-params="dataLoaderParams"
      :auto-load="hasValidEntity"
      @view-ready="$emit('view-ready', 'entity-neighborhood')"
      @selection-change="$emit('selection-change', $event)"
      @error="$emit('error', $event)"
      @data-loaded="onDataLoaded"
      @layout-complete="onLayoutComplete"
    />
  </div>
</template>

<script>
import BaseGraphView from './BaseGraphView.vue';
import { computed, ref, watch } from 'vue';

export default {
  name: 'EntityNeighborhoodGraph',
  
  components: {
    BaseGraphView
  },
  
  props: {
    /**
     * Function that loads entity neighborhood data
     * Expected to return { nodes: Array, edges: Array }
     */
    dataLoader: {
      type: Function,
      required: true
    },
    
    /**
     * Name of the entity to explore
     */
    entityName: {
      type: String,
      default: ''
    },
    
    /**
     * Depth of neighborhood to explore (1 or 2 hops)
     */
    depth: {
      type: Number,
      default: 2,
      validator: (value) => [1, 2, 3].includes(value)
    },
    
    /**
     * Number of force layout iterations
     */
    layoutIterations: {
      type: Number,
      default: 200
    },
    
    /**
     * Whether to fix the center entity position
     */
    fixCenterEntity: {
      type: Boolean,
      default: true
    }
  },
  
  emits: [
    'view-ready',
    'selection-change',
    'error',
    'entity-changed',
    'empty-state'
  ],
  
  setup(props, { emit }) {
    // Reference to base view component
    const baseView = ref(null);
    
    // Check if we have a valid entity
    const hasValidEntity = computed(() => {
      return props.entityName && props.entityName.trim().length > 0;
    });
    
    // Data loader parameters
    const dataLoaderParams = computed(() => ({
      entityName: props.entityName.trim(),
      depth: props.depth
    }));
    
    // Layout configuration for entity neighborhood
    const layoutConfig = computed(() => ({
      algorithm: 'force',  // Use force with radial hints
      iterations: props.layoutIterations,
      preventOverlaps: true,
      // Force layout with radial positioning hints
      settings: {
        barnesHutOptimize: true,
        barnesHutTheta: 0.5,
        edgeWeightInfluence: 0.8,
        gravity: 0.05,  // Lower gravity for radial layout
        linLogMode: false,
        outboundAttractionDistribution: true,  // Better for neighborhoods
        scalingRatio: 15,  // More spread for clarity
        slowDown: 1,
        strongGravityMode: false
      }
    }));
    
    // Selection configuration
    const selectionConfig = computed(() => ({
      enableBridgeSelection: false,  // No bridge concept in entity view
      enablePoolSelection: false,    // No pool nodes in this view
      clearOnStageClick: true,       // Clear selection on empty space
      highlightConnections: true     // Highlight connected entities
    }));
    
    /**
     * Handle data loaded event
     * Apply radial positioning hints based on depth
     */
    const onDataLoaded = (data) => {
      if (!data.nodes || data.nodes.length === 0) {
        console.log('Entity Neighborhood: No data found for entity');
        return;
      }
      
      console.log(`Entity Neighborhood [${props.entityName}]: Loaded ${data.nodes.length} entities, ${data.edges.length} relationships`);
      
      // If we have access to the graph, apply radial hints
      if (baseView.value && baseView.value.graph) {
        applyRadialHints(baseView.value.graph);
      }
    };
    
    /**
     * Apply radial positioning hints to nodes based on depth
     */
    const applyRadialHints = (graph) => {
      if (!props.fixCenterEntity) return;
      
      // Find the center entity
      const centerNode = graph.nodes().find(nodeId => {
        const attrs = graph.getNodeAttributes(nodeId);
        return attrs.label === props.entityName.trim() || attrs.isCenterEntity;
      });
      
      if (centerNode) {
        // Fix center entity at origin
        graph.setNodeAttribute(centerNode, 'x', 0);
        graph.setNodeAttribute(centerNode, 'y', 0);
        graph.setNodeAttribute(centerNode, 'fixed', true);
        graph.setNodeAttribute(centerNode, 'size', graph.getNodeAttribute(centerNode, 'size') * 1.5);
        
        // Apply radial hints to other nodes based on depth
        const depths = calculateNodeDepths(graph, centerNode);
        const angleStep = (2 * Math.PI) / Math.max(depths[1]?.length || 1, 1);
        
        depths[1]?.forEach((nodeId, index) => {
          const angle = index * angleStep;
          const radius = 150;  // Inner ring
          graph.setNodeAttribute(nodeId, 'x', radius * Math.cos(angle));
          graph.setNodeAttribute(nodeId, 'y', radius * Math.sin(angle));
        });
        
        if (depths[2]) {
          const angleStep2 = (2 * Math.PI) / depths[2].length;
          depths[2].forEach((nodeId, index) => {
            const angle = index * angleStep2 + (angleStep2 / 2);  // Offset for better layout
            const radius = 300;  // Outer ring
            graph.setNodeAttribute(nodeId, 'x', radius * Math.cos(angle));
            graph.setNodeAttribute(nodeId, 'y', radius * Math.sin(angle));
          });
        }
      }
    };
    
    /**
     * Calculate node depths from center entity
     */
    const calculateNodeDepths = (graph, centerNode) => {
      const depths = { 0: [centerNode], 1: [], 2: [], 3: [] };
      const visited = new Set([centerNode]);
      
      // BFS to calculate depths
      let currentDepth = 0;
      let currentLevel = [centerNode];
      
      while (currentLevel.length > 0 && currentDepth < props.depth) {
        const nextLevel = [];
        
        for (const node of currentLevel) {
          graph.neighbors(node).forEach(neighbor => {
            if (!visited.has(neighbor)) {
              visited.add(neighbor);
              nextLevel.push(neighbor);
              depths[currentDepth + 1].push(neighbor);
            }
          });
        }
        
        currentLevel = nextLevel;
        currentDepth++;
      }
      
      return depths;
    };
    
    /**
     * Handle layout complete event
     */
    const onLayoutComplete = (algorithm) => {
      console.log(`Entity Neighborhood: ${algorithm} layout complete`);
    };
    
    /**
     * Watch for entity changes
     */
    watch(() => props.entityName, async (newEntity, oldEntity) => {
      if (newEntity !== oldEntity) {
        emit('entity-changed', { from: oldEntity, to: newEntity });
        
        if (!hasValidEntity.value) {
          emit('empty-state');
        } else if (baseView.value) {
          await refresh();
        }
      }
    });
    
    /**
     * Refresh the view
     * Delegated to base view
     */
    const refresh = async () => {
      if (baseView.value && hasValidEntity.value) {
        await baseView.value.initializeView();
      }
    };
    
    /**
     * Get neighborhood statistics
     */
    const getStats = () => {
      if (baseView.value && baseView.value.graph) {
        const graph = baseView.value.graph;
        return {
          entity: props.entityName,
          depth: props.depth,
          nodes: graph.order,
          edges: graph.size
        };
      }
      return null;
    };
    
    return {
      // Refs
      baseView,
      
      // Computed
      hasValidEntity,
      dataLoaderParams,
      layoutConfig,
      selectionConfig,
      
      // Methods
      onDataLoaded,
      onLayoutComplete,
      refresh,
      getStats
    };
  }
};
</script>

<style scoped>
/* Entity Neighborhood specific styles */
.entity-neighborhood-wrapper {
  width: 100%;
  height: 100%;
  position: relative;
}

/* Empty state styling */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 2rem;
  text-align: center;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}

.empty-title {
  color: var(--text-primary);
  font-size: 1.5rem;
  margin: 0 0 1rem 0;
  font-weight: 600;
}

.empty-message {
  color: var(--text-secondary);
  font-size: 1rem;
  margin: 0;
  max-width: 400px;
}

/* Entity-specific loading message */
:deep(.loading-text) {
  &::after {
    content: ' (Entity Relationships)';
    opacity: 0.7;
  }
}

/* Enhanced appearance for entity neighborhood */
:deep(.view-type-entity-neighborhood) {
  /* Center entity should be prominent */
  .sigma-node-center {
    stroke-width: 4px;
    stroke: var(--color-accent);
  }
  
  /* Relationship depth visualization */
  .sigma-edge {
    transition: opacity 0.2s ease;
  }
}
</style>