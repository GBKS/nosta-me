<script setup>
import { storeToRefs } from 'pinia'
import ToolBox from '@/helpers/toolBox'
import { useHandlerStore } from "@/stores/handlers.js"
import { useRelayStore } from '@/stores/relays'

const handlerStore = useHandlerStore()
const relayStore = useRelayStore()

const { handlers } = storeToRefs(handlerStore)

const props = defineProps([
  'info'
])

const title = computed(() => {
  let result = null
  
  const tag = props.info.tags.find(tag => tag[0] == 'title')
  if(tag) {
    result = tag[1]
  }

  return result
})

const created = computed(() => {
  let result = null
  
  const tag = props.info.tags.find(tag => tag[0] == 'published_at')
  if(tag) {
    result = tag[1]
  } else {
    result = props.info.created_at
  }

  return ToolBox.formatRelativeDate(result, true)
})

const url = computed(() => {
  const relay = relayStore.getRelay(props.info.relay)
  const identifierTag = props.info.tags.find(tag => tag[0] == 'd')

  const data = {
    kind: props.info.kind+'',
    identifier: identifierTag[1],
    pubkey: props.info.pubkey,
    relays: [relay.url]
  }
  const bech = window.NostrTools.nip19.naddrEncode(data)

  if(handler.value) {
    return handler.value.replace('<bech32>', bech)
  } else {
    return 'https://habla.news/a/' + bech
  }
})

const summary = computed(() => {
  let result = null
  
  const tag = props.info.tags.find(tag => tag[0] == 'summary')
  if(tag) {
    result = tag[1]
  } else {
    result = props.info.content
  }

  return result
})

const image = computed(() => {
  const tag = props.info.tags.find(tag => tag[0] == 'image')
  return tag ? tag[1] : null
})

const tags = computed(() => {
  let result = null

  const tags = props.info.tags.filter(tag => tag[0] == 't')

  if(tags) {
    let i=0, tag
    result = []

    for(; i<tags.length; i++) {
      tag = '#' + tags[i][1]
      result.push({
        name: tag,
        url: 'https://primal.net/search/' + encodeURIComponent(tag)
      })
    }

    if(result.length > 5) {
      result = result.slice(0, 5)
    }
  }

  return result
})

// See if the profile has defined a preferred handler for short notes.
// TODO: Fallback to the logged in users preferred handler
// TODO: Make this platform specific (on iOS, look for iOS handlers)
const handler = computed(() => {
  let result = null

  let handler, kindTag, eventTag
  for(let id in handlers.value) {
    handler = handlers.value[id]


    kindTag = handler.tags.find(tag => tag[0] == 'k' && tag[1] == '30023')
    eventTag = handler.tags.find(tag => tag[0] == 'web' && tag[2] == 'naddr')

    if(kindTag && eventTag) {
      result = eventTag[1]
      break
    }
  }

  return result
})
</script>

<template>
  <div class="long-notes-item">
    <img
      v-if="image"
      :src="image"
    />
    <div class="copy">
      <h3 v-if="title">
        <a
          :href="url"
          target="_blank"
          rel="nofollow noreferrer"
        >{{ title }}</a>
      </h3>
      <div class="info">
        <p v-if="created">{{ created }}</p>
        <UiTags
          :info="tags"
          max="5"
        />
      </div>
      <ProfileBitsNote
        :text="summary"
      />
    </div>
  </div>
</template>

<style scoped lang="scss">

.long-notes-item {
  display: flex;
  @include r('gap', 15, 25);

  img {
    aspect-ratio: 1.5;
    border-radius: 5px;
    object-fit: cover;
  }

  .copy {
    display: flex;
    flex-direction: column;
    gap: 10px;

    h3 {
      a {
        font-size: 21px;
        font-weight: 600;
        color: var(--theme-front);
        text-decoration: none;

        &:hover {
          text-decoration: underline;
        }
      }
    }

    .info {
      display: flex;
      align-items: center;
      gap: 10px;

      p {
        font-size: 13px;
        font-weight: 600;
        color: var(--theme-text-medium);
      }
    }
  }
  
  @include media-query(small) {
    flex-direction: column;

    img {
      max-height: 200px;
    }
  }
  
  @include media-query(medium-up) {
    img {
      max-width: 200px;
    }
  }
}

</style>
