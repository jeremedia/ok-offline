<!-- GraphStats.vue - Display node and edge counts for the graph -->
<!-- This component shows basic statistics about the current graph visualization -->
<template>
  <div v-if="nodeCount > 0" class="graph-stats">
    <span>Nodes: {{ nodeCount.toLocaleString() }}</span>
    <span>Edges: {{ edgeCount.toLocaleString() }}</span>
  </div>
</template>

<script>
export default {
  name: 'GraphStats',
  
  props: {
    // Number of nodes in the current graph
    nodeCount: {
      type: Number,
      default: 0
    },
    
    // Number of edges in the current graph
    edgeCount: {
      type: Number,
      default: 0
    }
  }
};
</script>

<style scoped>
.graph-stats {
  position: absolute;
  bottom: 1rem;
  left: 1rem;
  padding: 0.75rem 1rem;
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border-light);
  border-radius: 8px;
  display: flex;
  gap: 1.5rem;
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  z-index: 10;
}

.graph-stats span {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

/* Mobile optimizations */
@media (max-width: 768px) {
  .graph-stats {
    bottom: 0.5rem;
    left: 0.5rem;
    padding: 0.5rem 0.75rem;
    font-size: 0.75rem;
    gap: 1rem;
  }
}
</style>