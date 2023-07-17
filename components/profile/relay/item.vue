<script setup>
const props = defineProps([
  'relayId'
])
</script>

<template>
  <div class="relay-item">
    <p>{{ relayId }}</p>
  </div>
</template>

<style scoped lang="scss">

.relay-item {
  p {
    font-size: 17px;
    color: white;
  }
}

</style>
