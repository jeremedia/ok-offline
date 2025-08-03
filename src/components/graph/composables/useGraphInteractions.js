// useGraphInteractions.js - Composable for managing graph interactions
// This composable handles node dragging, selection, and highlighting behavior
// Extracted from KnowledgeGraph.vue to be reusable across different graph views

import { ref } from 'vue';

export function useGraphInteractions() {
  // Selection state
  const selectedBridge = ref(null);
  const selectedNode = ref(null);
  
  // Drag state - not reactive for performance
  let isDragging = false;
  let draggedNode = null;
  
  /**
   * Get theme CSS variable value
   * @param {string} name - CSS variable name
   * @returns {string} CSS variable value
   */
  const getVar = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  
  /**
   * Select a bridge entity and highlight its connections
   * @param {Object} graph - Graphology graph instance
   * @param {Object} renderer - Sigma renderer instance
   * @param {string} bridgeId - ID of the bridge entity to select
   * @param {Object} bridgeNode - Node attributes of the bridge
   */
  const selectBridgeEntity = (graph, renderer, bridgeId, bridgeNode) => {
    // Clear any previous selection
    clearBridgeSelection(graph, renderer);
    
    // Store selected bridge
    selectedBridge.value = { id: bridgeId, ...bridgeNode };
    
    // Highlight the selected bridge entity
    graph.setNodeAttribute(bridgeId, 'size', (bridgeNode.size || 20) * 1.3);
    graph.setNodeAttribute(bridgeId, 'borderColor', getVar('--color-accent') || '#FFD700');
    
    // Get connected pools for this bridge
    const connectedPools = bridgeNode.pools || [];
    
    // Highlight connected pool nodes
    connectedPools.forEach(pool => {
      const poolNodeId = `pool_${pool}`;
      if (graph.hasNode(poolNodeId)) {
        // Make pool nodes larger and more prominent
        const currentSize = graph.getNodeAttribute(poolNodeId, 'size') || 15;
        graph.setNodeAttribute(poolNodeId, 'size', currentSize * 1.8);
        graph.setNodeAttribute(poolNodeId, 'borderColor', getVar('--color-accent') || '#FFD700');
        graph.setNodeAttribute(poolNodeId, 'selected', true);
      }
    });
    
    // Highlight edges connecting bridge to pools
    graph.forEachEdge((edge, attributes, source, target) => {
      if (source === bridgeId || target === bridgeId) {
        // This edge connects to the selected bridge
        graph.setEdgeAttribute(edge, 'size', (attributes.size || 1) * 2.5);
        graph.setEdgeAttribute(edge, 'color', getVar('--color-accent') || '#FFD700');
        graph.setEdgeAttribute(edge, 'selected', true);
      } else {
        // Dim other edges
        graph.setEdgeAttribute(edge, 'color', getVar('--color-border-light') || '#ddd');
        graph.setEdgeAttribute(edge, 'size', (attributes.originalSize || attributes.size || 1) * 0.4);
      }
    });
    
    // Dim non-connected nodes
    graph.forEachNode((nodeId, attributes) => {
      if (nodeId !== bridgeId && 
          !connectedPools.some(pool => nodeId === `pool_${pool}`) &&
          attributes.nodeType !== 'pool') {
        // Dim bridge entities not involved in this selection
        graph.setNodeAttribute(nodeId, 'color', getVar('--color-text-muted') || '#666');
        graph.setNodeAttribute(nodeId, 'size', (attributes.originalSize || attributes.size || 15) * 0.6);
      }
    });
    
    // Refresh renderer to show changes
    if (renderer) {
      renderer.refresh();
    }
  };
  
  /**
   * Select a pool entity and highlight its connected bridges
   * @param {Object} graph - Graphology graph instance
   * @param {Object} renderer - Sigma renderer instance
   * @param {string} poolId - ID of the pool to select
   * @param {Object} poolNode - Node attributes of the pool
   */
  const selectPoolEntity = (graph, renderer, poolId, poolNode) => {
    // Clear any previous selection
    clearBridgeSelection(graph, renderer);
    
    // Store selected pool
    selectedBridge.value = { id: poolId, ...poolNode, isPool: true };
    
    // Highlight the selected pool
    graph.setNodeAttribute(poolId, 'size', (poolNode.originalSize || 15) * 2.2);
    graph.setNodeAttribute(poolId, 'borderColor', getVar('--color-accent') || '#FFD700');
    
    // Get the pool name from the node ID (remove 'pool_' prefix)
    const poolName = poolId.replace('pool_', '');
    
    // Find all bridge entities connected to this pool
    const connectedBridges = [];
    graph.forEachNode((nodeId, attributes) => {
      if (attributes.nodeType === 'bridge' && attributes.pools && attributes.pools.includes(poolName)) {
        connectedBridges.push(nodeId);
      }
    });
    
    // Highlight connected bridge entities
    connectedBridges.forEach(bridgeId => {
      const bridgeNode = graph.getNodeAttributes(bridgeId);
      // Make bridge nodes larger and more prominent
      graph.setNodeAttribute(bridgeId, 'size', (bridgeNode.originalSize || 20) * 1.4);
      graph.setNodeAttribute(bridgeId, 'borderColor', getVar('--color-accent') || '#FFD700');
      graph.setNodeAttribute(bridgeId, 'selected', true);
    });
    
    // Highlight edges connecting pool to bridges
    graph.forEachEdge((edge, attributes, source, target) => {
      if ((source === poolId && connectedBridges.includes(target)) ||
          (target === poolId && connectedBridges.includes(source))) {
        // This edge connects the selected pool to a bridge
        graph.setEdgeAttribute(edge, 'size', (attributes.originalSize || 1) * 3);
        graph.setEdgeAttribute(edge, 'color', getVar('--color-accent') || '#FFD700');
        graph.setEdgeAttribute(edge, 'selected', true);
      } else {
        // Dim other edges
        graph.setEdgeAttribute(edge, 'color', getVar('--color-border-light') || '#ddd');
        graph.setEdgeAttribute(edge, 'size', (attributes.originalSize || attributes.size || 1) * 0.4);
      }
    });
    
    // Dim non-connected nodes
    graph.forEachNode((nodeId, attributes) => {
      if (nodeId !== poolId && 
          !connectedBridges.includes(nodeId) &&
          attributes.nodeType !== 'bridge') {
        // Dim other pool nodes not involved in this selection
        graph.setNodeAttribute(nodeId, 'color', getVar('--color-text-muted') || '#666');
        graph.setNodeAttribute(nodeId, 'size', (attributes.originalSize || attributes.size || 15) * 0.6);
      }
    });
    
    // Refresh renderer to show changes
    if (renderer) {
      renderer.refresh();
    }
  };
  
  /**
   * Clear all selection highlighting
   * @param {Object} graph - Graphology graph instance
   * @param {Object} renderer - Sigma renderer instance
   */
  const clearBridgeSelection = (graph, renderer) => {
    if (!selectedBridge.value) return;
    
    selectedBridge.value = null;
    
    // Reset all node sizes and colors to original values
    graph.forEachNode((nodeId, attributes) => {
      // Reset size to original
      if (attributes.originalSize) {
        graph.setNodeAttribute(nodeId, 'size', attributes.originalSize);
      }
      
      // Reset color to original
      if (attributes.originalColor) {
        graph.setNodeAttribute(nodeId, 'color', attributes.originalColor);
      }
      
      // Reset border colors based on node type
      if (attributes.nodeType === 'bridge') {
        graph.setNodeAttribute(nodeId, 'borderColor', getVar('--color-text-primary') || '#fff');
      } else if (attributes.nodeType === 'pool') {
        graph.setNodeAttribute(nodeId, 'borderColor', getVar('--color-border-heavy') || '#666');
      }
      
      // Remove selection flags
      graph.removeNodeAttribute(nodeId, 'selected');
    });
    
    // Reset all edge sizes and colors to original values
    graph.forEachEdge((edge, attributes) => {
      if (attributes.originalSize) {
        graph.setEdgeAttribute(edge, 'size', attributes.originalSize);
      }
      if (attributes.originalColor) {
        graph.setEdgeAttribute(edge, 'color', attributes.originalColor);
      }
      graph.removeEdgeAttribute(edge, 'selected');
    });
    
    // Refresh renderer to show changes
    if (renderer) {
      renderer.refresh();
    }
  };
  
  /**
   * Setup draggable nodes functionality
   * Allows users to manually position nodes by dragging
   * @param {Object} graph - Graphology graph instance
   * @param {Object} renderer - Sigma renderer instance
   */
  const setupDraggableNodes = (graph, renderer) => {
    if (!renderer) return;
    
    // On mouse down on a node - start dragging
    renderer.on("downNode", (e) => {
      isDragging = true;
      draggedNode = e.node;
      
      // Optional: highlight the dragged node
      graph.setNodeAttribute(draggedNode, "highlighted", true);
      
      // Disable camera movement while dragging
      renderer.getCamera().disable();
    });
    
    // On mouse move - update node position if dragging
    renderer.getMouseCaptor().on("mousemovebody", (e) => {
      if (!isDragging || !draggedNode) return;
      
      // Convert mouse position to graph coordinates
      const pos = renderer.viewportToGraph(e);
      
      // Update node position
      graph.setNodeAttribute(draggedNode, "x", pos.x);
      graph.setNodeAttribute(draggedNode, "y", pos.y);
      
      // Prevent default camera movement
      e.preventSigmaDefault();
    });
    
    // On mouse up - stop dragging
    renderer.getMouseCaptor().on("mouseup", () => {
      if (draggedNode) {
        // Remove highlight
        graph.removeNodeAttribute(draggedNode, "highlighted");
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
  
  /**
   * Setup click handlers for node selection
   * @param {Object} graph - Graphology graph instance
   * @param {Object} renderer - Sigma renderer instance
   * @param {Function} onNodeClick - Optional callback for node clicks
   */
  const setupClickHandlers = (graph, renderer, onNodeClick) => {
    if (!renderer) return;
    
    // Handle node clicks
    renderer.on("clickNode", ({ node }) => {
      const nodeData = graph.getNodeAttributes(node);
      
      // Check if it's a bridge entity
      if (nodeData.nodeType === 'bridge') {
        selectBridgeEntity(graph, renderer, node, nodeData);
      } 
      // Check if it's a pool entity
      else if (nodeData.nodeType === 'pool') {
        selectPoolEntity(graph, renderer, node, nodeData);
      }
      
      // Call optional callback
      if (onNodeClick) {
        onNodeClick(node, nodeData);
      }
    });
    
    // Clear selection when clicking on empty space
    renderer.on("clickStage", () => {
      clearBridgeSelection(graph, renderer);
      selectedNode.value = null;
    });
  };
  
  return {
    // State
    selectedBridge,
    selectedNode,
    
    // Selection functions
    selectBridgeEntity,
    selectPoolEntity,
    clearBridgeSelection,
    
    // Interaction setup
    setupDraggableNodes,
    setupClickHandlers
  };
}