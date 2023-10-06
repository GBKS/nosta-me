import { defineStore } from 'pinia'

/*

Stores the users own profile in the creation flow and edit page.

 */

export const useProfileStore = defineStore({
  id: 'profile',

  state: () => {
    return {
      name: ref(''),
      about: ref(''),
      website: ref(''),
      picture: ref(''),
      pictureData: null,
      banner: ref(''),
      bannerData: null,
      handle: ref(''),
      bitcoin: ref(''),
      publicKey: ref(''),
      privateKey: ref(''),
      npub: ref(''),
      mnemonic: ref(''),
      relays: ref([]),
      follows: ref([]),
      theme: ref('')
    }
  },

  actions: {
    setPublicKey(value) {
      this.publicKey = value
    },

    addRelay(value) {
      this.relays.push(value)
    },

    addFollow(value) {
      this.follows.push(value)
    },

    removeFollow(value) {
      for(let i=0; i<this.follows.length; i++) {
        if(this.follows[i].npub == value.npub) {
          this.follows.splice(i, 1)
          break
        }
      }
    },

    clearFollows() {
      this.follows.value = []
    }
  }
})