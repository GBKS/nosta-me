<script setup>
import Icons from '@/helpers/icons'

const props = defineProps([
  'name',
  'icon',
  'url',
  'download',
  'webshare'
])

const emit = defineEmits(['click'])

function click() {
  if(props.webshare) {
    navigator.share({
      url: props.url
    })
  }

  emit('click')
}
</script>

<template>
  <NuxtLink
    v-if="url && !webshare"
    class="share-list-option"
    :to="url"
    target="_blank"
    rel="nofollow noopener noreferrer"
    :download="download"
  >
    <span>{{ name }}</span><span v-html="Icons[icon]" />
  </NuxtLink>
  <button
    v-if="!url || webshare"
    class="share-list-option"
    @click="click"
  >
    <span>{{ name }}</span><span v-html="Icons[icon]" />
  </button>
</template>

<style scoped lang="scss">

.share-list-option {
  border-top: 1px solid #DEDEDE;
  display: flex;
  justify-content: center;
  padding: 10px 0;
  opacity: 0.75;
  transition: all 150ms $ease;
  text-decoration: none;
  color: black;

  span {
    text-align: left;

    &:first-child {
      flex-grow: 1;
    }

    :deep(svg) {
      width: 18px;
      height: 18px;
    }
  }

  // &:first-of-type {
  //   border-top-width: 0;
  // }

  &:hover {
    opacity: 1;
  }
}

button.share-list-option {
  appearance: none;
  background-color: transparent;
  border-left-width: 0;
  border-right-width: 0;
  border-bottom-width: 0;
  cursor: pointer;
}

</style>
