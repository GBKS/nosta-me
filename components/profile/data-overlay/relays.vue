<script setup>
const props = defineProps([
  'info'
])
</script>

<template>
  <div class="profile-data-overlay-relays">
    <h3>Relays</h3>
    <p>Data relays you are posting to (<a href="https://github.com/nostr-protocol/nips/blob/master/65.md" target="_blank" rel="nofollow noopener noreferrer">NIP 65</a>).</p>
    <ProfileDataOverlayEventBrowser v-if="info" :events="info" />
    <p v-if="!info">No relays found on this profile.</p>
  </div>
</template>

<style scoped lang="scss">

.profile-data-overlay-relays {
  display: flex;
  flex-direction: column;
  min-width: 0; // CSS fix for pre tag

  > p + div,
  > p + p {
    margin-top: 20px;
  }
}

</style>
