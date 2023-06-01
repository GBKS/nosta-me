<script setup>
import Icons from '@/helpers/icons'

const tipVisible = ref(false)
let timer = null

const props = defineProps([
  'text',
  'link'
])

const classObject = computed(() => {
  const c = ['tip']

  if(tipVisible.value) c.push('-visible')

  return c.join(' ')
})

function showTip() {
  tipVisible.value = true
}

function hideTip() {
  tipVisible.value = false
}

function onEnter() {
  clearTimeout(timer)
  timer = setTimeout(showTip, 100)
}

function onLeave() {
  clearTimeout(timer)
  timer = setTimeout(hideTip, 100)
}
</script>

<template>
  <div :class="classObject">
    <div
      v-if="!link"
      class="icon"
      v-html="Icons.help"
      @mouseenter="onEnter"
      @mouseleave="onLeave"
    />
    <NuxtLink
      v-if="link"
      class="icon"
      :to="link"
      v-html="Icons.help"
      target="_blank"
      rel="nofollow noopener noreferrer"
      @mouseenter="onEnter"
      @mouseleave="onLeave"
    />
    <div
      v-if="tipVisible"
      class="tip"
      v-html="text"
    />
  </div>
</template>

<style scoped lang="scss">

.tip {
  position: relative;

  .icon {
    background-color: var(--theme-back);
    border-radius: 100px;
    width: 18px;
    height: 18px;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0.15;
    transition: all 100ms $ease;
    cursor: pointer;

    :deep svg {
      width: 10px;
      height: 10px;
      color: var(--theme-front);
    }

    &:hover {
      opacity: 1;
    }
  }

  &.-visible {
    .icon {
      opacity: 1;
    }
  }

  .tip {
    position: absolute;
    bottom: calc(100% + 5px);
    left: 50%;
    transform: translateX(-50%);
    background-color: var(--theme-front);
    border-radius: 5px;
    padding: 8px 13px;
    font-size: 13px;
    box-shadow: 0 10px 30px -8px rgba(0, 0, 0, 0.5);
    pointer-events: none;
    max-width: 150px;
    text-align: center;
    width: max-content;
  }
}

</style>
