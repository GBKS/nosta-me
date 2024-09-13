
import { useRelayStore } from "@/stores/relays.js"
import ToolBox from '@/helpers/toolBox'
import relayList from '@/helpers/relayList.js'
import relayConnector from '@/helpers/relayConnector.js'

/*

Centralized organizer for relays.
Creates a relayConnector for every relay we connect to.

 */

export default {
  log: false,
  initialized: false,
  relayStore: null,
  connectors: {},

  init() {
    console.log('relayManager.init')
    if(!this.initialized) {
      this.initialized = true

      this.relayStore = useRelayStore()
      
      this.addInitialRelays()
    }
  },

  // Connect to 3 random ideas from our initial seed list
  addInitialRelays() {
    const relayIds = []
    for(let i in relayList) relayIds.push(i)
    ToolBox.shuffleArray(relayIds)

    let relaysToAdd = 5, i=0, relayId
    for(let i=0; i<relayIds.length; i++) {
      relayId = relayIds[i]
      relayList[relayId].id = relayId

      this.relayStore.addRelay(relayList[relayId])

      relaysToAdd--
      if(relaysToAdd < 0) break
    }
  },

  addRelayByUrl(url) {
    // console.log('addRelayByUrl', this.relayStore, url)

    if(!url) {
      console.log('relayManager.addRelayByUrl: No url provided', url)
      return
    }

    // Check if already added
    const relay = this.relayStore.getRelayByUrl(url)

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

      if(this.log) {
        console.log('addRelayByUrl', url, bits)
      }

      if(bits.length > 0) {
        let idBit = bits[0]
        if(idBit == '' && bits.length > 1) {
          idBit = bits[1]
        }

        let relayId = idBit.replaceAll('.', '-')

        // if(relayId.endsWith('/')) {
        //   relayId = relayId.substr(0, relayId.length-1)
        // }

        const data = {
          id: relayId,
          name: relayId,
          url,
          status: null
        }

        if(this.log) {
          console.log('addRelayByUrl', url, data)
        }

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

  getRelayByUrl(url) {
    let result = null

    const relays = this.relayStore.getAll
    let relay
    for(let relayId in relays) {
      relay = relays[relayId]

      if(relay.url == url) {
        result = relay
        break
      }
    }

    return result
  },

  connectToAllRelays() {
    console.log('connectToRelays')
    const relays = this.relayStore.getAll
    for(let relayId in relays) {
      this.connectToRelay(relayId)
    }
  },

  connectToRelay(relayId) {
    const connector = relayConnector()
    connector.init(relayId)

    if(this.log) {
      console.log('connectToRelay', relayId, connector)
    }
    
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
  }
}