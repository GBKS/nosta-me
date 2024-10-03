<script setup>
import { useRelayStore } from '@/stores/relays'

const props = defineProps([
  'publicKey',
  'info',
  'isOwner'
])

const relayStore = useRelayStore()

const sortedInfo = computed(() => {
  return props.info.sort(function(a, b) {
    if(a.created_at > b.created_at) return -1
    if(a.created_at < b.created_at) return 1
    return 0
  })
})

const relay = computed(() => {
  return relayStore.getRelay(sortedInfo.value[0].relay)
})

const relayUrl = computed(() => {
  return relay.value.url
})

const nprofile = computed(() => {
  return window.NostrTools.nip19.nprofileEncode({
    pubkey: props.publicKey,
    relays: [relayUrl.value]
  })
})
</script>

<template>
  <div class="profile-data-overlay-profile">
    <h3>Profile</h3>
    <p>Name, about, profile image, and other basics (<a href="https://github.com/nostr-protocol/nips/blob/master/01.md#basic-event-kinds" target="_blank" rel="nofollow noopener noreferrer">NIP 01</a>).</p>
    <ProfileDataOverlayEventBrowser 
      v-if="info" 
      :events="sortedInfo"
      :isOwner="isOwner"
    />
    <p v-if="!info">No info found on this profile.</p>

    <template v-if="info">
      <h4>Public key & relay</h4>
      <p>Combines the public key and the relay "<NuxtLink :to="relayUrl" target="_blank" rel="nofollow noopener noreferrer">{{ relayUrl }}</NuxtLink>"<span>(<a href="https://github.com/nostr-protocol/nips/blob/e1004d3d4bca4542f1862886b20c6a1c8b4d9e0b/19.md" target="_blank" rel="nofollow noopener noreferrer">NIP 19</a>)</span>.</p>
      <pre>{{ nprofile }}</pre>
    </template>
  </div>
</template>

<style scoped lang="scss">

.profile-data-overlay-profile {
  display: flex;
  flex-direction: column;
  min-width: 0; // CSS fix for pre tag

  > p + div,
  > p + p {
    margin-top: 20px;
  }

  > pre {
    border: 1px dashed #dedede;
    background-color: #f8f8f8;
    overflow-x: auto;
    display: block;
    border-radius: 5px;
    padding: 10px;
    font-size: 13px;
    box-sizing: border-box;
    min-width: 0; // CSS fix for pre tag
  }
}

</style>
