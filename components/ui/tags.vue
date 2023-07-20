<script setup>
import themes from '@/data/themes.json'

const props = defineProps([
  'info',
  'theme',
  'scroll'
])

const classObject = computed(() => {
  return [
    'tags',
    props.scroll ? '-scroll' : '-wrap'
  ].join(' ')
})
</script>

<template>
  <div :class="classObject">
    <UiTag
      v-for="(item, index) in info"
      :key="index"
      :info="item"
      :theme="theme"
    />
  </div>
</template>

<style scoped lang="scss">

.tags {
  display: flex;
  gap: 10px;

  &.-scroll {
    overflow: hidden;
    overflow-x: scroll;
    -ms-overflow-style: none;  /* IE and Edge */
    scrollbar-width: none;  /* Firefox */

    &::-webkit-scrollbar {
      display: none;
    }
  }

  &.-wrap {
    flex-wrap: wrap;
  }
}

</style>
