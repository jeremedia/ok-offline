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
      <div class="about-panel">
        <div v-if="viewMode === 'clusters'">
          <h4>🌉 Bridge Entities - Enliteracy in Action</h4>
          <p>This demonstrates how the dataset has become <strong>literate</strong> about Burning Man culture by showing the most powerful <strong>bridge entities</strong> - concepts that create meaning across multiple pools.</p>
          
          <p><strong>What you're seeing:</strong></p>
          <ul class="bridge-explanation">
            <li><strong>Large nodes:</strong> Bridge entities sized by "bridge power" - how well they connect different pools</li>
            <li><strong>Small background nodes:</strong> The seven pools of enliteracy</li>
            <li><strong>Golden/Accent colored:</strong> Most powerful bridges (4+ pools)</li>
            <li><strong>Lines:</strong> Show which pools each bridge connects</li>
          </ul>
          
          <p><strong>Bridge Power Formula:</strong><br>
          <code>Pool_Count × √Frequency × Cross_Pool_Centrality</code></p>
          
          <p>Click any bridge to explore its connections across the knowledge graph. This reveals how the dataset understands cultural interconnections that span traditional boundaries.</p>
        </div>
        
        <div v-if="viewMode === 'pool'">
          <h4>{{ selectedPool.charAt(0).toUpperCase() + selectedPool.slice(1) }} Pool Deep Dive</h4>
          <p>Exploring the <strong>{{ selectedPool }}</strong> pool with {{ nodeCount }} entities. Node size reflects how frequently each concept appears in the Burning Man knowledge base.</p>
          <p><strong>Connections:</strong> Lines show relationships between concepts - thicker lines indicate stronger associations.</p>
        </div>
        
        <div v-if="viewMode === 'entity'">
          <h4>Entity Neighborhood</h4>
          <p v-if="!entitySearch.trim()">Enter an entity name to explore its connections across all pools.</p>
          <p v-else>Showing connections for "<strong>{{ entitySearch }}</strong>" within 2 degrees of separation. The red center node is your search target.</p>
          <p><strong>Colors:</strong> Each node is colored by its pool classification. <strong>Distance:</strong> Shows how closely related each concept is to your search.</p>
        </div>
      </div>
      
      <!-- Enhanced Info Panel - positioned within graph area -->
      <div v-if="selectedNode" class="info-panel">
        <h3>{{ selectedNode.label }}</h3>
        <div class="info-details">
          <p><strong>Pool:</strong> <span class="pool-badge" :style="{backgroundColor: knowledgeGraphService.getPoolColor(selectedNode.pool)}">{{ selectedNode.pool }}</span></p>
          <p v-if="selectedNode.originalSize"><strong>Occurrences:</strong> {{ selectedNode.originalSize.toLocaleString() }}</p>
          <p v-if="selectedNode.distance !== undefined"><strong>Distance from center:</strong> {{ selectedNode.distance }}</p>
          <p v-if="selectedNode.isCenter"><strong>Role:</strong> <span class="center-badge">Search Center</span></p>
        </div>
        <div class="info-actions">
          <button v-if="viewMode !== 'entity'" @click="searchForEntity" class="action-btn">Explore Connections</button>
          <button @click="selectedNode = null" class="close-btn">Close</button>
        </div>
      </div>
    </div>
    
    <!-- Stats -->
    <div v-if="nodeCount > 0" class="graph-stats">
      <span>Nodes: {{ nodeCount }}</span>
      <span>Edges: {{ edgeCount }}</span>
    </div>
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

