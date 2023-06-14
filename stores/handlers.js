import { defineStore } from 'pinia'

/*

Stores handlers (kind 31990) for the duration of this use

 */

export const useHandlerStore = defineStore({
  id: 'handlers',

  state: () => {
    return {
      handlers: {}
    }
  },

  getters: {
    getHandler: (state) => {
      return (id) => {
        return state.handlers[id]
      }
    }
  },

  actions: {
    addHandler(id, data) {
      // Auto convert the content field to an object for convenience
      if(typeof data.content == 'string' && data.content.length > 0) {
        data.content = JSON.parse(data.content)
      }
      
      this.handlers[id] = data
    }
  }
})