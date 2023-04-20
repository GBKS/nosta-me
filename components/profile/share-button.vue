<script setup>
import Icons from '@/helpers/icons'

const props = defineProps([
  'active'
])

const title = computed(() => {
  return props.active ? 'Hide options' : 'Show options'
})

const classObject = computed(() => {
  const c = ['share-button']

  if(props.active) {
    c.push('-active')
  }

  return c.join(' ')
})
</script>

<template>
  <div
    :class="classObject"
    :title="title"
    :aria-pressed="active"
    role="button"
    @click="toggleOptions"
  >
    <div class="dot" />
    <div class="dot" />
    <div class="dot" />
  </div>
</template>

<style scoped lang="scss">

.share-button {
  border-radius: 100px;
  border-width: 0;
  appearance: none;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 3px;
  cursor: pointer;
  transition: all 150ms $ease;
  color: rgba(var(--theme-front-rgb), 0.75);
  background-color: rgba(var(--theme-front-rgb), 0.1);

  .dot {
    width: 3px;
    height: 3px;
    border-radius: 100px;
    transition: all 150ms $ease;
    background-color: rgba(var(--theme-front-rgb), 0.75);
  }

  :deep(svg) {
    width: 16px;
    height: 16px;
    color: rgba(var(--theme-front-rgb), 0.75);
  }

  &:hover {
    color: var(--theme-front);
    background-color: rgba(var(--theme-front-rgb), 0.2);
    
    :deep(svg) {
      color: var(--theme-front);
    }

    .dot {
      background-color: var(--theme-front);
    }
  }

  &.-active {
    color: var(--theme-back);
    background-color: var(--theme-front);

    :deep(svg) {
      color: var(--theme-back);
    }

    .dot {
      background-color: var(--theme-back);
    }
  }

  @include media-query(large) {
    &:hover {
      .dot {
        animation: dotWave 750ms linear infinite;

        &:nth-child(2) { animation-delay: 150ms; }
        &:nth-child(3) { animation-delay: 300ms; }
      }
    }
  }
}

@keyframes dotWave {
  0% {
    transform: translateY(0px);
  }

  25% {
    transform: translateY(-3px);
  }

  50% {
    transform: translateY(0px);
  }

  75% {
    transform: translateY(3px);
  }

  100% {
    transform: translateY(0px);
  }
}

</style>
