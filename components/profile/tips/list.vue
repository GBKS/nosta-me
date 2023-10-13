<script setup>
const props = defineProps([
  'info'
])
</script>

<template>
  <div v-if="info" class="tips-list">
    <ProfileTipsItem
      v-for="(item, index) in info"
      :key="item.kind"
      :index="index"
      :info="item"
    />
  </div>
</template>

<style scoped lang="scss">

.tips-list {
  margin-top: 25px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

</style>
