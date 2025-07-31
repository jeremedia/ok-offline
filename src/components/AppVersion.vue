<template>
  <span class="app-version">v{{ version }}</span>
</template>

<script setup>
const version = __APP_VERSION__
</script>

<style scoped>
.app-version {
  font-family: 'Berkeley Mono', monospace;
  font-size: 0.875rem;
  color: var(--color-text-disabled);
}
</style>