<script setup>
import relayRequest from '@/helpers/relayRequest.js'
import multiRelayRequest from '@/helpers/multiRelayRequest.js'
import { useRelayStore } from '@/stores/relays'
import linkHelper from '@/helpers/linkHelper.js'

const props = defineProps([
  'info',
  'handlers'
])

let rawBadgeData = null
const badgeData = ref(null)
const imageStatus = ref(null)
const relayStore = useRelayStore()
let badgeTag = null

function loadBadgeData() {
  // console.log('loadBadgeData', props.info)
  let tag, i
  for(i=0; i<props.info.tags.length; i++) {
    tag = props.info.tags[i]
    if(tag[0] == 'a') {
      requestBadgeData(tag[i])
      break
    }
  }
}

function requestBadgeData(tag) {
  badgeTag = tag
  const bits = tag.split(':')

  const filter = {
    kinds: [parseInt(bits[0])],
    'authors': [bits[1]],
    '#d': [bits[2]],
    limit: 1
  }

  // console.log('requestBadgeData', tag, filter)

  const request = multiRelayRequest()
  request.init(onBadgeData)
  request.start(relayStore.getAll, [filter])

  // const request = relayRequest()
  // request.init(onBadgeData, false)
  // request.start(
  //   props.info.relay,
  //   filter
  // )
}

function onBadgeData(data) {
  // console.log('onBadgeData', data)

  rawBadgeData = data
  const refinedData = {
    thumbs: []
  }

  const tags = data.tags
  let i, tag
  for(i=0; i<tags.length; i++) {
    tag = tags[i]

    switch(tag[0]) {
      case 'name':
        refinedData.name = tag[1]
        break
      case 'description':
        refinedData.description = tag[1]
        break
      case 'thumb':
        refinedData.thumbs.push(formatThumbData(tag))
        break
    }
  }

  // console.log('refinedData', refinedData)

  badgeData.value = refinedData
}

function formatThumbData(tag) {
  const result = {
    image: tag[1]
  }

  if(tag.length > 2) {
    const sizeBits = tag[2].split('x')

    if(sizeBits.length == 2) {
      result.width = sizeBits[0]
      result.height = sizeBits[1]
    }
  }

  return result
}

const thumb = computed(() => {
  let result = null

  if(badgeData.value.thumbs.length > 0) {
    result = badgeData.value.thumbs[0]
  }

  return result
})

const link = computed(() => {
  let result = null

  if(badgeTag && rawBadgeData) {
    const bits = badgeTag.split(':')

    const relay = relayStore.getRelay(rawBadgeData.relay)

    const url = linkHelper.address(
      bits[2],
      bits[1], 
      bits[0],
      relay.url,
      props.handlers,
      linkHelper.badges.badge
    )

    if(url) {
      result = url
    }
  }

  return result
})

const classObject = computed(() => {
  const c = ['badge-item']

  if(imageStatus.value) {
    c.push('-'+imageStatus.value)
  }

  return c.join(' ')
})

function imageLoaded() {
  imageStatus.value = 'loaded'
}

function imageLoadError() {
  imageStatus.value = 'error'
}

onMounted(() => {
  // console.log('BadgeItem.onMounted', props.info)
  loadBadgeData()
})
</script>

<template>
  <Transition name="fade" appear>
    <a
      v-if="badgeData"
      :class="classObject"
      :href="link"
      target="_blank"
      rel="nofollow noopener noreferrer"
    >
      <img
        v-if="thumb && imageStatus != 'error'"
        :src="thumb.image"
        :alt="badgeData.name"
        :width="thumb.width"
        :height="thumb.height"
        @load="imageLoaded"
        @error="imageLoadError"
      />
      <div
        v-if="!thumb || imageStatus == 'error'"
        class="error"
      >
        <p>Could not load image.</p>
      </div>
      <h5>{{ badgeData.name }}</h5>
      <p>{{ badgeData.name }}</p>
      <UiUsername
        :publicKey="rawBadgeData.pubkey"
        :relayIds="[rawBadgeData.relay]"
      />
    </a>
  </Transition>
</template>

<style scoped lang="scss">

.badge-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-decoration: none;

  img {
    width: 125px;
    height: 125px;
    object-fit: contain;
  }

  .error {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 125px;
    padding: 5px;
    box-sizing: border-box;
    border-radius: 15px;
    background-color: rgba(var(--theme-back-rgb), 0.2);
    border: 1px solid rgba(var(--theme-front-rgb), 0.2);
  }

  h5 {
    margin-top: 20px;
    font-size: 17px;
    font-weight: 600;
    color: var(--theme-front);
  }

  p {
    margin-top: 3px;
    font-size: 15px;
    color: var(--theme-front);
    opacity: 0.75;
  }
}

</style>
