<script setup>
import relayManager from '@/helpers/relayManager.js'

const props = defineProps([
  'info',
  'count',
  'handlers'
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
</script>

<template>
  <div v-if="count > 0" class="long-notes-summary">
    <ProfileSectionTitle
      title="Latest article"
    />
    <ProfileLongNotesItem
      :key="latestNote.id"
      :info="latestNote"
      :handlers="handlers"
    />
  </div>
</template>

<style scoped lang="scss">

.long-notes-summary {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

</style>
