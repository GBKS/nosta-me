<script setup>
const props = defineProps([
  'info'
])

const emit = defineEmits(['navigate', 'back'])

const title = computed(() => {
  const count = props.info.length
  return count + ' pin'  + (count == 1 ? '' : 's')
})

function navigate(info) {
  emit('navigate', 'pinstr', info)
}

const pins = computed(() => {
  return props.info.tags.filter(tag => tag[0] == 'pin')
})

const type = computed(() => {
  const result = props.info.tags.find(tag => tag[0] == 'f')
  return result ? result[1] : null
})

const headers = computed(() => {
  const result = props.info.tags.find(tag => tag[0] == 'headers')
  return result ? result : null
})

onMounted(() => {
  console.log('pin-list', props.info)
})
</script>

<template>
  <div v-if="info" class="pinstr-pin-list">
    <ProfilePinstrPin
      v-for="(item, index) in pins"
      :key="item.id"
      :info="item"
      :type="type"
      :headers="headers"
    />
  </div>
</template>

<style scoped lang="scss">

.pinstr-pin-list {
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
