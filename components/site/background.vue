<script setup>
import useAssets from  '@/composables/useAssets.js'

const props = defineProps([
  'themeId',
  'theme'
])

const imageLoaded = ref(false)

watch(() => props.themeId, () => {
  imageLoaded.value = false
})

const classObject = computed(() => {
  return [
    'site-background',
    imageLoaded.value ? '-loaded' : null
  ].join(' ')
})

function onImageLoaded() {
  imageLoaded.value = true
}

const imageSource = computed(() => {
  const image =  '/images/themes/'+props.themeId+'.jpg'
  return image
})

const imageSourceSet = computed(() => {
  const image =  '/images/themes/'+props.themeId+'.jpg'
  const retinaImage =  '/images/themes/'+props.themeId+'@2x.jpg'
  return image + ' 1x, ' + retinaImage + ' 2x'
})

</script>

<template>
  <Transition name="fade" mode="out-in" appear>
    <img
      :key="themeId"
      :class="classObject"
      :src="imageSource"
      :srcset="imageSourceSet"
      :alt="theme.name"
      @load="onImageLoaded"
    />
  </Transition>
</template>

<style scoped lang="scss">

.site-background {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  object-fit: cover;
  opacity: 0;
  transition: opacity 400ms $ease;

  &.-loaded {
    opacity: 1;
  }
}

</style>
