
import relayManager from '@/helpers/relayManager.js'

import { useEventStore } from "@/stores/events.js"
import { useRelayStore } from "@/stores/relays.js"
import { useUserStore } from "@/stores/users.js"

/*

Checks a single relay for data.

 */

export default function relayRequest () { 
  return {
    logEnabled: !false,
    initialized: false,
    autoClose: true,
    relayId: null,
    filters: null,
    events: {},
    subscription: null,
    relayStore: null,
    eventStore: null,
    userStore: null,
    callback: null,
    connectCallback: null,

    init(callback, autoClose) {
      if(!this.initialized) {
        this.initialized = true

        if(autoClose !== null) {
          this.autoClose = autoClose
        }

        this.callback = callback
        
        this.relayStore = useRelayStore()
        this.eventStore = useEventStore()
        this.userStore = useUserStore()
      }
    },

    start(relayId, filters) {
      this.relayId = relayId
      this.filters = filters

      this.subscribe()
    },

    stop() {
      this.unsubscribe()
    },

    kill() {
      this.stop()
    },

    subscribe() {
      this.logger('subscribe', this.relayId)

      const relay = this.relayStore.getRelay(this.relayId)

      if(!relay) {
        this.logger('subscribe: No relay found with relayId: ' + this.relayId)
        return
      }

      const connection = this.relayStore.getRelayConnection(this.relayId)
      this.logger('relay', relay, connection)

      if(relay.status == 'connected') {
        if(connection) {
          this.logger('subbing now', this.subscription, this.relayId, this.filters, connection)
          this.subscription = connection.subscribe(
            this.filters,
            {
              onevent: (event) => { this.onEvent(event) },
              oneose: () => { this.onEndOfEvents() }
            }
          )
        } else {
          console.log('No connection')
        }
      } else {
        console.log('subscribe connection not found with relayId: ' + this.relayId)

        if(!connection) {
          relayManager.connectToRelay(this.relayId)
        }

        if(!this.connectCallback) {
          this.connectCallback = this.onRelayConnect.bind(this)
          window.emitter.on('relay-connect-'+this.relayId, this.connectCallback)
        }
      }
    },

    onRelayConnect(data) {
      this.logger('onRelayConnect', data)

      window.emitter.off('relay-connect-'+this.relayId, this.connectCallback)
      this.connectCallback = null
      
      this.subscribe()
    },

    unsubscribe() {
      if(this.subscription) {
        this.subscription.close()

        this.subscription = null
      }
    },

    onEvent(event) {
      this.logger('onEvent', this.relayId, event)

      const connection = relayManager.getConnector(this.relayId)
      connection.stats.events++

      event.relay = this.relayId

      if(event.kind === 0) {
        this.userStore.addUser(event.pubkey, event)

        window.emitter.emit('profile-'+event.pubkey, event)
      }

      this.eventStore.addEvent(event)

      this.events[event.id] = event

      this.callback(event, this.relayId)
    },

    onEndOfEvents() {
      this.logger('onEndOfEvents', this.relayId, this.autoClose)

      if(this.autoClose) {
        this.unsubscribe()

        this.callback({
          type: 'end'
        })
      }
    },

    logger(...args) {
      if(this.logEnabled) {
        console.log('RelayRequest', ...args)
      }
    }
  }
}