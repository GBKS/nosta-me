
import { useEventStore } from "@/stores/events.js"
import { useRelayStore } from "@/stores/relays.js"
import { useUserStore } from "@/stores/users.js"

import relayManager from "@/helpers/relayManager.js"

/*

Connects to multiple relays at once to find data.

 */

export default function multiRelayRequest () { 
  return {
    logEnabled: false,
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
      this.logger('subscribe', relayId)

      const relay = this.relayStore.getRelay(relayId)
      const connection = relayManager.getConnection(relayId)

      if(!relay) {
        this.logger('subscribeToRelay: No relay found with relayId: ' + relayId)
        return
      }

      if(relay.status == 'connected' && relayManager.isConnected(relayId)) {
        if(connection) {
          // const subscription = connection.sub(this.filters)

          const subscription = connection.subscribe(
            this.filters,
            {
              onevent: (event) => { this.onEvent(relayId, event) },
              oneose: () => { this.onEndOfEvents(relayId) }
            }
          )

          this.subscriptions[relayId] = subscription

          // console.log('subbing now', subscription, relayId, this.filters)
          // subscription.on('event', this.onEvent.bind(this, relayId))
          // subscription.on('eose', this.onEndOfEvents.bind(this, relayId))
        } else {
          console.log('No connection')
        }
      } else {
        // console.log('subscribe connection not found with relayId: ' + relayId)

        if(this.relaysWaitingForConnection.indexOf(relayId) === -1) {
          this.relaysWaitingForConnection.push(relayId)
        }

        // Connects, or retries if an earlier attempt failed.
        relayManager.connectToRelay(relayId)

        if(!this.connectCallback) {
          this.connectCallback = this.onRelayConnect.bind(this)
          window.emitter.on('relay-connect', this.connectCallback)
        }
      }
    },

    onRelayConnect(data) {
      this.logger('onRelayConnect', this.relaysWaitingForConnection, data)

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
        subscription.close()

        this.subscriptions[relayId] = null
      }
    },

    onEvent(relayId, event) {
      this.logger('onEvent', relayId, event)

      const connector = relayManager.getConnector(relayId)
      if(connector) connector.stats.events++

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
      this.logger('onEndOfEvents', relayId)

      this.unsubscribeFromRelay(relayId)

      if(this.endCallback) {
        this.endCallback()
      }
    },

    logger(...args) {
      if(this.logEnabled) {
        console.log('multiRelayRequest', ...args)
      }
    }
  }
}