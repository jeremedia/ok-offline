<template>
  <div class="knowledge-graph">
    <!-- Header with integrated controls -->
    <header class="app-header">
      <h1 class="graph-title">Seven Pools Knowledge Graph</h1>
      
      <div class="graph-controls">
        <div class="control-group">
          <label>View Mode:</label>
          <select v-model="viewMode" @change="onViewModeChange">
            <option value="clusters">Pool Overview</option>
            <option value="pool">Single Pool</option>
            <option value="entity">Entity Neighborhood</option>
          </select>
        </div>
        
        <div v-if="viewMode === 'pool'" class="control-group">
          <label>Pool:</label>
          <select v-model="selectedPool" @change="loadPoolGraph">
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
            v-model="entitySearch" 
            @keyup.enter="loadEntityNeighborhood"
            placeholder="Enter entity name..."
          >
          <button @click="loadEntityNeighborhood">Search</button>
        </div>
        
        <div class="control-group">
          <button @click="zoomToFit">Zoom to Fit</button>
          <button @click="resetView">Reset View</button>
          <button v-if="viewMode === 'clusters'" @click="startSmoothLayout">Smooth Layout</button>
          <button @click="toggleFullscreen">
            {{ isFullscreen ? 'Exit Fullscreen' : 'Fullscreen' }}
          </button>
        </div>
      </div>
    </header>
    
    <!-- Graph Container -->
    <div ref="graphContainer" class="graph-container" :class="{ fullscreen: isFullscreen }">
      <!-- Loading Spinner -->
      <Transition name="fade">
        <div v-if="loading" class="spinner"></div>
      </Transition>
      
      <!-- About Panel - explains current view -->
      <GraphAboutPanel 
        :view-mode="viewMode"
        :selected-pool="selectedPool"
        :entity-search="entitySearch"
        :node-count="nodeCount"
      />
      
      <!-- Enhanced Info Panel - positioned within graph area -->
      <GraphInfoPanel 
        :selected-node="selectedNode" 
        :view-mode="viewMode"
        @search-for-entity="searchForEntity"
        @close="selectedNode = null"
      />
    </div>
    
    <!-- Stats -->
    <GraphStats :node-count="nodeCount" :edge-count="edgeCount" />
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted, computed, nextTick } from 'vue';
import Graph from 'graphology';
import Sigma from 'sigma';
import { fitViewportToNodes } from '@sigma/utils';
import { NodeBorderProgram } from '@sigma/node-border';
import circular from 'graphology-layout/circular.js';
import forceAtlas2 from 'graphology-layout-forceatlas2';
import ForceSupervisor from 'graphology-layout-force/worker';
import { knowledgeGraphService } from '../services/knowledgeGraphService.js';
import { useGraphRenderer } from './graph/composables/useGraphRenderer.js';
import { useGraphInteractions } from './graph/composables/useGraphInteractions.js';
import { useGraphLayouts } from './graph/composables/useGraphLayouts.js';

// UI Components
import GraphStats from './graph/ui/GraphStats.vue';
import GraphInfoPanel from './graph/ui/GraphInfoPanel.vue';
import GraphAboutPanel from './graph/ui/GraphAboutPanel.vue';

