<script setup>
import Icons from '@/helpers/icons'

const props = defineProps([
  'info',
  'theme',
  'size'
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

const classObject = computed(() => {
  return [
    '-'+(props.theme || 'theme'),
    '-'+(props.size || 'default')
  ].join(' ')
})
</script>

<template>
  <button
    v-if="info.profile.nip05"
    :class="classObject"
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
