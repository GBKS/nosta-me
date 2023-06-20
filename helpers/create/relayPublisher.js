import relayPublishRequest from '@/helpers/relayPublishRequest.js'
import { useProfileStore } from '@/stores/profile'
import relayManager from '@/helpers/relayManager.js'

export default function relayPublisher () { 
  return {
    store: null,
    callback: null,
    relayId: null,
    status: {
      status: 'default',
      request: null
    },

    init() {
      if(!this.store) {
        this.store = useProfileStore()
      }

      if(!this.relayId) {
        const relayUrl = "wss://nostr.mutinywallet.com"
        this.relayId = relayManager.addRelayByUrl(relayUrl)
      }
    },

    // Save NIP-65 (kind 10002) list of read and write relays
    // Blast everywhere so people know how to reach the user
    publish(callback) {
      this.callback = callback

      this.init()

      const event =  this.getBlankEvent()
      
      event.kind = 10002
      event.content = ""

      event.tags = []
      let item
      for(let i=0; i<this.store.relays.length; i++) {
        item = this.store.relays[i]
        if(item.added) {
          event.tags.push(['r', item.url])
        }
      }

      const signedEvent = this.signEvent(event)
      const request = relayPublishRequest()

      this.status.status = 'saving'
      this.status.request = request

      console.log('testPublishRelayData', signedEvent, this.status)

      request.publish(
        this.relayId,
        signedEvent,
        this.onResult.bind(this)
      )

      return this.status
    },

    onResult(data) {
      console.log('RelayResult', data)

      this.status.status = data.status
      this.status.result = data

      this.callback(this.status)
    },

    // Helpers
    
    cleanContent(data) {
      let key, value
      for(key in data) {
        value = data[key]
        if(!value || value.length == 0) {
          delete data[key]
        }
      }
    },

    getBlankEvent() {
      return {
        pubkey: this.store.publicKey,
        created_at: Math.floor(Date.now() / 1000)
      }
    },

    signEvent(event) {
      event.id = window.NostrTools.getEventHash(event)
      event.sig = window.NostrTools.signEvent(event, this.store.privateKey)

      return event
    },

    // Tests

    testPublish(callback) {
      this.callback = callback

      this.init()

      const event =  this.getBlankEvent()
      
      event.kind = 10002
      event.content = ""

      event.tags = []
      let item
      for(let i=0; i<this.store.relays.length; i++) {
        item = this.store.relays[i]
        if(item.added) {
          event.tags.push(['r', item.url])
        }
      }

      console.log('relays', this.store.relays)

      const signedEvent = this.signEvent(event)
      const request = relayPublishRequest()

      this.status.status = 'saving'
      this.status.request = request

      console.log('testPublishRelayData', signedEvent, this.status)

      const relayId = relayManager.addRelayByUrl('ws://umbrel.local:4848')
      request.publish(
        relayId,
        signedEvent,
        this.onResult.bind(this)
      )

      return this.status
    }
  }
}