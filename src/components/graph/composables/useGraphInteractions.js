// useGraphInteractions.js - Composable for managing graph drag interactions
// This composable handles node dragging and click event setup
// Selection logic has been moved to useGraphSelection.js for better separation of concerns

export function useGraphInteractions() {
  // Drag state - not reactive for performance
  let isDragging = false;
  let draggedNode = null;
  
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
   * Setup click handlers for graph interaction
   * This sets up the basic click events but delegates selection logic to callbacks
   * @param {Object} graph - Graphology graph instance
   * @param {Object} renderer - Sigma renderer instance
   * @param {Object} callbacks - Event callback functions
   * @param {Function} callbacks.onNodeClick - Callback for node clicks (node, nodeData)
   * @param {Function} callbacks.onStageClick - Callback for clicking empty space
   */
  const setupClickHandlers = (graph, renderer, callbacks = {}) => {
    if (!renderer) return;
    
    // Handle node clicks
    renderer.on("clickNode", ({ node }) => {
      const nodeData = graph.getNodeAttributes(node);
      
      // Delegate to callback for selection handling
      if (callbacks.onNodeClick) {
        callbacks.onNodeClick(node, nodeData);
      }
    });
    
    // Handle clicking on empty space
    renderer.on("clickStage", () => {
      // Delegate to callback for clearing selections
      if (callbacks.onStageClick) {
        callbacks.onStageClick();
      }
    });
  };
  
  /**
   * Check if currently dragging a node
   * @returns {boolean} True if dragging
   */
  const isDraggingNode = () => isDragging;
  
  /**
   * Get the currently dragged node ID
   * @returns {string|null} Node ID or null
   */
  const getDraggedNode = () => draggedNode;
  
  return {
    // Interaction setup functions
    setupDraggableNodes,
    setupClickHandlers,
    
    // State query functions
    isDraggingNode,
    getDraggedNode
  };
}