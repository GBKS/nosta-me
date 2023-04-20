<script setup>
const props = defineProps([
  'info'
])
</script>

<template>
  <div v-if="info" class="lists-list">
    <ProfileListsItem
      v-for="(item, index) in info"
      :key="item.id"
      :info="item"
    />
  </div>
</template>

<style scoped lang="scss">

.lists-list {
  display: flex;
  flex-direction: column;
  flex-basis: 20%;
  flex-grow: 1;
}

</style>
