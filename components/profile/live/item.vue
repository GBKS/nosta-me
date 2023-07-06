<script setup>
import { useRelayStore } from '@/stores/relays'
import ToolBox from '@/helpers/toolBox'

const relayStore = useRelayStore()

const props = defineProps([
  'info'
])

const title = computed(() => {
  const tag = ToolBox.findTag(props.info, 'title')
  return ToolBox.trim(tag[0], 50, 'end')
})

const summary = computed(() => {
  const tag = ToolBox.findTag(props.info, 'summary')
  return ToolBox.trim(tag[0], 50, 'end')
})

const participants = computed(() => {
  let result = null
  let tagName = null
  switch(status.value) {
    case 'live':
      tagName = 'current_participants'
      break
    case 'ended':
      tagName = 'total_participants'
      break
  }

  if(tagName) {
    const tag = ToolBox.findTag(props.info, tagName)
    if(tag) result = tag[0]
  }

  return result
})

const image = computed(() => {
  const tag = ToolBox.findTag(props.info, 'image')
  return tag ? tag[0] : null
})

const status = computed(() => {
  const tag = ToolBox.findTag(props.info, 'status')
  return tag ? tag[0] : null
})

const link = computed(() => {
  const tag = ToolBox.findTag(props.info, 'd')
  const relay = relayStore.getRelay(props.info.relay)

  const data = {
    kind: 30311,
    pubkey: props.info.pubkey,
    identifier: tag[0],
    relays: [relay.url]
  }

  return 'https://zap.stream/' + window.NostrTools.nip19.naddrEncode(data)
})

const classObject = computed(() => {
  const c = ['live-item']

  if(status.value) c.push('-'+status.value)

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
        :src="image"
        class="image"
        radius="15"
        height="150"
      />
      <p>{{ status }}</p>      
    </div>
    <h5 v-if="title">{{ title }}</h5>
    <p v-if="summary">{{ summary }}</p>
    <p v-if="participants">{{ participants }}</p>
  </a>
</template>

<style scoped lang="scss">

.live-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-decoration: none;

  .image-wrap {
    position: relative;
    width: 100%;
    line-height: 0;

    > .image {
      width: 100%;
      object-fit: cover;
      border-radius: 5px;
      transition: all 250ms $ease;
    }

    p {
      position: absolute;
      left: 10px;
      bottom: 10px;
      background-color: var(--back);
      color: var(--front);
      font-size: 11px;
      font-weight: 600;
      border-radius: 2px;
      padding: 1px 4px;
      text-transform: uppercase;
    }

    & + h5,
    & + p {
      margin-top: 20px;
    }
  }

  h5 {
    font-size: 17px;
    font-weight: 600;
    color: var(--theme-front);
    text-align: center;
    word-break: break-all;
  }

  > p {
    margin-top: 3px;
    font-size: 15px;
    color: var(--theme-front);
    opacity: 0.75;
    text-align: center;
  }
}

</style>
