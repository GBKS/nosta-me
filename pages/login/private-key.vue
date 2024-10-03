<script setup>
import { useSessionStore } from '@/stores/session'
const sessionStore = useSessionStore()
const router = useRouter()

import { npubEncode } from 'nostr-tools/nip19'
import { getPublicKey } from 'nostr-tools/pure'
import { wordlist } from '@scure/bip39/wordlists/english'
import * as secp256k1 from '@noble/secp256k1'
import { mnemonicToSeedSync, validateMnemonic } from '@scure/bip39'
import { HDKey } from '@scure/bip32'

const privateKeyModel = ref('')

const inputValid = computed(() => {
  let result = false

  if(privateKeyModel.value.length > 0) {
    const validMnemonic = validateMnemonic(privateKeyModel.value, wordlist)

    if(validMnemonic) {
      result = true
    } else {
      const validPrivateKey = privateKeyModel.value.match(/[a-f0-9]{64}/)

      if(validPrivateKey) {
        result = true
      }
    }
  }

  return result
})

function evaluate() {
  let privateKey

  const isValidMnemonic = validateMnemonic(privateKeyModel.value, wordlist)
  if(isValidMnemonic) {
    // Get private key from mnemonic
    const root = HDKey.fromMasterSeed(mnemonicToSeedSync(privateKeyModel.value, null))
    const privateKeyTemp = root.derive(`m/44'/1237'/0'/0/0`).privateKey
    if (!privateKeyTemp) throw new Error('could not derive private key')
    privateKey =  secp256k1.utils.bytesToHex(privateKeyTemp)
  } else {
    const isValidPrivateKey = privateKeyModel.value.match(/[a-f0-9]{64}/)

    if(isValidPrivateKey) {
      privateKey = privateKeyModel.value
    }
  }
  
  if(privateKey) {
    const publicKey = getPublicKey(privateKey)
    const npub = npubEncode(publicKey)

    // Store for later.
    sessionStore.setLoginType('privatekey')
    sessionStore.setPrivateKey(privateKey)
    sessionStore.setPublicKey(publicKey)
    sessionStore.setLoggedIn(true)

    router.push('/'+npub)

    // console.log('evaluate', privateKeyModel.value, validMnemonic, validPrivateKey)
  }
}

</script>
<template>
  <div class="private-key-page">
    <NuxtLink to="/login/options">Back</NuxtLink>
    
    <h1>Log in</h1>
    <p>Enter your private key or recovery phrase.</p>

    <div class="input">
      <textarea
        placeholder="Enter here..."
        v-model="privateKeyModel"
      />
    </div>

    <UiButton
      :disabled="!inputValid"
      @click="evaluate" 
    >Log me in</UiButton>
  </div>
</template>

<style scoped lang="scss">

.private-key-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-left: 15px;
  padding-right: 15px;
  padding-bottom: 30px;
  @include r('padding-top', 30, 100);

  > a {
    color: var(--theme-front);
    text-decoration: none;
    padding: 4px 10px;
    border-radius: 5px;
    font-weight: 500;
    transition: all 150ms $ease;

    &:hover {
      background-color: rgba(var(--theme-front-rgb), 0.2);
    }
  }

  h1 {
    @include r('font-size', 80, 80);
    font-family: 'PoetsenOne';
    color: white;
  }

  p {
    margin: 0;
    @include r('font-size', 27, 27);
    color: white;
    text-align: center;
    font-weight: 600;
    max-width: 600px;
  }

  .input {
    margin-top: 50px;
    background-color: white;
    border-radius: 15px;
    border-width: 0;
    width: 100%;
    max-width: 500px;

    textarea {
      font-size: 24px;
      font-weight: 500;
      width: 100%;
      box-sizing: border-box;
      padding: 20px;
      @include r('min-height', 200, 120);
      background-color: transparent;
      border-width: 0;
      resize: none;
      font-feature-settings: 'tnum';
      font-variant-numeric: slashed-zero;

      &:focus {
        outline: none;
      }
    }
  }

  :deep(button) {
    margin-top: 20px;
  }
}

</style>
