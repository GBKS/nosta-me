<script setup>
import { useRelayStore } from '@/stores/relays'

const props = defineProps([
  'relayUrls',
  'active'
])

const emit = defineEmits([
  'addRelayUrl',
  'removeRelayUrl'
])

function addRelay(url) {
  emit('addRelayUrl', url)
}

function removeRelayUrl(relayUrl) {
  emit('removeRelayUrl', relayUrl)
}
</script>

<template>
  <div class="relay-add-list">
    <RelayAddListItem
      v-for="relayUrl in relayUrls"
      :key="relayUrl"
      :relayUrl="relayUrl"
      :active="active"
      @remove="removeRelayUrl"
    />
    <RelayAddListInput
      :active="active"
      @add="addRelay"
    />
  </div>
</template>

<style scoped lang="scss">

.relay-add-list {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

</style>
