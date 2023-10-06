<script setup>
import Icons from '@/helpers/icons'

const props = defineProps([
  'interactive',
  'active',
  'disabled',
  'title'
])

const classObject = computed(() => {
  const c = ['check']

  if(props.disabled) {
    c.push('-disabled')
  }

  if(props.active) {
    c.push('-active')
  }

  return c.join(' ')
})

defineEmits(['click'])
</script>

<template>
  <component
    :is="interactive ? 'button' : 'div'"
    :class="classObject"
    :disabled="disabled"
    :aria-pressed="active"
    :title="title"
    v-html="Icons.check"
    @click="$emit('click')"
  />
</template>

<style scoped lang="scss">

button {
  appearance: none;
  background-color: transparent;
}

.check {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: 1px solid var(--front);
  color: var(--front);
  opacity: 0.25;
  border-radius: 143px;
  transition: all 150ms $ease;
  line-height: 0;
  box-sizing: border-box;

  :deep(svg) {
    width: 12px;
    height: 12px;
  }

  &:not(:disabled) {
    cursor: pointer;

    &:not(.-active) {
      &:hover {
        opacity: 1;
        border-color: var(--green);
        color: var(--green);
      }
    }
  }

  &.-active {
    opacity: 1;
    background-color: var(--green);
    border-color: var(--green);
    color: var(--back);
    animation: checkBump 500ms $timing-cubic-easeinoutbounce;
  }
}

@keyframes checkBump {
  0% {
    transform: scale(1);
    position: relative;
    z-index: 1;
  }

  50% {
    transform: scale(2);
    position: relative;
    z-index: 1;
  }

  100% {
    transform: scale(1);
    position: relative;
    z-index: 1;
  }
}


</style>
