
import relayManager from '@/helpers/relayManager.js'
import { useEventStore } from "@/stores/events.js"
import { useRelayStore } from "@/stores/relays.js"
import { Relay } from 'nostr-tools/relay'

/*

Handles the connection to a relay.

 */

export const RelayConnectorStatus = {
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  CONNECTION_ERROR: 'connection-error',
  COULD_NOT_OPEN: 'could-not-open',
  NOTICE: 'notice',
  DISCONNECTED: 'disconnected'
}

export default function relayConnector () { 
  return {
    logEnabled: false,
    relayId: null,
    relayData: null,
    initialized: false,
    relayStore: null,
    eventStore: null,
    connection: null,

    stats: {
      connectionAttempts: 0,
      connectionSuccesses: 0,
      connectionFailures: 0,
      events: 0,
      errors: 0,
      notices: 0,
      disconnects: 0,
      publishAttempts: 0,
      publishSuccesses: 0,
      publishSeens: 0,
      publishErrors: 0
    },

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
      this.logger('connect', this.relayId)

      this.stats.connectionAttempts++

      try {
        const connection = await Relay.connect(this.relayData.url)
        // console.log('relayUrl', this.relayData.url)
        // console.log('connection', connection)
        // console.log('connection.connect', connection.connect)
        // console.log('connection.connected', connection.connected)
        // console.log('connection.subscribe', connection.subscribe)

        this.setRelayStatus(this.relayId, RelayConnectorStatus.CONNECTING)
        this.relayStore.setRelayConnection(this.relayId, connection)

        // await connection.connect()
        
        // connection.ws.onopen = this.onConnect.bind(this)
        // connection.ws.onclose = this.onDisconnect.bind(this)
        // connection.ws.onerror = this.onError.bind(this)
        // connection.ws.onmessage = this.onNotice.bind(this)

        if(connection.connected) {
          this.onConnect()
        } else {
          this.onError()
        }

        // connection.on('connect', this.onConnect.bind(this))
        // connection.on('disconnect', this.onDisconnect.bind(this))
        // connection.on('error', this.onError.bind(this))
        // connection.on('notice', this.onNotice.bind(this))
      } catch(error) {
        // 0 Connecting
        // 1 Open
        // 2 Closing
        // 3 Closed
        this.logger('could not connect', error, this.relayId)

        this.stats.connectionFailures++

        this.setRelayStatus(this.relayId, RelayConnectorStatus.COULD_NOT_OPEN)
      }
    },

    onConnect() {
      this.logger('onConnect', this.relayId)

      this.setRelayStatus(this.relayId, RelayConnectorStatus.CONNECTED)

      this.stats.connectionSuccesses++

      window.emitter.emit('relay-connect', { relayId: this.relayId })
      window.emitter.emit('relay-connect-'+this.relayId)
    },

    onError() {
      this.logger('onError', this.relayId)

      this.stats.errors++

      this.setRelayStatus(this.relayId, RelayConnectorStatus.CONNECTION_ERROR)
    },

    onDisconnect(data) {
      this.logger('onDisconnect', this.relayId, data)

      this.stats.disconnects++

      this.setRelayStatus(this.relayId, RelayConnectorStatus.DISCONNECTED)
    },

    onNotice(data) {
      this.logger('onNotice', this.relayId, data)

      this.stats.notices++

      this.setRelayStatus(this.relayId, RelayConnectorStatus.NOTICE)
    },

    disconnect() {
      this.setRelayStatus(this.relayId, null)
      this.relayStore.setRelayConnection(this.relayId, null)

      this.stats.disconnects++

      this.connection.close()
    },

    async publish(event) {
      this.logger('publish', event, this.connection.url)

      this.stats.publishAttempts++

      const subscription = this.connection.subscribe([
        { ids: [event.id] },
      ], {
        onevent: (event) => {
          this.logger('we got the event we wanted:', event)
          this.stats.publishSuccesses++
          this.stats.publishSeens++
        },
        oneose() {
          this.logger('closing subscription')
          subscription.close()
        }
      })
      this.logger('subscription', subscription)

      try {
        const request = await connection.publish(event)
        this.logger('request', request)
      } catch(error) {
        this.logger('error', error)
        this.stats.publishErrors++
        this.onError(error)
      }

      // let pub = this.connection.publish(event)
      // 
      // pub.on('ok', () => {
      //   console.log(`${this.connection.url} has accepted our event`)
      //   this.stats.publishSuccesses++
      // })

      // pub.on('seen', () => {
      //   console.log(`we saw the event on ${this.connection.url}`)
      //   this.stats.publishSeens++
      // })

      // pub.on('failed', reason => {
      //   console.log(`failed to publish to ${this.connection.url}: ${reason}`)
      //   this.stats.publishErrors++
      // })
    },

    setRelayStatus(relayId, status) {
      this.relayStore.setRelayStatus(relayId, status)

      window.emitter.emit('relay-connection-status-change', {
        relayId: relayId,
        status: status
      })
    },

    logger(...args) {
      if(this.logEnabled) {
        console.log('RelayConnector', ...args)
      }
    }
  }
}