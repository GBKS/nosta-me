<script setup>
import Icons from '@/helpers/icons'

const props = defineProps([
  'url',
  'title',
  'clickable'
])

const emit = defineEmits(['select'])

const classObject = computed(() => {
  return (props.clickable || props.url) ? '-clickable' : null
})

</script>

<template>
  <h2 :class="classObject">
    <a
      v-if="url" 
      :href="url"
      target="_blank"
      rel="nofollow noreferrer"
    >{{ title }} <span v-html="Icons.caretRight"/></a>
    <button v-if="clickable" @click="$emit('select')">{{ title }} <span v-html="Icons.caretRight"/></button>
    <template v-if="!(url || clickable)">{{ title }}</template>
  </h2>
</template>

<style scoped lang="scss">

h2 {
  font-size: 21px;
  font-weight: 600;
  color: var(--theme-front);

  &.-clickable {
    a,
    button {
      appearance: none;
      background-color: transparent;
      border-width: 0;
      font-size: 21px;
      font-weight: 600;
      padding: 0;
      color: var(--theme-front);
      text-decoration: none;

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
        background-color: rgba(var(--theme-active-rgb), 0.1);

        span {
          transform: translateX(10px);
          opacity: 1;
        }
      }
    }
  }
}

</style>
