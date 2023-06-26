<script setup>
const props = defineProps([
  'info',
  'activeId'
])

const emit = defineEmits(['select'])

function select(id) {
  emit('select', id)
}
</script>

<template>
  <div class="profile-data-overlay-nav">
    <ProfileDataOverlayNavItem
      v-for="item in info"
      :key="item.id"
      :info="item"
      :activeId="activeId"
      @select="select"
    />
  </div>
</template>

<style scoped lang="scss">

.profile-data-overlay-nav {
  display: flex;
  gap: 10px;
  margin-left: -9px;
  margin-right: -9px;

  @include media-query(small) {
    flex-wrap: wrap;
  }

  @include media-query(medium-up) {
    flex-direction: column;
  }
}

</style>
