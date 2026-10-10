<script setup>
import userStatusHelper from '@/helpers/userStatusHelper.js'
import Icons from '@/helpers/icons'

// For the owner of the profile: opens the status modal.
const props = defineProps([
  'events'
])

const hasStatus = computed(() => {
  return !!userStatusHelper.current(props.events)
})

function click() {
  window.emitter.emit('show-modal', {
    id: 'status',
    events: props.events ? toRaw(props.events) : []
  })
}
</script>

<template>
  <button
    :class="hasStatus ? 'status-button -edit' : 'status-button -new'"
    :title="hasStatus ? 'Change your status' : 'Set a status'"
    @click="click"
  >
    <span v-if="!hasStatus" v-html="Icons.plus" />{{ hasStatus ? 'Change' : 'Set a status' }}
  </button>
</template>

<style scoped lang="scss">

.status-button {
  appearance: none;
  border-width: 0;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  border-radius: 3px;
  font: inherit;
  font-size: 13px;
  font-weight: 500;
  color: var(--theme-text-medium);
  background-color: transparent;
  transition: all 150ms $ease;

  span {
    line-height: 0;

    :deep(svg) {
      width: 10px;
      height: 10px;
    }
  }

  &.-new {
    background-color: rgba(var(--theme-active-rgb), 0.1);
  }

  &:hover {
    color: var(--theme-text-bright);
    background-color: rgba(var(--theme-active-rgb), 0.25);
  }
}

</style>
