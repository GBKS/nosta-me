<script setup>
import { useRelayStore } from '@/stores/relays'

const relayStore = useRelayStore()

const active = ref(false)
const connectedRelayCount = ref(0)

function toggle() {
  active.value = !active.value

  if(active.value) {
    window.emitter.emit('show-modal', {id: 'relays'})
  } else {
    window.emitter.emit('hide-modal', {id: 'relays'})
  }
}

function onShowModal(data) {
  if(data.id != 'relays') {
    active.value = false
  }
}

function onHideModal(data) {
  if(data.id === 'relays') {
    active.value = false
  }
}

function onRelayConnectionStatusChange() {
  updateConnectedRelayCount()
}

function updateConnectedRelayCount() {
  let count = 0
  for(let i in relayStore.connections) {
    if(relayStore.connections[i].status == 1) {
      count++
    }
  }

  connectedRelayCount.value = count
}

const circleOneFill = computed(() => {
  return connectedRelayCount.value > 0 ? 'currentColor' : null
})

const circleTwoFill = computed(() => {
  return connectedRelayCount.value > 1 ? 'currentColor' : null
})

const circleThreeFill = computed(() => {
  return connectedRelayCount.value > 2 ? 'currentColor' : null
})

const circleFourFill = computed(() => {
  return connectedRelayCount.value > 3 ? 'currentColor' : null
})

const circleFiveFill = computed(() => {
  return connectedRelayCount.value > 4 ? 'currentColor' : null
})

const circleSixFill = computed(() => {
  return connectedRelayCount.value > 5 ? 'currentColor' : null
})

onMounted(() => {
  window.emitter.on('show-modal', onShowModal)
  window.emitter.on('hide-modal', onHideModal)
  window.emitter.on('relay-connection-status-change', onRelayConnectionStatusChange)

  updateConnectedRelayCount()
})

onBeforeUnmount(() => {
  window.emitter.off('show-modal', onShowModal)
  window.emitter.off('hide-modal', onHideModal)
  window.emitter.off('relay-connection-status-change', onRelayConnectionStatusChange)
})

const buttonTitle = computed(() => {
  return active.value ? 'Hide relays' : 'Show relays'
})
</script>

<template>
  <button
    class="header-icon-button"
    :title="buttonTitle"
    :active="active"
    @click="toggle"
  >
    <svg viewBox="0 0 19 19" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle :fill="circleOneFill" cx="9" cy="10" r="2.75" stroke="currentColor" stroke-width="0.916667"/>
      <circle :fill="circleTwoFill" cx="11" cy="2.24121" r="1.75" stroke="currentColor" stroke-width="1"/>
      <circle :fill="circleThreeFill" cx="16.7393" cy="6.50195" r="1.75" stroke="currentColor" stroke-width="1"/>
      <circle :fill="circleFourFill" cx="4.0002" cy="4.0002" r="1.8" stroke="currentColor" stroke-width="0.9"/>
      <circle :fill="circleFiveFill" cx="3" cy="16" r="1.75" stroke="currentColor" stroke-width="1"/>
      <circle :fill="circleSixFill" cx="14" cy="16" r="1.75" stroke="currentColor" stroke-width="1"/>
      <path d="M9.66943 7.42676L10.5766 3.82031" stroke="currentColor"/>
      <path d="M10.6343 11.9239L12.9991 14.8164" stroke="currentColor"/>
      <path d="M11.4678 8.86666L15.3125 7.11024" stroke="currentColor"/>
      <path d="M7.08447 11.8594L4.14796 14.9062" stroke="currentColor"/>
      <path d="M7.41406 8.08626L5.06104 5.21777" stroke="currentColor"/>
    </svg>
  </button>
</template>

<style scoped lang="scss">

.header-icon-button {

}

</style>
