<script setup>
import { computed } from 'vue'
import Icons from '@/helpers/icons'

const props = defineProps([
  'info'
])

const emit = defineEmits(['toggle'])

const classObject = computed(() => {
  const c = ['relay-item']

  // Add 'added' status
  c.push(props.info.added ? '-added' : '-not-added')

  // Add 'connected' status

  return c.join(' ')  
})

const buttonLabel = computed(() => {
  return props.info.added ? 'Added' : 'Add'
})

const addedIcon = computed(() => {
  return Icons.plus
})

const look = computed(() => {
  return props.info.added ? null : 'outline'
})

function toggleAdd() {
  emit('toggle', props.info.id)
}
</script>

<template>
  <div :class="classObject">
    <p class="-name">{{ info.name }}</p>
    <UiButton
      size="tiny"
      :look="look"
      @click="toggleAdd"
    >{{ buttonLabel }}</UiButton>
  </div>
</template>

<style scoped lang="scss">

.relay-item {
  display: flex;
  align-items: center;
  gap: 15px;
  flex-grow: 1;
  padding: 14px 0;
  border-bottom: 1px solid rgba(var(--front-rgb), 0.2);

  > div {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    border-radius: 100px;
    border: 1px solid rgba(var(--front-rgb), 1);

    :deep(svg) {
      width: 12px;
      height: 12px;
    }
  }

  p {
    &.-name {
      flex-basis: 10%;
      flex-grow: 1;
      font-size: 22px;
      color: var(--front);
    }

    &.-connection {
      display: flex;
      align-items: center;
      gap: 10px;
      position: relative;
      font-size: 17px;
      color: rgba(var(--front-rgb), 0.5);

      &:after {
        display: block;
        content: '';
        width: 6px;
        height: 6px;
        background-color: rgba(var(--front-rgb), 0.2);
        border-radius: 10px;
      }
    }
  }

  :deep(button) {
    min-width: 100px;
  }

  &:last-child {
    border-bottom-width: 0;
  }

  > div {
    background-color: var(--green);
    border-color: var(--green);

    :deep(svg) {
      color: white;
    }
  }

  &.-added {
    > div {

    }
  }

  &.-not-added {
    > div {
      
    }
  }
}

</style>
