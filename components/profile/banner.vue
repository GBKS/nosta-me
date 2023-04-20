<script setup>
const props = defineProps([
  'info'
])

const styleObject = computed(() => {
  return {
    backgroundImage: "url('"+props.info.profile.banner+"')"
  }
})
</script>

<template>
  <div
    v-if="info.profile.banner" 
    class="profile-banner" 
    :style="styleObject"
  />
</template>

<style scoped lang="scss">

.profile-banner {
  padding-bottom: 25%;
  background-size: cover;
  background-position: center center;
  border-top-left-radius: 25px;
  border-top-right-radius: 25px;
  background-color: rgba(black, 0.2);

  @include media-query(small) {
    padding-bottom: 40%;
  }
}

</style>
