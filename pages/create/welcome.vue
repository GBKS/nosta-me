<script setup>
import { ref, onMounted } from 'vue'
import { useProfileStore } from '@/stores/profile'
import profileInitializer from '@/helpers/create/profileInitializer.js'

import * as secp256k1 from '@noble/secp256k1'
import { wordlist } from '@scure/bip39/wordlists/english.js'
import { generateMnemonic, mnemonicToSeedSync, validateMnemonic } from '@scure/bip39'
import { HDKey } from '@scure/bip32'

// import { generatePrivateKey, getPublicKey } from 'nostr-tools'

// import nostrTools from 'nostr-tools';
// const { generatePrivateKey, getPublicKey } = nostrTools;

definePageMeta({
  layout: "create",
  pageTransition: {
    name: 'slide-right'
  },
  middleware (to, from) {
    // console.log('welcome.from', from.name)
    // console.log('welcome.to', to.name)

    if(to.name == 'create-welcome' && from.name == 'create-info') {
      to.meta.pageTransition.name = 'slide-left'

      if(from.meta.pageTransition) {
        from.meta.pageTransition.name = 'slide-left'
      }
    } else {
      if(to.meta.pageTransition) {
        to.meta.pageTransition.name = 'slide-right'
      }

      if(from.meta.pageTransition) {
        from.meta.pageTransition.name = 'slide-right'
      }
    }
    // to.meta.pageTransition.name = from.name == 'create-private-key' ? 'slide-left' : 'slide-right'
  }
})

function privateKeyFromSeedWords(mnemonic, passphrase) {
  let root = HDKey.fromMasterSeed(mnemonicToSeedSync(mnemonic, passphrase))
  let privateKey = root.derive(`m/44'/1237'/0'/0/0`).privateKey
  if (!privateKey) throw new Error('could not derive private key')
  return secp256k1.utils.bytesToHex(privateKey)
}

const imageSource = computed(() => {
  const image =  '/assets/images/baby-nostrich.jpg'
  return useAssets(image)
})

const imageSourceSet = computed(() => {
  const retinaImage = '/assets/images/baby-nostrich@2x.jpg'
  return imageSource.value + ' 1x, ' + useAssets(retinaImage) + ' 2x'
})

onMounted(() => {
  const store = useProfileStore()
  console.log('mounted', store.privateKey, store.publicKey)  
  console.log('privateKey', store.privateKey == '')   
  console.log('publicKey', store.publicKey == '')  

  profileInitializer.init()
})

// Only navigate back home after confirming cancel
onBeforeRouteLeave((to, from) => {
  if(to.name == 'index' && from.name == 'create-welcome') {
    if(confirm('Sure you want to cancel setting your profile?')) {
      return true
    } else {
      return false
    }
  } else {
    return true
  }
})

</script>

<template>
  <div class="welcome-page -create-page">
    <div class="content">
      <div class="copy">
        <p class="-step">1 of 10</p>
        <h1>Welcome</h1>
        <p class="-description">So great that you decided to join Nostr.<br/><br/>We’ll now take you through a few steps to set up your profile the way you want.</p>
      </div>
    </div>
    <div class="options">
      <img
        :src="imageSource"
        :srcset="imageSourceSet"
        width="600"
        height="600"
        alt="A purple baby Nostrich."
      />
    </div>
    <nav>
      <UiButton to="/" icon="arrowLeft" size="small"></UiButton>
      <UiButton to="/create/info" icon="arrowRight" size="small">Next</UiButton>
    </nav>
  </div>
</template>

<style scoped lang="scss">

.welcome-page {
  .options {
    overflow: hidden;

    img {
      object-fit: cover;
      width: 100%;
      height: 100%;
    }
  }
}

</style>

/*


Welcome to priv !--

welcome gets  left-leave
Priv gets     priv-left-enter


Priv to welcome --!

priv gets     priv-left-leave
welcome gets  left-enter


priv to pub !--

priv gets     priv-left-leave
pub gets      pub-left-enter


pub to priv --!

pub gets      priv-left-leave
priv gets     priv-left-enter

 */