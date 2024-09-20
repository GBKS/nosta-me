import { defineStore } from 'pinia'
import { useStorage, useLocalStorage } from '@vueuse/core'

/*

Profiles (kind 0) gets loaded a lot, this is a temp storage.

 */

export const useUserStore = defineStore({
  id: 'users',

  state: () => {
    return {
      users: {}
    }
  },

  getters: {
    getUser: (state) => {
      return (publicKey) => {
        return state.users[publicKey]
      }
    }
  },

  actions: {
    addUser(publicKey, data) {
      // Auto convert the content field to an object for convenience
      if(typeof data.content == 'string' && data.content.length > 0) {
        data.originalContent = data.content
        data.content = JSON.parse(data.content)
      }
      
      this.users[publicKey] = data
    }
  }
})