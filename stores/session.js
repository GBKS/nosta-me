import { defineStore } from 'pinia'
import { useStorage, useLocalStorage } from '@vueuse/core'

/*

Info about the currently logged in user.

 */

export const useSessionStore = defineStore('session', {
  id: 'session',

  state: () => {
    return { 
      isLoggedIn: useLocalStorage('isLoggedIn', false),
      loginType: useLocalStorage('loginType', null), // browser, privatekey, connect
      privateKey: useLocalStorage('privateKey', null),
      publicKey: useLocalStorage('publicKey', null),
      theme: useLocalStorage('theme', null)
    }
  },

  hydrate(state, initialState) {
    state.isLoggedIn = useLocalStorage('isLoggedIn', false)
    state.loginType = useLocalStorage('loginType', null)
    state.privateKey = useLocalStorage('privateKey', null)
    state.publicKey = useLocalStorage('publicKey', null)
    state.theme = useLocalStorage('theme', 'space')
  },

  actions: {
    setTheme(value) {
      this.theme = value
    },

    setPrivateKey(value) {
      this.privateKey = value
    },

    setPublicKey(value) {
      this.publicKey = value
    },

    setLoggedIn(value) {
      this.isLoggedIn = value
    },

    setLoginType(value) {
      this.loginType = value
    }
  }
})