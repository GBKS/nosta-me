<script setup>
import relayManager from '@/helpers/relayManager.js'
import relayRequest from '@/helpers/relayRequest.js'
import { useRelayStore } from '@/stores/relays'
import ToolBox from '@/helpers/toolBox'
import kinds from '@/data/kinds.json'
import { useHandlerStore } from "@/stores/handlers.js"

const props = defineProps([
  'appId',
  'info',
  'data',
  'layout', // icon, grid, full
  'theme' // light, dark
])

let rawHandlerData = null
const handlerData = ref(null)
const relayStore = useRelayStore()
const handlerStore = useHandlerStore()

function loadHandlerData() {
  // console.log('loadHandlerData', props.appId, props.info)

  const handlerId = props.info.identifier + '_' + props.info.kind + '_' + props.appId
  const cachedHandlerData = handlerStore.getHandler(handlerId)
  if(cachedHandlerData) {
    handlerData.value = cachedHandlerData
  } else {
    const filter = {
      '#d': [props.info.identifier],
      kinds: [props.info.kind],
      authors: [props.appId],
      limit: 1
    }

    const relayId = relayManager.addRelayByUrl(props.info.relay)

    // console.log('info', filter, relayId)

    const request = relayRequest()
    request.init(onHandlerData)
    request.start(relayId, [filter])
  }
}

function onHandlerData(data) {
  // console.log('onHandlerData', data)

  const handlerId = props.info.identifier + '_' + props.info.kind + '_' + props.appId
  handlerStore.addHandler(handlerId, data)

  if(typeof data.content == 'string') {
    data.content = JSON.parse(data.content)
  }

  handlerData.value = data
}

const picture = computed(() => {
  return ToolBox.dig(handlerData.value, 'content.picture')
})

const banner = computed(() => {
  return ToolBox.dig(handlerData.value, 'content.banner')
})

const name = computed(() => {
  return ToolBox.dig(handlerData.value, 'content.name')
})

const description = computed(() => {
  let result = ToolBox.dig(handlerData.value, 'content.about')

  if(props.layout == 'compact') {
    result = ToolBox.trim(result, 25, 'end')
  } else if(props.layout == 'grid') {
    result = ToolBox.trim(result, 50, 'end')
  }

  return result
})

const website = computed(() => {
  return ToolBox.dig(handlerData.value, 'content.website')
})

const handle = computed(() => {
  return ToolBox.dig(handlerData.value, 'content.nip05')
})

const lightningAddress = computed(() => {
  return ToolBox.dig(handlerData.value, 'content.lud16')
})

const kindTags = computed(() => {
  let result = null

  const tags = ToolBox.findTags(handlerData.value, 'k')

  if(tags) {
    let i=0, kind, kindId
    result = []

    for(; i<tags.length; i++) {
      kind = parseInt(tags[i])
    
      for(kindId in kinds) {
        if(kinds[kindId].kind == kind) {
          result.push({
            name: kinds[kindId].name
          })
          continue
        }
      }
    }
  }

  return result
})

const platformTags = computed(() => {
  let result = null

  if(props.info) {
    const events = props.info.events
    let i=0, event, tags, tag, k
    for(; i<events.length; i++) {
      event = events[i]
      tags = ToolBox.findTags(event, 'a')

      if(tags) {
        result = []

        for(k=0; k<tags.length; k++) {
          tag = tags[k]

          if(tag.length > 2) {
            result.push({
              name: tag[2]
            })
          }
        }
      }
    }
  }

  return result
})

const classObject = computed(() => {
  const c = ['handler-item', '-'+props.layout, '-'+props.theme]

  return c.join(' ')
})

const type = computed(() => {
  return props.layout == 'full' ? 'div' : 'button'
})

const iconSize = computed(() => {
  return props.layout == 'grid' ? 75 : 100
})

const linkInfo = computed(() => {
  return {
    profile: {
      nip05: handle.value,
      lud16: lightningAddress.value,
      website: website.value
    }
  }
})

const buttonTitle = computed(() => {
  return type.value == 'button' ? 'View ' + name.value + ' details' : null
})

function click() {
  window.emitter.emit('show-modal', {
    id: 'handler',
    appId: props.appId,
    info: props.info,
    details: handlerData.value
  })
}

