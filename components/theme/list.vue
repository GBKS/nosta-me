<script setup>
import themes from '@/data/themes.json'

const props = defineProps([
  'activeThemeId'
])

const emit = defineEmits([
  'selectTheme'
])

function selectTheme(themeId) {
  emit('selectTheme', themeId)
}
</script>

<template>
  <div class="theme-list">
    <ThemeItem
      v-for="(theme, themeId) in themes"
      :key="themeId"
      :themeId="themeId"
      :info="theme"
      :active="activeThemeId == themeId"
      @select="selectTheme"
    />
  </div>
</template>

<style scoped lang="scss">

.theme-list {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
  justify-content: center;
}

</style>
