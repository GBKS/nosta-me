<script setup>
const props = defineProps([
  'info',
  'handlers'
])

const emit = defineEmits(['navigate', 'back'])

const title = computed(() => {
  const count = props.info.length
  return count + ' live activit'  + (count == 1 ? 'y' : 'ies')
})

function navigate(info) {
  emit('navigate', 'file', info)
}
</script>

<template>
  <div v-if="info" class="live-list">
    <ProfileLiveItem
      v-for="(item, index) in info"
      :key="item.id"
      :info="item"
      :handlers="handlers"
    />
  </div>
</template>

<style scoped lang="scss">

.live-list {
  margin-top: 25px;
  display: flex;
  flex-wrap: wrap;
  @include r('gap', 10, 25);

  > * {
    flex-grow: 1;
  }

  @include media-query(small) {
    > * {
      flex-basis: 35%;
    }
  }

  @include media-query(medium) {
    > * {
      flex-basis: 26%;
    }
  }

  @include media-query(large) {
    > * {
      flex-basis: 26%;
    }
  }
}

</style>
