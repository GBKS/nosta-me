<script setup>
const props = defineProps([
  'index',
  'activeIndex',
  'imageUrl',
  'alt'
])

const imageStatus = ref(null)

const classObject = computed(() => {
  const c = ['product-item-image']

  if(imageStatus.value) {
    c.push('-'+imageStatus.value)
  }

  if(props.index < props.activeIndex) c.push('-pre')
  else if(props.index > props.activeIndex) c.push('-post')
  else c.push('-active')

  return c.join(' ')
})

function imageLoaded() {
  imageStatus.value = 'loaded'
}

function imageLoadError() {
  imageStatus.value = 'error'
}
</script>

<template>
  <div :class="classObject">
    <img
      v-if="imageUrl && imageStatus != 'error'"
      :src="imageUrl"
      :alt="alt"
      @load="imageLoaded"
      @error="imageLoadError"
    />
    <div v-if="!imageUrl || imageStatus == 'error'" >
      <p>Could not load image.</p>
    </div>
  </div>
</template>

<style scoped lang="scss">

.product-item-image {
  position: absolute;
  transition: all 400ms $ease;

  img {
    width: 125px;
    height: 125px;
    object-fit: cover;
  }

  &.-error {
    div {
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

  &.-pre {
    transform: translateX(-100%);
  }

  &.-post {
    transform: translateX(100%);
  }
}

</style>
