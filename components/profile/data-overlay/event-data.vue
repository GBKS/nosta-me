<script setup>
const props = defineProps([
  'event'
])

const formattedData = computed(() => {
  const data = JSON.parse(JSON.stringify(props.event))

  if(data.content && data.content.length > 0) {
    try {
      data.content = JSON.parse(data.content)
    } catch(error) {
      console.log('DataOverlay.formattedFollowData', 'There was an error formatting the data')
    }
  }

  delete data.relay
  return JSON.stringify(data, undefined, 2)
})
</script>

<template>
  <pre>{{ formattedData }}</pre>
</template>

<style scoped lang="scss">

pre {
  border: 1px dashed #dedede;
  background-color: #f8f8f8;
  overflow-x: auto;
  display: block;
  border-radius: 5px;
  padding: 10px;
  font-size: 13px;
  box-sizing: border-box;
  min-width: 0; // CSS fix for pre tag
}

</style>