export default {
  name: 'KnowledgeGraph',
  
  components: {
    GraphStats,
    GraphInfoPanel,
    GraphAboutPanel
  },
  
  setup() {
    // Utility function for theme CSS variables - shared across all functions
    const getVar = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    
    // Reactive state
    const graphContainer = ref(null);
    const viewMode = ref('clusters');
    const selectedPool = ref('experience');
    const entitySearch = ref('');
    const isFullscreen = ref(false);
    const stats = ref(null);
    
    // Graph instances - initialize immediately to avoid null errors
    // Using Graphology Graph instance wrapped in Vue ref for reactivity
    const graph = ref(new Graph());
    let camera = null; // Camera instance from renderer
    
    // Use the graph renderer composable
    const {
      loading,
      initializeGraph,
      ensureRenderer,
      updateRenderer,
      resetView,
      zoomToFit,
      getRenderer,
      getCamera,
      cleanup: cleanupRenderer
    } = useGraphRenderer();
    
    // Use the graph interactions composable
    const {
      selectedBridge,
      selectedNode,
      selectBridgeEntity,
      selectPoolEntity,
      clearBridgeSelection,
      setupDraggableNodes,
      setupClickHandlers
    } = useGraphInteractions();
    
    // Use the graph layouts composable
    const {
      runForceLayout,
      runPoolOverviewLayout,
      runBridgeLayout,
      calculatePoolPositions,
      calculateBridgePosition,
      calculateBridgeColor,
      startSmoothLayout: startSmoothLayoutFn,
      stopSmoothLayout: stopSmoothLayoutFn,
      preventNodeOverlaps,
      cleanup: cleanupLayouts
    } = useGraphLayouts();
    
    // Computed properties - safe access with proper error handling
    // These automatically update when graph changes, triggering UI updates
    const nodeCount = computed(() => {
      try {
        return graph.value?.order || 0;  // .order = number of nodes
      } catch (e) {
        return 0;
      }
    });
    
    const edgeCount = computed(() => {
      try {
        return graph.value?.size || 0;   // .size = number of edges
      } catch (e) {
        return 0;
      }
    });
    
    // REFACTOR: This section will be replaced by useGraphRenderer composable
    // START: useGraphRenderer functions
    /* REPLACED BY COMPOSABLE - Now using useGraphRenderer
    
    const initializeGraph = () => {
      if (renderer) {
        renderer.kill();
        renderer = null;
      }
      if (graph.value) {
        graph.value.clear();
      } else {
        graph.value = new Graph();
      }
    };
    
    const ensureRenderer = async () => {
      if (renderer) return;  // Already exists, no need to recreate
      
      // Wait for DOM updates to complete before creating renderer
      await nextTick();
      
      if (!graphContainer.value) {
        console.error('Graph container not available');
        return;
      }
      
      // Create Sigma.js renderer with optimized settings for mobile performance
      // Use CSS variables for theme-aware default colors and include border support
      renderer = new Sigma(graph.value, graphContainer.value, {
        renderLabels: true,
        renderEdgeLabels: false,
        minCameraRatio: 0.1,
        maxCameraRatio: 10,
        defaultNodeColor: getVar('--color-text-muted') || '#666',
        defaultEdgeColor: getVar('--color-border-medium') || '#ccc',
        defaultLabelColor: getVar('--color-text-primary') || '#fff',
        labelDensity: 0.5,
        labelGridCellSize: 100,
        labelRenderedSizeThreshold: 8,
        labelColor: { color: getVar('--color-text-primary') || '#fff' },
        // Add border support for nodes
        nodeProgramClasses: {
          border: NodeBorderProgram,
        },
        settings: {
          animationsTime: 3000
        }
      });
      
      camera = renderer.getCamera();
      
      // REFACTOR: Setup draggable functionality using composable
      // Now passing graph and renderer as parameters
      setupDraggableNodes(graph.value, renderer);
      
      // REFACTOR: Handle node clicks using composable click handlers
      // The composable now manages all click interactions
      setupClickHandlers(graph.value, renderer, (nodeId, nodeData) => {
        // Update selected node for info panel
        selectedNode.value = { ...nodeData, id: nodeId };
        
        // If in entity mode, load this entity's neighborhood
        if (viewMode.value === 'entity') {
          entitySearch.value = nodeId;
          loadEntityNeighborhood();
        }
      });
      
      // Mark loading as complete
      loading.value = false;
    };
    
    // Update renderer after graph changes
    const updateRenderer = async () => {
      if (renderer) {
        try {
          renderer.refresh();
          if (camera) {
            camera.animatedReset();
          }
          // Mark loading as complete
          loading.value = false;
        } catch (error) {
          console.error('Error updating renderer:', error);
          loading.value = false;
        }
      }
    };
    
    // END: useGraphRenderer functions
    // REFACTOR: Above functions will be replaced by useGraphRenderer composable
    */
    
    // Load bridge entities view - demonstrates enliteracy through cross-pool bridges
    const loadClusters = async () => {
      loading.value = true;
      try {
        // Get powerful bridge entities that span multiple pools
        const bridgeData = await knowledgeGraphService.getBridgeEntities(2, 15);
        
        // Clear and populate graph
        graph.value.clear();
        
        // Add pool nodes (background/context nodes - smaller and translucent)
        const pools = ['manifest', 'experience', 'relational', 'practical', 'idea', 'evolutionary', 'emanation'];
        const poolPositions = calculatePoolPositions(pools);
        
        pools.forEach((pool, index) => {
          const position = poolPositions[index];
          graph.value.addNode(`pool_${pool}`, {
            label: pool.charAt(0).toUpperCase() + pool.slice(1),
            size: 15, // Smaller background pools
            originalSize: 15, // Store original size for selection reset
            type: "border", // Enable border rendering
            color: knowledgeGraphService.getPoolColor(pool),
            originalColor: knowledgeGraphService.getPoolColor(pool), // Store original color
            borderColor: getVar('--color-border-heavy') || '#666',
            labelColor: getVar('--color-text-secondary') || '#999',
            pool: pool,
            nodeType: 'pool',
            x: position.x,
            y: position.y,
            zIndex: 1 // Background layer
          });
        });
        
        // Add bridge entities (primary nodes - large and prominent)
        bridgeData.bridge_entities.forEach(bridge => {
          // Calculate bridge position based on connected pools
          const bridgePosition = calculateBridgePosition(bridge.pools, poolPositions, pools, bridge.bridge_power);
          
          // Bridge size based on power (logarithmic scaling)
          const bridgeSize = Math.max(12, Math.min(35, Math.log(bridge.bridge_power + 1) * 3));
          
          // Bridge color - gradient based on pool combination
          const bridgeColor = calculateBridgeColor(bridge.pools);
          
          graph.value.addNode(bridge.name, {
            label: bridge.name,
            size: bridgeSize,
            originalSize: bridgeSize, // Store original size for selection reset
            type: "border", // Enable border rendering
            color: bridgeColor,
            originalColor: bridgeColor, // Store original color for selection reset
            borderColor: getVar('--color-text-primary') || '#fff',
            labelColor: getVar('--color-text-primary') || '#fff',
            nodeType: 'bridge',
            pools: bridge.pools,
            poolCount: bridge.pool_count,
            bridgePower: bridge.bridge_power,
            totalFrequency: bridge.total_frequency,
            crossPoolCentrality: bridge.cross_pool_centrality,
            poolFrequencies: bridge.pool_frequencies,
            x: bridgePosition.x,
            y: bridgePosition.y,
            zIndex: 2 // Foreground layer
          });
          
          // Connect bridge to its pools with flowing lines
          bridge.pools.forEach(pool => {
            const poolNodeId = `pool_${pool}`;
            if (graph.value.hasNode(poolNodeId)) {
              const edgeWeight = bridge.pool_frequencies[pool] || 1;
              const edgeSize = Math.max(1, Math.min(4, Math.log(edgeWeight + 1) * 0.8));
              
              graph.value.addEdge(bridge.name, poolNodeId, {
                size: edgeSize,
                originalSize: edgeSize, // Store original size for selection reset
                color: getVar('--color-primary-alpha-30') || 'rgba(139, 0, 0, 0.3)',
                originalColor: getVar('--color-primary-alpha-30') || 'rgba(139, 0, 0, 0.3)', // Store original color
                weight: edgeWeight
              });
            }
          });
        });
        
        // Apply smooth animated layout to position bridges naturally between pools
        setTimeout(() => {
          startSmoothLayout();
          // Auto zoom to fit after layout starts
          setTimeout(() => zoomToFit(graph.value), 500);
        }, 100);
        
        // Ensure renderer exists and update
        await ensureRenderer(graph.value, graphContainer);
        await updateRenderer();
        
      } catch (error) {
        console.error('Failed to load bridge entities:', error);
        loading.value = false;
      }
    };
    
    // Load single pool
    const loadPoolGraph = async () => {
      loading.value = true;
      try {
        const data = await knowledgeGraphService.getPoolGraph(selectedPool.value, 500);
        
        graph.value.clear();
        
        // Add nodes with enhanced sizing for single pool view
        data.nodes.forEach(node => {
          // Consistent scaling across all views
          const scaledSize = Math.max(3, Math.min(20, Math.log((node.size || 1) + 1) * 2.5));
          
          graph.value.addNode(node.id, {
            label: node.label,
            size: scaledSize,
            color: knowledgeGraphService.getPoolColor(node.pool),
            labelColor: getVar('--color-text-primary') || '#fff',
            pool: node.pool,
            originalSize: node.size || 1,
            x: 0, // Default position
            y: 0  // Default position
          });
        });
        
        // Add edges with enhanced styling for single pool
        data.edges.forEach(edge => {
          if (graph.value.hasNode(edge.source) && graph.value.hasNode(edge.target)) {
            const edgeSize = Math.max(0.3, Math.min(3, Math.log(edge.weight + 1) * 0.6));
            const edgeColor = edge.weight > 5 
              ? getVar('--color-border-medium') || '#555' 
              : getVar('--color-border-light') || '#bbb';
            
            graph.value.addEdge(edge.source, edge.target, {
              weight: edge.weight,
              size: edgeSize,
              color: edgeColor,
              originalWeight: edge.weight
            });
          }
        });
        
        // Apply layout before creating renderer
        circular.assign(graph.value);
        runForceLayout(graph.value, camera);
        
        // Auto-fit to viewport after layout
        setTimeout(() => zoomToFit(graph.value), 200);
        
        // Ensure renderer exists and update
        await ensureRenderer(graph.value, graphContainer);
        await updateRenderer();
        
        // Show message if more data available
        if (data.has_more) {
          console.log(`Showing ${data.nodes.length} of ${data.total_entities} entities`);
        }
        
      } catch (error) {
        console.error('Failed to load pool graph:', error);
        loading.value = false;
      }
    };
    
    // Load entity neighborhood
    const loadEntityNeighborhood = async () => {
      if (!entitySearch.value.trim()) return;
      
      loading.value = true;
      try {
        const data = await knowledgeGraphService.getEntityNeighborhood(
          entitySearch.value.trim(),
          2
        );
        
        graph.value.clear();
        
        // Add nodes with special styling for entity neighborhood
        data.nodes.forEach(node => {
          const isCenter = node.id === data.center.id;
          // Center node is larger and themed red, others sized by connections
          const scaledSize = isCenter ? 20 : Math.max(4, Math.min(15, Math.log((node.size || 1) + 1) * 2));
          
          graph.value.addNode(node.id, {
            label: node.label,
            size: scaledSize,
            color: isCenter ? (getVar('--color-error') || '#ff0000') : knowledgeGraphService.getPoolColor(node.pool),
            labelColor: getVar('--color-text-primary') || '#fff',
            pool: node.pool,
            distance: node.distance,
            originalSize: node.size || 1,
            isCenter: isCenter,
            x: 0, // Default position
            y: 0  // Default position
          });
        });
        
        // Add edges for entity neighborhood with enhanced styling
        data.edges.forEach(edge => {
          if (graph.value.hasNode(edge.source) && graph.value.hasNode(edge.target)) {
            const edgeSize = Math.max(0.5, Math.min(4, Math.log(edge.weight + 1) * 0.7));
            // Highlight edges to center node using theme colors
            const isConnectedToCenter = edge.source === data.center.id || edge.target === data.center.id;
            const edgeColor = isConnectedToCenter 
              ? (getVar('--color-error') || '#ff6666')  // Use error color for center connections
              : (edge.weight > 3 
                ? (getVar('--color-border-heavy') || '#666') 
                : (getVar('--color-border-light') || '#ccc'));
            
            graph.value.addEdge(edge.source, edge.target, {
              weight: edge.weight,
              size: edgeSize,
              color: edgeColor,
              originalWeight: edge.weight,
              isConnectedToCenter: isConnectedToCenter
            });
          }
        });
        
        // Layout with center node fixed
        circular.assign(graph.value);
        if (data.center) {
          graph.value.setNodeAttribute(data.center.id, 'x', 0);
          graph.value.setNodeAttribute(data.center.id, 'y', 0);
        }
        runForceLayout(graph.value, camera);
        
        // Auto-fit to viewport after layout  
        setTimeout(() => zoomToFit(graph.value), 200);
        
        // Ensure renderer exists and update
        await ensureRenderer(graph.value, graphContainer);
        await updateRenderer();
        
      } catch (error) {
        console.error('Failed to load entity neighborhood:', error);
        alert('Entity not found');
        loading.value = false;
      }
    };
    
    // REFACTOR: Layout functions moved to useGraphLayouts composable
    // These are now imported from the composable above
    
    // View mode change - handles switching between the three main views
    // This is the core navigation function that maintains smooth UX
    const onViewModeChange = async () => {
      selectedNode.value = null;  // Clear any selected entity
      // REFACTOR: Clear bridge selection using composable (need renderer)
      const renderer = getRenderer();
      if (renderer) {
        clearBridgeSelection(graph.value, renderer);
      }
      stopSmoothLayout();         // Stop any running layout
      loading.value = true;       // Show loading spinner
      
      try {
        // Entity mode special case - just clear the graph and wait for search
        if (viewMode.value === 'entity' && graph.value) {
          graph.value.clear();
          await updateRenderer();  // Refresh display with empty graph
          return;
        }
        
        // Load appropriate data based on selected view mode
        switch (viewMode.value) {
          case 'clusters':
            // Pool Overview: Show all 7 pools and inter-pool relationships
            await loadClusters();
            break;
          case 'pool':
            // Single Pool: Deep dive into one pool (500+ entities)
            await loadPoolGraph();
            break;
          case 'entity':
            // Entity Neighborhood: Empty graph, wait for user search
            loading.value = false;
            break;
        }
      } catch (error) {
        console.error('Error during view mode change:', error);
        loading.value = false;
      }
    };
    
    // REFACTOR: Camera control functions - now using useGraphRenderer composable
    // The resetView and zoomToFit functions are imported from the composable
    
    // Toggle fullscreen
    const toggleFullscreen = () => {
      isFullscreen.value = !isFullscreen.value;
      
      // Force renderer resize after DOM update
      setTimeout(() => {
        const renderer = getRenderer();
        if (renderer) {
          renderer.refresh();
          const cam = getCamera();
          if (cam) cam.animatedReset();
        }
      }, 100);
    };
    
    // Search for entity connections - switches to entity neighborhood view
    const searchForEntity = () => {
      if (selectedNode.value) {
        entitySearch.value = selectedNode.value.label;
        viewMode.value = 'entity';
        loadEntityNeighborhood();
        selectedNode.value = null;
      }
    };
    
    // Get pool colors for the about panel legend
    const getPoolDisplayColor = (poolName) => {
      return knowledgeGraphService.getPoolColor(poolName);
    };
    
    // REFACTOR: Position calculation functions moved to useGraphLayouts composable
    
    // REFACTOR: All layout algorithms and calculations moved to useGraphLayouts composable
    // These functions are now imported from the composable above:
    // - calculateBridgePosition, calculateBridgeColor, calculatePoolPositions
    // - startSmoothLayout, stopSmoothLayout, runBridgeLayout
    // - runForceLayout, runPoolOverviewLayout, preventNodeOverlaps
    
    // Wrapper functions to adapt composable functions to local usage
    const startSmoothLayout = () => {
      return startSmoothLayoutFn(graph.value);
    };
    
    const stopSmoothLayout = () => {
      stopSmoothLayoutFn();
    };
    
    // REFACTOR: Interaction functions moved to useGraphInteractions composable
    // These are now imported from the composable above
    
    // Load stats
    const loadStats = async () => {
      try {
        stats.value = await knowledgeGraphService.getGraphStats();
      } catch (error) {
        console.error('Failed to load stats:', error);
      }
    };
    
    // Lifecycle
    onMounted(async () => {
      initializeGraph(graph.value);
      await loadClusters();
      loadStats();
      
      // Handle window resize
      window.addEventListener('resize', () => {
        const renderer = getRenderer();
        if (renderer) {
          renderer.refresh();
        }
      });
    });
    
    onUnmounted(() => {
      // Clean up layouts using composable (includes ForceSupervisor)
      cleanupLayouts();
      
      // Clean up renderer using composable
      cleanupRenderer();
      
      // Clean up graph
      if (graph.value) {
        graph.value.clear();
        graph.value = null;
      }
    });
    
    return {
      graphContainer,
      loading,
      viewMode,
      selectedPool,
      entitySearch,
      selectedNode,
      isFullscreen,
      stats,
      nodeCount,
      edgeCount,
      onViewModeChange,
      loadPoolGraph,
      loadEntityNeighborhood,
      resetView,
      zoomToFit,
      toggleFullscreen,
      searchForEntity,
      getPoolDisplayColor,
      startSmoothLayout,
      stopSmoothLayout,
      selectedBridge,
      knowledgeGraphService  // Expose service for template access
      // REFACTOR: Removed interaction functions - handled internally by useGraphInteractions composable
      // REFACTOR: Removed layout functions - handled internally by useGraphLayouts composable
    };
  }
};
</script>

