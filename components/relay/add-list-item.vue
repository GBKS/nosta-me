<script setup>
import Icons from '@/helpers/icons'

const props = defineProps([
  'relayUrl',
  'active'
])

const emit = defineEmits([
  'remove'
])

function remove() {
  emit('remove', props.relayUrl)
}
</script>

<template>
  <div class="relay-add-list-item">
    <p>{{ props.relayUrl }}</p>
    <p class="-add">Adding</p>
    <button
      v-html="Icons.cross"
      @click="remove"
    />
  </div>
</template>

<style scoped lang="scss">

.relay-add-list-item {
  display: flex;
  align-items: center;
  background-color: #f4f4f4;
  border-radius: 5px;
  gap: 3px;
  padding: 4px 12px;
  
  p {
    :deep(svg) {
      width: 8px;
      height: 8px;
      color: black;
    }

    &:first-of-type {
      flex-grow: 1;
      font-size: 17px;
      color: black;
    }

    &.-add {
      margin-left: 5px;
      font-size: 12px;
      font-weight: 600;
      color: white;
      background-color: var(--green);
      border-radius: 3px;
      padding: 1px 5px 2px 5px;
    }
  }

  button {
    appearance: none;
    background-color: transparent;
    cursor: pointer;
    border-width: 0;
    opacity: 0.35;
    line-height: 0;
    margin-left: 5px;
    padding: 8px;

    :deep(svg) {
      width: 12px;
      height: 12px;
      color: black;
    }

    &:hover {
      background-color: #ededed;
      opacity: 1;
    }
  }
}

</style>
