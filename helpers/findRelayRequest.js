
import { useEventStore } from "@/stores/events.js"
import { useRelayStore } from "@/stores/relays.js"
import { useUserStore } from "@/stores/users.js"

import relayManager from "@/helpers/relayManager.js"

/*

Checks multiple relays for data, one at a time.
Not really implemented, need to do that.

 */

export default function findRelayRequest () { 
  return {
    initialized: false,
    relayIds: null,
    filter: null,
    events: {},
    subscriptions: {},
    relaysWaitingForConnection: [],
    relayStore: null,
    eventStore: null,
    userStore: null,
    callback: null,
    connectCallback: null,

    init(callback) {
      if(!this.initialized) {
        this.initialized = true

        this.callback = callback
        
        this.relayStore = useRelayStore()
        this.eventStore = useEventStore()
        this.userStore = useUserStore()
      }
    },

    start(relayIds, filter) {
      this.relayIds = relayIds
      this.filter = filter

      const relays = this.relayStore.getAll
      for(let relayId in relays) {
        this.subscribeToRelay(relayId)
      }
    },

    stop() {
      const relays = this.relayStore.getAll
      for(let relayId in relays) {
        this.unsubscribeFromRelay(relayId)
      }
    },

    kill() {
      this.stop()
    },

    subscribeToRelay(relayId) {
      // console.log('subscribe', relayId)

      const relay = this.relayStore.getRelay(relayId)
      const connection = this.relayStore.getRelayConnection(relayId)
      // console.log('relay', relay, connection)

      if(relay.status == 'connected') {
        if(connection) {
          const subscription = connection.sub([
            this.filter
          ])

          this.subscriptions[relayId] = subscription

          // console.log('subbing now', subscription, relayId, this.filter)
          subscription.on('event', this.onEvent.bind(this, relayId))
          subscription.on('eose', this.onEndOfEvents.bind(this, relayId))
        } else {
          console.log('No connection')
        }
      } else {
        // console.log('subscribe connection not found with relayId: ' + relayId)

        this.relaysWaitingForConnection.push(relayId)

        if(!connection) {
          relayManager.connectToRelay(relayId)
        }

        if(!this.connectCallback) {
          this.connectCallback = this.onRelayConnect.bind(this)
          window.emitter.on('relay-connect', this.connectCallback)
        }
      }
    },

    onRelayConnect(data) {
      // console.log('onRelayConnect', publicKey, this.relaysWaitingForConnection, data)

      const index = this.relaysWaitingForConnection.indexOf(data.relayId)
      if(index !== -1) {
        this.relaysWaitingForConnection.splice(index, 1)
        
        if(this.relaysWaitingForConnection.length == 0) {
          window.emitter.off('relay-connect', this.connectCallback)
          this.connectCallback = null
        }

        this.subscribeToRelay(data.relayId)
      }
    },

    unsubscribeFromRelay(relayId) {
      const subscription = this.subscriptions[relayId]

      if(subscription) {
        subscription.unsub()

        this.subscriptions[relayId] = null
      }
    },

    onEvent(relayId, event) {
      // console.log('onEvent', relayId, event)

      event.relay = relayId

      this.eventStore.addEvent(event)

      if(event.kind === 0) {
        this.userStore.addUser(event.pubkey, event)

        window.emitter.emit('profile-'+event.pubkey, event)
      }

      this.events[event.id] = event

      this.callback(event, relayId)
    },

    onEndOfEvents(relayId) {
      // console.log('onEndOfEvents', relayId)

      this.unsubscribeFromRelay(relayId)
    }
  }
}