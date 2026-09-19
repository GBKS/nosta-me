<script setup>
import { useProfileStore } from '@/stores/profile'
import { useSessionStore } from '@/stores/session'
import profilePublisher from '@/helpers/create/profilePublisher.js'
import { OUTCOME } from '@/helpers/create/publishTracker.js'
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
const savedEvents = ref(null) // Which of the three events made it, once saving is over
let publisher = null

const profileLink = computed(() => {
  return '/' + store.npub
})

// Going back is fine at any time but in the middle of saving.
const backEnabled = computed(() => {
  return state.value != 'saving'
})

function pressButton() {
  if(state.value == 'default' || state.value == 'error') {
    startSave()
  } else if(state.value == 'success' || state.value == 'partial') {
    router.push('/create/done')
  }
}

// status.summary says how it is going, see publishTracker
function onPublishStatus(status) {
  if(!status.summary || state.value != 'saving') return

  switch(status.summary.outcome) {
    case OUTCOME.SUCCESS:
      savedEvents.value = status.summary.events
      onSaveSuccess()
      break
    case OUTCOME.PARTIAL:
      savedEvents.value = status.summary.events
      // Without the profile itself there is nothing to go on with.
      if(status.summary.events.meta && status.summary.events.meta.saved) {
        state.value = 'partial'
        login()
      } else {
        onSaveError()
      }
      break
    case OUTCOME.ERROR:
      savedEvents.value = status.summary.events
      onSaveError()
      break
  }
}

function startSave() {
  saveStart.value = new Date()
  state.value = 'saving'
  savedEvents.value = null

  // A fresh one for every attempt, so that trying again really tries again.
  if(publisher) publisher.kill()

  publisher = profilePublisher()
  publisher.publish(onPublishStatus)
}

function onSaveSuccess() {
  state.value = 'success'
  login()
}

function onSaveError() {
  state.value = 'error'
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
  switch(state.value) {
    case 'saving': return 'Saving...'
    case 'success': return 'Hooray!'
    case 'partial': return 'Almost!'
    case 'error': return 'Oh no!'
  }

  return 'Ready to save?'
})

// What did not get saved, in words. Only used when the profile itself did.
const missingParts = computed(() => {
  const events = savedEvents.value || {}
  const missing = []

  if(events.relays && !events.relays.saved) missing.push('your relay list')
  if(events.follows && !events.follows.saved) missing.push('the people you follow')

  return missing.join(' and ')
})

const description = computed(() => {
  switch(state.value) {
    case 'saving':
      return 'Sending your profile to the relays. This takes a few seconds, 20 at the most.'
    case 'success':
      return 'That worked! Your profile is now broadly available on many Nostr relays for others to follow you.'
    case 'partial':
      return 'Your profile is saved, but ' + missingParts.value + ' did not make it to any relay. You can go on and add that later in the app you use, or go back and save again.'
    case 'error':
      return 'None of the relays accepted your profile. They may be busy or down, or you may be offline. Nothing is lost, your profile is still here. Try again, or go back and pick other relays.'
  }

  return 'Press “Save” to broadcast your profile to lots of relays, so others can find your information.'
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
    case 'partial':
      result = 'Next'
      break
    case 'error':
      result = 'Retry'
      break
  }

  return result
})

onBeforeUnmount(() => {
  if(publisher) publisher.kill()
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
      <CreateSaveIcon :state="state == 'partial' ? 'success' : state" />
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