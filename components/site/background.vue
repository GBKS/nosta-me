<script setup>
import useAssets from  '@/composables/useAssets.js'

const props = defineProps([
  'themeId',
  'theme'
])

const imageLoaded = ref(false)
const image = ref()
const retinaImage = ref()
const isVisible = ref(true)

watch(() => props.themeId, () => {
  imageLoaded.value = false
  updateImages()
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
  return image.value
})

const imageSourceSet = computed(() => {
  return image.value + ' 1x, ' + retinaImage.value + ' 2x'
})

async function updateImages() {
  image.value = await useAssets('/assets/images/themes/'+props.themeId+'.jpg')
  retinaImage.value = await useAssets('/assets/images/themes/'+props.themeId+'@2x.jpg')
}

onBeforeMount(() => {
  updateImages()
})
</script>

<template>
  <Transition name="fade" mode="out-in" appear>
    <img
      v-if="isVisible && image && retinaImage"
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
