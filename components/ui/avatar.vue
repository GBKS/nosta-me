<script setup>

const props = defineProps([
  'image',
  'size',
  'name',
  'style'
])

const imageStatus = ref('loading')

function imageLoaded() {
  imageStatus.value = 'loaded'
}

function imageLoadError() {
  imageStatus.value = 'error'
}

const classObject = computed(() => {
  const c = [
    'avatar',
    '-' + (props.size || 'medium'),
    '-' + (props.style || 'default'),
    '-' + imageStatus.value
  ]

  return c.join(' ')
})
</script>

<template>
  <span 
    v-if="image"
    :class="classObject"
  >
    <img
      v-if="imageStatus != 'error'"
      :src="image" 
      :title="name"
      @load="imageLoaded" 
      @error="imageLoadError"
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
    opacity: 0.2;
    // transition: all 250ms $ease;
    object-fit: cover;
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
    width: 30px;
    height: 30px;

    img {
      width: 30px;
      height: 30px;
    }
  }
  
  &.-medium {
    width: 40px;
    height: 40px;

    img {
      width: 40px;
      height: 40px;
    }
  }
  
  &.-big {
    width: 60px;
    height: 60px;

    img {
      width: 60px;
      height: 60px;
    }
  }
  
  &.-huge {
    width: 75px;
    height: 75px;

    img {
      width: 75px;
      height: 75px;
    }
  }
}

</style>
