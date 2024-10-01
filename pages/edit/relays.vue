<script setup>
import relayPublishRequest from '@/helpers/relayPublishRequest.js'
import sessionRelayService from '@/helpers/sessionRelayService.js'
import relayManager from '@/helpers/relayManager.js'
import { useRelayStore } from '@/stores/relays'
import { useSessionStore, LOGIN_TYPE } from '@/stores/session'
import browserHelper from '@/helpers/browserHelper.js'

definePageMeta({
  layout: "edit"
})

const logEnabled = false
const sessionStore = useSessionStore()
const relayStore = useRelayStore()
const isSaving = ref(false)
const relayIds = ref(sessionRelayService.relayIds)
const relayIdsToRemove = ref([])
const relayUrlsToAdd = ref([])

function onSessionRelays(relays) {
  logger('onSessionRelays', relays)
  relayIds.value = sessionRelayService.relayIds
}

function logger(...args) {
  if(logEnabled) {
    console.log('EditRelays', ...args)
  }
}

const saveEnabled = computed(() => {
  return relayIdsToRemove.value.length > 0 || relayUrlsToAdd.value.length > 0
})

const hasChanges = computed(() => {
  return relayIdsToRemove.value.length > 0 || relayUrlsToAdd.value.length > 0
})

const saveChangesLabel = computed(() => {
  const count = relayIdsToRemove.value.length + relayUrlsToAdd.value.length
  const result = 'Save ' + count + ' change' + (count > 1 ? 's' : '')
  return result
})

function addRelayUrl(url) {
  console.log('addrelayUrl', url)  
  relayUrlsToAdd.value.push(url)
}

function removeRelay(relayId) {
  if(!relayIdsToRemove.value.includes(relayId)) {
    relayIdsToRemove.value.push(relayId)
  }
}

function removeRelayUrl(relayUrl) {
  const index = relayUrlsToAdd.value.indexOf(relayUrl)
  if(index > -1) {
    relayUrlsToAdd.value.splice(index, 1)
  }
}

function cancelRemoveRelay(relayId) {
  const index = relayIdsToRemove.value.indexOf(relayId)
  if(index > -1) {
    relayIdsToRemove.value.splice(index, 1)
  }
}

function saveChanges() {
  console.log('saveChanges')
  publish()
}

/*

- Send the updated relay list to the new relays we are going to use
- Do we need to request event deletion from relays we are no longer using?
  This could als include the profile event...

*/ 
async function publish() {
  const event = {
    pubkey: sessionStore.publicKey,
    created_at: Math.floor(Date.now() / 1000),
    kind: 10002,
    tags: [],
    content: ''
  }

  console.log('EditRelays.publish', relayIds, relayIds.value)

  const newRelayIds = []

  // Add existing ones that are not being deleted
  let i=0, relayId, relayUrl, relay
  for(i=0; i<relayIds.value.length; i++) {
    relayId = relayIds.value[i]

    if(!relayIdsToRemove.value.includes(relayId)) {
      newRelayIds.push(relayId)
    }
  }

  for(i=0; i<relayUrlsToAdd.value.length; i++) {
    relayUrl = relayUrlsToAdd.value[i]
    relayId = relayManager.addRelayByUrl(relayUrl)
    newRelayIds.push(relayId)
  }

  for(i=0; i<newRelayIds.length; i++) {
    relayId = newRelayIds[i]
    relay = relayStore.getRelay(relayId)

    event.tags.push(['r', relay.url, 'write'])
  }

  event.id = window.NostrTools.getEventHash(event)

  let signedEvent
  switch(sessionStore.loginType) {
    case LOGIN_TYPE.PRIVATE_KEY:
      event.sig = window.NostrTools.signEvent(event, sessionStore.privateKey)
      signedEvent = event
      break
    case LOGIN_TYPE.BROWSER:
      signedEvent = await browserHelper.signNostrEvent(event)
      if(!signedEvent) {
        // The user did not sign the event
        return null
      }
      break
  }

  console.log('EditRelays.publish', signedEvent)

  console.log('EditRelays.relayIds', sessionRelayService.relayIds)
  let request
  for(i=0; i<newRelayIds.length; i++) {
    relayId = newRelayIds[i]

    request = relayPublishRequest()
    request.showNotification = true

    console.log('Publishing to', relayId)

    request.publish(
      relayId,
      signedEvent,
      onPublishResult
    )
  }

  // Update the session relay list
  sessionRelayService.relayIds = newRelayIds

  // Clear the form.
  clearChanges()
}

function onPublishResult(data) {
  console.log('Relays.onPublishResult', data)
}

function clearChanges() {
  relayIdsToRemove.value = []
  relayUrlsToAdd.value = []
}

const description = computed(() => {
  let result

  switch(sessionRelayService.source) {
    case 'relay':
      result = 'These are the relays your Nostr clients are connected to. If you ever have problems connecting to some, try switching them out.'
      break
    case 'browser-extension':
      result = 'These relays are loaded from your browser extension. Updating them here may not update your extension. You may want to verify.'
      break
    case 'nip05':
      result = 'These are the relays associated with your Nostr handle (NIP-05). Updating them here may update them for some Nostr clients you use, but will not update the ones linked to your handle. You need to update them with the service that provides your handle.'
      break
    default:
      result = 'Edit your relays.'
  }

  return result
})

onBeforeMount(() => {
  window.emitter.on('session-relays', onSessionRelays)

  console.log('onbeforemount', relayIds.value, sessionRelayService.relayIds)
})
</script>

<template>
  <div class="relays-page -edit-page">
    <p class="-description">{{ description }}</p>
    <div class="relays">
      <RelayEditList
        :active="!isSaving"
        :relayIds="relayIds"
        :removeIds="relayIdsToRemove"
        @removeRelay="removeRelay"
        @cancelRemoveRelay="cancelRemoveRelay"
      />
      <RelayAddList
        :active="!isSaving"
        :relayUrls="relayUrlsToAdd"
        @addRelayUrl="addRelayUrl"
        @removeRelayUrl="removeRelayUrl"
      />
    </div>
    <div class="changes" v-if="hasChanges">
      <div class="options">
        <UiButton
          size="tiny"
          look="outline"
          :disabled="!saveEnabled"
          @click="clearChanges"
        >Clear</UiButton>
        <UiButton
          size="tiny"
          :disabled="!saveEnabled"
          @click="saveChanges"
        >{{ saveChangesLabel }}</UiButton>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">

.relays-page {
  display: flex;
  flex-direction: column;
  gap: 20px;

  .relays {
    display: flex;
    flex-direction: column;
    gap: 5px;
  }

  .options {
    display: flex;
    gap: 20px;
    justify-content: space-between;
  }
}

</style>