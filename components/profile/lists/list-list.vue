<script setup>
import ToolBox from '@/helpers/toolBox'

const props = defineProps([
  'info'
])

const emit = defineEmits(['navigate', 'back'])
const currentPage = ref(0)
const perPage = 10

function selectPage(page) {
  currentPage.value = page
}

const pageCount = computed(() => {
  return Math.ceil(count.value / perPage)
})

const followPublicKeys = computed(() => {
  return ToolBox.findTags(props.info, ['p'])
})

const notePublicKeys = computed(() => {
  return ToolBox.findTags(props.info, ['e'])
})

const count = computed(() => {
  const tags = ToolBox.findTags(props.info, ['e', 'p'])
  return tags ? tags.length : 0
})

const visibleTags = computed(() => {
  return props.info.tags.slice(
    currentPage.value*perPage, 
    (currentPage.value+1)*perPage
  )
})

const listName = computed(() => {
  let result = 'List'

  const tag = ToolBox.findTag(props.info, 'd')
  if(tag) {
    result = tag[0].charAt(0).toUpperCase() + tag[0].substr(1)
  }

  return result
})

const typeName = computed(() => {
  let result = 'note'

  switch(props.info.kind) {
    case 10000:
    case 30000:
      result = 'profile'
      break
  }

  return result
})

const title = computed(() => {
  return listName.value + ' (' + count.value + ' ' + typeName.value + (count.value == 1 ? '' : 's') + ')'
})

function back() {
  emit('navigate', 'lists')
}

function navigate(info) {
  emit('navigate', 'list', info)
}

onMounted(() => {
  console.log('ListList.onMounted', props.info)
})
</script>

<template>
  <div v-if="info" class="list-list">
    <ProfileSectionBack @select="back" />
    <ProfileSectionTitle :title="title" />
    <div class="items">
      <template v-for="tag in visibleTags">
        <ProfileFollowItem
          v-if="tag[0] == 'p'"
          :key="tag[1]"
          :publicKey="tag[1]"
          :selfLoad="true"
          :relayId="info.relay"
        />
        <ProfileListsListNote
          v-if="tag[0] == 'e'"
          :key="tag[1]"
          :publicKey="tag[1]"
          :relayId="info.relay"
        />
      </template>
    </div>
    <UiPagination
      v-if="pageCount > 1"
      :activeIndex="currentPage"
      :max="pageCount"
      @selectPage="selectPage"
    />
  </div>
</template>

<style scoped lang="scss">

.list-list {
  .items {
    margin-top: 10px;
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 20px;
  }
}

</style>
