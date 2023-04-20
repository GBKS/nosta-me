<script setup>
import { useRelayStore } from '@/stores/relays'

const props = defineProps([
  'info'
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

const showLoader = computed(() => {
  return Object.keys(relayData.value).length == 0
})
</script>

<template>
  <div class="relay-list">
    <UiLoadIndicator
      v-if="showLoader"
    />
    <ModalRelayList
      v-if="!showLoader"
      :info="relayData"
      :showStatus="false"
      theme="theme"
    />
  </div>
</template>

<style scoped lang="scss">

.relay-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

</style>
