<script setup>
import Icons from '@/helpers/icons'

const props = defineProps([
  'to',
  'icon',
  'title',
  'active',
  'disabled'
])

defineEmits(['click'])

const classObject = computed(() => {
  return [
    'header-icon-button',
    props.active ? '-active' : '',
    '-'+props.icon
  ]
})
</script>

<template>
  <NuxtLink
    v-if="to"
    :to="to"
    :class="classObject" 
    :title="title" 
    :disabled="disabled"
  >
    <span v-html="Icons[icon]" />
  </NuxtLink>
  <button
    v-if="!to"
    :class="classObject" 
    :title="title" 
    :disabled="disabled"
    :aria-selected="active"
    @click="$emit('click')" 
  >
    <span v-html="Icons[icon]" />
  </button>
</template>

<style scoped lang="scss">

.header-icon-button {
  
}

</style>