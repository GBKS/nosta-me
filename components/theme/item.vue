<script setup>
import useAssets from  '@/composables/useAssets.js'

const props = defineProps([
  'themeId',
  'info',
  'active'
])

const emit = defineEmits(['select'])
const image = ref()
const retinaImage = ref()

const classObject = computed(() => {
  const c = [
    'theme-item',
    '-'+props.info.brightness
  ]

  if(props.active) {
    c.push('-active')
  }

  return c.join(' ')
})

const imageSource = computed(() => {
  return image.value
})

const imageSourceSet = computed(() => {
  return image.value + ' 1x, ' + retinaImage.value + ' 2x'
})

async function updateImages() {
  image.value = await useAssets('/assets/images/themes/preview/'+props.themeId+'.jpg')
  retinaImage.value = await useAssets('/assets/images/themes/preview/'+props.themeId+'@2x.jpg')
}

const styleObject = computed(() => {
  return {
    backgroundColor: props.info.color
  } 
})

function click() {
  emit('select', props.themeId)
}

onBeforeMount(() => {
  updateImages()
})
</script>

<template>
  <button
    :class="classObject"
    :aria-pressed="active"
    :style="styleObject"
    title="Select theme"
    @click="click"
  >
    <img
      :src="imageSource"
      :srcset="imageSourceSet"
      :alt="info.name"
      width="200"
      height="129"
    />
    <p>{{ info.name }}</p>
  </button>
</template>

<style scoped lang="scss">

.theme-item {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  background-color: transparent;
  border-width: 0;
  appearance: none;
  padding: 0;
  border-radius: 10px;
  box-shadow: 0 15px 30px -8px rgba(black, 0.5);
  transition: all 250ms $ease;
  cursor: pointer;

  img {
    width: 100%;
    height: auto;
    border-top-left-radius: 10px;
    border-top-right-radius: 10px;
  }

  p {
    padding: 10px;
    font-weight: 600;
    color: white;
  }

  &.-light {
    p {
      color: black;
    }
  }

  &.-active {
    box-shadow: 0 8px 16px -4px rgba(black, 0.75);

    &:after {
      position: absolute;
      box-sizing: border-box;
      left: 0;
      top: 0;
      right: 0;
      bottom: 0;
      display: block;
      content: '';
      border: 2px solid var(--red);
      pointer-events: none;
      border-radius: 10px;
      transition: all 250ms $ease;
    }
  }
}

</style>
