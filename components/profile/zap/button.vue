<script setup>
import Icons from '@/helpers/icons'
import analytics from '@/helpers/analytics.js'

const props = defineProps([
  'info'
])

const visible = computed(() => {
  // Without a Nostr extension the zap request is signed another way, see zapHelper.
  return window.webln && props.info.profile.lud16
})

function click() {
  analytics.track('zap-open', { from: 'button' })
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
