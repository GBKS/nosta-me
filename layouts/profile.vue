<script setup>
  

onBeforeMount(() => {
  console.log('pp.onBeforeMount')
})
</script>

<template>
  <div class="profile-layout">
    <h1>Profile</h1>
    <slot stuff="awesome" />
  </div>
</template>

<style lang="scss">

.profile-layout {

}

</style>
