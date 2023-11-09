<script setup>
import ToolBox from '@/helpers/toolBox'

const props = defineProps([
  'info',
  'handlers'
])

const emit = defineEmits(['navigate', 'back'])

const sortedInfo = computed(() => {
  const now = new Date()

  return props.info.sort(function(a, b) {
    const aStartTag = ToolBox.findTag(a, 'start')
    const bStartTag = ToolBox.findTag(b, 'start')
    const aEndTag = ToolBox.findTag(a, 'end')
    const bEndTag = ToolBox.findTag(b, 'end')

    const aStartDate = aStartTag ? new Date(parseInt(aStartTag[0])*1000) : null
    const bStartDate = bStartTag ? new Date(parseInt(bStartTag[0])*1000) : null 
    const aEndDate = aEndTag ? new Date(parseInt(aEndTag[0])*1000) : null
    const bEndDate = bEndTag ? new Date(parseInt(bEndTag[0])*1000) : null

    const aIsLive = now > aStartDate && now < aEndDate
    const bIsLive = now > bStartDate && now < bEndDate

    const aIsFuture = now < aStartDate
    const bIsFuture = now < bStartDate

    // Show live events first
    if(aIsLive && !bIsLive) return -1
    if(bIsLive && !aIsLive) return 1

    // Then future events
    if(aIsFuture && !bIsFuture) return -1
    if(bIsFuture && !aIsFuture) return 1

    // Show future events that happen sooner befores one that happen later
    if(aIsFuture && bIsFuture) {
      if(aStartDate < bStartDate) return -1
      if(aStartDate > bStartDate) return 1
    }

    // Default to showing newer events before older events
    if(aStartDate > bStartDate) return -1
    if(aStartDate < bStartDate) return 1
    return 0
  })
})

const title = computed(() => {
  const count = props.info.length
  return count + ' event'  + (count == 1 ? '' : 's')
})

function navigate(info) {
  emit('navigate', 'events', info)
}
</script>

<template>
  <div v-if="info" class="calendar-list">
    <ProfileCalendarItem
      v-for="(item, index) in info"
      :key="item.id"
      :info="item"
      :handlers="handlers"
    />
  </div>
</template>

<style scoped lang="scss">

.calendar-list {
  margin-top: 25px;
  display: flex;
  flex-wrap: wrap;
  @include r('gap', 10, 25);

  > * {
    flex-grow: 1;
  }

  @include media-query(small) {
    flex-direction: column;
  }

  @include media-query(medium-up) {
    > * {
      flex-basis: 35%;
    }
  }
}

</style>
