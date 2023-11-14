<script setup>
import { useRelayStore } from '@/stores/relays'
import ToolBox from '@/helpers/toolBox'

const relayStore = useRelayStore()

const props = defineProps([
  'info'
])

const emit = defineEmits(['navigate'])

const title = computed(() => {
  const result = props.info.tags.find(tag => tag[0] == 'd')
  return result ? ToolBox.trim(result[1], 50, 'end') : null
})

const description = computed(() => {
  const result = props.info.tags.find(tag => tag[0] == 'description')
  return result ? ToolBox.trim(result[1], 50, 'end') : null
})

const category = computed(() => {
  const result = props.info.tags.find(tag => tag[0] == 'c')
  return result ? result[1] : null
})

const type = computed(() => {
  const result = props.info.tags.find(tag => tag[0] == 'f')
  return result ? result[1] : null
})

const image = computed(() => {
  const result = props.info.tags.find(tag => tag[0] == 'image')
  return result
})

const link = computed(() => {
  let result = null

  const titleTag = props.info.tags.find(tag => tag[0] == 'd')
  if(titleTag) {
    const npub = window.NostrTools.nip19.npubEncode(props.info.pubkey)
    result = 'https://pinstr.app/p/'+npub+'/'+encodeURIComponent(titleTag[1])
  }

  return result
})

const pins = computed(() => {
  return props.info.tags.filter(tag => tag[0] == 'pin')
})

const meta = computed(() => {
  const bits = []

  if(category.value) bits.push(category.value)

  const pinCount = pins.value.length
  if(pinCount > 0 && type.value) {
    let bit = pinCount + ' ' + type.value + (pinCount == 1 ? '' : 's')
    bits.push(bit.toLowerCase())
  }

  return bits.length > 0 ? bits.join(' · ') : null
})

const classObject = computed(() => {
  const c = ['pinstr-board']

  if(status.value) c.push('-'+status.value)

  return c.join(' ')
})

function navigate() {
  emit('navigate', props.info)
}
</script>

<template>
  <div
    :class="classObject"
    role="button"
    @click="navigate"
  >
    <UiImage
      :src="image[1]"
    />
    <h5 v-if="title">{{ title }}</h5>
    <p v-if="description">{{ description }}</p>
    <p v-if="meta">{{ meta }}</p>
  </div>
</template>

<style scoped lang="scss">

.pinstr-board {
  display: flex;
  flex-direction: column;
  text-decoration: none;
  cursor: pointer;

  :deep(.image) {
    img {
      border-radius: 5px;
      aspect-ratio: 1.33;
      object-fit: cover;
      object-position: center center;
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
    word-break: break-all;
  }

  > p {
    margin-top: 3px;
    font-size: 15px;
    color: var(--theme-front);
    opacity: 0.75;
  }

  &:hover {
    h5 {
      text-decoration: underline;
    }
  }
}

</style>
