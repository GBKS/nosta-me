<script setup>
import Icons from '@/helpers/icons'
import { useRelayStore } from '@/stores/relays'

const props = defineProps([
  'info',
  'infoEvents',
  'publicKey',
  'relayData',
  'followData',
  'stats'
])

const relayStore = useRelayStore()
const emit = defineEmits(['close'])

const hasInfo = computed(() => {
  return props.info && props.info.event
})

const hasRelayData = computed(() => {
  return props.relayData !== null
})

const hasFollowData = computed(() => {
  return props.followData !== null
})

const infoRelayUrl = computed(() => {
  return relayStore.getRelay(props.info.event.relay).url
})

const infoRelayLink = computed(() => {
  const url = infoRelayUrl.value.split('wss://').join('').split('ws://').join('')
  return 'https://nostr.watch/relay/' + url
})

const relayRelayUrl = computed(() => {
  return relayStore.getRelay(props.relayData.relay).url
})

const relayRelayLink = computed(() => {
  const url = relayRelayUrl.value.split('wss://').join('').split('ws://').join('')
  return 'https://nostr.watch/relay/' + url
})

const followRelayUrl = computed(() => {
  return relayStore.getRelay(props.followData.relay).url
})

const followRelayLink = computed(() => {
  const url = followRelayUrl.value.split('wss://').join('').split('ws://').join('')
  return 'https://nostr.watch/relay/' + url
})

const formattedInfo = computed(() => {
  const data = JSON.parse(JSON.stringify(props.info.event))

  if(typeof data.content == 'string') {
    data.content = JSON.parse(data.content)
  }
  
  delete data.relay
  return JSON.stringify(data, undefined, 2)
})

const nprofile = computed(() => {
  console.log('nprofile', props.info)
  const relay = relayStore.getRelay(props.info.event.relay)
  console.log('relay', relay)
  return window.NostrTools.nip19.nprofileEncode({
    pubkey: props.publicKey,
    relays: [relay.url]
  })
})

const formattedRelayData = computed(() => {
  return JSON.stringify(props.relayData, undefined, 2)
})

const formattedFollowData = computed(() => {
  const data = JSON.parse(JSON.stringify(props.followData))

  if(data.content.length > 0) {
    try {
      data.content = JSON.parse(data.content)
    } catch(error) {
      console.log('DataOverlay.formattedFollowData', 'There was an error formatting the data')
    }
  }

  delete data.relay
  return JSON.stringify(data, undefined, 2)
})

const formattedStats = computed(() => {
  let result = null

  if(props.stats && props.stats.count > 0) {
    const relayCount = Object.keys(props.stats.relays).length
    result = 'Found ' + props.stats.count + ' note' + (props.stats.count == 1 ? '' : 's') + ' across ' + relayCount + ' relay' + (relayCount == 1 ? '' : 's') + '.'
    // return JSON.stringify(props.stats, undefined, 2)
  }

  return result
})

function close() {
  emit('close')
}
</script>

<template>
  <div class="profile-data-overlay">
    <div class="wrap">
      <div class="content">
        <UiButton
          icon="cross"
          size="tiny"
          title="Close overlay"
          @click="close"
        />

        <h1>Profile data</h1>
        <p v-if="formattedStats">{{ formattedStats }}</p>

        <h6>Public key</h6>
        <pre>{{ publicKey }}</pre>

        <h6>Profile info <span>(<a href="https://github.com/nostr-protocol/nips/blob/master/01.md#basic-event-kinds" target="_blank" rel="nofollow noopener noreferrer">NIP 01</a>)</span></h6>
        <template v-if="hasInfo">
          <p>Found on the relay "<NuxtLink :to="infoRelayLink" target="_blank" rel="nofollow noopener noreferrer">{{ infoRelayUrl }}</NuxtLink>".</p>
          <pre>{{ formattedInfo }}</pre>
        </template>
        <p v-if="!hasInfo">No profile information found.</p>

        <h6>Following <span>(<a href="https://github.com/nostr-protocol/nips/blob/master/02.md" target="_blank" rel="nofollow noopener noreferrer">NIP 02</a>)</span></h6>
        <template v-if="hasFollowData">
          <p>Found on the relay "<NuxtLink :to="followRelayLink" target="_blank" rel="nofollow noopener noreferrer">{{ followRelayUrl }}</NuxtLink>".</p>
          <pre>{{ formattedFollowData }}</pre>
        </template>
        <p v-if="!hasFollowData">No follow data found.</p>

        <h6>Relays <span>(<a href="https://github.com/nostr-protocol/nips/blob/master/65.md" target="_blank" rel="nofollow noopener noreferrer">NIP 65</a>)</span></h6>
        <template v-if="hasRelayData">
          <p>Found on the relay "<NuxtLink :to="relayRelayLink" target="_blank" rel="nofollow noopener noreferrer">{{ relayRelayUrl }}</NuxtLink>".</p>
          <pre>{{ formattedRelayData }}</pre>
        </template>
        <p v-if="!hasRelayData">No relay data found.</p>

        <template v-if="hasInfo">
          <h6>Public key & relay <span>(<a href="https://github.com/nostr-protocol/nips/blob/e1004d3d4bca4542f1862886b20c6a1c8b4d9e0b/19.md" target="_blank" rel="nofollow noopener noreferrer">NIP 19</a>)</span></h6>
          <p>Found on the relay "<NuxtLink :to="infoRelayLink" target="_blank" rel="nofollow noopener noreferrer">{{ infoRelayUrl }}</NuxtLink>".</p>
          <pre>{{ nprofile }}</pre>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">

.profile-data-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(black, 0.2);
  z-index: 144;

  .wrap {
    padding: 20px;
    width: 100%;
    height: 100%;
    overflow-y: scroll;
    box-sizing: border-box;

    .content {
      max-width: 800px;
      margin-left: auto;
      margin-right: auto;
      background-color: white;
      border-radius: 15px;
      padding: 20px;
      position: relative;

      :deep(button) {
        position: absolute;
        top: 15px;
        right: 15px;
        padding: 5px 13px;
        border-radius: 100px;

        p {
          padding: 0;
        }
      }

      h6 {
        font-weight: 600;

        span {
          font-weight: 400;
          color: #808080;

          a {
            color: #808080;
            text-decoration: none;

            &:hover {
              color: var(--red);
              text-decoration: underline;
            }
          }
        }

        & + p {
          margin-top: 5px;
        }
      }

      > p {
        & + h6 {
          margin-top: 20px;
        }

        a {
          color: black;
          text-decoration: none;

          &:hover {
            text-decoration: underline;
          }
        }
      }

      code {
        word-break: break-all;
      }

      pre {
        border: 1px dashed #dedede;
        background-color: #f8f8f8;
        overflow-x: auto;
        // white-space: pre-wrap;
        border-radius: 5px;
        padding: 10px;

        & + h6 {
          margin-top: 20px;
        }
      }
    }
  }
}

</style>
