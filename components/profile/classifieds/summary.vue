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
  let result = 'No classifieds yet'

  if(props.count > 0) {
    result = props.count + ' classified' + (props.count == 1 ? '' : 's')
  }

  return result
})

function navigate() {
  emit('navigate', 'classifieds')
}
</script>

<template>
  <Transition name="fade" appear>
    <div v-if="count > 0" class="classifieds-summary">
      <ProfileSectionTitle
        :title="titleCopy"
        :clickable="true"
        @select="navigate"
      />
      <ProfileClassifiedsList
        class="items"
        :info="visibleItems"
        :handlers="handlers"
      />
    </div>
  </Transition>
</template>

<style scoped lang="scss">

.classifieds-summary {
  .items {
    margin-top: 25px;
    display: flex;
    @include r('gap', 10, 25);
  }
}

</style>
