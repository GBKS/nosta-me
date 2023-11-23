<script setup>
import Icons from '@/helpers/icons'
import ToolBox from '@/helpers/toolBox'

const props = defineProps([
  'info',
  'count',
  'handlers'
])

const emit = defineEmits(['navigate'])

const visibleItems =  computed(() => {
  return props.count > 0 ? props.info.slice(0, 3) : null
})

const titleCopy = computed(() => {
  let result = 'No live activities yet'

  if(props.count > 0) {
    result = props.count + ' live activit' + (props.count == 1 ? 'y' : 'ies')
  }

  return result
})

function navigate() {
  emit('navigate', 'live')
}
</script>

<template>
  <div v-if="count > 0" class="live-summary">
    <ProfileSectionTitle
      :title="titleCopy"
      :clickable="true"
      @select="navigate"
    />
    <ProfileLiveList
      class="items"
      :info="visibleItems"
      :handlers="handlers"
    />
  </div>
</template>

<style scoped lang="scss">

.live-summary {
  .items {
    margin-top: 25px;
    display: flex;
    @include r('gap', 10, 25);
  }
}

</style>
