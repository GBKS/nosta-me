<script setup>
import useAssets from  '@/composables/useAssets.js'

const props = defineProps([
  'tabId',
  'info',
  'activeId',
  'theme'
])

const emit = defineEmits(['select'])

const classObject = computed(() => {
  const c = [
    'tab',
    '-'+props.theme
  ]

  if(active.value) {
    c.push('-active')
  }

  return c.join(' ')
})

const active = computed(() => {
  return props.tabId == props.activeId
})

function click() {
  emit('select', props.tabId)
}
</script>

<template>
  <button
    :class="classObject"
    :aria-pressed="active"
    @click="click"
  >{{ info.name }}</button>
</template>

<style scoped lang="scss">

.tab {
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
  white-space: nowrap;

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
