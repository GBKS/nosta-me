import { defineStore } from 'pinia'

/*

Relays are used all over the place. We store info about them here and only use
relayIds elsewhere. Ids are created from the URL.

The connections themselves are not kept here, they don't belong in reactive
state. Get them with relayManager.getConnection().

 */

export const useRelayStore = defineStore('relays', {
  state: () => {
    return {
      relays: {}, // Objects created by relayManager.addRelayByUrl()
      info: {} // Relay info document, NIP-11
    }
  },

  getters: {
    getAll() {
      return this.relays
    },

    getRelay: (state) => {
      return (relayId) => {
        return state.relays[relayId]
      }
    },

    getRelayByUrl: (state) => {
      return (url) => {
        let result = null

        for(let relayId in state.relays) {
          if(state.relays[relayId].url == url) {
            result = state.relays[relayId]
          }
        }

        return result
      }
    },

    getRelayIds: (state) => {
      const result = []

      for(let relayId in state.relays) {
        result.push(relayId)
      }

      return result
    },

    getRelayInfo: (state) => {
      return (relayId) => {
        return state.info[relayId]
      }
    }
  },

  actions: {
    addRelay(relay) {
      this.relays[relay.id] = relay
    },

    removeRelay(relayId) {
      delete this.relays[relayId]
    },

    setRelayStatus(relayId, status) {
      this.relays[relayId].status = status
    },

    setRelayInfo(relayId, info) {
      this.info[relayId] = info
    }
  }
})