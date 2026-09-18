
import { useRelayStore } from "@/stores/relays.js"
import ToolBox from '@/helpers/toolBox'
import relayList from '@/helpers/relayList.js'
import relayConnector from '@/helpers/relayConnector.js'
import { normalizeURL } from 'nostr-tools/utils'

/*

Centralized organizer for relays.
Creates a relayConnector for every relay we connect to.

 */

export default {
  logEnabled: false,
  initialized: false,
  relayStore: null,
  connectors: {},

  init() {
    this.logger('init')
    if(!this.initialized) {
      this.initialized = true

      this.relayStore = useRelayStore()
      
      this.addInitialRelays()
    }
  },

  // Connect to all primary relays and a few random ones from our initial seed list
  addInitialRelays() {
    const primaryIds = []
    const otherIds = []
    for(let i in relayList) {
      if(relayList[i].primary) {
        primaryIds.push(i)
      } else {
        otherIds.push(i)
      }
    }
    ToolBox.shuffleArray(otherIds)

    const relayIds = primaryIds.concat(otherIds.slice(0, 3))

    let relayId
    for(let i=0; i<relayIds.length; i++) {
      relayId = relayIds[i]
      relayList[relayId].id = relayId

      this.relayStore.addRelay(relayList[relayId])
    }
  },

  addRelayByUrl(url) {
    // console.log('addRelayByUrl', this.relayStore, url)

    if(!url) {
      this.logger('addRelayByUrl: No url provided', url)
      return
    }

    url = url.trim()

    // Check if already added
    const relay = this.getRelayByUrl(url)

    if(relay) {
      return relay.id
    } else {
      let bits
      if(url.indexOf('wss://') !== -1) {
        bits = url.split('wss://')
      } else if(url.indexOf('ws://') !== -1) {
        bits = url.split('ws://')
      } else {
        bits = url.split('//')
      }

      this.logger('addRelayByUrl', url, bits)

      if(bits.length > 0) {
        let idBit = bits[0]
        if(idBit == '' && bits.length > 1) {
          idBit = bits[1]
        }

        let relayId = idBit.replaceAll('.', '-')

        if(relayId.endsWith('/')) {
          relayId = relayId.substr(0, relayId.length-1)
        }

        const data = {
          id: relayId,
          name: relayId,
          url,
          status: null
        }

        this.logger('addRelayByUrl', url, data)

        this.relayStore.addRelay(data)

        this.connectToRelay(relayId)

        return relayId
      } else {
        return null
      }
    }
  },

  isAdded(url) {
    return this.getRelayByUrl(url) !== null
  },

  getAllRelayIds() {
    let result = []

    const relays = this.relayStore.getAll
    for(let relayId in relays) {
      result.push(relayId)
    }

    return result
  },

  // So that wss://nos.lol and wss://nos.lol/ are seen as the same relay
  normalizeUrl(url) {
    try {
      return normalizeURL(url)
    } catch(error) {
      return url
    }
  },

  getRelayByUrl(url) {
    let result = null

    const normalizedUrl = this.normalizeUrl(url)
    const relays = this.relayStore.getAll
    let relay
    for(let relayId in relays) {
      relay = relays[relayId]

      if(this.normalizeUrl(relay.url) == normalizedUrl) {
        result = relay
        break
      }
    }

    return result
  },

  getConnector(relayId) {
    return this.connectors[relayId]
  },

  connectToAllRelays() {
    this.logger('connectToAllRelays')
    const relays = this.relayStore.getAll
    for(let relayId in relays) {
      this.connectToRelay(relayId)
    }
  },

  connectToRelay(relayId) {
    let connector = this.connectors[relayId]

    if(!connector) {
      connector = relayConnector()
      connector.init(relayId)
    }

    this.logger('connectToRelay', relayId, connector)
    
    this.connectors[relayId] = connector
  },

  removeRelay(relayUrl) {
    let relay
    const relays = this.relayStore.getAll
    for(let relayId in relays) {
      relay = relays[relayId]

      if(relay.url == relayUrl) {
        const connection = this.connectors[relayId]
        connection.disconnect()

        delete this.connectors[relayId]

        relayStore.removeRelay(relayId)
        break
      }
    }
  },

  publish(event) {
    for(let relayId in this.connectors) {
      this.connectors[relayId].publish(event)
    }
  },

  logger(...args) {
    if(this.logEnabled) {
      console.log('RelayManager', ...args)
    }
  }
}