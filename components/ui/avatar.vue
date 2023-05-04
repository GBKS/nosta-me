<script setup>

const props = defineProps([
  'image',
  'size',
  'name',
  'style'
])

const imageLoaded = ref(false)

function onLoadImage() {
  imageLoaded.value = true
}

const classObject = computed(() => {
  const c = [
    'avatar',
    '-' + (props.size || 'medium'),
    '-' + (props.style || 'default'),
    imageLoaded.value ? '-loaded' : '-loading'
  ]

  if(imageLoaded.value) {
    c.push('-loaded')
  }

  return c.join(' ')
})
</script>

<template>
  <span 
    v-if="image"
    :class="classObject"
  >
    <img
      :src="image" 
      :title="name"
      @load="onLoadImage" 
    />
  </span>
</template>

<style scoped lang="scss">

.avatar {
  background-color: rgba(black, 0.15);
  border-radius: 143px;
  line-height: 0;
  display: inline-block;

  img {
    border-radius: 143px;
    opacity: 0;
    transition: all 250ms $ease;
  }

  &.-shadow {
    box-shadow: 0 8px 16px -4px rgba(black, 0.35);
  }

  &.-loaded {
    img {
      opacity: 1;
    }
  }
  
  &.-small {
    img {
      width: 30px;
      height: 30px;
    }
  }
  
  &.-medium {
    img {
      width: 40px;
      height: 40px;
    }
  }
  
  &.-big {
    img {
      width: 60px;
      height: 60px;
    }
  }
  
  &.-huge {
    img {
      width: 75px;
      height: 75px;
    }
  }
}

</style>
