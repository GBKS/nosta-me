<script setup>
import Icons from '@/helpers/icons'

const props = defineProps([
  'info',
  'count',
  'baseUrl'
])

const filledLists = computed(() => {
  let result

  if(props.info){
    let i=0, list
    for(; i<props.info.length; i++) {
      list = props.info[i]
      if(list.tags.length > 1) {
        if(!result) result = []
        result.push(list)
      }
    }
  }

  return result
})

const emptyLists = computed(() => {
  let result

  if(props.info){
    let i=0, list
    for(; i<props.info.length; i++) {
      list = props.info[i]
      if(list.tags.length >= 1) {
        if(!result) result = []
        result.push(list)
      }
    }
  }

  return result
})

const visibleLists =  computed(() => {
  let result

  if(filledLists.value && filledLists.value.length > 0) {
    const sortedLists = filledLists.value.sort(function(a, b) {
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

const filledListCount = computed(() => {
  return filledLists.value ? filledLists.value.length : 0
})

const emptyListCount = computed(() => {
  return emptyLists.value ? emptyLists.value.length : 0
})

const emptyListText = computed(() => {
  let result = null

  if(emptyListCount.value > 0) {
    if(filledListCount.value == 0) {
      result = 'Has ' + emptyListCount.value + ' empty list' + (emptyListCount.value == 1 ? '' : 's') + '.'
    } else {
      result = 'And has ' + emptyListCount.value + ' empty list' + (emptyListCount.value == 1 ? '' : 's') + '.'
    }
  }

  return result
})

const titleCopy = computed(() => {
  let result = 'Not using lists'

  if(filledLists.value) {
    result = 'Created ' + filledListCount.value + ' list' + (filledListCount.value == 1 ? '' : 's')
  }

  return result
})

const emit = defineEmits(['navigate'])

function navigate() {
  emit('navigate', 'lists')
}

function selectList(info) {
  emit('navigate', 'list', info)
}
</script>

<template>
  <Transition name="fade" appear>
    <div v-if="count > 0" class="lists-summary">
      <ProfileSectionTitle
        :title="titleCopy"
        :clickable="true"
        @select="navigate"
      />
      <p v-if="emptyListCount > 0">{{ emptyListText }}</p>
      <div class="lists">
        <ProfileListsItem
          v-for="(item, index) in visibleLists"
          :key="item.id"
          :info="item"
          layout="box"
          @select="selectList"
        />
      </div>
    </div>
  </Transition>
</template>

<style scoped lang="scss">

.lists-summary {
  > p {
    margin-top: 2px;
    font-size: 17px;
    font-weight: 500;
    color: rgba(var(--theme-front-rgb), 0.75);
  }

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
