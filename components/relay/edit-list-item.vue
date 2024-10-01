<script setup>
import { useRelayStore } from '@/stores/relays'
import ToolBox from '@/helpers/toolBox'
import relayManager from '~/helpers/relayManager'
import Icons from '@/helpers/icons'
import Relays from '../header/relays.vue'

const relayStore = useRelayStore()

const expanded = ref(false)
const relayInfo = ref(null)
const relayConnection = ref(null)
const relayStatus = ref(null)
const relayStats = ref(null)

const props = defineProps([
  'relayId',
  'active',
  'removeIds'
])

const emit = defineEmits([
  'remove',
  'cancelRemove'
])

// watch(() => props.active, () => {
//   console.log('active changed', props.active)
// })

const relayData = computed(() => {
  return relayStore.getRelay(props.relayId)
})

const isRemoved = computed(() => {
  return props.removeIds.includes(props.relayId)
})

const title = computed(() => {
  const result = relayInfo.value ? relayInfo.value.name : props.relayId
  return ToolBox.trim(result, 30)
})

function onRelayStatusChange(data) {
  console.log('onRelayStatusChange', data)
  if(data.relayId == props.relayId) {
    relayStatus.value = data.status

    const connector = relayManager.getConnector(props.relayId)
    relayStats.value = connector?.stats

    console.log('updating', props.relayId, relayStats.value)
  }
}

const classObject = computed(() => {
  const c = ['relay-edit-list-item']

  if(relayStatus.value) {
    c.push('-'+relayStatus.value)
  }

  if(isRemoved.value) {
    c.push('-removed')
  }

  return c.join(' ')
})

const formattedStats = computed(() => {
  let result

  if(relayStats.value) {
    switch(relayStatus.value) {
      case 'connecting':
        result = 'Connecting...'
        break
      case 'connected':
        result = 'Connected'
        break
      case 'connection-error':
        result = 'Connection error'
        break
      case 'could-not-open':
        result = 'Could not open'
        break
      case 'notice':
        result = 'Notice'
        break
      case 'disconnected':
        result = 'Disconnected'
        break
    }
  }

  return result
})

function reconnect() {
  const connection = relayManager.connectors[info.id]
  if(connection) {
    connection.connect()
  } 
}

function remove() {
  // Need to remove it from the extension, well-known, and publish an event
  emit('remove', props.relayId)
}

function cancelRemove() {
  // Need to remove it from the extension, well-known, and publish an event
  emit('cancelRemove', props.relayId)
}

onMounted(() => {
  relayInfo.value = relayStore.getRelay(props.relayId)
  relayConnection.value = relayStore.getRelayConnection(props.relayId)

  relayStatus.value = relayInfo.status

  const connector = relayManager.getConnector(props.relayId)
  relayStats.value = connector?.stats

  console.log('edit-list-item', props.relayId, relayConnection, relayInfo, connector)
  console.log('relayConnection', relayConnection)
  console.log('relayInfo', relayInfo)
  console.log('connector', connector)
  console.log('connector?.stats', connector?.stats)

  window.emitter.on('relay-connection-status-change', onRelayStatusChange)
})
</script>

<template>
  <div :class="classObject">
    <button
      class="top"
      :aria-selected="expanded"
      @click="expanded = !expanded"
    >
      <UiRelayStatus :info="relayInfo" size="compact" />
      <p class="-title">{{ title }}</p>
      <p class="-remove" v-if="isRemoved">Removing</p>
      <p class="-stats">{{ formattedStats }}</p>
      <div class="icon"
        v-html="expanded ? Icons.caretUp : Icons.caretDown"
      />
    </button>
    <div v-if="expanded" class="content">
      <div class="stats">
        <div class="group">
          <h5>General</h5>
          <p>Notes received: {{ relayStats.events }}</p>
          <p>Errors: {{ relayStats.errors }}</p>
          <p>Notices: {{ relayStats.notices }}</p>
          <p>Disconnects: {{ relayStats.disconnects }}</p>
        </div>
        <div class="group">
          <h5>Connection</h5>
          <p>Attempts: {{ relayStats.connectionAttempts }}</p>
          <p>Successes: {{ relayStats.connectionSuccesses }}</p>
          <p>Failures: {{ relayStats.connectionFailures }}</p>
        </div>
        <div class="group">
          <h5>Publishing</h5>
          <p>Attempts: {{ relayStats.publishAttempts }}</p>
          <p>Successes: {{ relayStats.publishSuccesses }}</p>
          <p>Seens: {{ relayStats.publishSeens }}</p>
          <p>Errors: {{ relayStats.publishErrors }}</p>
        </div>
      </div>
      <div class="options">
        <UiButton
          look="outline" 
          size="tiny"
          @click="reconnect"
        >Reconnect</UiButton>
        <UiButton
          v-if="!isRemoved"
          look="outline" 
          size="tiny"
          @click="remove"
        >Remove</UiButton>
        <UiButton
          v-if="isRemoved"
          look="outline" 
          size="tiny"
          @click="cancelRemove"
        >Don't remove</UiButton>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">

.relay-edit-list-item {
  background-color: #f4f4f4;
  border-radius: 5px;

  .top {
    display: flex;
    align-items: center;
    width: 100%;
    gap: 3px;
    padding: 6px 12px;
    appearance: none;
    background-color: transparent;
    cursor: pointer;
    border-width: 0;
    text-align: left;

    p {
      font-size: 17px;
      color: black;

      &.-title {
        flex-grow: 1;
      }

      &.-remove {
        margin-left: 5px;
        font-size: 12px;
        font-weight: 600;
        color: white;
        background-color: var(--red);
        border-radius: 3px;
        padding: 1px 5px 2px 5px;
      }

      &.-stats {
        opacity: 0.5;
        font-size: 14px;
      }
    }

    .icon {
      opacity: 0.35;
      line-height: 0;
      margin-left: 5px;

      :deep(svg) {
        width: 14px;
        height: 14px;
        color: black;
      }
    }

    &:hover {
      background-color: #ededed;

      .icon {
        opacity: 1;
      }
    }
  }

  .content {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 10px 20px;
    border-top: 1px solid white;

    .stats {
      display: flex;
      gap: 10px;

      .group {
        h5 {
          font-size: 15px;
          font-weight: 600;
        }

        p {
          font-size: 15px;
        }
      }
    }

    .options {
      display: flex;
      gap: 10px;
    }
  }

  @include media-query(medium-up) {
    .content {
      .stats {
        .group {
          flex-grow: 1;
        }
      }
    }
  }
}

</style>
