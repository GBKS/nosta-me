/*

'headers', 'Link:Content', 'Text:Title', 'Image:Image'
'headers', 'Image:Content', 'Text:Title', 'Video:Christmas Dance in Peru'
'headers', 'Link:Content', 'Text:Title', 'Image:Image', 'Video:VIRUSES VS EXOSOMES / GERM VS TERRAIN'

 */

<script setup>
import { useRelayStore } from '@/stores/relays'
import Icons from '@/helpers/icons'
import ToolBox from '@/helpers/toolBox'

const relayStore = useRelayStore()

const props = defineProps([
  'info',
  'type',
  'headers'
])

const componentType = computed(() => {
  return link.value ? 'a' : 'div'
})

const title = computed(() => {
  const result = findHeaders(props.info, props.headers, ['Text:Title'])
  return result ? ToolBox.trim(result, 50, 'end') : null
})

const link = computed(() => {
  return findHeaders(props.info, props.headers, ['Link:Content'])
})

const image = computed(() => {
  return findHeaders(props.info, props.headers, ['Image:Content', 'Image:Image'])
})

const video = computed(() => {
  return findHeaders(props.info, props.headers, ['Video:'], true)
})

function findHeaders(item, itemHeaders, headers, allowPartialMatch) {
  let result = null

  let i=0, k=0, index
  for(; i<headers.length; i++) {
    if(allowPartialMatch) {
      for(k=0; k<itemHeaders.length; k++) {
        index = itemHeaders[k].indexOf(headers[i])
        if(index !== -1) {
          result = item[index]
          break
        }
      }
    } else {
      index = itemHeaders.indexOf(headers[i])
      if(index !== -1) {
        result = item[index]
        break
      }
    }

    if(result) break
  }

  return result
}

const classObject = computed(() => {
  const c = [
    'pinstr-pin',
    '-' + (props.type ? props.type.toLowerCase() : 'no-type')
  ]

  return c.join(' ')
})

onMounted(() => {
  console.log('pin', props.info)
})
</script>

<template>
  <component
    :class="classObject"
    :is="componentType"
    :href="link"
    :target="link ? '_blank' : null"
    :rel="link ? 'nofollow noopener noreferrer' : null"
  >
    <UiImage
      v-if="image"
      :src="image"
    />
    <div class="copy">
      <h5 v-if="title">{{ title }}</h5>
      <div
        v-if="video"
        class="icon"
        v-html="Icons.play"
      />
    </div>
  </component>
</template>

<style scoped lang="scss">

.pinstr-pin {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;

  :deep(img) {
    border-radius: 5px;
    aspect-ratio: 1.33;
    object-fit: cover;
    object-position: center center;
  }

  .copy {
    position: absolute;
    bottom: 0;
    left: 0;
    background-color: rgba(black, 0.35);
    border-bottom-left-radius: 5px;
    border-bottom-right-radius: 5px;
    padding: 3px 5px;
    transition: all 150ms $ease;
    display: flex;
    gap: 5px;
    align-items: center;
    backdrop-filter: blur(5px);

    h5 {
      font-weight: 600;
      color: white;
      @include r('font-size', 12, 13);
      text-wrap: balance;
    }

    .icon {
      line-height: 0;

      :deep(svg) {
        width: 12px;
        height: 12px;
        color: white;
      }
    }
  }

  &:hover {
    .copy {
      opacity: 0;
    }
  }
}

</style>
