<script setup>
const props = defineProps([
  'info',
  'showStatus',
  'theme'
])
</script>

<template>
  <div class="modal-relay-list">
    <ModalRelayItem
      v-for="(item, index) in info"
      :key="item.id"
      :info="item"
      :showStatus="showStatus"
      :theme="theme"
    />
  </div>
</template>

<style scoped lang="scss">

.modal-relay-list {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
  justify-content: center;

  @include media-query(medium-down) {
    
  }

  @include media-query(large) {
    
  }
}

</style>
