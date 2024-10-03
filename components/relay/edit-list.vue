<script setup>
import { useRelayStore } from '@/stores/relays'

const props = defineProps([
  'relayIds',
  'removeIds',
  'active'
])

const emit = defineEmits([
  'removeRelay',
  'cancelRemoveRelay'
])

function removeRelay(relayId) {
  emit('removeRelay', relayId)
}

function cancelRemoveRelay(relayId) {
  emit('cancelRemoveRelay', relayId)
}
</script>

<template>
  <div class="relay-edit-list" v-if="relayIds?.length > 0">
    <RelayEditListItem
      v-for="(relayId, index) in relayIds"
      :key="relayId"
      :relayId="relayId"
      :active="active"
      :removeIds="removeIds"
      @remove="removeRelay"
      @cancelRemove="cancelRemoveRelay"
    />
  </div>
</template>

<style scoped lang="scss">

.relay-edit-list {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

</style>
