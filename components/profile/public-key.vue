<script setup>
import Icons from '@/helpers/icons'
import ToolBox from '@/helpers/toolBox'

const props = defineProps([
  'publicKey'
])

const isCopied = ref(false)

const npub = computed(() => {
  return window.NostrTools.nip19.npubEncode(props.publicKey)
})

const formattedKey = computed(() => {
  return ToolBox.trim(npub.value, 15)
})

function copy() {
  navigator.clipboard.writeText(npub.value)
  isCopied.value = true

  setTimeout(resetCopied, 2000)
}

function resetCopied() {
  isCopied.value = false
}

const text = computed(() => {
  return isCopied.value ? 'Copied to clipboard' : formattedKey.value
})
</script>

<template>
  <button
    v-if="publicKey"
    :to="'/'+publicKey"
    title="Copy public key"
    @click="copy"
  ><span v-html="Icons.keyCircle" />{{ text }}</button>
</template>

<style scoped lang="scss">

button {
  appearance: none;
  border-width: 0;
  background-color: transparent;
  vertical-align: middle;
  text-decoration: none;
  font-size: 17px;
  padding: 5px 10px 8px 10px;
  color: var(--theme-text-medium);
  transition: all 150ms $ease;
  border-radius: 5px;
  margin-left: -10px;

  span {
    display: inline-block;
    margin-right: 10px;
    
    :deep(svg) {
      width: 18px;
      height: 18px;
      vertical-align: middle;
    }
  }

  &:hover {
    cursor: pointer;
    background-color: rgba(var(--theme-active-rgb), 0.25);
    color: var(--theme-active);
  }
}

</style>
