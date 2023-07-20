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
  display: flex;
  justify-content: center;
  padding: 7px 0;
  opacity: 0.75;
  transition: all 150ms $ease;
  text-decoration: none;
  color: black;
  position: relative;

  &:before {
    content: '';
    position: absolute;
    top: 0px;
    bottom: 0px;
    left: -5px;
    right: -5px;
    pointer-events: none;
    background-color: rgba(var(--front-rgb), 0.1);
    opacity: 0;
    transition: opacity 150ms $ease;
    border-radius: 5px;
  }

  span {
    text-align: left;

    &:first-child {
      flex-grow: 1;
    }

    :deep(svg) {
      width: 16px;
      height: 16px;
      opacity: 0.75;
      transition: all 150ms $ease;
      vertical-align: middle;
    }
  }

  &:hover {
    opacity: 1;
   
    &:before {
      opacity: 1;
    } 

    span {
      :deep(svg) {
        opacity: 1;
      }
    }
  }
}

button.share-list-option {
  appearance: none;
  background-color: transparent;
  border-width: 0;
  cursor: pointer;
}

</style>
