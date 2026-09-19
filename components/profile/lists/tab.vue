<script setup>
import listsService from '@/helpers/listsService.js'
import listHelper from '@/helpers/listHelper.js'
import ToolBox from '@/helpers/toolBox'

const props = defineProps([
  'info',
  'handlers'
])


const emit = defineEmits(['navigate', 'back'])

// Lists with nothing public in them are left out. Some clients keep their state
// in sets like that, and a profile can have dozens of them.
const sortedLists = computed(() => {
  return props.info.filter(item => !listHelper.isEmpty(item)).sort(function(a, b) {
    // Most recently edited
    if(a.created_at > b.created_at) return -1
    if(a.created_at < b.created_at) return 1

    return 0
  })
})

const emptyListCount = computed(() => {
  return props.info.length - sortedLists.value.length
})

const emptyListText = computed(() => {
  const count = emptyListCount.value
  return count + ' empty list' + (count == 1 ? ' is' : 's are') + ' not shown.'
})

const title = computed(() => {
  const count = sortedLists.value.length
  return count + ' list' + (count == 1 ? '' : 's')
})

function navigate(info) {
  emit('navigate', 'list', info)
}

</script>

<template>
  <div v-if="info" class="lists-tab">
    <ProfileSectionBack @select="$emit('back')" />
    <ProfileSectionTitle :title="title" />

    <ProfileListsList
      :info="sortedLists"
      class="items"
      :handlers="handlers"
      layout="box"
    />
    <p v-if="emptyListCount > 0" class="empty">{{ emptyListText }}</p>
  </div>
</template>

<style scoped lang="scss">

.lists-tab {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  flex-basis: 20%;
  flex-grow: 1;

  .items {
    margin-top: 10px;
  }

  .empty {
    margin-top: 25px;
    font-size: 17px;
    font-weight: 500;
    color: rgba(var(--theme-front-rgb), 0.75);
  }
}

</style>