export default {
  name: 'KnowledgeGraph',
  
  setup() {
    // Utility function for theme CSS variables - shared across all functions
    const getVar = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    
    // Reactive state
    const graphContainer = ref(null);
    const loading = ref(false);
    const viewMode = ref('clusters');
    const selectedPool = ref('experience');
    const entitySearch = ref('');
    const selectedNode = ref(null);
    const selectedBridge = ref(null);
    const isFullscreen = ref(false);
    const stats = ref(null);
    
    // Graph instances - initialize immediately to avoid null errors
    // Using Graphology Graph instance wrapped in Vue ref for reactivity
    const graph = ref(new Graph());
    let renderer = null;  // Sigma.js renderer instance (not reactive)
    let camera = null;    // Sigma camera for view control (not reactive)
    let forceSupervisor = null; // ForceSupervisor for smooth animated layout
    
    // Draggable functionality variables
    let draggedNode = null;
    let isDragging = false;
    
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
    
    // Initialize graph
    const initializeGraph = () => {
      // Clean up existing
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
    
    // Ensure renderer exists - creates Sigma.js renderer only once
    // This prevents recreating the renderer on every view change (which caused flashing)
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
      
      // Setup draggable functionality
      setupDraggableNodes();
      
      // Handle node clicks (only if not dragging)
      renderer.on('clickNode', (e) => {
        if (isDragging) return; // Don't trigger click if we just finished dragging
        
        const node = graph.value.getNodeAttributes(e.node);
        selectedNode.value = { ...node, id: e.node };
        
        // Special handling for different node types in clusters view
        if (viewMode.value === 'clusters') {
          if (node.nodeType === 'bridge') {
            selectBridgeEntity(e.node, node);
          } else if (node.nodeType === 'pool') {
            selectPoolEntity(e.node, node);
          }
        }
        
        // If in entity mode, load this entity's neighborhood
        if (viewMode.value === 'entity') {
          entitySearch.value = e.node;
          loadEntityNeighborhood();
        }
      });
      
      // Handle stage clicks (deselect)
      renderer.on('clickStage', () => {
        selectedNode.value = null;
        clearBridgeSelection();
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
          setTimeout(() => zoomToFit(), 500);
        }, 100);
        
        // Ensure renderer exists and update
        await ensureRenderer();
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
        runForceLayout();
        
        // Auto-fit to viewport after layout
        setTimeout(() => zoomToFit(), 200);
        
        // Ensure renderer exists and update
        await ensureRenderer();
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
        runForceLayout();
        
        // Auto-fit to viewport after layout  
        setTimeout(() => zoomToFit(), 200);
        
        // Ensure renderer exists and update
        await ensureRenderer();
        await updateRenderer();
        
      } catch (error) {
        console.error('Failed to load entity neighborhood:', error);
        alert('Entity not found');
        loading.value = false;
      }
    };
    
    // Run force-directed layout using ForceAtlas2 algorithm
    // This creates the organic, cluster-like positioning of nodes
    const runForceLayout = () => {
      const settings = {
        iterations: 50,           // Number of layout iterations
        settings: {
          gravity: 1,             // Pull nodes toward center
          scalingRatio: 10,       // Spacing between nodes
          slowDown: 1,            // Layout convergence speed
          outboundAttractionDistribution: false  // Classic ForceAtlas2
        }
      };
      
      // Apply the layout algorithm to position all nodes
      forceAtlas2.assign(graph.value, settings);
      
      // Center the camera view on the newly laid out graph
      if (camera) {
        camera.animatedReset();
      }
    };
    
    // Specialized layout for pool overview - more compact and viewport-fitted
    const runPoolOverviewLayout = () => {
      const settings = {
        iterations: 30,           // Fewer iterations for faster processing
        settings: {
          gravity: 2,             // Stronger pull toward center
          scalingRatio: 6,        // Tighter spacing between pools
          slowDown: 2,            // Faster convergence
          outboundAttractionDistribution: false
        }
      };
      
      // Apply the layout algorithm
      forceAtlas2.assign(graph.value, settings);
      
      // Auto-fit to viewport after layout
      setTimeout(() => zoomToFit(), 100);
    };
    
    // View mode change - handles switching between the three main views
    // This is the core navigation function that maintains smooth UX
    const onViewModeChange = async () => {
      selectedNode.value = null;  // Clear any selected entity
      clearBridgeSelection();     // Clear any bridge selection
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
    
    // Reset view
    const resetView = () => {
      if (camera) {
        camera.animatedReset();
      }
    };
    
    // Zoom to fit all nodes in viewport using @sigma/utils
    const zoomToFit = () => {
      if (!renderer || !graph.value) return;
      
      const nodes = graph.value.nodes();
      if (nodes.length === 0) return;
      
      // Use the official sigma utils function to fit viewport to all nodes
      fitViewportToNodes(renderer, nodes, { animate: true, duration: 500 });
    };
    
    // Toggle fullscreen
    const toggleFullscreen = () => {
      isFullscreen.value = !isFullscreen.value;
      
      // Force renderer resize after DOM update
      setTimeout(() => {
        if (renderer) {
          renderer.refresh();
          camera.animatedReset();
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
    
    // Calculate semantic positions for Seven Pools based on their relationships
    const calculatePoolPositions = (pools) => {
      const positions = [];
      const radius = 200; // Distance from center
      
      // Create meaningful arrangement based on semantic relationships
      const semanticPositions = {
        'manifest': { x: 0, y: radius },              // Bottom center - physical manifestation
        'experience': { x: radius * 0.8, y: radius * 0.6 },   // Bottom-right - direct experience
        'practical': { x: radius, y: 0 },            // Right - practical application
        'relational': { x: radius * 0.6, y: -radius * 0.8 },  // Top-right - relationships
        'idea': { x: 0, y: -radius },                // Top center - abstract concepts
        'evolutionary': { x: -radius * 0.6, y: -radius * 0.8 }, // Top-left - evolution/growth
        'emanation': { x: -radius, y: 0 }            // Left - transcendent emergence
      };
      
      // Map each pool to its semantic position
      pools.forEach(pool => {
        if (semanticPositions[pool]) {
          positions.push(semanticPositions[pool]);
        } else {
          // Fallback to circle position for any unknown pools
          const i = pools.indexOf(pool);
          const angle = (i * 2 * Math.PI) / pools.length;
          positions.push({
            x: Math.cos(angle) * radius,
            y: Math.sin(angle) * radius
          });
        }
      });
      
      return positions;
    };
    
    // Calculate bridge position based on semantic relationships
    const calculateBridgePosition = (bridgePools, poolPositions, allPools, bridgePower) => {
      // For high-power bridges spanning many pools, place them centrally
      if (bridgePools.length >= 5) {
        // Central powerful bridges get positions in the core
        const angle = Math.random() * Math.PI * 2;
        const radius = 80 + (Math.random() * 40); // Core zone
        return {
          x: Math.cos(angle) * radius,
          y: Math.sin(angle) * radius
        };
      }
      
      // For medium bridges spanning 3-4 pools, create bridge zones
      if (bridgePools.length >= 3) {
        let totalX = 0, totalY = 0, validPositions = 0;
        
        bridgePools.forEach(pool => {
          const poolIndex = allPools.indexOf(pool);
          if (poolIndex !== -1 && poolPositions[poolIndex]) {
            totalX += poolPositions[poolIndex].x;
            totalY += poolPositions[poolIndex].y;
            validPositions++;
          }
        });
        
        if (validPositions > 0) {
          // Position in the middle of connected pools, but pulled toward center
          const avgX = totalX / validPositions;
          const avgY = totalY / validPositions;
          const pullFactor = 0.4; // Pull toward center to show bridging nature
          
          return {
            x: avgX * (1 - pullFactor),
            y: avgY * (1 - pullFactor)
          };
        }
      }
      
      // For 2-pool bridges, position along the edge between pools
      if (bridgePools.length === 2) {
        const pool1Index = allPools.indexOf(bridgePools[0]);
        const pool2Index = allPools.indexOf(bridgePools[1]);
        
        if (pool1Index !== -1 && pool2Index !== -1 && 
            poolPositions[pool1Index] && poolPositions[pool2Index]) {
          const pos1 = poolPositions[pool1Index];
          const pos2 = poolPositions[pool2Index];
          
          // Position along the line between pools with some variation
          const t = 0.4 + (Math.random() * 0.2); // Between 40-60% along the line
          const offsetAngle = Math.random() * Math.PI * 2;
          const offsetRadius = 15 + (Math.random() * 15);
          
          return {
            x: pos1.x + (pos2.x - pos1.x) * t + Math.cos(offsetAngle) * offsetRadius,
            y: pos1.y + (pos2.y - pos1.y) * t + Math.sin(offsetAngle) * offsetRadius
          };
        }
      }
      
      // Fallback to center with small radius
      const angle = Math.random() * Math.PI * 2;
      const radius = 30 + (Math.random() * 30);
      return {
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius
      };
    };
    
    // Calculate bridge color based on pool combination
    const calculateBridgeColor = (bridgePools) => {
      if (bridgePools.length === 1) {
        return knowledgeGraphService.getPoolColor(bridgePools[0]);
      }
      
      // For multi-pool bridges, create a mixed color
      // Use primary pool color but with accent mixing
      const primaryPool = bridgePools[0];
      const baseColor = knowledgeGraphService.getPoolColor(primaryPool);
      
      // For powerful multi-pool bridges, use a special enhanced color
      if (bridgePools.length >= 4) {
        return getVar('--color-accent') || '#FFD700'; // Gold for powerful bridges
      } else if (bridgePools.length >= 3) {
        return getVar('--color-primary') || baseColor; // Primary theme color
      }
      
      return baseColor;
    };
    
    // Smooth animated layout using ForceSupervisor
    const startSmoothLayout = () => {
      // Stop any existing layout
      if (forceSupervisor) {
        forceSupervisor.kill();
        forceSupervisor = null;
      }
      
      // Create ForceSupervisor with settings optimized for bridge entities
      forceSupervisor = new ForceSupervisor(graph.value, {
        attraction: 0.0005,      // Light attraction between connected nodes
        repulsion: 0.15,         // Stronger repulsion to prevent overlaps
        gravity: 0.01,           // Very light gravity toward center
        inertia: 0.8,           // Smooth movement
        maxIterations: 1000,     // Allow longer to converge
        isNodeFixed: (nodeKey, attributes) => {
          // Keep pool nodes fixed in their semantic positions
          return attributes.nodeType === 'pool';
        }
      });
      
      // Start the animated layout
      forceSupervisor.start();
    };
    
    // Stop smooth layout
    const stopSmoothLayout = () => {
      if (forceSupervisor && forceSupervisor.isRunning()) {
        forceSupervisor.stop();
      }
    };
    
    // Legacy bridge layout for fallback
    const runBridgeLayout = () => {
      // Apply minimal force layout to adjust only for overlap, preserve semantic positioning
      const settings = {
        iterations: 15, // Fewer iterations to preserve our semantic positioning
        settings: {
          gravity: 0.1,           // Very low gravity - trust our semantic positioning
          scalingRatio: 25,       // More spacing for readability  
          slowDown: 3,            // Fast convergence
          outboundAttractionDistribution: true, // Better edge handling
          linLogMode: false,      // Linear mode for smaller graphs
          adjustSizes: true,      // Account for node sizes
          edgeWeightInfluence: 0.3, // Moderate edge weight influence
          strongGravityMode: false
        }
      };
      
      // Only apply light forces to reduce overlap while preserving semantic structure
      forceAtlas2.assign(graph.value, settings);
    };
    
    // Overlap prevention using collision detection and adjustment
    const preventNodeOverlaps = () => {
      if (!graph.value) return;
      
      const nodes = [];
      graph.value.forEachNode((nodeId, attributes) => {
        nodes.push({
          id: nodeId,
          x: attributes.x || 0,
          y: attributes.y || 0,
          size: attributes.size || 10,
          fixed: attributes.nodeType === 'pool' // Keep pools in their semantic positions
        });
      });
      
      // Simple collision detection and resolution
      const iterations = 10;
      const minDistance = 5; // Minimum distance between node edges
      
      for (let iter = 0; iter < iterations; iter++) {
        let adjusted = false;
        
        for (let i = 0; i < nodes.length; i++) {
          for (let j = i + 1; j < nodes.length; j++) {
            const nodeA = nodes[i];
            const nodeB = nodes[j];
            
            // Skip if both nodes are fixed (pools)
            if (nodeA.fixed && nodeB.fixed) continue;
            
            const dx = nodeB.x - nodeA.x;
            const dy = nodeB.y - nodeA.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const minRequiredDistance = (nodeA.size + nodeB.size) / 2 + minDistance;
            
            if (distance < minRequiredDistance && distance > 0) {
              const overlap = minRequiredDistance - distance;
              const moveDistance = overlap / 2;
              
              // Normalize direction vector
              const moveX = (dx / distance) * moveDistance;
              const moveY = (dy / distance) * moveDistance;
              
              // Move nodes apart (only move non-fixed nodes)
              if (!nodeA.fixed) {
                nodeA.x -= moveX;
                nodeA.y -= moveY;
                adjusted = true;
              }
              if (!nodeB.fixed) {
                nodeB.x += moveX;
                nodeB.y += moveY;
                adjusted = true;
              }
            }
          }
        }
        
        // If no adjustments were made, we're done
        if (!adjusted) break;
      }
      
      // Apply the adjusted positions back to the graph
      nodes.forEach(node => {
        if (!node.fixed) { // Only update non-fixed nodes
          graph.value.setNodeAttribute(node.id, 'x', node.x);
          graph.value.setNodeAttribute(node.id, 'y', node.y);
        }
      });
      
      // Refresh renderer
      if (renderer) {
        renderer.refresh();
      }
    };
    
    // Bridge entity selection - highlights connected pools and edges
    const selectBridgeEntity = (bridgeId, bridgeNode) => {
      // Clear any previous selection
      clearBridgeSelection();
      
      // Store selected bridge
      selectedBridge.value = { id: bridgeId, ...bridgeNode };
      
      // Highlight the selected bridge entity
      graph.value.setNodeAttribute(bridgeId, 'size', (bridgeNode.size || 20) * 1.3);
      graph.value.setNodeAttribute(bridgeId, 'borderColor', getVar('--color-accent') || '#FFD700');
      
      // Get connected pools for this bridge
      const connectedPools = bridgeNode.pools || [];
      
      // Highlight connected pool nodes
      connectedPools.forEach(pool => {
        const poolNodeId = `pool_${pool}`;
        if (graph.value.hasNode(poolNodeId)) {
          // Make pool nodes larger and more prominent
          const currentSize = graph.value.getNodeAttribute(poolNodeId, 'size') || 15;
          graph.value.setNodeAttribute(poolNodeId, 'size', currentSize * 1.8);
          graph.value.setNodeAttribute(poolNodeId, 'borderColor', getVar('--color-accent') || '#FFD700');
          graph.value.setNodeAttribute(poolNodeId, 'selected', true);
        }
      });
      
      // Highlight edges connecting bridge to pools
      graph.value.forEachEdge((edge, attributes, source, target) => {
        if (source === bridgeId || target === bridgeId) {
          // This edge connects to the selected bridge
          graph.value.setEdgeAttribute(edge, 'size', (attributes.size || 1) * 2.5);
          graph.value.setEdgeAttribute(edge, 'color', getVar('--color-accent') || '#FFD700');
          graph.value.setEdgeAttribute(edge, 'selected', true);
        } else {
          // Dim other edges
          graph.value.setEdgeAttribute(edge, 'color', getVar('--color-border-light') || '#ddd');
          graph.value.setEdgeAttribute(edge, 'size', (attributes.originalSize || attributes.size || 1) * 0.4);
        }
      });
      
      // Dim non-connected nodes
      graph.value.forEachNode((nodeId, attributes) => {
        if (nodeId !== bridgeId && 
            !connectedPools.some(pool => nodeId === `pool_${pool}`) &&
            attributes.nodeType !== 'pool') {
          // Dim bridge entities not involved in this selection
          graph.value.setNodeAttribute(nodeId, 'color', getVar('--color-text-muted') || '#666');
          graph.value.setNodeAttribute(nodeId, 'size', (attributes.originalSize || attributes.size || 15) * 0.6);
        }
      });
      
      // Refresh renderer to show changes
      if (renderer) {
        renderer.refresh();
      }
    };
    
    // Clear bridge entity selection
    const clearBridgeSelection = () => {
      if (!selectedBridge.value) return;
      
      selectedBridge.value = null;
      
      // Reset all node sizes and colors to original values
      graph.value.forEachNode((nodeId, attributes) => {
        // Reset size to original
        if (attributes.originalSize) {
          graph.value.setNodeAttribute(nodeId, 'size', attributes.originalSize);
        }
        
        // Reset color to original
        if (attributes.originalColor) {
          graph.value.setNodeAttribute(nodeId, 'color', attributes.originalColor);
        }
        
        // Reset border colors based on node type
        if (attributes.nodeType === 'bridge') {
          graph.value.setNodeAttribute(nodeId, 'borderColor', getVar('--color-text-primary') || '#fff');
        } else if (attributes.nodeType === 'pool') {
          graph.value.setNodeAttribute(nodeId, 'borderColor', getVar('--color-border-heavy') || '#666');
        }
        
        // Remove selection flags
        graph.value.removeNodeAttribute(nodeId, 'selected');
      });
      
      // Reset all edge sizes and colors to original values
      graph.value.forEachEdge((edge, attributes) => {
        if (attributes.originalSize) {
          graph.value.setEdgeAttribute(edge, 'size', attributes.originalSize);
        }
        if (attributes.originalColor) {
          graph.value.setEdgeAttribute(edge, 'color', attributes.originalColor);
        }
        graph.value.removeEdgeAttribute(edge, 'selected');
      });
      
      // Refresh renderer to show changes
      if (renderer) {
        renderer.refresh();
      }
    };
    
    // Pool entity selection - highlights connected bridge entities
    const selectPoolEntity = (poolId, poolNode) => {
      // Clear any previous selection
      clearBridgeSelection();
      
      // Store selected pool
      selectedBridge.value = { id: poolId, ...poolNode, isPool: true };
      
      // Highlight the selected pool
      graph.value.setNodeAttribute(poolId, 'size', (poolNode.originalSize || 15) * 2.2);
      graph.value.setNodeAttribute(poolId, 'borderColor', getVar('--color-accent') || '#FFD700');
      
      // Get the pool name from the node ID (remove 'pool_' prefix)
      const poolName = poolId.replace('pool_', '');
      
      // Find all bridge entities connected to this pool
      const connectedBridges = [];
      graph.value.forEachNode((nodeId, attributes) => {
        if (attributes.nodeType === 'bridge' && attributes.pools && attributes.pools.includes(poolName)) {
          connectedBridges.push(nodeId);
        }
      });
      
      // Highlight connected bridge entities
      connectedBridges.forEach(bridgeId => {
        const bridgeNode = graph.value.getNodeAttributes(bridgeId);
        // Make bridge nodes larger and more prominent
        graph.value.setNodeAttribute(bridgeId, 'size', (bridgeNode.originalSize || 20) * 1.4);
        graph.value.setNodeAttribute(bridgeId, 'borderColor', getVar('--color-accent') || '#FFD700');
        graph.value.setNodeAttribute(bridgeId, 'selected', true);
      });
      
      // Highlight edges connecting pool to bridges
      graph.value.forEachEdge((edge, attributes, source, target) => {
        if ((source === poolId && connectedBridges.includes(target)) ||
            (target === poolId && connectedBridges.includes(source))) {
          // This edge connects the selected pool to a bridge
          graph.value.setEdgeAttribute(edge, 'size', (attributes.originalSize || 1) * 3);
          graph.value.setEdgeAttribute(edge, 'color', getVar('--color-accent') || '#FFD700');
          graph.value.setEdgeAttribute(edge, 'selected', true);
        } else {
          // Dim other edges
          graph.value.setEdgeAttribute(edge, 'color', getVar('--color-border-light') || '#ddd');
          graph.value.setEdgeAttribute(edge, 'size', (attributes.originalSize || attributes.size || 1) * 0.4);
        }
      });
      
      // Dim non-connected nodes
      graph.value.forEachNode((nodeId, attributes) => {
        if (nodeId !== poolId && 
            !connectedBridges.includes(nodeId) &&
            attributes.nodeType !== 'bridge') {
          // Dim other pool nodes not involved in this selection
          graph.value.setNodeAttribute(nodeId, 'color', getVar('--color-text-muted') || '#666');
          graph.value.setNodeAttribute(nodeId, 'size', (attributes.originalSize || attributes.size || 15) * 0.6);
        }
      });
      
      // Refresh renderer to show changes
      if (renderer) {
        renderer.refresh();
      }
    };
    
    // Setup draggable nodes functionality
    const setupDraggableNodes = () => {
      if (!renderer) return;
      
      // On mouse down on a node - start dragging
      renderer.on("downNode", (e) => {
        isDragging = true;
        draggedNode = e.node;
        
        // Optional: highlight the dragged node
        graph.value.setNodeAttribute(draggedNode, "highlighted", true);
        
        // Disable camera movement while dragging
        renderer.getCamera().disable();
      });
      
      // On mouse move - update node position if dragging
      renderer.getMouseCaptor().on("mousemovebody", (e) => {
        if (!isDragging || !draggedNode) return;
        
        // Convert mouse position to graph coordinates
        const pos = renderer.viewportToGraph(e);
        
        // Update node position
        graph.value.setNodeAttribute(draggedNode, "x", pos.x);
        graph.value.setNodeAttribute(draggedNode, "y", pos.y);
        
        // Prevent default camera movement
        e.preventSigmaDefault();
      });
      
      // On mouse up - stop dragging
      renderer.getMouseCaptor().on("mouseup", () => {
        if (draggedNode) {
          // Remove highlight
          graph.value.removeNodeAttribute(draggedNode, "highlighted");
        }
        
        isDragging = false;
        draggedNode = null;
        
        // Re-enable camera
        renderer.getCamera().enable();
      });
      
      // Disable autoscale on first interaction
      renderer.getMouseCaptor().on("mousedown", () => {
        if (!renderer.getCustomBBox()) {
          renderer.setCustomBBox(renderer.getBBox());
        }
      });
    };
    
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
      initializeGraph();
      await loadClusters();
      loadStats();
      
      // Handle window resize
      window.addEventListener('resize', () => {
        if (renderer) {
          renderer.refresh();
        }
      });
    });
    
    onUnmounted(() => {
      // Clean up ForceSupervisor
      if (forceSupervisor) {
        forceSupervisor.kill();
        forceSupervisor = null;
      }
      
      // Clean up Sigma renderer
      if (renderer) {
        renderer.kill();
        renderer = null;
        camera = null;
      }
      
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
      calculatePoolPositions,
      calculateBridgePosition,
      calculateBridgeColor,
      runBridgeLayout,
      startSmoothLayout,
      stopSmoothLayout,
      setupDraggableNodes,
      selectBridgeEntity,
      selectPoolEntity,
      clearBridgeSelection,
      selectedBridge,
      preventNodeOverlaps,
      knowledgeGraphService  // Expose service for template access
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

.info-panel {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border-medium);
  border-radius: 8px;
  padding: 1.5rem;
  min-width: 250px;
  z-index: 20;
  box-shadow: 0 4px 8px var(--color-shadow);
}

.info-panel h3 {
  margin: 0 0 1rem 0;
  color: var(--color-text-primary);
  font-size: 1.25rem;
  font-weight: 600;
}

.info-panel p {
  margin: 0.5rem 0;
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  display: flex;
  justify-content: space-between;
}

.info-panel p strong {
  color: var(--color-text-primary);
  font-weight: 600;
}

.info-panel button {
  margin-top: 1rem;
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

.info-panel button:hover {
  background: var(--color-primary);
  border-color: var(--color-primary);
}

/* Enhanced info panel styling */
.info-details {
  margin: 1rem 0;
}

.info-details p {
  margin: 0.75rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.pool-badge {
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.center-badge {
  background: var(--color-accent);
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
}

.info-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
}

.action-btn {
  flex: 1;
  padding: 0.5rem 1rem;
  background: var(--color-accent);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 600;
  transition: all 0.2s ease;
}

.action-btn:hover {
  background: var(--color-primary);
  transform: translateY(-1px);
}

.close-btn {
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

.close-btn:hover {
  background: var(--color-border-medium);
}

/* About Panel - explains current view */
.about-panel {
  position: absolute;
  top: 1rem;
  left: 1rem;
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border-medium);
  border-radius: 8px;
  padding: 1.5rem;
  max-width: 350px;
  z-index: 20;
  box-shadow: 0 4px 8px var(--color-shadow);
}

.about-panel h4 {
  margin: 0 0 1rem 0;
  color: var(--color-text-primary);
  font-size: 1.125rem;
  font-weight: 600;
}

.about-panel p {
  margin: 0.75rem 0;
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  line-height: 1.4;
}

.pool-legend {
  list-style: none;
  padding: 0;
  margin: 0.5rem 0 0 0;
}

.pool-legend li {
  display: flex;
  align-items: center;
  margin: 0.5rem 0;
  font-size: 0.8rem;
  color: var(--color-text-secondary);
  line-height: 1.3;
}

.legend-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  margin-right: 0.5rem;
  flex-shrink: 0;
}

.pool-legend strong {
  color: var(--color-text-primary);
  margin-right: 0.25rem;
}

.bridge-explanation {
  list-style: none;
  padding: 0;
  margin: 0.5rem 0;
}

.bridge-explanation li {
  margin: 0.5rem 0;
  font-size: 0.8rem;
  color: var(--color-text-secondary);
  line-height: 1.3;
  padding-left: 0.5rem;
  border-left: 2px solid var(--color-border-light);
}

.bridge-explanation strong {
  color: var(--color-text-primary);
}

.about-panel code {
  background: var(--color-bg-base);
  padding: 0.2rem 0.4rem;
  border-radius: 3px;
  font-size: 0.75rem;
  color: var(--color-accent);
  border: 1px solid var(--color-border-light);
}

.graph-stats {
  position: absolute;
  bottom: 1rem;
  left: 1rem;
  background: var(--color-background-tertiary);
  border: 1px solid var(--color-border-medium);
  padding: 0.5rem 1rem;
  border-radius: 4px;
  font-size: 0.875rem;
  display: flex;
  gap: 1rem;
  color: var(--color-text-secondary);
}

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
  
  .info-panel {
    top: auto;
    bottom: 1rem;
    right: 0.5rem;
    left: 0.5rem;
    min-width: auto;
  }
  
  .about-panel {
    position: static;
    margin: 0.5rem;
    max-width: none;
    order: -1; /* Show above graph on mobile */
  }
  
  .pool-legend li {
    font-size: 0.75rem;
    margin: 0.25rem 0;
  }
  
  .legend-dot {
    width: 10px;
    height: 10px;
  }
}
</style>