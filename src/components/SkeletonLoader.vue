<template>
  <div class="skeleton-loader">
    <div v-for="n in count" :key="n" class="skeleton-item">
      <div class="skeleton-line skeleton-title"></div>
      <div class="skeleton-line skeleton-subtitle"></div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  count: {
    type: Number,
    default: 10
  }
})
</script>

<style scoped>
.skeleton-loader {
  padding: 0;
}

.skeleton-item {
  padding: 1rem;
  border-bottom: 1px solid #444;
}

.skeleton-line {
  background: linear-gradient(90deg, #333 25%, #444 50%, #333 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 4px;
}

.skeleton-title {
  height: 1.2rem;
  width: 60%;
  margin-bottom: 0.5rem;
}

.skeleton-subtitle {
  height: 0.9rem;
  width: 40%;
}

@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}
</style>