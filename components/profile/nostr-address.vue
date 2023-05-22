<script setup>
import Icons from '@/helpers/icons'

const props = defineProps([
  'info'
])

const isCopied = ref(false)

function copy() {
  navigator.clipboard.writeText(props.info.profile.nip05)
  isCopied.value = true

  setTimeout(resetCopied, 2000)
}

function resetCopied() {
  isCopied.value = false
}

const text = computed(() => {
  return isCopied.value ? 'Copied to clipboard' : props.info.profile.nip05
})
</script>

<template>
  <button
    v-if="info.profile.nip05"
    :to="'/'+info.profile.nip05"
    title="Copy handle"
    @click="copy"
  ><span v-html="Icons.contactCircle" />{{ text }}</button>
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
