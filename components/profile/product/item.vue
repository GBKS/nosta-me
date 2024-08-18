<script setup>
import relayRequest from '@/helpers/relayRequest.js'
import multiRelayRequest from '@/helpers/multiRelayRequest.js'
import { useRelayStore } from '@/stores/relays'
import ToolBox from '@/helpers/toolBox'

const props = defineProps([
  'info'
])

const imageStatus = ref(null)

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

const images = computed(() => {
  let result = null

  if(props.info.content.images && props.info.content.images.length > 0) {
    result = props.info.content.images
  }

  return result
})

const thumb = computed(() => {
  let result = null

  if(props.info.content.images.length > 0) {
    result = props.info.content.images[0]
  }

  return result
})

const link = computed(() => {
  // The seemingly duplicate params seem to be how market.nostr.com wants things formatted. Maybe double-check.
  const bits = {
    merchant_pubkey: props.info.pubkey,
    stall_id: props.info.content.stall_id,
    product_id: props.info.content.id,
    merchant: props.info.pubkey,
    stall: props.info.content.stall_id,
    product: props.info.content.id
  }

  const params = []
  for(let key in bits) {
    params.push(key+'='+bits[key])
  }

  return 'https://market.nostr.com?' + params.join('&')
})

const classObject = computed(() => {
  const c = ['product-item']

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

const title = computed(() => {
  return props.info.content.name.length > 0 ? props.info.content.name : null
})

const description = computed(() => {
  return props.info.content.description.length > 0 ? props.info.content.description : null
})

const currency = computed(() => {
  return props.info.content.currency.length > 0 ? props.info.content.currency : null
})

const price = computed(() => {
  return props.info.content.price > 0 ? props.info.content.price : null
})

const formattedPrice = computed(() => {
  const format = new Intl.NumberFormat(undefined, { style: 'currency', currency: currency.value })
  const result = format.format(price.value)
  return result
})

const quantity = computed(() => {
  return props.info.content.quantity > 0 ? props.info.content.quantity : null
})

const meta = computed(() => {
  return formattedPrice.value + ' · ' + quantity.value + ' available'
})

const formattedDate = computed(() => {
  return ToolBox.formatRelativeDate(props.info.created_at)
})

const tags = computed(() => {
  return ToolBox.findTags(props.info, ['t'])
})

const hasTags = computed(() => {
  return tags.value && tags.value.length > 0
})
</script>

<template>
  <div :class="classObject">
    <ProfileProductItemImages :images="images" />
    <div class="copy">
      <h5>
        <a
        :href="link"
        target="_blank"
        rel="nofollow noopener noreferrer"
      >{{ title }}</a>
      </h5>
      <p>{{ description }}</p>
      <p>{{ meta }}</p>
      <ProfileBitsTags :info="info" align="left" />
    </div>
  </div>
</template>

<style scoped lang="scss">

.product-item {
  display: flex;
  align-items: center;
  text-decoration: none;
  @include r('gap', 10, 25);

  .images {
    img {
      width: 125px;
      height: 125px;
      object-fit: cover;
      border-radius: 15px;
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
  }

  .copy {
    h5 {
      a {
        font-size: 17px;
        font-weight: 600;
        color: var(--theme-front);
        text-decoration: none;
        transition: all 150ms $ease;

        &:hover {
          opacity: 0.75;
        }
      }
    }

    > p {
      margin-top: 3px;
      font-size: 15px;
      color: var(--theme-front);

      &:first-of-type {
        opacity: 0.75;
      }
    }

    .tags {
      margin-top: 10px;
    }
  }

  @include media-query(small) {
    flex-direction: column;
  }

  @include media-query(medium-up) {
    
  }
}

</style>
