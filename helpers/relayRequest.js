
import relayManager from '@/helpers/relayManager.js'

import { useEventStore } from "@/stores/events.js"
import { useRelayStore } from "@/stores/relays.js"
import { useUserStore } from "@/stores/users.js"

/*

Checks a single relay for data.

 */

export default function relayService () { 
  return {
    log: !true,
    initialized: false,
    autoClose: true,
    relayId: null,
    filter: null,
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

    start(relayId, filter) {
      this.relayId = relayId
      this.filter = filter

      this.subscribe()
    },

    stop() {
      this.unsubscribe()
    },

    kill() {
      this.stop()
    },

    subscribe() {
      if(this.log) {
        console.log('subscribe', this.relayId)
      }

      const relay = this.relayStore.getRelay(this.relayId)
      const connection = this.relayStore.getRelayConnection(this.relayId)
      // console.log('relay', relay)

      if(relay.status == 'connected') {
        if(connection) {
          this.subscription = connection.sub([
            this.filter
          ])

          if(this.log) {
            console.log('subbing now', this.subscription, this.relayId, this.filter)
          }

          this.subscription.on('event', this.onEvent.bind(this))
          this.subscription.on('eose', this.onEndOfEvents.bind(this))
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
      if(this.log) {
        console.log('onRelayConnect', data)
      }

      window.emitter.off('relay-connect-'+this.relayId, this.connectCallback)
      this.connectCallback = null
      
      this.subscribe()
    },

    unsubscribe() {
      if(this.subscription) {
        this.subscription.unsub()

        this.subscription = null
      }
    },

    onEvent(event) {
      if(this.log) {
        console.log('onEvent', this.relayId, event)
      }

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
      if(this.log) {
        console.log('onEndOfEvents', this.relayId, this.autoClose)
      }

      if(this.autoClose) {
        this.unsubscribe()

        this.callback({
          type: 'end'
        })
      }
    }
  }
}