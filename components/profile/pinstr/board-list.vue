<script setup>
const props = defineProps([
  'info'
])

const emit = defineEmits(['select'])

const title = computed(() => {
  const count = props.info.length
  return count + ' board'  + (count == 1 ? '' : 's')
})

function navigate(info) {
  emit('select', info)
}
</script>

<template>
  <div v-if="info" class="pinstr-board-list">
    <ProfilePinstrBoard
      v-for="(item, index) in info"
      :key="item.id"
      :info="item"
      @navigate="navigate"
    />
  </div>
</template>

<style scoped lang="scss">

.pinstr-board-list {
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
      max-width: 50%;
    }
  }
}

</style>
