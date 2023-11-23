<script setup>
import Icons from '@/helpers/icons'

const props = defineProps([
  'info',
  'count'
])

const emit = defineEmits(['navigate'])

const visibleFiles =  computed(() => {
  return props.count > 0 ? props.info.slice(0, 4) : null
})

const titleCopy = computed(() => {
  let result = 'No files yet'

  if(props.count > 0) {
    result = 'Shared ' + props.count + ' file' + (props.count == 1 ? '' : 's')
  }

  return result
})

function navigate() {
  emit('navigate', 'files')
}
</script>

<template>
  <div v-if="count > 0" class="file-summary">
    <ProfileSectionTitle
      :title="titleCopy"
      :clickable="true"
      @select="navigate"
    />
    <div class="files">
      <ProfileFileItem
        v-for="(item, index) in visibleFiles"
        :key="item.id"
        :info="item"
      />
    </div>
  </div>
</template>

<style scoped lang="scss">

.file-summary {
  .files {
    margin-top: 25px;
    display: flex;
    @include r('gap', 10, 25);

    > * {
      flex-basis: 10%;
      flex-grow: 1;
    }
  }
}

</style>
