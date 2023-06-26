<script setup>
const props = defineProps([
  'sentInfo',
  'receivedInfo'
])

const combinedEvents = computed(() => {
  if(!props.sentInfo && props.receivedInfo) return props.receivedInfo
  if(props.sentInfo && !props.receivedInfo) return props.sentInfo
  if(props.sentInfo && props.receivedInfo) return props.sentInfo.concat(props.receivedInfo)
  return null
})

const sortedEvents = computed(() => {
  return combinedEvents.value.sort(function(a, b) {
    if(a.created_at > b.created_at) return -1
    if(a.created_at < b.created_at) return 1
    return 0
  })
})
</script>

<template>
  <div class="profile-data-overlay-zaps">
    <h3>Zaps</h3>
    <p>Sent and received bitcoin payments (<a href="https://github.com/nostr-protocol/nips/blob/master/57.md" target="_blank" rel="nofollow noopener noreferrer">NIP 57</a>).</p>
    <ProfileDataOverlayEventBrowser v-if="combinedEvents" :events="sortedEvents" />
    <p v-if="!combinedEvents">No zaps found on this profile.</p>
  </div>
</template>

<style scoped lang="scss">

.profile-data-overlay-zaps {
  display: flex;
  flex-direction: column;
  min-width: 0; // CSS fix for pre tag

  > p + div,
  > p + p {
    margin-top: 20px;
  }
}

</style>
