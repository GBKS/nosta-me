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
  return props.count > 0 ? props.info.slice(0, 2) : null
})

const titleCopy = computed(() => {
  let result = 'No events yet'

  if(props.count > 0) {
    result = props.count + ' event' + (props.count == 1 ? '' : 's')
  }

  return result
})

function navigate() {
  emit('navigate', 'events')
}
</script>

<template>
  <div v-if="count > 0" class="event-summary">
    <ProfileSectionTitle
      :title="titleCopy"
      :clickable="true"
      @select="navigate"
    />
    <ProfileEventList
      class="items"
      :info="visibleItems"
      :handlers="handlers"
    />
  </div>
</template>

<style scoped lang="scss">

.event-summary {
  .items {
    margin-top: 15px;
    // display: flex;
    // @include r('gap', 10, 25);
  }
}

</style>
