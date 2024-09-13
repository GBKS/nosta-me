import relayPublishRequest from '@/helpers/relayPublishRequest.js'
import { useProfileStore } from '@/stores/profile'
import relayManager from '@/helpers/relayManager.js'
import metaPublisher from '@/helpers/create/metaPublisher.js'
import relayPublisher from '@/helpers/create/relayPublisher.js'
import followPublisher from '@/helpers/create/followPublisher.js'

/*

Make connection to Blastr relay and post the profile notes

1. Meta data (kind 0)
2. Recommended relays (kind 2, one per relay)
3. Follows (kind 3)
4. Relay list meta data (kind 10002)
5. Application data (kind 30078)

 */

export default function profilePublisher () { 
  return {
    logEnabled: false,
    requests: [],
    store: null,
    callback: null,
    metaPublisher: null,
    relayPublisher: null,
    followPublisher: null,
    status: {
      meta: null,
      relays: null,
      follows: null
    },

    publish(callback) {
      this.callback = callback

      this.init()

      const metaStatus = this.metaPublisher.publish(this.metaResult.bind(this))
      const relayStatus = this.relayPublisher.publish(this.relayResult.bind(this))
      const followStatus = this.followPublisher.publish(this.followResult.bind(this))

      this.status.meta = metaStatus
      this.status.relays = relayStatus
      this.status.follows = followStatus

      return this.status
    },

    init() {
      if(!this.store) {
        this.store = useProfileStore()

        this.metaPublisher = metaPublisher()
        this.relayPublisher = relayPublisher()
        this.followPublisher = followPublisher()
      }
    },

    metaResult(status) {
      this.logger('metaResult', status)

      this.status.meta = status

      this.callback(this.status)
    },

    relayResult(status) {
      this.logger('relayResult', status)

      this.status.relays = status

      this.callback(this.status)
    },

    followResult(status) {
      this.logger('followResult', status)

      this.status.follows = status

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
      this.setupTestCalls()

      const metaStatus = this.metaPublisher.testPublish(this.metaResult.bind(this))
      const relayStatus = this.relayPublisher.testPublish(this.relayResult.bind(this))
      const followStatus = this.followPublisher.testPublish(this.followResult.bind(this))

      this.status.meta = metaStatus
      this.status.relays = relayStatus
      this.status.follows = followStatus

      return this.status
    },

    setupTestCalls() {
      this.store.publicKey = process.env.TEST_PUBLIC_KEY
      this.store.privateKey = process.env.TEST_PRIVATE_KEY
    },

    logger(...args) {
      if(this.logEnabled) {
        console.log('ProfilePublisher', ...args)
      }
    }
  }
}