<script setup>
import Icons from '@/helpers/icons'

const emit = defineEmits(['select'])

</script>

<template>
  <button @click="$emit('select')"><span v-html="Icons.caretLeft"/> Back</button>
</template>

<style scoped lang="scss">


button {
  appearance: none;
  background-color: transparent;
  border-width: 0;
  font-size: 15px;
  font-weight: 600;
  opacity: 0.75;
  color: var(--theme-front);
  text-decoration: none;
  transition: all 150ms $ease;
  display: inline;
  padding: 7px 15px 5px 10px;
  border-radius: 15px;
  margin-left: -10px;
  cursor: pointer;

  span {
    vertical-align: middle;
    opacity: 0.5;
    transition: all 150ms $ease;
    margin-right: 5px;

    :deep(svg) {
      width: 15px;
      height: 15px;
    }
  }

  &:hover {
    opacity: 1;
    background-color: rgba(var(--theme-active-rgb), 0.2);

    span {
      transform: translateX(-5px);
    }
  }
}

</style>
