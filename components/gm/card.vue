<script setup>
import { ref, computed, watch, nextTick, onMounted } from 'vue'
import { npubEncode } from 'nostr-tools/nip19'
import { greetingHtml } from '@/helpers/gm/text.js'

/*

The card next to a sun or moon: who said it, what they said, and how many
people piled in.

 */

const props = defineProps({
  data: Object,   // { person, greeting, stats, profile }
  anchor: Object  // { x, y, size } of the sun on screen
})

defineEmits(['close'])

const element = ref(null)
const height = ref(200)

const isMoon = computed(() => props.data.person.type == 'gn')
const icon = computed(() => isMoon.value ? '🌙' : '☀️')
const name = computed(() => props.data.profile.name || props.data.person.pubkey.slice(0, 8) + '…')
const profileLink = computed(() => '/' + npubEncode(props.data.person.pubkey))
const html = computed(() => greetingHtml(props.data.greeting.event))

const when = computed(() => {
  const seconds = Math.floor(Date.now() / 1000) - props.data.greeting.t
  if(seconds < 90) return 'just now'
  const minutes = Math.round(seconds / 60)
  if(minutes < 60) return `${minutes} min ago`
  return `${Math.round(minutes / 60)} h ago`
})

const statsText = computed(() => {
  const { people, zaps, sats } = props.data.stats
  const parts = [people ? `${icon.value} ${people} piled in` : `${icon.value} Nobody piled in yet`]
  if(zaps) parts.push(`⚡ ${sats.toLocaleString()} sats`)
  return parts.join('  ·  ')
})

const avatarStyle = computed(() => {
  const picture = props.data.profile.picture
  return picture ? { backgroundImage: `url("${picture.replace(/"/g, '%22')}")` } : {}
})

// Beside the sun, on whichever side has room.
const position = computed(() => {
  const width = Math.min(320, window.innerWidth - 24)
  const { x, y, size } = props.anchor
  let left = x + size / 2 + 22
  if(left + width > window.innerWidth - 12) left = x - size / 2 - 22 - width
  left = Math.max(12, Math.min(window.innerWidth - width - 12, left))
  const top = Math.max(80, Math.min(window.innerHeight - height.value - 90, y - height.value / 2))
  return { left: left + 'px', top: top + 'px', width: width + 'px' }
})

function measure() {
  if(element.value) height.value = element.value.offsetHeight
}

watch(() => props.data.greeting, () => nextTick(measure))
onMounted(measure)
</script>

<template>
  <div ref="element" class="gm-card" :class="{ '-moon': isMoon }" :style="position" @click.stop>
    <button class="close" aria-label="Close" @click="$emit('close')">×</button>
    <div class="head">
      <div class="avatar" :style="avatarStyle"></div>
      <div class="who">
        <b>{{ name }}</b>
        <small>{{ when }}</small>
      </div>
    </div>
    <p class="text" v-html="html"></p>
    <p class="stats">{{ statsText }}</p>
    <NuxtLink :to="profileLink" class="profile">View profile</NuxtLink>
  </div>
</template>

<style scoped lang="scss">

.gm-card {
  position: absolute;
  z-index: 20;
  padding: 16px;
  border-radius: 20px;
  background: rgba(255, 252, 244, 0.97);
  color: #2a1c08;
  box-shadow: 0 18px 50px rgba(0, 0, 0, 0.35);
  user-select: text;

  &.-moon {
    background: rgba(246, 247, 255, 0.97);
    color: #1c2050;
  }

  .close {
    position: absolute;
    top: 8px;
    right: 10px;
    border: 0;
    background: none;
    font-size: 22px;
    line-height: 1;
    cursor: pointer;
    color: inherit;
    opacity: 0.5;

    &:hover {
      opacity: 1;
    }
  }

  .head {
    display: flex;
    gap: 10px;
    align-items: center;
    margin-bottom: 10px;
    padding-right: 20px;
  }

  .avatar {
    width: 42px;
    height: 42px;
    border-radius: 50%;
    flex: none;
    background: #ffcf5c center / cover;
    border: 2px solid #ffcf5c;
  }

  &.-moon .avatar {
    background-color: #c9d0f5;
    border-color: #c9d0f5;
  }

  .who {
    min-width: 0;

    b {
      display: block;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    small {
      opacity: 0.6;
    }
  }

  p {
    color: inherit;
  }

  .text {
    font-size: 15px;
    line-height: 1.45;
    margin-bottom: 12px;
    overflow-wrap: anywhere;

    :deep(img.emoji) {
      height: 1.4em;
      vertical-align: middle;
    }
  }

  .stats {
    font-size: 13px;
    opacity: 0.75;
    margin-bottom: 12px;
  }

  .profile {
    display: block;
    text-align: center;
    padding: 9px 14px;
    border-radius: 12px;
    font-weight: 700;
    text-decoration: none;
    background: #ffcf5c;
    color: #4a2600;
    transition: transform 150ms $ease;

    &:hover {
      transform: scale(1.02);
    }
  }

  &.-moon .profile {
    background: #c9d0f5;
    color: #1c2050;
  }
}

</style>
