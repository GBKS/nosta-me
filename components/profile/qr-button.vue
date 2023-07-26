<script setup>
import Icons from '@/helpers/icons'

const props = defineProps([
  'info'
])

function click() {
  window.emitter.emit('show-modal', {
    id: 'qr', 
    event: props.info.event
  })
}
</script>

<template>
  <button
    class="qr-button"
    title="Click to zap"
    v-html="Icons.qr"
    @click="click"
  />
</template>

<style scoped lang="scss">

.qr-button {
  border-radius: 100px;
  border-width: 0;
  appearance: none;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 150ms $ease;
  color: rgba(var(--theme-front-rgb), 0.75);
  background-color: rgba(var(--theme-front-rgb), 0.1);

  :deep(svg) {
    width: 12px;
    height: 12px;
    color: rgba(var(--theme-front-rgb), 0.75);
  }

  &:hover {
    color: var(--theme-front);
    background-color: rgba(var(--theme-front-rgb), 0.2);
    
    :deep(svg) {
      color: var(--theme-front);
    }
  }
}

</style>
