import { useSessionStore } from '@/stores/session'
import { useUserStore } from "@/stores/users.js"
import { useRelayStore } from '@/stores/relays'
import browserHelper from '@/helpers/browserHelper.js'
import sessionContactsService from './sessionContactsService'
import multiRelayRequest from '@/helpers/multiRelayRequest.js'
import relayManager from '@/helpers/relayManager.js'

const RELOAD_DELTA = 3600 // Seconds after which data is considered stale

const STATUS = {
  NOT_INITIALIZED: 'not-initialized',
  INITIALIZED: 'initialized',
  LOADING: 'loading',
  LOADED: 'loaded',
  ERROR: 'error'
}

const SOURCES = {
  BROWSER_EXTENSION: 'browser-extension',
  NIP05: 'nip05',
  RELAY: 'relay'
}

/*

Handles data for the logged-in users relays.

Designed for:

- Finding the logged-in users relays
- Posting data specifically to the users relays
- In relay lists, showing which ones the user also uses
- Updating the users list of relays

Gets initialized when:

- The user logs in
- The logged in user returns

To find the relays we:

- Do we already have the user profile in the user store?
  - Check for a NIP-05 name and then the .well-known/nostr.json file
- Check if there is a browser extension available
  - Check for relays via window.nostr.getRelays()
- Check some popular relays

 */

