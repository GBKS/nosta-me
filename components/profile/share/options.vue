<script setup>
import { nprofileEncode, npubEncode } from 'nostr-tools/nip19'

const props = defineProps([
  'info',
  'publicKey',
  'active',
  'relayData',
  'followData'
])

const canShare = ref(false)
const emit = defineEmits(['close', 'showDataOverlay'])

const npub = computed(() => {
  return  npubEncode(props.publicKey)
})

const shareUrl = computed(() => {
  return window.location.href
})

const downloadUrl = computed(() => {
  const data = {
    profile: JSON.parse(JSON.stringify(props.info.event))
  }

  let content = data.profile.content
  if(typeof content == 'string') {
    content = JSON.parse(content)
  }

  data.profile.content = content
  delete data.profile.relay

  if(props.followData) {
    data.follows = JSON.parse(JSON.stringify(props.followData))
    if(data.follows.content.length > 0) {
      data.follows.content = JSON.parse(data.follows.content)
    }
    delete data.follows.relay
  }

  if(props.relayData) {
    data.relays = JSON.parse(JSON.stringify(props.relayData))
    delete data.relays.relay
  }

  const encodedData = encodeURIComponent(JSON.stringify(data))
  return "data:text/json;charset=utf-8," + encodedData
})

// Where the user writes to, so that is where others find them (NIP-65).
// relayData is their relay list event, kind 10002.
const relayHints = computed(() => {
  const tags = props.relayData && Array.isArray(props.relayData.tags) ? props.relayData.tags : []

  return tags
    .filter(tag => tag[0] == 'r' && typeof tag[1] == 'string' && (!tag[2] || tag[2] == 'write'))
    .map(tag => tag[1])
    .slice(0, 3)
})

// A nostr: link takes a bech32 id, not the hex key (NIP-21).
const nostrUrl = computed(() => {
  if(relayHints.value.length > 0) {
    return 'nostr:' + nprofileEncode({
      pubkey: props.publicKey,
      relays: relayHints.value
    })
  }

  return 'nostr:' + npub.value
})

function close() {
  emit('close')
}

function showDataOverlay() {
  emit('showDataOverlay')
}

onMounted(() => {
  canShare.value = navigator.canShare && navigator.canShare({
    url: shareUrl.value
  })
})

const appOptions = [
  {
    id: 'primal',
    name: 'Primal',
    url: 'https://primal.net/p/{npub}',
    image: 'primal'
  },
  {
    id: 'iris',
    name: 'Iris',
    url: 'https://iris.to/{npub}',
    image: 'iris'
  },
  {
    id: 'snort',
    name: 'Snort',
    url: 'https://snort.social/p/{npub}',
    image: 'snort'
  }
]

</script>

<template>
  <Transition name="slide-up" appear>
    <div class="share-options" v-if="active">
      <div class="apps">
        <ProfileShareAppOption
          v-for="item in appOptions"
          :key="item.id"
          :name="item.name"
          :description="item.description"
          :platform="item.platform"
          :url="item.url"
          :image="item.image"
          :npub="npub"
          @click="close"
        />
      </div>
      <ProfileShareListOption
        v-if="canShare"
        name="Share"
        icon="share"
        :url="shareUrl"
        :webshare="true"
        @click="close"
      />
      <ProfileShareListOption
        name="Open in default client"
        icon="export"
        :url="nostrUrl"
      />
      <ProfileShareListOption
        name="Download"
        icon="receive"
        download="profile.json"
        :url="downloadUrl"
        @click="close"
      />
      <ProfileShareListOption
        name="View profile data"
        icon="contact"
        @click="showDataOverlay"
      />
    </div>
  </Transition>
</template>

<style scoped lang="scss">

.share-options {
  position: absolute;
  right: 0;
  top: calc(100% + 5px);
  z-index: 5;
  background-color: white;
  padding: 10px 10px 5px 10px;
  border-radius: 22px 22px 8px 8px;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  text-decoration: none;
  box-shadow: 0 15px 30px -8px rgba(black, 0.25);

  .apps {
    margin-bottom: 10px;
    display: flex;
    gap: 10px;
  }

  // Simple slide up/down
  &.slide-up-enter-active,
  &.slide-up-leave-active {
    transition: all 250ms $ease;
  }

  &.slide-up-enter-from,
  &.slide-up-leave-to {
    transform: translateY(10px);
    opacity: 0;
  }
}

</style>
