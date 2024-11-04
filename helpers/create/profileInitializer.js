import { useProfileStore } from '@/stores/profile'
import sampleRelays from '@/data/sample-relays.json'
import sampleFollows from '@/data/sample-follows.json'

import { wordlist } from '@scure/bip39/wordlists/english'
import { generateMnemonic } from '@scure/bip39'
import { accountFromSeedWords } from 'nostr-tools/nip06'
import { npubEncode, nsecEncode } from 'nostr-tools/nip19'
import { bytesToHex } from '@noble/hashes/utils'

// Sets up default values for a profile in the create flow

export default {
  logEnabled: !false,
  store: null,

  init() {
    if(!this.store) {
      this.store = useProfileStore()
    }

    this.initKeys()
    this.initRelays()
    // this.initFollows()
  },

  initKeys() {
    if(!this.store.mnemonic) {
      this.logger('initKeys')

      const mnemonic = generateMnemonic(wordlist)
      this.logger('mnemonic', mnemonic)

      // A mnemonic with the same word twice, for testing.
      // const mnemonic = 'cute whip blossom wedding arm arrange runway arrange oven jazz rival accuse'
      
      const passphrase = null // optional
      const accountIndex = 0
      const { privateKey, publicKey } = accountFromSeedWords(mnemonic, passphrase, accountIndex)
      this.logger('privateKey', privateKey)
      this.logger('publicKey', publicKey)

      const privateKeyHex = bytesToHex(privateKey)
      this.logger('privateKeyHex', privateKeyHex)

      const nsec = nsecEncode(privateKey)
      this.logger('nsec', nsec)

      const npub = npubEncode(publicKey)
      this.logger('npub', npub)

      this.store.mnemonic = mnemonic
      this.store.privateKey = privateKeyHex
      this.store.publicKey = publicKey
      this.store.npub = npub
    }
  },

  initRelays() {
    if(this.store.relays.length == 0) {
      const relayIds = []

      for(let i=0; i<sampleRelays.relays.length; i++) {
        relayIds.push(i)
      }

      // Shuffle
      relayIds.sort(() => Math.random() - 0.5)

      let item, index
      for(let i=0; i<5; i++) {
        index = relayIds[i]
        item = sampleRelays.relays.slice(index, index+1)[0]
        item.added = true
        this.store.addRelay(item)
      }
      
      this.logger('initRelays', this.store.relays, sampleRelays)
    }
  },

  initFollows() {
    if(this.store.follows.length == 0) {
      let item
      for(let i=0; i<sampleFollows.follows.length; i++) {
        item = sampleFollows.follows.slice(i, i+1)[0]
        item.added = true
        this.store.addFollow(item)
      }
  
      this.logger('initFollows', this.store.follows)
    }
  },

  logger(...args) {
    if(this.logEnabled) {
      console.log('profileInitializer', ...args)
    }
  }
}