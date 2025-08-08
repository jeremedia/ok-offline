<template>
  <div class="graph-test">
    <h2>Graph Renderer Test</h2>
    <div ref="graphContainer" class="graph-container" style="height: 400px; border: 1px solid #ccc;">
      <div v-if="loading" class="spinner">Loading...</div>
    </div>
    <div class="controls">
      <button @click="addTestNodes">Add Test Nodes</button>
      <button @click="resetView">Reset View</button>
      <button @click="zoomToFit">Zoom to Fit</button>
      <button @click="clear">Clear</button>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted } from 'vue';
import Graph from 'graphology';
import { useGraphRenderer } from './composables/useGraphRenderer.js';

export default {
  name: 'GraphRendererTest',
  
  setup() {
    // Graph instance
    const graph = ref(new Graph());
    
    // Container ref
    const graphContainer = ref(null);
    
    // Use the composable
    const {
      loading,
      initializeGraph,
      ensureRenderer,
      updateRenderer,
      resetView: resetViewFn,
      zoomToFit: zoomToFitFn,
      cleanup
    } = useGraphRenderer();
    
    // Add test nodes to verify rendering
    const addTestNodes = async () => {
      loading.value = true;
      
      // Clear and add test data
      graph.value.clear();
      
      // Add some test nodes
      graph.value.addNode('test1', {
        label: 'Test Node 1',
        size: 20,
        color: '#ff0000',
        x: 0,
        y: 0
      });
      
      graph.value.addNode('test2', {
        label: 'Test Node 2', 
        size: 15,
        color: '#00ff00',
        x: 100,
        y: 50
      });
      
      graph.value.addNode('test3', {
        label: 'Test Node 3',
        size: 15,
        color: '#0000ff',
        x: -50,
        y: 100
      });
      
      // Add edges
      graph.value.addEdge('test1', 'test2', { size: 2 });
      graph.value.addEdge('test1', 'test3', { size: 1 });
      
      // Ensure renderer exists and update
      await ensureRenderer(graph.value, graphContainer);
      await updateRenderer();
    };
    
    // Wrapper functions
    const resetView = () => resetViewFn();
    const zoomToFit = () => zoomToFitFn(graph.value);
    
    // Clear graph
    const clear = () => {
      initializeGraph(graph.value);
      updateRenderer();
    };
    
    // Initialize on mount
    onMounted(async () => {
      await ensureRenderer(graph.value, graphContainer);
      await addTestNodes();
    });
    
    // Cleanup on unmount
    onUnmounted(() => {
      cleanup();
    });
    
    return {
      graphContainer,
      loading,
      addTestNodes,
      resetView,
      zoomToFit,
      clear
    };
  }
};
</script>

<style scoped>
.graph-test {
  padding: 20px;
}

.graph-container {
  position: relative;
  width: 100%;
  margin: 20px 0;
}

.spinner {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.controls {
  display: flex;
  gap: 10px;
}

button {
  padding: 8px 16px;
  cursor: pointer;
}
</style>