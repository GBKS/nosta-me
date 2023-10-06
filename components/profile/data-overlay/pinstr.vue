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
  <div class="profile-data-overlay-pinstr">
    <h3>Pinstr boards</h3>
    <p>Image collections. (<a href="https://pinstr.app/" target="_blank" rel="nofollow noopener noreferrer">pinstr.app</a>, no NIP yet).</p>
    <ProfileDataOverlayEventBrowser v-if="info" :events="sortedInfo" />
    <p v-if="!info">No Pinstr boards found on this profile.</p>
  </div>
</template>

<style scoped lang="scss">

.profile-data-overlay-pinstr {
  display: flex;
  flex-direction: column;
  min-width: 0; // CSS fix for pre tag

  > p + div,
  > p + p {
    margin-top: 20px;
  }
}

</style>
