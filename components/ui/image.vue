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

  return c.join(' ')
})

const styleObject = computed(() => {
  const s = {}

  if(props.radius) s.borderRadius = props.radius + 'px'

  return s
})

const imageStyleObject = computed(() => {
  const s = {}

  if(props.width) s.width = props.width + 'px'
  if(props.height) s.height = props.height + 'px'

  return s
})
</script>

<template>
  <div 
    v-if="src"
    :class="classObject"
    :style="styleObject"
  >
    <img
      v-if="status != 'error'"
      :src="src" 
      :alt="alt"
      :style="imageStyleObject"
      @load="imageLoaded" 
      @error="imageLoadError"
    />
      <p
        v-if="status == 'error'"
        class="error"
      >Could not load image.</p>
  </div>
</template>

<style scoped lang="scss">

.image {
  background-color: rgba(black, 0.15);
  line-height: 0;
  display: inline-block;
  overflow: hidden;

  img {
    opacity: 0;
    transition: all 250ms $ease;
    object-fit: cover;
  }

  p {

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

  &.-error {
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
