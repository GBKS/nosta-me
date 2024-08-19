<script setup>
const props = defineProps([
  'index',
  'activeIndex',
  'theme'
])

const emit = defineEmits(['select'])

const classObject = computed(() => {
  const c = [
    'pagination-page',
    '-'+props.theme
  ]

  if(active.value) {
    c.push('-active')
  }

  return c.join(' ')
})

const active = computed(() => {
  return props.index == props.activeIndex
})

function click() {
  emit('select', props.index)
}
</script>

<template>
  <button
    :class="classObject"
    :aria-pressed="active"
    @click="click"
  >{{ index + 1 }}</button>
</template>

<style scoped lang="scss">

.pagination-page {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  background-color: transparent;
  border-width: 0;
  appearance: none;
  padding: 0;
  border-radius: 15px;
  transition: all 250ms $ease;
  cursor: pointer;
  padding: 5px 15px;
  font-weight: 600;
  font-size: 15px;
  color: rgba(var(--theme-front-rgb), 0.85);
  background-color: rgba(var(--theme-front-rgb), 0.05);

  &:hover {
    color: var(--theme-active);
    background-color: rgba(var(--theme-active-rgb), 0.1);
  }

  &.-active {
    color: var(--theme-back);
    background-color: var(--theme-active);
  }
}

</style>
