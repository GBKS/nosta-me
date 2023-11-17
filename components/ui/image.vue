<script setup>

const props = defineProps([
  'src',
  'width',
  'height',
  'alt',
  'style',
  'radius'
])

const status = ref('loading')

function imageLoaded() {
  status.value = 'loaded'
}

function imageLoadError() {
  status.value = 'error'
}

const classObject = computed(() => {
  const c = [
    'image',
    '-' + status.value
  ]

  if(props.style) {
    c.push('-' + props.style)
  }

  if(!props.src) {
    c.push('-placeholder')
  }

  return c.join(' ')
})

const styleObject = computed(() => {
  const s = {}

  if(props.radius) s.borderRadius = props.radius + 'px'
  if(!props.src && props.height) s.height = props.height + 'px'

  return s
})

const imageStyleObject = computed(() => {
  const s = {}

  if(props.width) s.width = props.width + 'px'
  if(props.height) s.height = props.height + 'px'

  return s
})

const message = computed(() => {
  let result = 'No image'

  if(status.value == 'error') {
    result = 'Could not load image'
  }

  return result
})
</script>

<template>
  <div 
    :class="classObject"
    :style="styleObject"
  >
    <img
      v-if="src && status != 'error'"
      :src="src" 
      :alt="alt"
      :style="imageStyleObject"
      @load="imageLoaded" 
      @error="imageLoadError"
    />
    <p
      v-if="!src || status == 'error'"
      class="error"
    >{{ message }}</p>
  </div>
</template>

<style scoped lang="scss">

.image {
  background-color: rgba(black, 0.15);
  line-height: 0;
  display: inline-block;
  overflow: hidden;

  img {
    width: 100%;
    height: auto;
    opacity: 0;
    transition: all 250ms $ease;
    object-fit: cover;
  }

  p {
    color: rgba(var(--theme-front-rgb), 0.5);
  }

  &.-shadow {
    box-shadow: 0 8px 16px -4px rgba(black, 0.35);
  }

  &.-loading {

  }

  &.-loaded {
    background-color: rgba(black, 0);

    img {
      opacity: 1;
    }
  }

  &.-error,
  &.-placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 125px;
    padding: 5px;
    box-sizing: border-box;
    border-radius: 15px;
    background-color: rgba(var(--theme-back-rgb), 0.2);
    border: 1px solid rgba(var(--theme-front-rgb), 0.2);
  }
}

</style>
