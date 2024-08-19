<script setup>
const knownTypes = [
  'nudity',
  'profanity',
  'illegal',
  'spam',
  'impersonation'
]

const props = defineProps([
  'type'
])

const image = computed(() => {
  let type = props.type
  if(type && knownTypes.indexOf(type) === -1) {
    type = 'unknown'
  }

  const image =  '/images/report-'+type+'.jpg'
  return image
})
</script>

<template>
  <div class="report-icon">
    <img
      :src="image"
      alt=""
    >
  </div>
</template>

<style scoped lang="scss">

.report-icon {
  flex-basis: 50px;
  flex-shrink: 0;
  width: 50px;
  height: 50px;
  border-radius: 100px;
  overflow: hidden;
  box-shadow: 
    0px 32px 32px rgba(0, 0, 0, 0.15), 
    0px 16px 16px rgba(0, 0, 0, 0.15), 
    0px 8px 8px rgba(0, 0, 0, 0.15), 
    0px 4px 4px rgba(0, 0, 0, 0.15), 
    0px 2px 2px rgba(0, 0, 0, 0.15);

  img {
    width: 50px;
    height: 50px;
  }
}

</style>
