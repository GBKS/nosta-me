<script setup>
import Icons from '@/helpers/icons'
import ToolBox from '@/helpers/toolBox'

const props = defineProps([
  'info',
  'count'
])

const emit = defineEmits(['navigate'])

const visibleItems =  computed(() => {
  return props.count > 0 ? props.info.slice(0, 3) : null
})

const titleCopy = computed(() => {
  let result = 'No pins yet'

  if(props.count > 0) {
    result = props.count + ' board' + (props.count == 1 ? '' : 's')
  }

  return result
})

function navigate() {
  emit('navigate', 'pinstr')
}
</script>

<template>
  <div v-if="count > 0" class="pinstr-summary">
    <ProfileSectionTitle
      :title="titleCopy"
      :clickable="true"
      @select="navigate"
    />
    <ProfilePinstrList
      class="items"
      :info="visibleItems"
    />
  </div>
</template>

<style scoped lang="scss">

.pinstr-summary {
  .items {
    margin-top: 25px;
    display: flex;
    @include r('gap', 10, 25);
  }
}

</style>
