<script setup>
import ToolBox from '@/helpers/toolBox'

const props = defineProps([
  'info'
])

const emit = defineEmits(['back', 'navigate'])

const filteredBoards = computed(() => {
  return props.info.filter(item => {
    let result = null

    const type = item.tags.find(tag => tag[0] == 'f')

    // Only support two types of boards for now
    const supported = ['Image', 'Link']
    if(type) {
      result = supported.indexOf(type[1]) !== -1 
    }
    return result
  })
})

const itemCount = computed(() => {
  return props.info.length
})

const title = computed(() => {
  return itemCount.value + ' board' + (itemCount.value == 1 ? '' : 's')
})

function navigate(info) {
  emit('navigate', 'pinstr-board', info)
}
</script>

<template>
  <Transition name="fade" appear>
    <div v-if="info" class="pinstr-boards-tab">
      <ProfileSectionBack @select="$emit('back')" />
      <ProfileSectionTitle :title="title" />
      <ProfilePinstrBoardList
        class="items"
        :info="filteredBoards" 
        @select="navigate"
      />
    </div>
  </Transition>
</template>

<style scoped lang="scss">

.pinstr-boards-tab {
  .items {
    margin-top: 25px;
    display: flex;
    gap: 20px;
    flex-wrap: wrap;

    > * {
      flex-grow: 1;
    }
  }

  @include media-query(small) {
    .items {
      > * {
        flex-basis: 40%;
      }
    }
  }

  @include media-query(medium) {
    .items {
      > * {
        flex-basis: 30%;
      }
    }
  }

  @include media-query(large) {
    .items {
      > * {
        flex-basis: 20%;
      }
    }
  }
}

</style>
