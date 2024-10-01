
import { useEventStore } from "@/stores/events.js"
import { useRelayStore } from "@/stores/relays.js"
import { useUserStore } from "@/stores/users.js"

import relayManager from "@/helpers/relayManager.js"

/*

Connects to multiple relays at once to find data.

 */

export default function multiRelayRequest () { 
  return {
    log: !true,
    initialized: false,
    relayIds: null,
    filters: null,
    events: {},
    subscriptions: {},
    relaysWaitingForConnection: [],
    relayStore: null,
    eventStore: null,
    userStore: null,
    callback: null,
    endCallback: null,
    connectCallback: null,

    init(callback, endCallback) {
      if(!this.initialized) {
        this.initialized = true

        this.callback = callback
        this.endCallback = endCallback
        
        this.relayStore = useRelayStore()
        this.eventStore = useEventStore()
        this.userStore = useUserStore()
      }
    },

    start(relayIds, filters) {
      this.relayIds = relayIds
      this.filters = filters

      if(relayIds && relayIds.length > 0) {
        for(let i=0; i<relayIds.length; i++) {
          this.subscribeToRelay(relayIds[i])
        }
      } else {
        const relays = this.relayStore.getAll
        for(let relayId in relays) {
          this.subscribeToRelay(relayId)
        }
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

    addRelay(relayId) {
      if(this.relayIds.indexOf(relayId) === -1) {
        this.subscribeToRelay(relayId)
      }
    },

    subscribeToRelay(relayId) {
      if(this.log) {
        console.log('subscribe', relayId)
      }

      const relay = this.relayStore.getRelay(relayId)
      const connection = this.relayStore.getRelayConnection(relayId)
      // console.log('relay', relay, connection)

      if(relay.status == 'connected') {
        if(connection) {
          const subscription = connection.sub(this.filters)

          this.subscriptions[relayId] = subscription

          // console.log('subbing now', subscription, relayId, this.filters)
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
      if(this.log) {
        console.log('onRelayConnect', publicKey, this.relaysWaitingForConnection, data)
      }

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
      if(this.log) {
        console.log('onEvent', relayId, event)
      }

      const connection = relayManager.getConnector(relayId)
      connection.stats.events++

      event.relay = relayId

      if(event.kind === 0) {
        this.userStore.addUser(event.pubkey, event)

        window.emitter.emit('profile-'+event.pubkey, event)
      }

      this.eventStore.addEvent(event)

      this.events[event.id] = event

      this.callback(event, relayId)
    },

    onEndOfEvents(relayId) {
      if(this.log) {
        console.log('onEndOfEvents', relayId)
      }

      this.unsubscribeFromRelay(relayId)

      if(this.endCallback) {
        this.endCallback()
      }
    }
  }
}