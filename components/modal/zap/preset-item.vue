<script setup>
import useAssets from  '@/composables/useAssets.js'

const props = defineProps([
  'info',
  'disabled'
])

const image = ref()

const classObject = computed(() => {
  const c = ['zap-preset-item']

  if(props.info.active) {
    c.push('-active')
  }

  if(props.disabled) {
    c.push('-disabled')
  }

  return c.join(' ')
})

async function updateImage() {
  image.value = await useAssets('/assets/images/zap-'+props.info.rank+'.jpg')
}

const styleObject = computed(() => {
  const result = {}

  if(image.value) {
    result.backgroundImage = "url('" + image.value + "')"
  }

  return result
})

onBeforeMount(() => {
  updateImage()
})
</script>

<template>
  <button
    :class="classObject"
    :style="styleObject"
    :title="info.name"
    :disabled="disabled"
  ></button>
</template>

<style scoped lang="scss">

.zap-preset-item {
  position: relative;
  appearance: none;
  padding: 0;
  border-width: 0;
  @include r('width', 30, 40);
  @include r('height', 30, 40);
  @include r('font-size', 14, 17);
  @include r('border-radius', 3, 5);
  font-weight: 900;
  color: white;
  text-shadow: 0 1px 2px rgba(black, 0.75);
  box-shadow: 0 8px 16px -4px rgba(black, 0.5);
  transition: all 250ms $ease;
  background-size: 50px 50px;
  background-position: center center;

  &.-disabled {
    opacity: 0.5;
  }

  &:not(.-active, .-disabled) {
    &:hover {
      cursor: pointer;
      box-shadow: 0 4px 8px -2px rgba(black, 0.5);
      transform: scale(0.95);
    }
  }

  &.-active {
    &:before {
      display: block;
      content: '';
      position: absolute;
      left: -5px;
      top: -5px;
      right: -5px;
      bottom: -5px;
      border: 2px solid rgba(var(--front-rgb), 0.2);
      @include r('border-radius', 5, 9);
    }
  }
}

</style>
