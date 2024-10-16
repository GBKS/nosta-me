<script setup>
const props = defineProps([
  'info',
  'handlers'
])

const emit = defineEmits([
  'navigate', 
  'back',
  'mintInfoLoaded'
])

const title = computed(() => {
  const count = props.info.length
  return count + ' cashu wallet'  + (count == 1 ? '' : 's')
})

function navigate(info) {
  emit('navigate', 'cashu', info)
}
</script>

<template>
  <div v-if="info" class="cashu-list">
    <ProfileCashuItem
      v-for="mint in info"
      :key="mint[1]"
      :mintUrl="mint[1]"
      @mintInfoLoaded="emit('mintInfoLoaded')"
    />
  </div>
</template>

<style scoped lang="scss">

.cashu-list {
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
