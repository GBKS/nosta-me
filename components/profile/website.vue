<script setup>
import Icons from '@/helpers/icons'

const props = defineProps([
  'info',
  'theme',
  'size'
])

const classObject = computed(() => {
  return [
    '-'+(props.theme || 'theme'),
    '-'+(props.size || 'default')
  ].join(' ')
})
</script>

<template>
  <a
    v-if="info.profile.website"
    :class="classObject"
    :href="info.profile.website"
    title="Visit website"
    target="_blank"
    rel="nofollow noreferrer"
  ><span v-html="Icons.linkCircle" />{{ info.profile.website }}</a>
</template>

<style scoped lang="scss">

a {
  vertical-align: middle;
  text-decoration: none;
  transition: all 150ms $ease;
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
}

</style>
