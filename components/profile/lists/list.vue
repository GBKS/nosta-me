<script setup>
const props = defineProps([
  'info',
  'handlers',
  'layout'
])
</script>

<template>
  <div v-if="info" class="lists-list">
    <ProfileListsItem
      v-for="(item, index) in info"
      :key="item.id"
      :info="item"
      :handlers="handlers"
      :layout="layout"
    />
  </div>
</template>

<style scoped lang="scss">

.lists-list {
  margin-top: 25px;
  display: flex;
  @include r('gap', 10, 25);

  @include media-query(small) {
    flex-direction: column;
  }

  @include media-query(medium-up) {
    flex-wrap: wrap;

    > * {
      flex-basis: 26%;
      flex-grow: 1;
    }
  }
}

</style>