<style scoped>
.knowledge-graph {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--color-bg-base);
  color: var(--color-text-primary);
}

.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  background: var(--color-bg-elevated);
  border-bottom: 1px solid var(--color-border-medium);
  gap: 2rem;
}

.graph-title {
  margin: 0;
  font-size: 1.25rem;
  color: var(--color-accent);
  font-weight: 600;
  flex-shrink: 0;
}

.graph-controls {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  flex: 1;
  justify-content: flex-end;
}

.control-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.control-group label {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  font-weight: 600;
  letter-spacing: 0.05em;
}

.control-group select,
.control-group input {
  padding: 0.5rem 0.75rem;
  background: var(--color-bg-header);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border-medium);
  border-radius: 4px;
  font-size: 0.875rem;
  transition: all 0.2s ease;
}

.control-group select:hover,
.control-group input:hover {
  border-color: var(--color-border-heavy);
}

.control-group select:focus,
.control-group input:focus {
  outline: none;
  border-color: var(--color-border-focus);
}

.control-group button {
  padding: 0.5rem 1rem;
  background: var(--color-bg-header);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border-medium);
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 600;
  transition: all 0.2s ease;
}

.control-group button:hover {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: var(--color-text-primary);
}

.graph-container {
  flex: 1;
  position: relative;
  min-height: 400px;
  cursor: grab;
}

