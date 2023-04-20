<script setup>
const props = defineProps([
  'info',
  'size'
])

const emit = defineEmits(['click'])

const classObject = computed(() => {
  const c = ['relay-status']

  if(props.info && props.info.status) {
    c.push('-'+props.info.status)
  }

  if(isClickable.value) {
    c.push('-clickable')
  }

  if(props.size == 'compact') {
    c.push('-compact')
  } else {
    c.push('-big')
  }

  return c.join(' ')
})

const isClickable = computed(() => {
  let result = false

  if(props.info && props.info.status) {
    switch(props.info.status) {
      case 'disconnected':
      case 'could-not-open':
      case 'connection-error':
        result = true
        break
    }
  }

  return result
})

const title = computed(() => {
  let result = ''

  if(props.info && props.info.status) {
    switch(props.info.status) {
      case 'connecting':
        result = '🫥 Connecting...'
        break
      case 'connected':
        result = '😆 Connected'
        break
      case 'disconnected':
        result = '😡 Disconnected. Click to re-connect.'
        break
      case 'notice':
        result = '🧐 Notice'
        break
      case 'could-not-open':
        result = '🤬 Could not connect. Click to try again.'
        break
      case 'connection-error':
        result = '🥵 Connection error. Click to try again.'
        break
    }
  }

  return result
})

const role = computed(() => {
  return isClickable.value ? 'button' : null
})

const statusText = computed(() => {
  let result = ''

  if(props.info && props.info.status) {
    switch(props.info.status) {
      case 'connecting':
        result = 'Connecting...'
        break
      case 'connected':
        result = 'Connected'
        break
      case 'disconnected':
        result = 'Disconnected'
        break
      case 'notice':
        result = 'Notice'
        break
      case 'could-not-open':
        result = 'Could not connect'
        break
      case 'connection-error':
        result = 'Connection error'
        break
    }
  }

  return result
})

const displayText = computed(() => {
  return props.size === 'compact' ? '' : statusText.value
})

function click() {
  if(isClickable.value) {
    emit('click', props.info)
  }
}
</script>

<template>
  <p
    :class="classObject"
    :title="title"
    :role="role"
    v-html="displayText"
    @click="click"
  />
</template>

<style scoped lang="scss">

.relay-status {
  position: relative;
  white-space: nowrap;
  
  &.-clickable {
    cursor: pointer;
  }

  &.-big {
    padding: 1px 10px 1px 8px;
    border-radius: 20px;
    font-size: 13px;
  }

  &:before {
    content: '';
    display: inline-block;
    width: 5px;
    height: 5px;
    border-radius: 100px;
    margin-right: 5px;
    background-color: #dedede;
    vertical-align: middle;
    transform: translateY(-1px);
  }

  &.-connecting {
    &:before {
      animation: connectingAnimation 750ms infinite linear alternate-reverse;
      background-color: var(--blue);
    }

    &.-big {
      background-color: rgba(var(--green-rgb), 0.1);
    }
  }

  &.-connected {
    &:before {
      background-color: var(--green);
    }

    &.-big {
      background-color: rgba(var(--green-rgb), 0.1);
    }
  }

  &.-disconnected {
    &:before {
      background-color: transparent;
      border: 1px solid var(--red);
    }

    &.-big {
      background-color: rgba(var(--red-rgb), 0.1);
    }
  }

  &.-notice {
    &:before {
      background-color: transparent;
      border: 1px solid var(--blue);
    }

    &.-big {
      background-color: rgba(var(--blue-rgb), 0.1);
    }
  }

  &.-could-not-open,
  &.-connection-error {
    &:before {
      background-color: var(--red);
    }

    &.-big {
      background-color: rgba(var(--blue-rgb), 0.1);
    }
  }
}

@keyframes connectingAnimation {
  0% {
    opacity: 0.25;
  }

  100% {
    opacity: 1;
  }
}

</style>
