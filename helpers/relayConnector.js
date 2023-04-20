
import relayList from '@/helpers/relayList.js'
import relayManager from '@/helpers/relayManager.js'
import { useEventStore } from "@/stores/events.js"
import { useRelayStore } from "@/stores/relays.js"

/*

Handles the connection to a relay.

 */

export default function relayConnector () { 
  return {
    log: false,
    relayId: null,
    relayData: null,
    initialized: false,
    relayStore: null,
    eventStore: null,
    connection: null,

    init(relayId) {
      if(!this.initialized) {
        this.relayStore = useRelayStore()
        this.eventStore = useEventStore()

        this.relayId = relayId
        this.relayData = this.relayStore.getRelay(relayId)
        this.initialized = true

        this.connect()
      }
    },

    async connect() {
      if(this.log) {
        console.log('relayConnector.connect', this.relayId)
      }
      
      const connection = window.NostrTools.relayInit(this.relayData.url)

      this.setRelayStatus(this.relayId, 'connecting')
      this.relayStore.setRelayConnection(this.relayId, connection)

      try {
        await connection.connect()
        
        connection.on('connect', this.onConnect.bind(this))
        connection.on('disconnect', this.onDisconnect.bind(this))
        connection.on('error', this.onError.bind(this))
        connection.on('notice', this.onNotice.bind(this))
      } catch(e) {
        // 0 Connecting
        // 1 Open
        // 2 Closing
        // 3 Closed
        if(this.log) {
          console.log('Could not connect', this.relayId, connection.status)
        }

        this.setRelayStatus(this.relayId, 'could-not-open')
      }
    },

    onConnect() {
      if(this.log) {
        console.log('relayConnector.onConnect', this.relayId)
      }

      this.setRelayStatus(this.relayId, 'connected')

      window.emitter.emit('relay-connect', { relayId: this.relayId })
      window.emitter.emit('relay-connect-'+this.relayId)
    },

    onError() {
      if(this.log) {
        console.log('onError', this.relayId)
      }

      this.setRelayStatus(this.relayId, 'connection-error')
    },

    onDisconnect(data) {
      if(this.log) {
        console.log('onDisconnect', this.relayId, data)
      }

      this.setRelayStatus(this.relayId, 'disconnected')
    },

    onNotice(data) {
      if(this.log) {
        console.log('onNotice', this.relayId, data)
      }

      this.setRelayStatus(this.relayId, 'notice')
    },

    disconnect() {
      this.setRelayStatus(this.relayId, null)
      this.relayStore.setRelayConnection(this.relayId, null)

      this.connection.close()
    },

    publish(event) {
      if(this.log) {
        console.log('publish', event, this.connection.url)
      }

      let pub = this.connection.publish(event)

      pub.on('ok', () => {
        console.log(`${this.connection.url} has accepted our event`)
      })

      pub.on('seen', () => {
        console.log(`we saw the event on ${this.connection.url}`)
      })

      pub.on('failed', reason => {
        console.log(`failed to publish to ${this.connection.url}: ${reason}`)
      })
    },

    setRelayStatus(relayId, status) {
      this.relayStore.setRelayStatus(relayId, status)

      window.emitter.emit('relay-connection-status-change', {
        relayId: relayId,
        status: status
      })
    }
  }
}