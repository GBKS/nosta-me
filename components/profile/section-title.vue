<script setup>
import Icons from '@/helpers/icons'

const props = defineProps([
  'title',
  'clickable'
])

const emit = defineEmits(['select'])

const classObject = computed(() => {
  return props.clickable ? '-clickable' : null
})

</script>

<template>
  <h2 :class="classObject">
    <button v-if="clickable" @click="$emit('select')">{{ title }} <span v-html="Icons.caretRight"/></button>
    <template v-if="!clickable">{{ title }}</template>
  </h2>
</template>

<style scoped lang="scss">

h2 {
  font-size: 21px;
  font-weight: 600;
  color: var(--theme-front);

  &.-clickable {
    button {
      appearance: none;
      background-color: transparent;
      border-width: 0;
      font-size: 21px;
      font-weight: 600;
      padding: 0;
      color: var(--theme-front);

      padding: 7px 12px 6px 15px;
      border-radius: 15px;
      margin-left: -15px;
      cursor: pointer;

      span {
        opacity: 0.5;
        transition: all 150ms $ease;

        :deep(svg) {
          width: 15px;
          height: 15px;
        }
      }

      &:hover {
        background-color: rgba(var(--theme-active-rgb), 0.2);

        span {
          transform: translateX(10px);
          opacity: 1;
        }
      }
    }
  }
}

</style>
