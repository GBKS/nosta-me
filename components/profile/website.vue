<script setup>
import Icons from '@/helpers/icons'

const props = defineProps([
  'info'
])
</script>

<template>
  <a
    v-if="info.profile.website"
    :href="info.profile.website"
    title="Visit website"
    target="_blank"
    rel="nofollow noreferrer"
  ><span v-html="Icons.link" />{{ info.profile.website }}</a>
</template>

<style scoped lang="scss">

a {
  vertical-align: middle;
  text-decoration: none;
  font-size: 17px;
  padding: 5px 10px 8px 10px;
  color: var(--theme-text-medium);
  transition: all 150ms $ease;
  border-radius: 5px;
  margin-left: -10px;
  word-break: break-all;

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
    background-color: rgba(var(--theme-active-rgb), 0.25);
    color: var(--theme-active);
    // text-decoration: underline;
  }
}

</style>
