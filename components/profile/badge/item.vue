<script setup>
import { useRelayStore } from '@/stores/relays'
import linkHelper from '@/helpers/linkHelper.js'
import badgeDefinitionService from '@/helpers/badgeDefinitionService.js'

// info is a badge as returned by badgeHelper.profileBadges()
const props = defineProps([
  'info',
  'handlers'
])

const imageStatus = ref(null)
const relayStore = useRelayStore()

// The badge definition event (kind 30009)
const rawBadgeData = computed(() => {
  return badgeDefinitionService.definitions[props.info.address] || null
})

const badgeData = computed(() => {
  if(!rawBadgeData.value) return null

  const refinedData = {
    thumbs: []
  }

  const tags = rawBadgeData.value.tags
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
      case 'image':
        refinedData.image = formatThumbData(tag)
        break
      case 'thumb':
        refinedData.thumbs.push(formatThumbData(tag))
        break
    }
  }

  return refinedData
})

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
  } else if(badgeData.value.image) {
    // Thumbnails are optional
    result = badgeData.value.image
  }

  return result
})

const link = computed(() => {
  let result = null

  const relay = rawBadgeData.value ? relayStore.getRelay(rawBadgeData.value.relay) : null

  if(relay) {
    const url = linkHelper.address(
      props.info.identifier,
      props.info.pubkey,
      props.info.kind,
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
  badgeDefinitionService.load(props.info)
})
</script>

<template>
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
    text-align: center;
  }

  p {
    margin-top: 3px;
    font-size: 15px;
    color: var(--theme-front);
    opacity: 0.75;
    text-align: center;
  }
}

</style>
