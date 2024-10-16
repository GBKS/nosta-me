<script setup>
const props = defineProps([
  'info',
  'count',
  'handlers'
])

const emit = defineEmits(['navigate'])
const mintInfoLoadedCount = ref(0)

const visibleItems =  computed(() => {
  return mintUrls.value.length > 0 ? mintUrls.value.slice(0, 3) : null
})

const mintUrls = computed(() => {
  const result = props.info?.flatMap(obj => 
    obj.tags.filter(tag => tag[0] === 'mint')
  )
  return result
})

const titleCopy = computed(() => {
  let result = 'No cashu mints yet'

  if(mintUrls.value.length > 0) {
    result = mintUrls.value.length + ' cashu mint' + (mintUrls.value.length == 1 ? '' : 's')
  }

  return result
})

function navigate() {
  emit('navigate', 'cashu')
}
</script>

<template>
  <div v-if="count > 0" class="cashu-summary">
    <ProfileSectionTitle
      v-if="mintInfoLoadedCount > 0"
      :title="titleCopy"
    />
    <ProfileCashuList
      class="items"
      :info="visibleItems"
      :handlers="handlers"
      @mintInfoLoaded="mintInfoLoadedCount++"
    />
  </div>
</template>

<style scoped lang="scss">

.cashu-summary {
  .items {
    margin-top: 25px;
    display: flex;
    @include r('gap', 10, 25);
  }
}

</style>
