import { useRelayStore } from "@/stores/relays.js"

/*

Posts an event to a single relay.

 */

export default function relayPublishRequest () { 
  return {
    log: false,
    initialized: false,
    relayId: null,
    callback: null,
    relayStore: null,
    connectCallback: null,

    init() {
      if(!this.initialized) {
        this.initialized = true
        
        this.relayStore = useRelayStore()
      }
    },

    publish(relayId, event, callback) {
      if(this.log) {
        console.log('relayPublishRequest.publish', relayId, event, callback)
      }

      this.init()

      this.relayId = relayId
      this.event = event
      this.callback = callback

      const relay = this.relayStore.getRelay(this.relayId)
      const connection = this.relayStore.getRelayConnection(this.relayId)
      console.log('relay', relay)

      if(relay.status == 'connected') {
        if(connection) {
          if(this.log) {
            console.log('publishing now')
          }

          const request = connection.publish(event)
          request.on('ok', this.onSuccess.bind(this))
          request.on('failed', this.onError.bind(this))
        } else {
          console.log('No connection')
        }
      } else {
        if(this.log) {
          console.log('subscribe connection not found with relayId: ' + this.relayId)
        }

        if(!connection) {
          relayManager.connectToRelay(this.relayId)
        }

        if(!this.connectCallback) {
          this.connectCallback = this.onRelayConnect.bind(this)
          window.emitter.on('relay-connect-'+this.relayId, this.connectCallback)
        }
      }
    },

    onRelayConnect() {
      if(this.log) {
        console.log('relayPublishRequest.onRelayConnect', this.relayId)
      }

      window.emitter.off('relay-connect-'+this.relayId, this.connectCallback)
      this.connectCallback = null
      
      this.publish(this.relayId, this.event, this.callback)
    },

    onSuccess() {
      if(this.log) {
        console.log('relayPublishRequest.onSuccess', this)
      }

      this.callback({
        status: 'success',
        event: this.event,
        relayId: this.relayId
      })
    },

    onError(error) {
      if(this.log) {
        console.log('relayPublishRequest.onError', error, this)
      }

      this.callback({
        status: 'error',
        reason: reason,
        event: this.event,
        relayId: this.relayId
      })
    }
  }
}