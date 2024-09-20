<script setup>
import Icons from '@/helpers/icons'

const props = defineProps([
  'id',
  'title',
  'description',
  'icon',
  'theme'
])

const emit = defineEmits(['hide'])

const classObject = computed(() => {
  const c = [
    'notification-item',
    '-' + (props.theme || 'default')
  ]

  return c.join(' ')
})

const icon = computed(() => {
  let result

  if(props.icon) {
    result = Icons[props.icon]
  } else if(props.theme == 'success') {
    result = Icons.check
  } else if(props.theme == 'error') {
    result = Icons.alert
  } else if(props.theme == 'progress') {
    result = Icons.clock
  }

  return result
})

function hide() {
  emit('hide', props.id)
}
</script>

<template>
  <li :class="classObject">
    <div class="top">
      <div v-if="icon" v-html="icon" />
      <h4 v-if="title">{{ title }}</h4>
      <button
        aria-label="Close Notification"
        v-html="Icons.cross"
        @click="hide"
      />
    </div>
    <p v-if="description">{{ description }}</p>
  </li>
</template>

<style scoped lang="scss">

.notification-item {
  background-color: white;
  border-radius: 10px;
  padding: 8px 10px;
  display: flex;
  flex-direction: column;
  gap: 1px;
  width: 100%;
  box-sizing: border-box;
  position: relative;

  .top {
    display: flex;
    align-items: center;
    gap: 8px;

    > div {
      background-color: #ededed;
      border-radius: 100px;
      width: 18px;
      height: 18px;
      display: flex;
      justify-content: center;
      align-items: center;
      transition: all 150ms $ease;
      color: black;

      :deep(svg) {
        width: 10px;
        height: 10px;
      }
    }

    h4 {
      flex-grow: 1;
      font-size: 14px;
      font-weight: 600;
    }

    button {
      padding: 4px;
      appearance: none;
      background-color: transparent;
      border-width: 0;
      line-height: 0;
      border-radius: 3px;
      transition: all 150ms $ease;
      opacity: 0.25;
      cursor: pointer;

      :deep(svg) {
        width: 10px;
        height: 10px;
        color: black;
      }

      &:hover {
        opacity: 1;
        background-color: rgba(var(--front-rgb), 0.05);
      }
    }
  }

  p {
    font-size: 14px;
    margin-left: 26px;
  }

  &.-default {

  }

  &.-error {
    .top {
      > div {
        background-color: var(--red);
        color: white;
      }
    }
  }

  &.-success {
    .top {
      > div {
        background-color: var(--green);
        color: white;
      }
    }
  }

  &.-progress {
    .top {
      > div {
        background-color: var(--blue);
        color: white;
      }
    }
  }
}

</style>
