<script setup>
import { useUserStore } from "@/stores/users.js"
import relayRequest from '@/helpers/relayRequest.js'
import multiRelayRequest from '@/helpers/multiRelayRequest.js'
import { useRelayStore } from '@/stores/relays'

const props = defineProps([
  'publicKey',
  'relayIds',
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
const userData = ref(null)

function loadUserData() {
  const filter = {
    kinds: [0],
    authors: [props.publicKey],
    limit: 1
  }

  const relayIds = props.relayIds || relayStore.getAll

  // console.log('Username.loadUserData', filter, props, relayIds[0])

  if(props.relayIds && props.relayIds.length == 1) {
    request = relayRequest()
    request.init(onUserData, true)
    request.start(
      relayIds[0],
      filter
    )
  } else {
    request = multiRelayRequest()
    request.init(onUserData)
    request.start(
      relayIds, 
      filter
    )
  }
}

function onUserData(data) {
  // console.log('Username.onUserData', data)

  if(data && data.type !== 'end') {
    let content = data.content
    if(typeof content == 'string') {
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
    // console.log('userLink', userData.value)
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

const userName = computed(() => {
  let result = "_____"

  if(userData.value) {
    result = userData.value.content.name

    if(result.length > 50) {
      result = result.substr(0, 20)+'...'+result.substr(result.length-20)
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

const classObject = computed(() => {
  const c = [
    'username',
    '-' + (props.layout || 'horizontal')
  ]

  if(props.showAvatar) {
    c.push('-avatar')
  }

  if(userData.value) {
    c.push('-loaded')
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
  if(request) {
    request.kill()
  }
})
</script>

<template>
  <NuxtLink
    :class="classObject"
    :to="userLink"
  >
    <UiAvatar
      v-if="showAvatar"
      :image="image"
      :name="userName"
      :style="avatarStyle"
      :size="avatarSize"
    />
    {{ userName }}
  </NuxtLink>
</template>

<style scoped lang="scss">

.username {
  color: rgba(var(--theme-front-rgb), 0.85);
  text-decoration: none;
  font-weight: 600;
  opacity: 0;
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

  &:hover {
    color: var(--theme-front);

    .avatar {
      transform: scale(0.9);
    }
  }
}

</style>