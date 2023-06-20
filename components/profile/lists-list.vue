<script setup>
import listsService from '@/helpers/listsService.js'
import ToolBox from '@/helpers/toolBox'

const props = defineProps([
  'info'
])

const emit = defineEmits(['navigate', 'back'])

const sortedLists = computed(() => {
  return props.info.sort(function(a, b) {
    const aCount = a.tags.length
    const bCount = b.tags.length

    if(aCount > bCount) return -1
    if(aCount < bCount) return 1
    return 0
  })
})

const emptyLists = computed(() => {
  const result = []

  let event, tags
  for(let i=0; i<props.info.length; i++) {
    event = props.info[i]
    tags = ToolBox.findTagsExcluding(event, ['d'])
    if(!tags || tags.length == 0) {
      result.push(event)
    }
  }

  return result
})

const title = computed(() => {
  const count = props.info.length
  return count + ' list' + (count == 1 ? '' : 's')
})

function navigate(info) {
  emit('navigate', 'list', info)
}

function deleteEmptyLists() {
  listsService.deleteEmptyLists(props.info)
}

</script>

<template>
  <div v-if="info" class="lists-list">
    <ProfileSectionBack @select="$emit('back')" />
    <ProfileSectionTitle :title="title" />

    <button
      v-if="false && emptyLists.length > 0"
      @click="deleteEmptyLists"
    >Delete empty lists</button>

    <div class="lists">
      <ProfileListsItem
        v-for="(item, index) in sortedLists"
        :key="item.id"
        :info="item"
        @select="navigate"
      />
    </div>
  </div>
</template>

<style scoped lang="scss">

.lists-list {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  flex-basis: 20%;
  flex-grow: 1;

  .lists {
    margin-top: 10px;
  }
}

</style>