.graph-container:active {
  cursor: grabbing;
}

.graph-container.fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9999;
  background: var(--color-bg-base);
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: var(--color-shadow-dark);
  z-index: 10;
  opacity: 1;
  transition: opacity 0.1s ease-in-out;
}

.loading-overlay.fade-enter-active,
.loading-overlay.fade-leave-active {
  transition: opacity 0.1s ease-in-out;
}

.loading-overlay.fade-enter-from,
.loading-overlay.fade-leave-to {
  opacity: 0;
}

.spinner {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 50px;
  height: 50px;
  border: 3px solid var(--color-border-medium);
  border-top-color: var(--color-accent);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  z-index: 10;
  opacity: 1;
  transition: opacity 0.1s ease-in-out;
}

@keyframes spin {
  to { transform: translate(-50%, -50%) rotate(360deg); }
}

/* REFACTOR: All .info-panel related styles moved to GraphInfoPanel.vue component */

/* REFACTOR: All .about-panel related styles moved to GraphAboutPanel.vue component */

/* REFACTOR: .pool-legend, .bridge-explanation, and related styles moved to GraphAboutPanel.vue */

/* REFACTOR: .graph-stats styles moved to GraphStats.vue component */

/* Mobile optimizations */
@media (max-width: 768px) {
  .app-header {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
  }
  
  .graph-title {
    font-size: 1.125rem;
    text-align: center;
  }
  
  .graph-controls {
    justify-content: center;
    gap: 0.5rem;
  }
  
  .control-group {
    flex: 1 0 auto;
  }
  
  .control-group label {
    display: none; /* Hide labels on mobile to save space */
  }
  
  /* REFACTOR: .info-panel mobile styles moved to GraphInfoPanel.vue */
  
  /* REFACTOR: .about-panel and .pool-legend mobile styles moved to GraphAboutPanel.vue */
}
</style>