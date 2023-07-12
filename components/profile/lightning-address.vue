<script setup>
import Icons from '@/helpers/icons'
import ToolBox from '@/helpers/toolBox'

const props = defineProps([
  'info',
  'theme',
  'size'
])

const formattedAddress = computed(() => {
  return ToolBox.trim(props.info.profile.lud16, 30)
})

const type = computed(() => {
  return (window.nostr && window.webln) ? 'button' : 'p'
})

const title = computed(() => {
  return type.value == 'button' ? 'Click to zap' : null
})

const classObject = computed(() => {
  let c = [
    'lightning-address',
    '-'+(props.theme || 'theme'),
    '-'+(props.size || 'default')
  ]

  if(window.nostr) {
    c.push('-zap')
  }

  return c.join(' ')
})

function select() {
  if(window.nostr && window.webln) {
    window.emitter.emit('show-modal', {
      id: 'zap', 
      event: props.info.event
    })
  }
}
</script>

<template>
  <component 
    v-if="info.profile.lud16" 
    :is="type"
    :class="classObject"
    :title="title"
    @click="select"
  ><span v-html="Icons.bitcoin" />{{ formattedAddress }}</component>
</template>

<style scoped lang="scss">

.lightning-address {
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

  &.-zap {
    cursor: pointer;
    appearance: none;
    border-width: 0;
    background-color: transparent;
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

    &.-zap:hover {
      background-color: rgba(var(--theme-active-rgb), 0.25);
      color: var(--theme-active);
    }
  }

  &.-light {
    color: rgba(black, 0.75);

    &.-zap:hover {
      background-color: rgba(black, 0.1);
      color: black;
    }
  }

  // &:hover {
  //   background-color: rgba(var(--theme-active-rgb), 0.25);
  //   color: var(--theme-active);
  // }
}

</style>
