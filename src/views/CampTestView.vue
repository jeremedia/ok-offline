<template>
  <div class="view-container">
    <h1>Camp Test View - Year: {{ year }}</h1>
    <p>This is a minimal test component</p>
  </div>
</template>

<script setup>
const props = defineProps({
  year: String
})
</script>

<style scoped>
.view-container {
  padding: 2rem;
}
</style>