<script setup>
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

const title = computed(() => {
  const count = props.info.length
  return count + ' list' + (count == 1 ? '' : 's')
})

function navigate(info) {
  console.log('nav', info)
  emit('navigate', 'list', info)
}

</script>

<template>
  <div v-if="info" class="lists-list">
    <ProfileSectionBack @select="$emit('back')" />
    <ProfileSectionTitle :title="title" />
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
