<script setup>
import Icons from '@/helpers/icons'
import ToolBox from '@/helpers/toolBox'

const props = defineProps([
  'info',
  'theme',
  'size'
])

const isCopied = ref(false)

const nip05 = computed(() => {
  return props.info.profile.nip05
})

function copy() {
  navigator.clipboard.writeText(nip05.value)
  isCopied.value = true

  setTimeout(resetCopied, 2000)
}

function resetCopied() {
  isCopied.value = false
}

const text = computed(() => {
  if(isCopied.value) {
    return 'Copied to clipboard'
  } else {
    return ToolBox.trim(nip05.value, 30)
  }
})

const classObject = computed(() => {
  return [
    '-'+(props.theme || 'theme'),
    '-'+(props.size || 'default')
  ].join(' ')
})
</script>

<template>
  <button
    v-if="nip05"
    :class="classObject"
    title="Copy Nostr address"
    aria-live="polite"
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
  transition: all 150ms $ease;

  span {
    display: inline-block;
    margin-right: 10px;
    
    :deep(svg) {
      width: 18px;
      height: 18px;
      vertical-align: middle;
    }
  }

  &.-default {
    font-size: 17px;
    padding: 5px 10px 8px 10px;
    margin-left: -10px;
    border-radius: 5px;
  }

  &.-small {
    font-size: 13px;
    padding: 4px 6px 4px 6px;
    margin-left: -6px;
    border-radius: 3px;
  }

  &.-theme {
    color: var(--theme-text-medium);

    &:hover {
      background-color: rgba(var(--theme-active-rgb), 0.25);
      color: var(--theme-active);
    }
  }

  &.-light {
    color: rgba(black, 0.75);

    &:hover {
      background-color: rgba(black, 0.1);
      color: black;
    }
  }

  &:hover {
    cursor: pointer;
  }
}

</style>
