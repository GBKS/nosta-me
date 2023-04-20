<script setup>

const isFollowing = computed(() => {
  return false
})

const title = computed(() => {
  return isFollowing.value ? 'Unfollow' : 'Follow'
})

function click() {
  
}
</script>

<template>
  <UiButton
    class="follow-button"
    @click="click"
  >{{ title }}</UiButton>
</template>

<style scoped lang="scss">

.follow-button {

}

</style>
