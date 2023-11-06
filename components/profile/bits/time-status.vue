/*
Small tag-like text box for indicating upcoming, live, past status
for live and calendar events.
 */
<script setup>
const props = defineProps([
  'start',
  'end'
])

const label = computed(() => {
  let result = null

  const now = new Date()
  const startDate = new Date(parseInt(props.start)*1000)
  const endDate = new Date(parseInt(props.end)*1000)
  
  if(now > endDate) {
    result = 'Past'
  } else if(now < startDate) {
    result = 'Upcoming'
  } else {
    result = 'Live'
  }

  return result
})

const classObject = computed(() => {
  return [
    'time-status',
  ].join(' ')
})
</script>

<template>
  <p :class="classObject">{{ label }}</p>
</template>

<style scoped lang="scss">

.time-status {
  background-color: var(--back);
  color: var(--front);
  font-size: 11px;
  font-weight: 600;
  border-radius: 2px;
  padding: 1px 4px;
  text-transform: uppercase;
}

</style>
