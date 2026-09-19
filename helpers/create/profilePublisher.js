import publishTracker, { OUTCOME } from '@/helpers/create/publishTracker.js'
import relayPublishRequest from '@/helpers/relayPublishRequest.js'
import { useProfileStore } from '@/stores/profile'
import relayManager from '@/helpers/relayManager.js'
import metaPublisher from '@/helpers/create/metaPublisher.js'
import relayPublisher from '@/helpers/create/relayPublisher.js'
import followPublisher from '@/helpers/create/followPublisher.js'
import { finalizeEvent } from 'nostr-tools/pure'
import ToolBox from '@/helpers/toolBox'

/*

Make connection to Blastr relay and post the profile notes

1. Meta data (kind 0)
2. Recommended relays (kind 2, one per relay)
3. Follows (kind 3)
4. Relay list meta data (kind 10002)
5. Application data (kind 30078)

 */

// How long to wait for relays in total, before calling it with what we have.
const MAX_WAIT = 20000

export default function profilePublisher () { 
  return {
    logEnabled: false,
    requests: [],
    store: null,
    callback: null,
    metaPublisher: null,
    relayPublisher: null,
    followPublisher: null,
    tracker: null,
    timeout: null,
    killed: false,
    started: false,
    status: {
      meta: null,
      relays: null,
      follows: null
    },

    publish(callback) {
      this.callback = callback

      this.init()

      this.tracker = publishTracker()

      const metaStatus = this.metaPublisher.publish(this.metaResult.bind(this))
      const relayStatus = this.relayPublisher.publish(this.relayResult.bind(this))
      const followStatus = this.followPublisher.publish(this.followResult.bind(this))

      this.status.meta = metaStatus
      this.status.relays = relayStatus
      this.status.follows = followStatus

      // Results only count once we know how many relays we're waiting for.
      this.tracker.expect('meta', metaStatus.relayIds)
      this.tracker.expect('relays', relayStatus.relayIds)
      this.tracker.expect('follows', followStatus.relayIds)

      // Each request gives up after 10 seconds. This is for the ones that don't.
      this.timeout = setTimeout(this.onTimeout.bind(this), MAX_WAIT)

      // From here on all three events are known, and an outcome means something.
      this.started = true

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
      this.onResult('meta', status)
    },

    relayResult(status) {
      this.logger('relayResult', status)

      this.status.relays = status
      this.onResult('relays', status)
    },

    followResult(status) {
      this.logger('followResult', status)

      this.status.follows = status
      this.onResult('follows', status)
    },

    // status.result is the answer of one relay, see relayPublishRequest
    onResult(eventName, status) {
      if(this.killed) return

      if(status && status.result) {
        this.tracker.record(eventName, status.result.relayId, status.result.status)
      }

      if(this.started) this.report()
    },

    onTimeout() {
      if(this.killed) return

      this.tracker.giveUp()
      this.report()
    },

    report() {
      this.status.summary = this.tracker.summary()

      if(this.status.summary.outcome != OUTCOME.PENDING) {
        clearTimeout(this.timeout)
      }

      this.callback(this.status)
    },

    // Stops reporting. Requests that are under way can't be taken back.
    kill() {
      this.killed = true
      clearTimeout(this.timeout)
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
      const signedEvent = finalizeEvent(event, ToolBox.privateKeyToBytes(this.store.privateKey))
      return signedEvent
    },

    // Tests
    // A dry run of the publish flow with the keys from the create flow.

    testPublish(callback) {
      this.callback = callback

      this.init()

      const metaStatus = this.metaPublisher.testPublish(this.metaResult.bind(this))
      const relayStatus = this.relayPublisher.testPublish(this.relayResult.bind(this))
      const followStatus = this.followPublisher.testPublish(this.followResult.bind(this))

      this.status.meta = metaStatus
      this.status.relays = relayStatus
      this.status.follows = followStatus

      return this.status
    },

    logger(...args) {
      if(this.logEnabled) {
        console.log('ProfilePublisher', ...args)
      }
    }
  }
}