/*

Quite a bit of complexity in this one.

Only renders if:

1. The user is logged in
2. Not on their own profile
3. The logged-in users contacts are loaded

Supported states:

- Invisible (logged-in and on your own profile, in which case an edit button is shown)
- Disabled (logged-out or contacts could not be loaded, or are still loading)
- "Follow" (you don't follow them)
- "Following" (you follow them)

 */

<script setup>
import { storeToRefs } from 'pinia'

import { useSessionStore } from '@/stores/session'
import sessionContactsService from '@/helpers/sessionContactsService.js'

const props = defineProps([
  'publicKey'
])

const logEnabled = !false
const sessionStore = useSessionStore()
const { isLoggedIn } = storeToRefs(sessionStore)
const isLoading = ref(true)
const isFollowing = ref(false)

const title = computed(() => {
  let result = null

  if(!isLoggedIn.value) {
    result = 'Log in to follow'
  } else if(isLoading.value) {
    result = 'Loading...'
  }

  return result
})

function logger(...args) {
  if(logEnabled) {
    console.log('FollowButton', ...args)
  }
}

const buttonLabel = computed(() => {
  let result = 'Follow'

  if(isLoggedIn.value) {
    result = isFollowing.value ? 'Following' : 'Follow'
  }

  return result
})

const icon = computed(() => {
  return isFollowing.value ? 'check' : null
})

const disabled = computed(() => {
  let result = false

  logger('disabled', isLoading.value, isLoading.value)
  if(!isLoggedIn.value || isLoading.value) {
    result = true
  }

  return result
})

const to = computed(() => {
  return isLoggedIn.value ? '/login/options' : null
})

async function click() {
  logger('click', isLoggedIn.value, sessionContactsService.isReady())
  if(isLoggedIn.value && sessionContactsService.isReady()) {
    logger('isFollowing', isFollowing.value) 
    if(isFollowing.value) {
      const unfollowText = 'Sure you want to unfollow?'
      if(confirm(unfollowText)) {
        const unfollowResult = await sessionContactsService.unfollow(props.publicKey)
        if(unfollowResult.success) {
          updateIsFollowing()
        }
      }
    } else {
      if(!sessionContactsService.isLoaded()) {
        const newListText = 'Is this the first person you follow?'
        if(!confirm(newListText)) {
          const warningText = 'Sorry, we could not find your existing follow list. If you continue, you will lose your current list. Continue?'
          if(!confirm(warningText)) {
            return
          }
        }
      }

      const followResult = await sessionContactsService.follow(props.publicKey)
      if(followResult.success) {
        updateIsFollowing()
      }
    }
  }
}

function updateIsFollowing() {
  isFollowing.value = sessionContactsService.isFollowing(props.publicKey)
}

function onSessionContactsUpdate(data) {
  logger('onSessionContactsUpdate', data)
  isLoading.value = false
  updateIsFollowing()
}

onMounted(() => {
  logger('mounted', isLoggedIn.value)
  if(isLoggedIn.value) {
    window.emitter.on('session-contacts', onSessionContactsUpdate)
    sessionContactsService.init()

    if(sessionContactsService.isReady()) {
      updateIsFollowing()
    }

    logger('mounted sessionContactsService.isLoaded', sessionContactsService.isLoaded())

    isLoading.value = !sessionContactsService.isLoaded()
  }
})

onBeforeUnmount(() => {
  window.emitter.off('session-contacts', onSessionContactsUpdate)
})
</script>

<template>
  <UiButton
    class="follow-button"
    look="tab"
    :icon="icon"
    :disabled="disabled"
    :title="title"
    @click="click"
  >{{ buttonLabel }}</UiButton>

</template>

<style scoped lang="scss">

.follow-button {

}

</style>
