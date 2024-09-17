import relayPublishRequest from '@/helpers/relayPublishRequest.js'
import { useProfileStore } from '@/stores/profile'
import relayManager from '@/helpers/relayManager.js'

export default function followPublisher () { 
  return {
    logEnabled: !false,
    store: null,
    callback: null,
    relayId: null,
    status: {
      status: 'default',
      requests: null
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

    // Save NIP-02 (kind 3) list of profiles to follow
    // Save only to the users write relays
    publish(callback) {
      this.callback = callback

      this.init()

      const event =  this.getBlankEvent()
      
      event.kind = 3
      event.content = ""

      event.tags = []
      let item, i
      for(i=0; i<this.store.follows.length; i++) {
        item = this.store.follows[i]
        if(item.added) {
          event.tags.push(['p', item.npub, item.relay, item.name])
        }
      }

      this.logger('follows', this.store.follows)

      const signedEvent = this.signEvent(event)

      this.status.status = 'saving'
      this.status.requests = []

      this.logger('publish', signedEvent, this.status)

      let relay, request, relayId
      for(i=0; i<this.store.relays.length; i++) {
        relay = this.store.relays[i]

        if(relay.added) {
          request = relayPublishRequest()
          relayId = relayManager.addRelayByUrl(relay.url)

          this.logger('Publishing to', relayId)

          this.status.requests.push(request)

          request.publish(
            relayId,
            signedEvent,
            this.onResult.bind(this)
          )
        }
      }

      return this.status
    },

    onResult(data) {
      this.logger('onResult', data, this)

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
      
      event.kind = 3
      event.content = ""

      event.tags = []
      let item, i
      for(i=0; i<this.store.follows.length; i++) {
        item = this.store.follows[i]
        if(item.added) {
          event.tags.push(['p', item.npub, item.relay, item.name])
        }
      }

      console.log('follows', this.store.follows)

      const signedEvent = this.signEvent(event)

      this.status.status = 'saving'
      this.status.requests = []

      this.logger('testPublish', signedEvent, this.status)

      const request = relayPublishRequest()
      const relayId = relayManager.addRelayByUrl('ws://umbrel.local:4848')
      request.publish(
        relayId,
        signedEvent,
        this.onResult.bind(this)
      )
      this.status.requests.push(request)

      // let relay, request, relayId
      // for(i=0; i<this.store.relays.length; i++) {
      //   relay = this.store.relays[i]

      //   if(relay.added) {
      //     request = relayPublishRequest()
      //     relayId = relayManager.addRelayByUrl(relay.url)

      //     console.log('Publishing to', relayId)

      //     this.status.follows.requests.push(request)

      //     request.publish(
      //       relayId,
      //       signedEvent,
      //       this.followResult
      //     )
      //   }
      // }

      return this.status
    },
    
    logger(...args) {
      if(this.logEnabled) {
        console.log('FollowPublisher', ...args)
      }
    }
  }
}