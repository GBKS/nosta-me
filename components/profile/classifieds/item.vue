<script setup>
import { useRelayStore } from '@/stores/relays'
import ToolBox from '@/helpers/toolBox'
import linkHelper from '@/helpers/linkHelper.js'

const relayStore = useRelayStore()

const props = defineProps([
  'info',
  'handlers'
])

const title = computed(() => {
  const tag = props.info.tags.find(tag => tag[0] == 'title')
  return ToolBox.trim(tag[1], 50, 'end')
})

const summary = computed(() => {
  const tag = props.info.tags.find(tag => tag[0] == 'summary')
  return ToolBox.trim(tag[1], 100, 'end')
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
    const tag = props.info.tags.find(tag => tag[0] == tagName)
    if(tag) result = tag[1]
  }

  return result
})

const image = computed(() => {
  const tag = ToolBox.findTag(props.info, 'image')
  return tag ? tag[0] : null
})

const status = computed(() => {
  const tag = props.info.tags.find(tag => tag[0] == 'status')
  return tag ? tag[1] : null
})

const link = computed(() => {
  const tag = props.info.tags.find(tag => tag[0] == 'd')
  const relay = relayStore.getRelay(props.info.relay)

  return linkHelper.address(
    tag[1], 
    props.info.pubkey,
    props.info.kind,
    relay.url,
    props.handlers,
    linkHelper.ostrich.job
  )
})

const formattedDate = computed(() => {
  const tag = props.info.tags.find(tag => tag[0] == 'published_at')
  return tag ? ToolBox.formatRelativeDate(parseInt(tag[1])) : null
})

// Initial spec format is just a string, then changed to [price, number, currency, frequence]
const price = computed(() => {
  const price = props.info.tags.find(tag => tag[0] == 'price')
  if(price.length == 2) {
    return price[1]
  } else {
    const format = new Intl.NumberFormat(undefined, { style: 'currency', currency: price[2] })
    let result = format.format(price[1])
    if(price.length > 3) {
      result += ' ' + price[3]
    }
    return result
  }
})

// Remote · 1000 sats per month · Jul 14
const meta = computed(() => {
  const location = props.info.tags.find(tag => tag[0] == 'location')
  const bits = []
  if(location) bits.push(location[1])
  if(price.value) bits.push(price.value)
  if(formattedDate.value) bits.push(formattedDate.value)
  return bits.length > 0 ? bits.join(' · ') : null
})

const classObject = computed(() => {
  const c = ['classifieds-item']

  if(status.value) c.push('-'+status.value)

  return c.join(' ')
})
</script>

<template>
  <div :class="classObject">
    <h5 v-if="title">
      <a
        :href="link"
        target="_blank"
        rel="nofollow noopener noreferrer"
      >{{ title }}</a>
    </h5>
    <p v-if="summary">{{ summary }}</p>
    <p v-if="meta">{{ meta }}</p>
    <ProfileBitsTags :info="info" align="center" max="5" />
  </div>
</template>

<style scoped lang="scss">

.classifieds-item {
  display: flex;
  flex-direction: column;
  align-items: center;

  h5 {
    font-size: 17px;
    font-weight: 600;
    text-align: center;
    word-break: break-all;

    a {
      text-decoration: none;
      color: var(--theme-front);
    }
  }

  > p {
    margin-top: 3px;
    font-size: 15px;
    color: var(--theme-front);
    opacity: 0.75;
    text-align: center;

    & + p {
      margin-top: 3px;
    }

    & + .tags {
      margin-top: 10px;
    }
  }
}

</style>
