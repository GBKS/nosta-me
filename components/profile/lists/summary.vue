<script setup>
import Icons from '@/helpers/icons'
import listHelper from '@/helpers/listHelper.js'

const props = defineProps([
  'info',
  'count',
  'handlers'
])

const emit = defineEmits(['navigate'])


// At least one valid content tag
const filledLists = computed(() => {
  let result = null

  if(props.info) {
    return props.info.filter(item => !listHelper.isEmpty(item))
  }

  return result
})

// Filled, recently changed
const visibleLists =  computed(() => {
  let result

  if(filledLists.value && filledLists.value.length > 0) {
    const sortedLists = filledLists.value.sort(function(a, b) {
      if(a.created_at > b.created_at) return -1
      if(a.created_at < b.created_at) return 1
    })

    result = sortedLists.slice(0, 3)
  }

  return result
})

const filledListCount = computed(() => {
  return filledLists.value ? filledLists.value.length : 0
})

const emptyListCount = computed(() => {
  return props.info.length - filledListCount.value
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

function navigate() {
  emit('navigate', 'lists')
}
</script>

<template>
  <div v-if="filledLists && filledLists.length > 0" class="lists-summary">
    <ProfileSectionTitle
      :title="titleCopy"
      :clickable="true"
      @select="navigate"
    />
    <p v-if="emptyListCount > 0">{{ emptyListText }}</p>
    <ProfileListsList
      class="items"
      :info="visibleLists"
      :handlers="handlers"
      layout="box"
    />
  </div>
</template>

<style scoped lang="scss">

.lists-summary {
  > p {
    margin-top: 2px;
    font-size: 17px;
    font-weight: 500;
    color: rgba(var(--theme-front-rgb), 0.75);
  }

  .items {
    margin-top: 10px;
  }
}

</style>
