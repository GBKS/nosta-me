<script setup>
import Icons from '@/helpers/icons'
import ToolBox from '@/helpers/toolBox'
import { useRelayStore } from '@/stores/relays'
import sessionRelayService from '@/helpers/sessionRelayService.js'
import relayPublishRequest from '@/helpers/relayPublishRequest.js'

const props = defineProps([
  'events',
  'type',
  'isOwner'
])

const relayStore = useRelayStore()
const activeIndex = ref(0)

const currentEvent = computed(() => {
  return props.events[activeIndex.value]
})

const pagination = computed(() => {
  return (activeIndex.value + 1) + ' of ' + props.events.length
})

function previous() {
  activeIndex.value = activeIndex.value > 0 ? (activeIndex.value - 1) : (props.events.length - 1)
}

function next() {
  activeIndex.value = activeIndex.value < (props.events.length - 1) ? (activeIndex.value + 1) : 0
}

const formattedDate = computed(() => {
  return ToolBox.formatRelativeDate(currentEvent.value.created_at)
})

const formattedRelay = computed(() => {
  return currentEvent.value.relay
})

const relayLink = computed(() => {
  const relayId = currentEvent.value.relay
  const relay = relayStore.getRelay(relayId)
  const url = relay.url.split('wss://').join('').split('ws://').join('')
  return 'https://nostr.watch/relay/' + url
})

const meta = computed(() => {
  let result = null

  if(currentEvent.value) {
    if(props.type == 'following') {
      const tags = ToolBox.findTags(currentEvent.value, 'p')
      result = 'following ' + (tags ? tags.length : 0)
    }
  }

  return result
})

const showRepublish = computed(() => {
  return props.isOwner && props.events.length > 0
})

function republish() {
  if(confirm('Republish this event to your relays?')) {
    // Need to figure out which relays to use
    // Ideally get them from the sessionRelayService
    const relayIds = sessionRelayService.relayIds
    console.log('ProfileDataOvelayEventBrowser.relayIds', sessionRelayService.relayIds)

    const newEvent = JSON.parse(JSON.stringify(currentEvent.value))
    if(newEvent.originalContent) {
      newEvent.content = newEvent.originalContent
      delete newEvent.originalContent
    }
    if(newEvent.content && typeof newEvent.content !== 'string') {
      newEvent.content = JSON.stringify(newEvent.content)
    }
    delete newEvent.relay

    // Validate event
    const oldId = newEvent.id
    // const oldSig = newEvent.sig
    // delete newEvent.id
    // delete newEvent.sig
    const newId = window.NostrTools.getEventHash(newEvent)
    if(newId != oldId) {
      console.error('Event id mismatch', oldId, newId)
      console.error('newEvent', newEvent)
      return
    }

    let request, relayId
    for(let i=0; i<relayIds.length; i++) {
      relayId = relayIds[i]

      request = relayPublishRequest()
      request.showNotification = true

      console.log('Publishing to', relayId, newEvent)

      request.publish(
        relayId,
        newEvent,
        onRepublishEvent
      )
    }
  }
}

function onRepublishEvent(result) {
  console.log('onRepublishEvent', result)
}
</script>

<template>
  <div>
    <div class="info">
      <p>{{ formattedDate }} · <a :href="relayLink" target="_blank" rel="nofollow noopener noreferrer">{{ formattedRelay }}</a>
        <template v-if="meta"> · {{ meta }}</template>
        <template v-if="showRepublish"> · <button @click="republish">Republish</button></template>
      </p>
      <div class="pagination" v-if="events.length > 1">
        <button
          v-html="Icons.caretLeft"
          aria-label="Previous event"
          @click="previous"
        />
        <p>{{ pagination }}</p>
        <button
          v-html="Icons.caretRight"
          aria-label="Next event"
          @click="next"
        />
      </div>
    </div>
    <ProfileDataOverlayEventData :event="currentEvent" />
  </div>
</template>

<style scoped lang="scss">

div {
  .info {
    display: flex;
    gap: 5px;
    align-items: center;
    justify-content: space-between;

    p {
      a {
        color: var(--text-light);
        text-decoration: none;
        transition: all 100ms $ease;

        &:hover {
          color: var(--front);
          opacity: 1;
          text-decoration: underline;
        }
      }

      button {
        appearance: none;
        border-width: 0;
        padding: 0;
        background-color: transparent;
        opacity: 0.5;

        &:hover {
          opacity: 1;
          text-decoration: underline;
          cursor: pointer;
        }
      }
    }
  }
  .pagination {
    display: flex;
    gap: 5px;
    align-items: center;

    p {
      min-width: 50px;
      text-align: center;
      font-size: 16px;
    }

    button {
      appearance: none;
      border-width: 0;
      background-color: transparent;
      color: var(--front);
      padding: 5px;
      line-height: 0;
      cursor: pointer;
      opacity: 0.5;
      transition: all 100ms $ease;
      border-radius: 2px;

      :deep(svg) {
        color: var(--front);
        width: 12px;
        height: 12px;
      }

      &:hover {
        background-color: rgba(var(--front-rgb), 0.05);
        opacity: 1;
      }
    }
  }
}

</style>
