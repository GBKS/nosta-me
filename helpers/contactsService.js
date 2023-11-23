
import { useRelayStore } from "@/stores/relays.js"
import { useUserStore } from "@/stores/users.js"

import relayList from '@/helpers/relayList.js'
import relayConnector from '@/helpers/relayConnector.js'
import relayManager from '@/helpers/relayManager.js'
import findRelayRequest from '@/helpers/findRelayRequest.js'
import multiRelayRequest from '@/helpers/multiRelayRequest.js'

/*

Loads profiles from a kind 3 event.

 */

export default function contactsService () { 
  return {
    log: false,
    eventData: null,
    relayIds: null,
    publicKeys: null,
    request: null,
    loadCallback: null,
    findCallback: null,
    relayStore: null,
    userStore: null,
    activePage: 0,
    perPage: 10,

    start(data, findCallback) {
      this.eventData = data
      this.findCallback = findCallback

      this.relayStore = useRelayStore()
      this.userStore = useUserStore()

      // Connect to provided relays
      this.relayIds = []
      if(data.content.length > 0) {
        try {
          const relays = JSON.parse(data.content)
          let relayId
          for(let relayUrl in relays) {
            relayId = relayManager.addRelayByUrl(relayUrl)
            this.relayIds.push(relayId)
          }
        } catch(error) {

        }
      } else {
        // Check our default relays
        this.relayIds = this.relayStore.getRelayIds
      }

      // Collect a list of all public keys
      this.publicKeys = this.collectPublicKeys()

      this.loadCallback = this.onEvent.bind(this)

      this.refreshRequest()
    },

    loadPage(page) {
      this.activePage = page

      this.refreshRequest()
    },

    collectPublicKeys() {
      const result = []
      for(let i=0; i<this.eventData.tags.length; i++) {
        result.push(this.eventData.tags[i][1])
      }
      return result
    },

    refreshRequest() {
      this.kill()

      const keysToLoad = this.publicKeys.slice(this.activePage*this.perPage, (this.activePage + 1)*this.perPage)

      if(this.log) {
        console.log('contactsService.refreshRequest', this.activePage, keysToLoad)
      }

      this.request = multiRelayRequest()
      this.request.init(this.loadCallback)
      this.request.start(
        this.relayIds,
        [{
          kinds: [0],
          authors: keysToLoad
        }]
      )
    },

    onEvent(data, relayId) {
      if(this.log) {
        console.log('contactsService.onEvent', data, relayId)
      }
      
      if(data.kind === 0) {
        this.userStore.addUser(data.pubkey, data)

        window.emitter.emit('profile-'+data.pubkey, data)
      }

      this.findCallback(data)
    },

    kill() {
      if(this.request) {
        this.request.kill()
        this.request = null
      }
    }
  }
}