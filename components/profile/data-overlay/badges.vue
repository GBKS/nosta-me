<script setup>
const props = defineProps([
  'info'
])

const sortedInfo = computed(() => {
  return props.info.sort(function(a, b) {
    if(a.created_at > b.created_at) return -1
    if(a.created_at < b.created_at) return 1
    return 0
  })
})
</script>

<template>
  <div class="profile-data-overlay-badges">
    <h3>Badges</h3>
    <p>Badges accepted by this user, created by other users (<a href="https://github.com/nostr-protocol/nips/blob/master/58.md" target="_blank" rel="nofollow noopener noreferrer">NIP 58</a>).</p>
    <ProfileDataOverlayEventBrowser v-if="info" :events="sortedInfo" />
    <p v-if="!info">No badges found on this profile.</p>
  </div>
</template>

<style scoped lang="scss">

.profile-data-overlay-badges {
  display: flex;
  flex-direction: column;
  min-width: 0; // CSS fix for pre tag

  > p + div,
  > p + p {
    margin-top: 20px;
  }
}

</style>
