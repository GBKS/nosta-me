import { useRelayStore } from "@/stores/relays.js"
import relayManager from '@/helpers/relayManager.js'

/*

Posts an event to a single relay.

 */

const NOTIFICATION_STATUS = {
  PUBLISHING: 'publishing',
  RECONNECTING: 'reconnecting',
  NO_CONNECTION: 'no-connection',
  ERROR: 'error',
  SUCCESS: 'success',
  TIMEOUT: 'timeout'
}

export default function relayPublishRequest () { 
  return {
    logEnabled: !false,
    initialized: false,
    relayId: null,
    callback: null,
    relayStore: null,
    connectCallback: null,
    showNotification: false,
    timeout: null,
    id: 'rpl-'+Math.round(Math.random()*1000000000),

    init() {
      if(!this.initialized) {
        this.initialized = true
        
        this.relayStore = useRelayStore()
      }
    },

    publish(relayId, event, callback) {
      this.logger('publish', relayId, event, callback)

      this.init()

      this.relayId = relayId
      this.event = event
      this.callback = callback

      const relay = this.relayStore.getRelay(this.relayId)
      const connection = this.relayStore.getRelayConnection(this.relayId)
      this.logger('relay', relay)

      if(this.timeout) clearTimeout(this.timeout)
      this.timeout = setTimeout(this.onTimeout.bind(this), 10000)

      if(relay.status == 'connected') {
        if(connection) {
          this.logger('publishing now')

          this.updateNotification(NOTIFICATION_STATUS.PUBLISHING)

          const request = connection.publish(event)
          request.on('ok', this.onSuccess.bind(this))
          request.on('failed', this.onError.bind(this))
        } else {
          this.logger('No connection')
          this.updateNotification(NOTIFICATION_STATUS.NO_CONNECTION)
        }
      } else {
        this.logger('subscribe connection not found with relayId: ' + this.relayId)

        this.updateNotification(NOTIFICATION_STATUS.RECONNECTING)

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
      this.logger('onRelayConnect', this.relayId)

      window.emitter.off('relay-connect-'+this.relayId, this.connectCallback)
      this.connectCallback = null
      
      this.publish(this.relayId, this.event, this.callback)
    },

    onSuccess() {
      this.logger('onSuccess', this)

      clearTimeout(this.timeout)

      this.updateNotification(NOTIFICATION_STATUS.SUCCESS)

      this.callback({
        id: this.id,
        status: 'success',
        event: this.event,
        relayId: this.relayId
      })
    },

    onError(error) {
      this.logger('relayPublishRequest.onError', error, this)

      this.updateNotification(NOTIFICATION_STATUS.ERROR)

      this.callback({
        id: this.id,
        status: 'error',
        reason: error,
        event: this.event,
        relayId: this.relayId
      })
    },

    onTimeout() { 
      this.logger('onTimeout', this.relayId)

      this.updateNotification(NOTIFICATION_STATUS.TIMEOUT)

      this.callback({
        id: this.id,
        status: 'timeout',
        event: this.event,
        relayId: this.relayId
      })
    },

    updateNotification(status) {
      if(!this.showNotification) return

      let theme = 'progress'
      let title = null
      let description = 'To ' + this.relayId
      let expiration = null
      // const detail = 'Kind ' + this.event.kind + ', ' + this.relayId

      console.log('updateNotification', status)

      switch(status) {
        case NOTIFICATION_STATUS.PUBLISHING:
          title = 'Publishing event'
          break
        case NOTIFICATION_STATUS.RECONNECTING:
          title = 'Reconnecting'
          break
        case NOTIFICATION_STATUS.NO_CONNECTION:
          theme = 'error'
          title = 'Publish error'
          description += ', could not connect'
          break
        case NOTIFICATION_STATUS.ERROR:
          theme = 'error'
          title = 'Publish error'
          break
        case NOTIFICATION_STATUS.SUCCESS:
          theme = 'success'
          title = 'Event published'
          expiration = 5000
          break
        case NOTIFICATION_STATUS.TIMEOUT:
          theme = 'error'
          title = 'Publish error'
          description += ', could not connect'
          break
      }

      description += '.'

      window.emitter.emit('show-notification', {
        id: this.id,
        theme,
        title,
        description,
        expiration
      })
    },
    
    logger(...args) {
      if(this.logEnabled) {
        console.log('relayPublishRequest', ...args)
      }
    }
  }
}