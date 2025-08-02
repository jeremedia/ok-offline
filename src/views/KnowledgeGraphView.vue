<template>
  <div class="knowledge-graph-view">
    <KnowledgeGraph />
  </div>
</template>

<script>
import { useRouter } from 'vue-router';
import KnowledgeGraph from '../components/KnowledgeGraph.vue';

export default {
  name: 'KnowledgeGraphView',
  
  components: {
    KnowledgeGraph
  },
  
  setup() {
    const router = useRouter();
    
    const goBack = () => {
      router.back();
    };
    
    return {
      goBack
    };
  }
};
</script>

<style scoped>
.knowledge-graph-view {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--color-bg-base);
}
</style>