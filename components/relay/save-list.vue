<script setup>
import { useRelayStore } from '@/stores/relays'

const props = defineProps([
  'relayIds',
  'active'
])

const relayStore = useRelayStore()

const relayData = computed(() => {
  const result = {}

  if(props.info) {
    let relayId, item
    for(let i=0; i<props.info.length; i++) {
      relayId = props.info[i]
      item = relayStore.getRelay(relayId)

      if(item) {
        result[relayId] = item
      }
    }
  }

  return result
})
</script>

<template>
  <div class="relay-save-list" v-if="relayIds.length > 0">
    <RelaySaveListItem
      v-for="(relayId, index) in relayIds"
      :key="relayId"
      :relayId="relayId"
      :active="active"
    />
  </div>
</template>

<style scoped lang="scss">

.relay-save-list {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

</style>
