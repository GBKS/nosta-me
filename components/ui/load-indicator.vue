<script setup>
import themes from '@/data/themes.json'

const props = defineProps([
  'active',
  'loadMessage',
  'slowMessage',
  'timeoutMessage'
])

let timer = null
let status = ref(null)

const emit = defineEmits([
  'retry',
  'timeout'
])

function retry() {
  emit('retry')
}

// Show
function onTimerOne() {
  status.value = 'loading'

  clearTimeout(timer)
  timer = setInterval(onTimerTwo, 1000)
}

// It's taking longer message
function onTimerTwo() {
  status.value = 'slowness'

  clearTimeout(timer)
  timer = setInterval(onTimerThree, 9000)
}

// Time out message
function onTimerThree() {
  status.value = 'timeout'

  emit('timeout')
}

const message = computed(() => {
  let result = null

  switch(status.value) {
    case 'loading':
      result = props.loadMessage || 'Loading...'
      break
    case 'slowness':
      result = props.slowMessage || 'Looking hard...'
      break
    case 'timeout':
      result = props.timeoutMessage || 'Sorry, could not find anything.'
      break
  }

  return result
})

onMounted(() => {
  clearTimeout(timer)
  timer = setInterval(onTimerOne, 1000)
})

onBeforeUnmount(() => {
  clearTimeout(timer)
})
</script>

<template>
  <div
    v-if="status != null"
    class="load-indicator"
  >
    <template v-if="status !== 'timeout'">
      <p>{{ message }}</p>
    </template>
    <template v-if="status == 'timeout'">
      <p>{{ message }}</p>
      <UiButton
        v-if="false"
        size="tiny"
        @click="retry"
      >Retry</UiButton>
    </template>
  </div>
</template>

<style scoped lang="scss">

.load-indicator {
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;

  p {
    font-size: 17px;
    font-weight: 500;
    color: rgba(var(--theme-front-rgb), 0.75);
  }
}

</style>
