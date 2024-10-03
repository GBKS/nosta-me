import { useSessionStore, LOGIN_TYPE } from '@/stores/session'
import { useRelayStore } from '@/stores/relays'
import relayPublishRequest from '@/helpers/relayPublishRequest.js'
import multiRelayRequest from '@/helpers/multiRelayRequest.js'
import browserHelper from '@/helpers/browserHelper.js'
import sessionRelayService from '@/helpers/sessionRelayService.js'
import { useUserStore } from "@/stores/users.js"
import { sign } from '@noble/secp256k1'
import { finalizeEvent, getEventHash } from 'nostr-tools/pure'

const RELOAD_DELTA = 3600 * 1000 // 1 hour in milliseconds

export const CONTACT_LOAD_STATUS = {
  NOT_INITIALIZED: 'not-initialized',
  INITIALIZED: 'initialized',
  LOADING: 'loading',
  LOADED: 'loaded',
  ERROR: 'error'
}

/*

Handles data for the logged-in users contacts.

Designed for:

- Showing follow state on profiles
- Allow for follow/unfollow functionality

Considerations:

Contacts saving needs to ensure the latest data is overwritten, and
not some older version. The new data also needs to be broadly broadcast. This
is the most sensitive part of this service.

Statuses:

- not-initialized
- initialized
- loading
- loaded
- error

 */

export default {
  logEnabled: false,
  initialized: false,
  request: null,
  loadCallback: null,
  lastLoad: null,
  loadStatus: CONTACT_LOAD_STATUS.NOT_INITIALIZED,
  relayIds: null,
  eventData: null,
  sessionStore: null,

  log(...args) {
    if(this.logEnabled) {
      console.log('sessionContactsService', ...args)
    }
  },

  init(relayIds) {
    this.log('init', this.initialized, relayIds)

    if(!this.initialized) {
      this.relayIds = relayIds
      this.sessionStore = useSessionStore()

      if(this.sessionStore.isLoggedIn) {
        this.loadStatus = 'initialized'
        this.load()
        this.initialized = true
      }
    }
  },

  load() {
    const publicKey = this.sessionStore.publicKey
    this.log('load', publicKey)

    const filter = {
      kinds: [3], // Contacts
      authors: [publicKey],
      limit: 1,
    }

    this.loadCallback = this.onLoad.bind(this)
    this.request = multiRelayRequest()
    this.request.init(this.loadCallback)
    this.request.start(this.relayIds, [filter])

    this.broadcastStatus(CONTACT_LOAD_STATUS.LOADING)
  },

  onLoad(data) {
    this.log('onLoad', data)

    if(!this.eventData) this.eventData = []
    this.eventData.push(data)

    this.lastLoad = new Date()
    this.broadcastStatus(CONTACT_LOAD_STATUS.LOADED)
  },

  onLoadError(error) {
    this.log('onLoadError', error)
    this.broadcastStatus(CONTACT_LOAD_STATUS.ERROR)
  },

  broadcastStatus(status) {
    this.loadStatus = status

    // Get the object from the this.eventData with the newest created_at timestamp
    const latestEvent = this.eventData?.reduce((a, b) => (a.created_at > b.created_at ? a : b), {})

    window.emitter.emit('session-contacts', {
      status: this.loadStatus,
      data: latestEvent,
      stale: this.isStale()
    })
  },

  save() {

  },

  onSave() {
    
  },

  onSaveError() {
    
  },

  getLatestEvent() {
    return this.eventData?.reduce((a, b) => (a.created_at > b.created_at ? a : b), {})
  },

  isStale() {
    if (!this.lastLoad) return true
    const now = new Date()
    const delta = now - this.lastLoad 
    return delta > RELOAD_DELTA
  },

  isLoaded() {
    return this.loadStatus == CONTACT_LOAD_STATUS.LOADED
  },

  isReady() {
    return this.loadStatus == CONTACT_LOAD_STATUS.LOADED && !this.isStale()
  },

  isFollowing(publicKey) {
    if(this.isReady()) {
      const latestEvent = this.getLatestEvent()
      const tag = latestEvent?.tags?.find((tag) => (tag[0] == 'p' && tag[1] == publicKey))
      return !!tag
    }
    return false
  },

  async follow(publicKey) {
    console.log('follow', publicKey)

    const result = {}

    // Create a new event and broadcast it
    const signedEvent = await this.publish(latestEvent)

    // Add locally
    if(signedEvent) {
      const latestEvent = this.getLatestEvent()
      const tagIndex = latestEvent?.tags?.findIndex((tag) => (tag[0] == 'p' && tag[1] == publicKey))
      if(tagIndex === -1) {
        // See if we can find a relay for this publicKey
        const userStore = useUserStore()
        const user = userStore.getUser(publicKey)
        let relayUrl = ''
        if(user && user.relay) {
          const relayStore = useRelayStore()
          const relay = relayStore.getRelay(user.relay)
          if(relay) {
            relayUrl = relay.url
          }
        }

        latestEvent.tags.push(['p', publicKey, relayUrl])
      }

      result.success = true      
    } else {
      result.success = false
      result.message = 'User did not sign the event.'
    }

    return result
  },

  async unfollow(publicKey) {
    console.log('unfollow', publicKey)

    const result = {}

    // Create a new event and broadcast it
    const signedEvent = await this.publish(latestEvent)

    // Remove locally
    if(signedEvent) {
      const latestEvent = this.getLatestEvent()
      const tagIndex = latestEvent?.tags?.findIndex((tag) => (tag[0] == 'p' && tag[1] == publicKey))
      if(tagIndex !== -1) {
        latestEvent.tags.splice(tagIndex, 1)
      }

      result.success = true
    } else {
      result.success = false
    }

    return result
  },

  async publish(oldEvent) {
    // Clone the old event, delete id and signature and updated created date
    const event = JSON.parse(JSON.stringify(oldEvent))
    event.created_at = Math.floor(Date.now() / 1000)
    delete event.id
    delete event.sig

    let signedEvent
    switch(this.sessionStore.loginType) {
      case LOGIN_TYPE.PRIVATE_KEY:
        signedEvent = finalizeEvent(event, this.sessionStore.privateKey)
        break
      case LOGIN_TYPE.BROWSER:
        signedEvent = await browserHelper.signNostrEvent(event)
        if(!signedEvent) {
          // The user did not sign the event
          return null
        }
        break
    }

    console.log('sessionContactsService.publish', signedEvent)

    const relayIds = sessionRelayService.relayIds
    console.log('sessionRelayService.relayIds', sessionRelayService.relayIds)
    let request, relayId
    for(let i=0; i<relayIds.length; i++) {
      relayId = relayIds[i]

      request = relayPublishRequest()

      console.log('Publishing to', relayId)

      request.publish(
        relayId,
        signedEvent,
        this.onPublishResult.bind(this)
      )
    }

    return signedEvent

    // Also post to the Blastr relay
    // relayId = relayManager.addRelayByUrl("wss://nostr.mutinywallet.com")
    // request = relayPublishRequest()
    // request.publish(
    //   relayId,
    //   signedEvent,
    //   this.onPublishResult.bind(this)
    // )
  },

  onPublishResult(data) {
    console.log('sessionContactsService.onPublishResult', data, this)
  },

  // Called when logging out
  reset() {
    this.initialized = false
    this.request = null
    this.loadCallback = null
    this.lastLoad = null
    this.loadStatus = CONTACT_LOAD_STATUS.NOT_INITIALIZED
    this.eventData = null
    this.sessionStore = null
  }
}