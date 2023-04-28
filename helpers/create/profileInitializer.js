import { useProfileStore } from '@/stores/profile'
import sampleRelays from '@/data/sample-relays.json'
import sampleFollows from '@/data/sample-follows.json'

import * as secp256k1 from '@noble/secp256k1'
import { wordlist } from '@scure/bip39/wordlists/english.js'
import { generateMnemonic, mnemonicToSeedSync, validateMnemonic } from '@scure/bip39'
import { HDKey } from '@scure/bip32'

/*

Sets up default values for a profile in the create flow

 */

export default {
  log: false,
  store: null,

  init() {
    if(!this.store) {
      this.store = useProfileStore()
    }

    this.initKeys()
    this.initRelays()
    this.initFollows()
  },

  initKeys() {
    if(!this.store.mnemonic) {
      const mnemonic = generateMnemonic(wordlist)

      // A mnemonic with the same word twice, for testing.
      // const mnemonic = 'cute whip blossom wedding arm arrange runway arrange oven jazz rival accuse'

      const root = HDKey.fromMasterSeed(mnemonicToSeedSync(mnemonic, null))
      const privateKeyTemp = root.derive(`m/44'/1237'/0'/0/0`).privateKey
      if (!privateKeyTemp) throw new Error('could not derive private key')
      const privateKey =  secp256k1.utils.bytesToHex(privateKeyTemp)

      const publicKey = window.NostrTools.getPublicKey(privateKey)
      const npub = window.NostrTools.nip19.npubEncode(publicKey)

      if(this.log) {
        console.log('Profile store.initKeys', mnemonic, privateKey, publicKey, npub)
      }

      this.store.mnemonic = mnemonic
      this.store.privateKey = privateKey
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
      
      if(this.log) {
        console.log('profileInitializer.initRelays', this.store.relays, sampleRelays)
      }
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
  
      if(this.log) {
        console.log('profileInitializer.initFollows', this.store.follows)
      }
    }
  }
}