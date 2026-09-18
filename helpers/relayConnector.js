
import relayPool from '@/helpers/relayPool.js'
import { useEventStore } from "@/stores/events.js"
import { useRelayStore } from "@/stores/relays.js"

/*

Handles the connection to a relay.

The connection itself comes from the shared pool (see relayPool.js), which
reconnects dropped connections on its own. What the pool doesn't do is
tell us about it, or retry relays that never connected in the first
place. That's handled here, see checkStatus() and reconnectIfNeeded().

 */

// How long to wait for a relay to respond when connecting.
const CONNECTION_TIMEOUT = 8000

// Don't retry a relay that failed to connect more often than this.
const RETRY_COOLDOWN = 30000

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
    connecting: false,
    lastAttempt: 0,

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
      if(this.connecting || this.isConnected()) return

      this.logger('connect', this.relayId)

      this.connecting = true
      this.lastAttempt = Date.now()
      this.stats.connectionAttempts++

      this.setRelayStatus(this.relayId, RelayConnectorStatus.CONNECTING)

      try {
        const connection = await relayPool().ensureRelay(this.relayData.url, {
          connectionTimeout: CONNECTION_TIMEOUT
        })

        // The pool hands back the same object if it still has the relay.
        if(this.connection !== connection) {
          this.connection = connection

          // Only called when the connection is closed for good, not when the
          // pool is going to reconnect. The pool has its own handler to keep.
          const poolOnClose = connection.onclose
          connection.onclose = () => {
            if(poolOnClose) poolOnClose()
            this.onDisconnect()
          }

          connection.onnotice = (message) => { this.onNotice(message) }
        }

        this.connecting = false

        if(connection.connected) {
          this.onConnect()
        } else {
          this.onError()
        }
      } catch(error) {
        this.logger('could not connect', error, this.relayId)

        this.connecting = false
        this.connection = null
        this.stats.connectionFailures++

        this.setRelayStatus(this.relayId, RelayConnectorStatus.COULD_NOT_OPEN)
      }
    },

    isConnected() {
      return !!this.connection && this.connection.connected
    },

    // Relays that never connected don't get retried by the pool. We only do
    // that when something asks for the relay again, and not too often.
    reconnectIfNeeded() {
      if(this.connecting || this.isConnected()) return

      if(Date.now() - this.lastAttempt > RETRY_COOLDOWN) {
        this.connect()
      }
    },

    // Called regularly by the relayManager. The pool drops and restores
    // connections without telling us, so we compare notes here.
    checkStatus() {
      if(this.connecting || !this.connection) return

      const isConnected = this.connection.connected
      const wasConnected = this.relayData.status == RelayConnectorStatus.CONNECTED

      if(isConnected && !wasConnected) {
        this.onConnect()
      } else if(!isConnected && wasConnected) {
        this.onDisconnect()
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

    onDisconnect() {
      // Nothing to report if we closed it ourselves, see disconnect().
      if(!this.connection) return

      this.logger('onDisconnect', this.relayId)

      this.stats.disconnects++

      this.setRelayStatus(this.relayId, RelayConnectorStatus.DISCONNECTED)
    },

    onNotice(data) {
      this.logger('onNotice', this.relayId, data)

      this.stats.notices++
    },

    disconnect() {
      const connection = this.connection
      this.connection = null

      if(connection) {
        relayPool().close([this.relayData.url])
      }

      this.stats.disconnects++

      this.setRelayStatus(this.relayId, null)
    },

    async publish(event) {
      if(!this.isConnected()) return

      this.logger('publish', event, this.connection.url)

      this.stats.publishAttempts++

      try {
        await this.connection.publish(event)
        this.stats.publishSuccesses++
      } catch(error) {
        this.logger('error', error)
        this.stats.publishErrors++
      }
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