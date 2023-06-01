<script setup>
import { useRelayStore } from '@/stores/relays'
import ToolBox from '@/helpers/toolBox'

const relayStore = useRelayStore()

let relayInfo = ref(null)
let relayConnection = ref(null)
let relayStatus = ref(null)

const props = defineProps([
  'relayId',
  'active'
])

// watch(() => props.active, () => {
//   console.log('active changed', props.active)
// })

const relayData = computed(() => {
  return relayStore.getRelay(props.relayId)
})

const title = computed(() => {
  const result = relayInfo.value ? relayInfo.value.name : props.relayId
  return ToolBox.trim(result, 30)
})

function onRelayStatusChange(data) {
  if(data.relayId == props.relayId) {
    relayStatus.value = data.status
  }
}

const classObject = computed(() => {
  const c = ['relay-save-list-item']

  if(relayStatus.value) {
    c.push('-'+relayStatus.value)
  }

  return c.join(' ')
})

onMounted(() => {
  relayInfo = relayStore.getRelay(props.relayId)
  relayConnection = relayStore.getRelayConnection(props.relayId)

  relayStatus.value = relayInfo.status

  window.emitter.on('relay-connection-status-change', onRelayStatusChange)
})
</script>

<template>
  <div :class="classObject">
    <UiRelayStatus :info="relayInfo" size="compact" />
    <p>{{ title }}</p>
  </div>
</template>

<style scoped lang="scss">

.relay-save-list-item {
  display: flex;
  align-items: center;
  background-color: #f4f4f4;
  border-radius: 5px;
  gap: 3px;
  padding: 3px 12px;

  p {
    font-size: 17px;
    color: black;
  }
}

</style>
