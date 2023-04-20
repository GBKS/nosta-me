import { defineStore } from 'pinia'
import { useStorage } from '@vueuse/core'

/*

Stores events (notes) received from relays for later reference.

 */

export const useEventStore = defineStore({
  id: 'events',

  state: () => {
    return { 
      events: useStorage('events', {})
    }
  },

  getters: {
    getAll() {
      return this.events
    },

    getEvent: (state) => {
      return (eventId) => {
        return state.events[eventId]
      }
    }
  },

  actions: {
    addEvent(event) {
      this.events[event.id] = event

      // Limit stored ones to a max amount to keep storage low
      const keys = Object.keys(this.events)
      let maxCount = 500
      if(keys.length > maxCount) {
        let deleteCounter = keys.length - maxCount
        while(deleteCounter > 0) {
          delete this.events[keys[deleteCounter]]

          deleteCounter--
        }
      }
    }
  }
})