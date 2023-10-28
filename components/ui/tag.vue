<script setup>
import useAssets from  '@/composables/useAssets.js'

const props = defineProps([
  'info',
  'theme' // theme, light
])

const classObject = computed(() => {
  return [
    'tag',
    '-' + (props.theme ? props.theme : 'theme')
  ].join(' ')
})

const type = computed(() => {
  return props.info.url ? 'a' : 'div'
})
</script>

<template>
  <component
    :class="classObject"
    :is="type"
    :href="info.url"
    :target="info.target"
    :rel="info.rel"
  >{{ info.name }}</component>
</template>

<style scoped lang="scss">

.tag {
  transition: all 150ms $ease;
  font-size: 12px;
  padding: 3px 7px 4px 7px;
  border-radius: 3px;

  &:is(a) {
    text-decoration: none;
  }

  &.-theme {
    color: rgba(var(--theme-front-rgb), 0.85);
    background-color: rgba(var(--theme-front-rgb), 0.1);

    &:is(a) {
      &:hover {
        color: var(--theme-active);
        background-color: rgba(var(--theme-active-rgb), 0.25);
      }
    }
  }

  &.-light {
    color: rgba(var(--front-rgb), 0.85);
    background-color: rgba(var(--front-rgb), 0.1);
    
    &:is(a) {
      &:hover {
        color: var(--front-rgb);
        background-color: rgba(var(--front-rgb), 0.15);
      }
    }
  }
}

</style>
