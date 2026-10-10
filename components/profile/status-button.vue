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
    v-if="hasStatus"
    class="status-button -edit"
    title="Change your status"
    aria-label="Change your status"
    v-html="Icons.pencil"
    @click="click"
  />
  <button
    v-else
    class="status-button -new"
    title="Set a status"
    @click="click"
  >
    <span v-html="Icons.plus" />Set a status
  </button>
</template>

<style scoped lang="scss">

.status-button {
  appearance: none;
  border-width: 0;
  cursor: pointer;
  display: flex;
  align-items: center;
  border-radius: 3px;
  font: inherit;
  color: var(--theme-text-medium);
  transition: all 150ms $ease;

  &.-edit {
    padding: 5px;
    background-color: transparent;

    :deep(svg) {
      width: 12px;
      height: 12px;
    }
  }

  &.-new {
    gap: 4px;
    padding: 3px 8px;
    font-size: 13px;
    font-weight: 500;
    background-color: rgba(var(--theme-active-rgb), 0.1);

    span {
      line-height: 0;

      :deep(svg) {
        width: 10px;
        height: 10px;
      }
    }
  }

  &:hover {
    color: var(--theme-text-bright);
    background-color: rgba(var(--theme-active-rgb), 0.25);
  }
}

</style>
