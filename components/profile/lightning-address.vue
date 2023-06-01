<script setup>
import Icons from '@/helpers/icons'
import ToolBox from '@/helpers/toolBox'

const props = defineProps([
  'info'
])

const formattedAddress = computed(() => {
  return ToolBox.trim(props.info.profile.lud16, 30)
})
</script>

<template>
  <p v-if="info.profile.lud16"><span v-html="Icons.bitcoin" />{{ formattedAddress }}</p>
</template>

<style scoped lang="scss">

p {
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

  // &:hover {
  //   background-color: rgba(var(--theme-active-rgb), 0.25);
  //   color: var(--theme-active);
  // }
}

</style>
