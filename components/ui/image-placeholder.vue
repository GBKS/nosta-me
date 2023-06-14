<script setup>

const props = defineProps([
  'text',
  'style',
  'width',
  'height',
  'radius'
])

const classObject = computed(() => {
  const c = ['image-placeholder']

  if(props.style) {
    c.push('-' + props.style)
  }

  return c.join(' ')
})

const styleObject = computed(() => {
  const s = {}

  if(props.width) s.width = props.width + 'px'
  if(props.height) s.height = props.height + 'px'
  if(props.radius) s.borderRadius = props.radius + 'px'

  return s
})
</script>

<template>
  <div :class="classObject" :style="styleObject">
    <p>{{ text }}</p>
  </div>
</template>

<style scoped lang="scss">

.image-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 125px;
  padding: 5px;
  box-sizing: border-box;
  border-radius: 15px;

  p {
    font-size: 13px;
    color: rgba(var(--theme-front-rgb), 0.2);
  }
  
  &.-light {
    background-color: rgba(black, 0.05);
    border: 1px solid rgba(black, 0.05);

    p {
      color: rgba(black, 0.2);
    }
  }

  &.-theme {
    background-color: rgba(var(--theme-back-rgb), 0.2);
    border: 1px solid rgba(var(--theme-front-rgb), 0.2);

    p {
      color: rgba(var(--theme-front-rgb), 0.2);
    }
  }
}

</style>
