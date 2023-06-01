<script setup>
import userService from '@/helpers/userService.js'
import relayRequest from '@/helpers/relayRequest.js'
import multiRelayRequest from '@/helpers/multiRelayRequest.js'
import { useUserStore } from "@/stores/users.js"
import { useRelayStore } from '@/stores/relays'
import ToolBox from '@/helpers/toolBox'

const props = defineProps([
  'publicKey',
  'relayIds',
  'hideName',
  'showAvatar',
  'avatarSize',
  'avatarStyle',
  'theme',
  'layout'
])

const userStore = useUserStore()
const relayStore = useRelayStore()

let request = null
let rawUserData = null
let loadTimer = null
const loadCallback = onUserData.bind(this)
const loadTimerDone = ref(false)
const userData = ref(null)

function loadUserData() {
  const filter = {
    kinds: [0],
    authors: [props.publicKey],
    limit: 1
  }

  const relayIds = props.relayIds || relayStore.getAll

  loadTimer = setTimeout(onLoadTimer, 5000)

  window.emitter.on('profile-'+props.publicKey, loadCallback)

  userService.getProfile(props.publicKey, relayIds)
}

function onLoadTimer() {
  loadTimerDone.value = true
}

function onUserData(data) {
  // console.log('Username.onUserData', data)

  if(data && data.type !== 'end') {
    let content = data.content
    if(typeof content == 'string' && content.length > 0) {
      content = JSON.parse(data.content)
    }

    data.content = content
    rawUserData = data

    userData.value = data
  }
}

const userLink = computed(() => {
  let result = null

  if(userData.value) {
    const relay = relayStore.getRelay(userData.value.relay)
    const nprofile = window.NostrTools.nip19.nprofileEncode({
      pubkey: userData.value.pubkey,
      relays: [relay.url]
    })

    result = '/' + nprofile

    if(props.theme) {
      result += '?t=' + props.theme
    }
  }

  return result
})

const type = computed(() => {
  return userLink.value ? 'NuxtLink' : 'div'
})

const userName = computed(() => {
  let result = ToolBox.trim(props.publicKey, 8)

  if(userData.value) {
    result = userData.value.content.name

    if(result) {
      result = ToolBox.trim(result, 50)
    }
  }

  return result
})

const image = computed(() => {
  let result = null

  if(userData.value) {
    result = userData.value.content ? userData.value.content.picture : null
  }

  return result
})

const title = computed(() => {
  let result = null

  if(!userData.value) {
    if(loadTimerDone.value) {
      result = 'Could not load profile.'
    } else {
      result = 'Loading...'
    }
  }

  return result
})

const classObject = computed(() => {
  const c = ['username']

  if(props.layout) {
    c.push('-'+props.layout)
  }

  if(props.showAvatar) {
    c.push('-avatar')
  }

  if(userData.value) {
    c.push('-loaded')
  }

  if(loadTimerDone.value) {
    c.push('-timer')
  }

  return c.join(' ')
})

onMounted(() => {
  const data = userStore.getUser(props.publicKey)
  if(data) {
    userData.value = data
  } else {
    loadUserData()
  }
})

onBeforeUnmount(() => {
  if(loadTimer) {
    clearTimeout(loadTimer)
  }

  window.emitter.off('profile-'+props.publicKey, loadCallback)

  if(request) {
    request.kill()
  }
})
</script>

<template>
  <NuxtLink
    :class="classObject"
    :to="userLink"
    :title="title"
  >
    <UiAvatar
      v-if="showAvatar"
      :image="image"
      :name="userName"
      :style="avatarStyle"
      :size="avatarSize"
    />
    <template v-if="!hideName">{{ userName }}</template>
  </NuxtLink>
</template>

<style scoped lang="scss">

.username {
  color: rgba(var(--theme-front-rgb), 0.85);
  text-decoration: none;
  font-weight: 600;
  opacity: 0.25;
  transition: opacity 150ms $ease;
  pointer-events: none;

  .avatar {
    transition: all 250ms $ease;
  }

  &.-horizontal {
    display: flex;
    justify-content: center;
    gap: 7px;
  }

  &.-vertical {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    text-align: center;
  }

  &.-loaded {
    opacity: 1;
    pointer-events: auto;
  }

  &.-timer {
    opacity: 1;
    pointer-events: auto;
  }

  &:hover {
    color: var(--theme-front);

    .avatar {
      transform: scale(0.9);
    }
  }
}

</style>
