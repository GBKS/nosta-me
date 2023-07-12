<script setup>
import Icons from '@/helpers/icons'

const props = defineProps([
  'info'
])

const visible = computed(() => {
  return window.nostr && window.webln && props.info.profile.lud16
})

function click() {
  window.emitter.emit('show-modal', {
    id: 'zap', 
    event: props.info.event
  })
}
</script>

<template>
  <button
    v-if="visible"
    class="zap-button"
    title="Click to zap"
    v-html="Icons.lightning"
    @click="click"
  />
</template>

<style scoped lang="scss">

.zap-button {
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
  }
}

</style>
