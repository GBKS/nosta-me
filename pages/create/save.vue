<script setup>
import { useProfileStore } from '@/stores/profile'
import { useSessionStore } from '@/stores/session'
import profilePublisher from '@/helpers/create/profilePublisher.js'
import profileInitializer from '@/helpers/create/profileInitializer.js'
import Icons from '@/helpers/icons'

definePageMeta({
  layout: "create",
  pageTransition: {
    name: 'slide-right'
  },
  middleware (to, from) {
    if(to.name == 'create-save' && from.name == 'create-done') {
      to.meta.pageTransition.name = 'slide-left'
      from.meta.pageTransition.name = 'slide-left'
    } else {
      to.meta.pageTransition.name = 'slide-right'
      from.meta.pageTransition.name = 'slide-right'
    }
  }
})

const router = useRouter()
const store = useProfileStore()
const sessionStore = useSessionStore()
const state = ref('default')
const saveStart = ref(null)
let publisher = null

const profileLink = computed(() => {
  return '/' + store.npub
})

const backEnabled = computed(() => {
  return state.value == 'default'
})

function pressButton() {
  if(state.value == 'default') {
    startSave()
  } else if(state.value == 'success') {
    router.push('/create/done')
  } else if(state.value == 'error') {
    startSave()
  }
}

function onPublishStatus(status) {
  console.log('onPublishStatus', status)

  const metaDone = status.meta.status == 'success'
  const relaysDone = status.relays.status == 'success'
  const followsDone = status.follows.status == 'success'

  if(metaDone && relaysDone && followsDone) {
    onSaveSuccess()
  }
}

function startSave() {
  saveStart.value = new Date()
  state.value = 'saving'

  if(!publisher) {
    publisher = profilePublisher()
    publisher.publish(onPublishStatus)
    // publisher.testPublish(onPublishStatus)
  }

  // setTimeout(onTimer, 5000)
}

function onTimer() {
  if(Math.random() > 0.5) {
    onSaveSuccess()
  } else {
    onSaveError()
  }
}

function onSaveSuccess() {
  state.value = 'success'

  login()
}

function onSaveError() {
  state.value = 'error'

  // Log user in anyways.
  login()
}

function login() {
  sessionStore.setLoginType('privatekey')
  sessionStore.setPrivateKey(store.privateKey)
  sessionStore.setPublicKey(store.publicKey)
  sessionStore.setLoggedIn(true)
}

const optionsClass = computed(() => {
  const c = ['options', '-'+state.value]

  return c.join(' ')
})

const title = computed(() => {
  let result = 'Ready to save?'

  if(!state.value == 'error') {
    result = 'Oh no!'
  } else if(state.value == 'success') {
    result = 'Hooray!'
  }

  return result
})

const description = computed(() => {
  let result = 'Press “Save” to broadcast your profile to lots of relays, so others can find your information.'

  if(!state.value == 'error') {
    result = 'Something went wrong, we’re so sorry.  Let’s cross our fingers and try this again.'
  } else if(state.value == 'success') {
    result = 'That worked! Your profile is now broadly available on many Nostr relays for others to follow you.'
  }

  return result
})

const buttonDisabled = computed(() => {
  return state.value == 'saving'
})

const buttonLabel = computed(() => {
  let result = 'Save'

  switch(state.value) {
    case 'saving':
      result = 'Saving...'
      break
    case 'success':
      result = 'Next'
      break
    case 'error':
      result = 'Retry'
      break
  }

  return result
})

onMounted(() => {
  profileInitializer.init()

  login()
})
</script>

<template>
  <div class="save-page -create-page">
    <div class="content">
      <div class="copy">
        <p class="-step">Done!</p>
        <h1>{{ title }}</h1>
        <p class="-description">{{ description }}</p>
      </div>
    </div>
    <div :class="optionsClass">
      <CreateSaveIcon :state="state" />
      <UiButton
        size="small"
        :disabled="buttonDisabled"
        @click="pressButton"
      >{{ buttonLabel }}</UiButton>
    </div>
    <nav>
      <UiButton
        to="/create/review" 
        icon="arrowLeft" 
        size="small"
        :disabled="!backEnabled"
      ></UiButton>
    </nav>
  </div>
</template>

<style scoped lang="scss">

.save-page {
  .options {
    gap: 25px;

    &.-default {

    }

    &.-saving {
      position: relative;
    }

    &.-success {

    }

    &.-error {

    }
  }
}

</style>