onMounted(() => {
  // console.log('HandlerItem.onMounted', props.appId, props.info)
  if(props.data) {
    handlerData.value = props.data
  } else {
    loadHandlerData()
  }
})
</script>

<template>
  <component
    v-if="handlerData"
    :is="type"
    :class="classObject"
    :title="buttonTitle"
    @click="click"
  >
    <UiImage
      v-if="picture"
      :src="picture"
      class="-profile"
      :width="iconSize"
      :height="iconSize"
      radius="15"
    />
    <UiImagePlaceholder
      v-if="!picture"
      text="No image"
      class="-profile"
      :width="iconSize"
      :height="iconSize"
      :style="layout == 'full' ? 'light' : 'theme'"
      radius="15"
    />
    <div class="info">
      <template v-if="name">
        <h5 v-if="layout == 'full' && website">
          <a
            :href="website"
            target="_blank"
            rel="nofollow noopener noreferrer"
          >{{ name }}</a>
        </h5>
        <h5 v-if="layout != 'full' || !website">{{ name }}</h5>
      </template>

      <p v-if="layout != 'icon' && description">{{ description }}</p>

      <template v-if="layout == 'full'">
        <UiImage
          v-if="banner"
          :src="banner"
          class="-banner"
          radius="15"
        />
        <div class="links">
          <ProfileNostrAddress 
            :info="linkInfo" 
            theme="light" 
            size="small"
          />
          <ProfileLightningAddress 
            :info="linkInfo" 
            theme="light"
            size="small"
          />
          <ProfileWebsite 
            :info="linkInfo" 
            theme="light" 
            size="small"
          />
        </div>
        <div class="tags">
          <h3>Recommended for</h3>
          <UiTags
            :info="kindTags"
            theme="light"
          />
        </div>
        <div class="platforms">
          <h3>Platforms</h3>
          <UiTags
            :info="platformTags"
            theme="light"
          />
        </div>
      </template>
    </div>
  </component>
</template>

<style scoped lang="scss">

.handler-item {
  display: flex;
  text-decoration: none;
  appearance: none;
  background-color: transparent;
  border-width: 0;
  text-decoration: none;
  text-align: left;

  > .-profile {
    flex-shrink: 0;

    &.image {
      background-color: white;
      box-shadow: 0 8px 16px -6px rgba(0, 0, 0, 0.25);

      :deep(img) {
        width: 100%;
        height: auto;
      }
    }
  }

  .info {
    display: flex;
    flex-direction: column;

    h5 {
      font-weight: 600;

      a {
        text-decoration: none;

        &:hover {
          text-decoration: underline;
        }
      }
    }

    > p {
      margin-top: 3px;
      opacity: 0.75;
    }

    .image.-banner {
      margin-top: 20px;
      border: 1px solid rgba(black, 0.15);
      :deep(img) {
        width: 100%;
        height: auto;
      }
    }

    .links {
      margin-top: 20px;
    }

    > .tags,
    > .platforms {
      margin-top: 20px;
      display: flex;
      flex-direction: column;
      gap: 10px;

      h3 {
        font-size: 15px;
        font-weight: 500;
        color: black;
      }
    }
  }

  &.-icon {
    flex-direction: column;
    align-items: center;
    text-align: center;

    .info {
      h5 {
        margin-top: 20px;
        font-size: 15px;
      }

      > p {
        font-size: 15px;
      }
    }

    &:focus {
      outline: 2px solid rgba(var(--theme-front-rgb), 0.5);
      outline-offset: 3px;
      border-radius: 5px;
    }
  }

  &.-grid {
    gap: 15px;

    .info {
      h5 {
        font-size: 17px;
      }
      
      > p {
        font-size: 15px;
      }
    }
  }

  &.-full {
    gap: 15px;
    align-items: flex-start;

    .info {
      h5 {
        font-size: 24px;
      }
      
      > p {
        font-size: 19px;
      }
    }
  }

  &.-theme {
    .info {
      h5 {
        color: var(--theme-front);

        a {
          color: var(--theme-front);
        }
      }

      p {
        color: var(--theme-front);
      }
    }
  }

  &.-light {
    .info {
      h5 {
        a {
          color: black;
        }
      }
    }
  }
}

button.handler-item {
  cursor: pointer;
}

</style>
