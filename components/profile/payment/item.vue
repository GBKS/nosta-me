<script setup>
import ToolBox from '@/helpers/toolBox'

// info is a payment target as returned by paymentTargetHelper.targets()
const props = defineProps([
  'info'
])

const status = ref(null) // null, 'copied' or 'failed'
let timeout = null

async function copy() {
  try {
    await navigator.clipboard.writeText(props.info.address)
    status.value = 'copied'
  } catch(error) {
    // The browser can refuse, say so instead of claiming it worked.
    status.value = 'failed'
  }

  clearTimeout(timeout)
  timeout = setTimeout(() => { status.value = null }, 2000)
}

const text = computed(() => {
  if(status.value == 'copied') return 'Copied to clipboard'
  if(status.value == 'failed') return 'Could not copy'

  return ToolBox.trim(props.info.address, 24)
})

onBeforeUnmount(() => {
  clearTimeout(timeout)
})
</script>

<template>
  <button
    class="payment-item"
    :title="'Copy ' + info.name + ' address'"
    aria-live="polite"
    @click="copy"
  >
    <h5>{{ info.name }}</h5>
    <p>{{ text }}</p>
  </button>
</template>

<style scoped lang="scss">

.payment-item {
  appearance: none;
  text-align: left;
  cursor: pointer;
  padding: 12px 15px;
  border-radius: 15px;
  background-color: rgba(var(--theme-back-rgb), 0.2);
  border: 1px solid rgba(var(--theme-front-rgb), 0.2);
  transition: all 250ms $ease;
  min-width: 0;

  h5 {
    font-size: 17px;
    font-weight: 600;
    color: var(--theme-front);
  }

  p {
    margin-top: 2px;
    font-size: 15px;
    color: var(--theme-front);
    opacity: 0.75;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &:hover {
    background-color: rgba(var(--theme-back-rgb), 0.3);
    border-color: rgba(var(--theme-front-rgb), 0.3);
  }

  &:focus-visible {
    outline: 2px solid rgba(var(--theme-front-rgb), 0.5);
    outline-offset: 3px;
  }
}

</style>
