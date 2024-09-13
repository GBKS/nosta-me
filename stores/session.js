import { defineStore } from 'pinia'
import { useStorage, useLocalStorage } from '@vueuse/core'
import sessionRelayService from '@/helpers/sessionRelayService.js'
import sessionContactsService from '@/helpers/sessionContactsService.js'

export const LOGIN_TYPE = {
  BROWSER: 'browser',
  PRIVATE_KEY: 'privatekey',
  CONNECT: 'connect'
}

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

      // When the user logs in, we need to initialize the relay and contacts services
      // We need the relays to find the contacts.
      // This allows for showing follow/following state on profiles.
      if(value) {
        // The relay service will initialize the contacts service when it's ready
        sessionRelayService.init()
      } else {
        sessionRelayService.reset()
        sessionContactsService.reset()
      }
    },

    setLoginType(value) {
      this.loginType = value
    }
  }
})