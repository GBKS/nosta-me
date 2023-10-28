<script setup>
import relayManager from '@/helpers/relayManager.js'

const props = defineProps([
  'info',
  'count'
])

const latestNote = computed(() => {
  let result = null

  if(props.count > 1) {
    const sorted = props.info.sort((a, b) => {
      if(a.created_at > b.created_at) return -1
      if(a.created_at < b.created_at) return 1
      return 0
    })

    result = sorted[0]
  } else if(props.count == 1) {
    result = props.info[0]
  }

  return result
})

const latestNotes = computed(() => {
  let result = null

  if(props.count > 0) {
    const sorted = props.info.sort((a, b) => {
      if(a.created_at > b.created_at) return -1
      if(a.created_at < b.created_at) return 1
      return 0
    })

    result = sorted.slice(0, 2)
  }

  return result
})

const titleUrl = computed(() => {
  let result = null
  
  if(latestNote.value) {
    result = 'https://primal.net/p/' + latestNote.value.pubkey
  }

  return result
})

</script>

<template>
  <Transition name="fade" appear>
    <div v-if="count > 0" class="short-notes-summary">
      <ProfileSectionTitle
        :url="titleUrl"
        title="Latest updates"
      />
      <div class="items">
        <ProfileShortNotesItem
          v-for="item in latestNotes"
          :key="item.id"
          :info="item"
        />
      </div>
    </div>
  </Transition>
</template>

<style scoped lang="scss">

.short-notes-summary {
  display: flex;
  flex-direction: column;
  gap: 20px;

  .items {
    display: flex;
    gap: 15px;

    > * {
      flex-basis: 40%;
      flex-grow: 1;
    }
  }

  @include media-query(small) {
    .items {
      flex-direction: column;
    }
  }

  @include media-query(medium-up) {
    
  }
}

</style>
