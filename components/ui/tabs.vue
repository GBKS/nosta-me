<script setup>
import themes from '@/data/themes.json'

const props = defineProps([
  'activeId',
  'info',
  'theme'
])

const emit = defineEmits([
  'selectTab'
])

function selectTab(tabId) {
  emit('selectTab', tabId)
}
</script>

<template>
  <div class="tabs">
    <UiTab
      v-for="(item, tabId) in info"
      :key="tabId"
      :tabId="tabId"
      :info="item"
      :activeId="activeId"
      :theme="theme"
      @select="selectTab"
    />
  </div>
</template>

<style scoped lang="scss">

.tabs {
  display: flex;
  gap: 10px;
  justify-content: center;
  overflow: hidden;
  overflow-x: scroll;
  -ms-overflow-style: none;  /* IE and Edge */
  scrollbar-width: none;  /* Firefox */

  &::-webkit-scrollbar {
    display: none;
  }
}

</style>
