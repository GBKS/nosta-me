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

const classObject = computed(() => {
  return [
    '-'+(props.theme || 'theme'),
    '-'+(props.size || 'default')
  ].join(' ')
})
</script>

<template>
  <p 
    v-if="info.profile.lud16" 
    :class="classObject"
  ><span v-html="Icons.bitcoin" />{{ formattedAddress }}</p>
</template>

<style scoped lang="scss">

p {
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
  }

  &.-light {
    color: rgba(black, 0.75);
  }

  // &:hover {
  //   background-color: rgba(var(--theme-active-rgb), 0.25);
  //   color: var(--theme-active);
  // }
}

</style>
