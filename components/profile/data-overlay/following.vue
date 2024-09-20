<script setup>
import ToolBox from '@/helpers/toolBox'

const props = defineProps([
  'info',
  'isOwner'
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
  <div class="profile-data-overlay-following">
    <h3>Following</h3>
    <p>Profiles followed (<a href="https://github.com/nostr-protocol/nips/blob/master/02.md" target="_blank" rel="nofollow noopener noreferrer">NIP 02</a>).</p>
    <ProfileDataOverlayEventBrowser
      v-if="info" 
      :events="sortedInfo"
      type="following"
      :isOwner="isOwner"
    />
    <p v-if="!info">No follow list found on this profile.</p>
  </div>
</template>

<style scoped lang="scss">

.profile-data-overlay-following {
  display: flex;
  flex-direction: column;
  min-width: 0; // CSS fix for pre tag

  > p + div,
  > p + p {
    margin-top: 20px;
  }
}

</style>
