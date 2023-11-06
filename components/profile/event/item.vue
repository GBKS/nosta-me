<script setup>
import { useRelayStore } from '@/stores/relays'
import ToolBox from '@/helpers/toolBox'
import Icons from '@/helpers/icons'

const relayStore = useRelayStore()

const props = defineProps([
  'info'
])

const title = computed(() => {
  const tag = ToolBox.findTag(props.info, 'name')
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

const location = computed(() => {
  const tag = ToolBox.findTag(props.info, 'location')
  return tag ? tag[0] : null
})

const status = computed(() => {
  return null
})

const timeZone = computed(() => {
  const tag = ToolBox.findTag(props.info, 'start_tzid')
  return tag ? tag[0] : null
})

const date = computed(() => {
  let result = null
  const tag = ToolBox.findTag(props.info, 'start')

  if(tag) {
    const d = new Date(parseInt(tag[0])*1000)

    result = d.toLocaleDateString(undefined, { 
      month: 'short', 
      day: 'numeric'
    })
  }

  return result
})

const startTime = computed(() => {
  const tag = ToolBox.findTag(props.info, 'start')
  return tag ? tag[0] : null
})

const endTime = computed(() => {
  const tag = ToolBox.findTag(props.info, 'end')
  return tag ? tag[0] : null
})

const time = computed(() => {
  let result = null
  const startTag = ToolBox.findTag(props.info, 'start')

  if(startTag) {
    const startDate = new Date(parseInt(startTag[0])*1000)

    result = startDate.toLocaleTimeString(undefined, { 
      hour: 'numeric',
      minute: '2-digit'
    })

    const endTag = ToolBox.findTag(props.info, 'end')
    if(endTag) {
      const endDate = new Date(parseInt(endTag[0])*1000)

      result += ' - ' + endDate.toLocaleTimeString(undefined, { 
        hour: 'numeric',
        minute: '2-digit'
      })
    }
  }

  return result
})

const formattedDate = computed(() => {
  let result = null

  if(date.value) {
    result = date.value

    if(time.value) {
      result += ', ' + time.value
    }
  }

  return result
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

  const data = {
    kind: 30311,
    pubkey: props.info.pubkey,
    identifier: tag[0],
    relays: [relay.url]
  }

  return 'https://www.flockstr.com/article/' + window.NostrTools.nip19.naddrEncode(data)
})

const classObject = computed(() => {
  const c = ['event-item']

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
    <div 
      v-if="image"
      class="image-wrap"
    >
      <UiImage
        :src="image"
        class="image"
        radius="15"
        height="200"
      />
      <ProfileBitsTimeStatus
        :start="startTime"
        :end="endTime"
      />
    </div>
    <ProfileBitsTimeStatus
      v-if="!image"
      :start="startTime"
      :end="endTime"
    />
    <h5 v-if="title">{{ title }}</h5>
    <p v-if="summary" class="-summary">{{ summary }}</p>
    <p v-if="formattedDate" class="-date"><span v-html="Icons.clock" />{{ formattedDate }}</p>
    <p v-if="location" class="-location"><span v-html="Icons.marker" />{{ location }}</p>
    <ProfileBitsTags :info="info" max="3" align="left" />
  </a>
</template>

<style scoped lang="scss">

.event-item {
  display: flex;
  flex-direction: column;
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
    }

    & + h5,
    & + p {
      margin-top: 20px;
    }
  }

  h5 {
    font-size: 19px;
    font-weight: 600;
    line-height: 1.4;
    color: var(--theme-front);
    // word-break: break-all;
    word-wrap: break-word;
  }

  .time-status {
    align-self: flex-start;

    & + h5 {
      margin-top: 10px;
    }
  }

  > p:not(.time-status) {
    margin-top: 3px;
    font-size: 16px;
    color: var(--theme-front);
    opacity: 0.75;
    text-decoration: none;

    :deep(span) {
      line-height: 1;
      vertical-align: middle;
      margin-right: 6px;

      svg {
        width: 15px;
        height: 15px;
      }
    }

    &.-summary {
      & + p {
        margin-top: 10px;
      }
    }

    &.-location {
      text-overflow: ellipsis;
      overflow: hidden;
      -webkit-line-clamp: 1;
      line-clamp: 1;
      -webkit-box-orient: vertical;
      display: -webkit-box;
    }

    &.-date {
      :deep(span) {
        svg {
          width: 15px;
          height: 14px;
        }
      }

      & + p {
        margin-top: 5px;
      }
    }

    &.-location,
    &.-date {
      font-size: 14px;
      opacity: 1;
    }
  }
}

</style>
