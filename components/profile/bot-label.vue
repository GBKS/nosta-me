<script setup>
import ToolBox from '@/helpers/toolBox'

// info is the profile content (kind 0)
const props = defineProps([
  'info'
])

const visible = computed(() => {
  return ToolBox.isBot(props.info)
})
</script>

<template>
  <p
    v-if="visible"
    class="bot-label"
    title="This account says that its posts are automated, entirely or in part"
  >Automated account</p>
</template>

<style scoped lang="scss">

.bot-label {
  padding: 3px 8px;
  align-self: flex-start;
  border-radius: 3px;
  background-color: rgba(var(--theme-front-rgb), 0.1);
  color: var(--theme-text-medium);
  font-size: 13px;
  font-weight: 500;
}

</style>
