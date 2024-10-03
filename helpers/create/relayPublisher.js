import relayPublishRequest from '@/helpers/relayPublishRequest.js'
import { useProfileStore } from '@/stores/profile'
import relayManager from '@/helpers/relayManager.js'
import { finalizeEvent } from 'nostr-tools/pure'

export default function relayPublisher () { 
  return {
    logEnabled: !false,
    store: null,
    callback: null,
    relayId: null,
    showNotifications: false,
    status: {
      status: 'default',
      request: null
    },

    init() {
      if(!this.store) {
        this.store = useProfileStore()
      }

      if(!this.relayId) {
        // const relayUrl = "wss://nostr.mutinywallet.com"
        const relayUrl = 'wss://relay.damus.io'
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
      request.showNotification = this.showNotifications

      this.status.status = 'saving'
      this.status.request = request

      this.logger('testPublishRelayData', signedEvent, this.status)

      request.publish(
        this.relayId,
        signedEvent,
        this.onResult.bind(this)
      )

      return this.status
    },

    onResult(data) {
      this.logger('onResult', data)

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
      return finalizeEvent(event, this.store.privateKey)
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
      request.showNotification = this.showNotifications

      this.status.status = 'saving'
      this.status.request = request

      this.logger('testPublish', signedEvent, this.status)

      const relayId = relayManager.addRelayByUrl('ws://umbrel.local:4848')
      request.publish(
        relayId,
        signedEvent,
        this.onResult.bind(this)
      )

      return this.status
    },

    logger(...args) {
      if(this.logEnabled) {
        console.log('RelayPublisher', ...args)
      }
    }
  }
}