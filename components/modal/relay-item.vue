<script setup>
import relayManager from '@/helpers/relayManager.js'
import { useRelayStore } from '@/stores/relays'

const props = defineProps([
  'info',
  'showStatus',
  'theme'
])

const relayData = ref(null)
const relayStore = useRelayStore()
const loadStatus = ref('none')

const name = computed(() => {
  let result = null

  if(props.info) {
    result = props.info.name
  }

  return result
})

const classObject = computed(() => {
  const c = [
    'relay-item',
    '-'+loadStatus.value
  ]

  if(props.info && props.info.status) {
    c.push('-'+props.info.status)
  }

  if(props.theme) {
    c.push('-'+props.theme)
  }

  return c.join(' ')
})

const title = computed(() => {
  let result = ''

  if(props.info && props.info.status) {
    switch(props.info.status) {
      case 'connecting':
        result = '🫥 Connecting...'
        break
      case 'connected':
        result = '😆 Connected'
        break
      case 'disconnected':
        result = '😡 Disconnected'
        break
      case 'notice':
        result = '🧐 Notice'
        break
      case 'could-not-open':
        result = '🤬 Could not connect'
        break
      case 'connection-error':
        result = '🥵 Connection error'
        break
    }
  }

  return result
})

const status = computed(() => {
  let result = ''

  if(props.info && props.info.status) {
    switch(props.info.status) {
      case 'connecting':
        result = 'Connecting...'
        break
      case 'connected':
        result = 'Connected'
        break
      case 'disconnected':
        result = 'Disconnected'
        break
      case 'notice':
        result = 'Notice'
        break
      case 'could-not-open':
        result = 'Could not connect'
        break
      case 'connection-error':
        result = 'Connection error'
        break
    }
  }

  return result
})

// Need to store this centrally so it can be recovered on re-render
function loadRelayData() {
  // console.log('loadRelayData', props.info)
  let currentRelayUrl = props.info.url.replace('wss://', 'https://')

  loadStatus.value = 'loading'

  try {
    fetch(currentRelayUrl, {headers: {'accept': 'application/nostr+json'}})
      .then((response) => response.json())
      .then(onRelayData)
      .catch(onRelayDataError)
  } catch(error) {
    console.log('ModalRelayItem.loadRelayData error', error)
    onRelayDataError(error)
  }
}

function onRelayData(data) {
  // console.log('onRelayData', data)

  relayStore.setRelayInfo(props.info.id, data)

  relayData.value = data

  loadStatus.value = 'loaded'
}

function onRelayDataError(error) {
  console.log('onRelayDataError', error)

  loadStatus.value = 'error'
}

function clickStatus(info) {
  console.log('clickStatus', info)

  const statuses = [
    'disconnected',
    'could-not-open'
  ]

  if(statuses.indexOf(props.info.status) !== -1) {
    const connection = relayManager.connectors[info.id]
    if(connection) {
      connection.connect()
    } 
    console.log('connection', connection)  
  }
}

onMounted(() => {
  let data = relayStore.getRelayInfo(props.info.id)

  if(data) {
    relayData.value = data
  } else {
    loadRelayData()
  }
})
</script>

<template>
  <div :class="classObject">
    <template v-if="!relayData">
      <h4>{{ name }}</h4>
      <p v-if="loadStatus == 'error'">Could not load details.</p>
    </template>
    <template v-if="relayData">
      <h4>{{ relayData.name }}</h4>
      <p>{{ relayData.description }}</p>
    </template>
    <UiRelayStatus 
      v-if="showStatus"
      :info="props.info"
      @click="clickStatus"
    />
  </div>
</template>

<style scoped lang="scss">

.relay-item {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  background-color: white;
  gap: 3px;
  border-width: 0;
  appearance: none;
  padding: 15px;
  border-radius: 10px;
  box-shadow: 0 15px 30px -8px rgba(black, 0.5);
  transition: all 250ms $ease;

  .relay-status {
    margin-top: 10px;
  }

  h4 {
    font-weight: 600;
    @include r('font-size', 17, 19);
  }

  &.-theme {
    box-shadow: none;
    padding: 15px;
    border-radius: 15px;
    background-color: rgba(var(--theme-back-rgb), 0.2);
    border: 1px solid rgba(var(--theme-front-rgb), 0.2);

    h4 {
      color: var(--theme-front);
    }

    p {
      color: rgba(var(--theme-front-rgb), 0.75);
    }
  }

  @include media-query(small) {
    flex-basis: 51%;
    flex-grow: 1;
    max-width: 300px;
  }

  @include media-query(medium) {
    flex-basis: 40%;
    flex-grow: 1;
  }

  @include media-query(large) {
    flex-basis: 26%;
    flex-grow: 1;
  }
}

</style>
