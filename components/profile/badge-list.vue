<script setup>
const props = defineProps([
  'info',
  'profileService'
])

const badgeCount = computed(() => {
  return props.info.length
})
</script>

<template>
  <Transition name="fade" appear>
    <div v-if="info" class="badge-list">
      <h2>Badges <span v-if="badgeCount > 0">({{ badgeCount }})</span></h2>
      <ProfileBadgeItem
        v-for="(item, index) in info"
        :key="item.id"
        :info="item"
      />
    </div>
  </Transition>
</template>

<style scoped lang="scss">

.badge-list {
  display: flex;
  flex-direction: column;
  flex-basis: 20%;
  flex-grow: 1;

  h2 {
    margin-bottom: 10px;
    font-size: 24px;
    font-weight: 600;
    color: var(--theme-front);
  }
}

</style>
