<script setup>
import Icons from '@/helpers/icons'

const props = defineProps([
  'info',
  'count',
  'baseUrl'
])

const visibleLists =  computed(() => {
  let result

  if(props.count > 0) {
    const sortedLists = props.info.sort(function(a, b) {
      const aCount = a.tags.length
      const bCount = b.tags.length

      if(aCount > bCount) return -1
      if(aCount < bCount) return 1
      return 0
    })

    result = sortedLists.slice(0, 3)
  }

  return result
})

const detailUrl = computed(() => {
  return props.baseUrl + '/lists'
})

const titleCopy = computed(() => {
  let result = 'No lists yet'

  if(props.count > 0) {
    result = 'Created ' + props.count + ' list' + (props.count == 1 ? '' : 's')
  }

  return result
})

const emit = defineEmits(['navigate'])

function navigate() {
  emit('navigate', 'lists')
}
</script>

<template>
  <Transition name="fade" appear>
    <div v-if="count > 0" class="list-summary">
      <ProfileSectionTitle
        :title="titleCopy"
        :clickable="true"
        @select="navigate"
      />
      <div class="lists">
        <ProfileListsItem
          v-for="(item, index) in visibleLists"
          :key="item.id"
          :info="item"
          layout="box"
        />
      </div>
    </div>
  </Transition>
</template>

<style scoped lang="scss">

.list-summary {
  .lists {
    margin-top: 10px;
    display: flex;
    @include r('gap', 10, 25);

    > * {
      flex-basis: 26%;
      flex-grow: 1;
    }
  }

  @include media-query(small) {
    .lists {
      flex-direction: column;
    }
  }

  @include media-query(medium-up) {
    
  }
}

</style>
