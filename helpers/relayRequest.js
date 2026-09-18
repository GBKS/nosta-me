
import relayManager from '@/helpers/relayManager.js'

import { useEventStore } from "@/stores/events.js"
import { useRelayStore } from "@/stores/relays.js"
import { useUserStore } from "@/stores/users.js"

/*

Checks a single relay for data.

 */

// How long to wait for the relay if it hasn't connected yet.
const MAX_WAIT_FOR_CONNECTION = 15000

export default function relayRequest () { 
  return {
    logEnabled: false,
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
    waitTimeout: null,
    stopped: false,

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
      // Without this, the relay connecting later would make this request
      // subscribe after all, and deliver events nobody is waiting for anymore.
      this.stopped = true
      this.stopWaitingForConnection()

      this.unsubscribe()
    },

    stopWaitingForConnection() {
      clearTimeout(this.waitTimeout)
      this.waitTimeout = null

      if(this.connectCallback) {
        window.emitter.off('relay-connect-'+this.relayId, this.connectCallback)
        this.connectCallback = null
      }
    },

    kill() {
      this.stop()
    },

    subscribe() {
      if(this.stopped) return

      this.logger('subscribe', this.relayId)

      const relay = this.relayStore.getRelay(this.relayId)

      if(!relay) {
        this.logger('subscribe: No relay found with relayId: ' + this.relayId)
        return
      }

      const connection = relayManager.getConnection(this.relayId)
      this.logger('relay', relay, connection)

      if(relay.status == 'connected' && relayManager.isConnected(this.relayId)) {
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
        this.logger('subscribe connection not found with relayId: ' + this.relayId)

        // Connects, or retries if an earlier attempt failed.
        relayManager.connectToRelay(this.relayId)

        if(!this.connectCallback) {
          this.connectCallback = this.onRelayConnect.bind(this)
          window.emitter.on('relay-connect-'+this.relayId, this.connectCallback)

          // Some relays never connect. Don't wait for them forever.
          this.waitTimeout = setTimeout(() => {
            this.logger('gave up waiting for', this.relayId)
            this.stopWaitingForConnection()
          }, MAX_WAIT_FOR_CONNECTION)
        }
      }
    },

    onRelayConnect(data) {
      this.logger('onRelayConnect', data)

      this.stopWaitingForConnection()

      this.subscribe()
    },

    unsubscribe() {
      if(this.subscription) {
        this.subscription.close()

        this.subscription = null
      }
    },

    onEvent(event) {
      if(this.stopped) return

      this.logger('onEvent', this.relayId, event)

      const connector = relayManager.getConnector(this.relayId)
      if(connector) connector.stats.events++

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