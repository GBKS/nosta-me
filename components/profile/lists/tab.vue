<script setup>
import listsService from '@/helpers/listsService.js'
import ToolBox from '@/helpers/toolBox'

const props = defineProps([
  'info',
  'handlers'
])

const contentTags = ['p', 't', 'word', 'e', 'a', 'r', 'relay', 'emoji']

const emit = defineEmits(['navigate', 'back'])

const sortedLists = computed(() => {
  return props.info.sort(function(a, b) {
    const aTags = a.tags.filter(tag => contentTags.indexOf(tag[0]) !== -1)
    const bTags = b.tags.filter(tag => contentTags.indexOf(tag[0]) !== -1)

    // Filled before empty lists
    if(aTags.length != 0 && bTags.length == 0) return -1
    if(aTags.length == 0 && bTags.length != 0) return 1

    // Most recently edited
    if(a.created_at > b.created_at) return -1
    if(a.created_at < b.created_at) return 1

    return 0
  })
})

const title = computed(() => {
  const count = props.info.length
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
}

</style>
