<script setup>
import { useRelayStore } from '@/stores/relays'
import ToolBox from '@/helpers/toolBox'
import Icons from '@/helpers/icons'
import linkHelper from '@/helpers/linkHelper.js'

const relayStore = useRelayStore()

const props = defineProps([
  'info',
  'handlers'
])

const title = computed(() => {
  let tag = ToolBox.findTag(props.info, 'name')
  if(!tag) {
    // The NIP uses 'd', but Flockstr uses 'name'
    tag = ToolBox.findTag(props.info, 'd')
  }
  return tag ? ToolBox.trim(tag[0], 50, 'end') : null
})

const summary = computed(() => {
  const tag = ToolBox.findTag(props.info, 'description')
  return tag ? ToolBox.trim(tag[0], 50, 'end') : null
})

const image = computed(() => {
  const tag = ToolBox.findTag(props.info, 'image')
  return tag ? tag[0] : null
})

const banner = computed(() => {
  const tag = ToolBox.findTag(props.info, 'banner')
  return tag ? tag[0] : null
})

const eventCount = computed(() => {
  const tags = props.info.tags.filter(tag => tag[0] == 'a')
  return tags ? tags.length : null
})

const eventCountText = computed(() => {
  return eventCount.value + ' event' + (eventCount.value == 1 ? '' : 's')
})

const locationLink = computed(() => {
  let result = null

  if(location.value) {
    result = 'maps:q=' + encodeURIComponent(location.value)
  }

  return result
})

const link = computed(() => {
  const tag = ToolBox.findTag(props.info, 'd')
  const relay = relayStore.getRelay(props.info.relay)

  return linkHelper.address(
    tag[0],
    props.info.pubkey, 
    props.info.kind,
    relay.url,
    props.handlers,
    linkHelper.flockstr.calendar
  )
})

const classObject = computed(() => {
  const c = ['calendar-item']

  return c.join(' ')
})
</script>

<template>
  <a
    :class="classObject"
    :href="link"
    target="_blank"
    rel="nofollow noopener noreferrer"
  >
    <div class="image-wrap">
      <UiImage
        :src="banner"
        class="-banner"
        radius="15"
        height="200"
      />
      <UiImage
        :src="image"
        class="-image"
        radius="30"
        width="60"
        height="60"
      />
    </div>
    <h5 v-if="title">{{ title }}</h5>
    <p v-if="summary" class="-summary">{{ summary }}</p>
    <p v-if="eventCountText" class="-count">{{ eventCountText }}</p>
  </a>
</template>

<style scoped lang="scss">

.calendar-item {
  display: flex;
  flex-direction: column;
  text-decoration: none;

  .image-wrap {
    position: relative;
    width: 100%;
    line-height: 0;

    > .-banner {
      width: 100%;
    }

    > .-image {
      position: absolute;
      left: 15px;
      bottom: 0;
      transform: translate(0, 30px);
    }

    & + h5,
    & + p {
      margin-top: 40px;
    }
  }

  h5 {
    font-size: 19px;
    font-weight: 600;
    color: var(--theme-front);
    // word-break: break-all;
    word-wrap: break-word;
  }

  > p {
    margin-top: 3px;
    font-size: 16px;
    color: var(--theme-front);
    opacity: 0.75;
    text-decoration: none;

    &.-summary {
      & + p {
        margin-top: 10px;
      }
    }

    &.-count {
      opacity: 1;
    }
  }
}

</style>
