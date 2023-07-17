<script setup>
const props = defineProps([
  'images'
])

const activeIndex = ref(0)

function nextImage() {
  let nextIndex = activeIndex.value + 1
  if(nextIndex >= props.images.length) {
    nextIndex = 0
  }
  activeIndex.value = nextIndex
}

const hasImages = computed(() => {
  return props.images && props.images.length > 0
})

const dots = computed(() => {
  const result = []

  let className
  for(let i=0; i<props.images.length; i++) {
    className = 'dot'

    if(i < activeIndex.value) className += ' -pre'
    else if(i == activeIndex.value) className +=  ' -active'
    else className += ' -post'

    result.push({
      index: i,
      active: i == activeIndex.value,
      className
    })
  }

  return result
})

const classObject = computed(() => {
  const c = ['product-item-images']

  if(dots.value.length > 1) {
    c.push('-interactive')
  }

  return c.join(' ')
})
</script>

<template>
  <div 
    v-if="hasImages" 
    :class="classObject" 
    @click="nextImage"
  >
    <div class="images">
      <ProfileProductItemImage
        v-for="(imageUrl, index) in images"
        :key="index"
        :index="index"
        :activeIndex="activeIndex"
        :imageUrl="imageUrl"
      />
    </div>
    <div v-if="dots.length > 1" class="dots">
      <div
        v-for="dot in dots"
        :key="dot.index"
        :class="dot.className"
        :active="dot.active"
      />
    </div>
  </div>
</template>

<style scoped lang="scss">

.product-item-images {
  position: relative;

  .images {
    width: 125px;
    height: 125px;
    position: relative;
    overflow: hidden;
    border-radius: 15px;
    background-color: rgba(black, 0.1);
  }

  .dots {
    position: absolute;
    bottom: 10px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    gap: 5px;

    .dot {
      width: 6px;
      height: 6px;
      background-color: white;
      box-shadow: 0 1px 2px rgba(black, 0.75);
      border-radius: 3px;

      &.-pre { opacity: 0.5; }
      &.-post { opacity: 0.5; }
    }
  }

  &.-interactive {
    cursor: pointer;
  }
}

</style>