export default {
  logEnabled: !false,
  initialized: false,
  checkedUserStore: false,
  checkedExtension: false,
  checkedPopularRelays: false,
  request: null,
  lastLoad: null,
  loadStatus: STATUS.NOT_INITIALIZED, // busy, done, error
  eventData: null,
  relayIds: null,
  source: null,

  init() {
    const sessionStore = useSessionStore()

    this.logger('init')

    if(!this.initialized && sessionStore.isLoggedIn) {
      this.broadcastStatus(STATUS.INITIALIZED)

      this.nextCheck()

      this.initialized = true
    }
  },

  nextCheck() {
    if (!this.checkedUserStore) {
      this.checkUserStore()
    } else if (!this.checkedExtension) {
      this.checkExtension()
    } else if (!this.checkedPopularRelays) {
      this.checkPopularRelays()
    } else {
      this.giveUp()
    }
  },

  giveUp() {  
    this.logger('giveUp - cannot find relays for the user')
  },

  checkUserStore() {
    const sessionStore = useSessionStore()
    const publicKey = sessionStore.publicKey
    const userStore = useUserStore()
    const result = userStore.getUser(publicKey)

    this.logger('checkUserStore', result)

    if(result) {
      // Need to figure out what we have here
      const nip05 = result?.content?.nip05
      if(nip05) {
        // We have a NIP-05 name, let's check for the .well-known/nostr.json file
        this.checkWellKnown(nip05)
        return
      }
    }

    this.checkedUserStore = true
    this.nextCheck()
  },

  async checkWellKnown(nip05) {
    try {
      let data = await window.NostrTools.nip05.queryProfile(nip05)

      this.logger('loadNip05', nip05, data)

      if(data && data.pubkey) {
        // Register found relays and create a list of IDs
        if(data.relays && data.relays.length > 0) {
          const relayIds = data.relays.map(url => relayManager.addRelayByUrl(url)).filter(Boolean)

          if(relayIds.length > 0) {
            this.relayIds = relayIds
            this.source = SOURCES.NIP05

            this.broadcastStatus(STATUS.LOADED)

            // We're still going to search those relays for more current data
            this.load(relayIds)

            // Tell the contacts service to start looking for contact lists
            sessionContactsService.init(relayIds)
            return
          }
        }
      }
    } catch(error) {
      console.error('Error checking well-known profile:', error)
    }

    this.nextCheck()
  },

  // See if we're connected to an extension that we can get the relays from
  checkExtension() {
    browserHelper.getNostrRelays(this.onCheckExtensionError.bind(this))
      .then(this.onCheckExtension.bind(this))
      .catch(this.onCheckExtensionError.bind(this))
  },

  /*
  We get an object with the relays and their read/write status.
  {
    "wss://relay.damus.io": {
        "read": true,
        "write": true
    },
    "wss://nostr1.tunnelsats.com": {
        "read": true,
        "write": true
    },
    ...
  }
  */
  onCheckExtension(relayData) {  
    this.logger('onCheckExtension', relayData, Object.keys(relayData))

    if(relayData && Object.keys(relayData).length > 0) {
      const relayIds = Object.keys(relayData).map(url => relayManager.addRelayByUrl(url)).filter(Boolean)

      if(relayIds.length > 0) {
        this.relayIds = relayIds
        this.source = SOURCES.BROWSER_EXTENSION

        this.broadcastStatus(STATUS.LOADED)

        // We're still going to search those relays for more current data
        this.load(relayIds)

        // Let's search those relays for contact info
        sessionContactsService.init(relayIds)
        return
      }
    }

    // The extension doesn't have relays info, we need to check elsewhere
    this.nextCheck()
  },

  onCheckExtensionError(result) {
    this.logger('onCheckExtension', result)
    this.checkPopularRelays()
  },

  // We don't have leads - check our default/popular relays.
  checkPopularRelays() {
    this.logger('checkPopularRelays')
    const relayStore = useRelayStore()
    this.relayIds = relayStore.getAll
    this.load(this.relayIds)
  },

  load(relayIds) {
    this.broadcastStatus(STATUS.LOADING)

    const sessionStore = useSessionStore()
    const publicKey = sessionStore.publicKey
    
    this.logger('load', publicKey)

    const filter = {
      kinds: [10002],
      'authors': [publicKey],
      limit: 1
    }

    const request = multiRelayRequest()
    request.init(this.onLoad.bind(this))
    request.start(relayIds, [filter])

    // We may need to set some type of timeout here
    // Not sure what we can do in that case
  },

  onLoad(data) {
    this.broadcastStatus(STATUS.LOADED)
    
    this.logger('onLoad', data)

    if(data && data.tags) {
      if(!this.eventData) this.eventData = []
      this.eventData.push(data)

      this.lastLoad = new Date()

      this.updateRelayIdsFromLatestEvent()
      
      if(this.relayIds && this.relayIds.length > 0) {
        // Let's search those relays for contact info
        sessionContactsService.init(this.relayIds)
      }
    }
  },

  updateRelayIdsFromLatestEvent() {
    this.logger('updateRelayIdsFromLatestEvent', this.eventData)
    if(this.eventData) {
      const latestEvent = this.eventData.reduce((a, b) => (a.created_at > b.created_at ? a : b), {})
      const tags = latestEvent.tags.filter(tag => tag[0] == 'r')
      const relayIds = tags.map(tag => relayManager.addRelayByUrl(tag[1])).filter(Boolean)
      this.logger('fhdskj', tags, relayIds)

      if(relayIds.length > 0) {
        this.relayIds = relayIds
        this.source = SOURCES.RELAY
      }
    // } else {
    //   this.relayIds = null
    }
  },

  onLoadError(error) {
    this.logger('onLoadError', error)

    this.broadcastStatus(STATUS.ERROR)
  },

  // Tell the world about our status.
  broadcastStatus(status) {
    this.loadStatus = status
    this.logger('broadcastStatus', status)
    
    window.emitter.emit('session-relays', {
      status: this.loadStatus,
      data: this.eventData,
      stale: this.isStale()
    })
  },

  save() {

  },

  onSave() {
    
  },

  onSaveError() {
    
  },

  isStale() {
    if(!this.lastLoad) return true
    const now = new Date()
    const delta = (now - this.lastLoad) / 1000 // Convert to seconds
    return delta > RELOAD_DELTA
  },

  isReady() {
    return this.loadStatus == STATUS.LOADED && !this.isStale()
  },

  // Check if a relay is also used by the logged-in user
  isUsing(relayId) {
    this.logger('isFollowing', relayId)

    if(this.isReady()) {
      const latestEvent = this.eventData.reduce((a, b) => (a.created_at > b.created_at ? a : b), {})
      const tag = latestEvent.tags?.find(tag => tag[0] === 'p' && tag[1] === relayId)
      return !!tag
    }
    return false
  },

  // Called when logging out
  reset() {
    this.initialized = false
    this.request = null
    this.lastLoad = null
    this.loadStatus = STATUS.NOT_INITIALIZED
    this.eventData = null
    this.relayIds = null
    this.checkedUserStore = false
    this.checkedExtension = false
    this.checkedPopularRelays = false
    this.source = null
  },

  logger(...args) {
    if(this.logEnabled) {
      console.log('SessionRelayService', ...args)
    }
  }
}