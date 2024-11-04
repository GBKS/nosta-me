<script setup>
import { useProfileStore } from '@/stores/profile'
import profileInitializer from '@/helpers/create/profileInitializer.js'
import { hexToBytes } from '@noble/hashes/utils'
import { nsecEncode } from 'nostr-tools/nip19'

definePageMeta({
  layout: "create",
  pageTransition: {
    name: 'slide-right'
  },
  middleware (to, from) {
    if(to.name == 'create-private-key' && from.name == 'create-public-key') {
      to.meta.pageTransition.name = 'slide-left'
      from.meta.pageTransition.name = 'slide-left'
    } else {
      to.meta.pageTransition.name = 'slide-right'
      from.meta.pageTransition.name = 'slide-right'
    }
  }
})

let store = null
const isCopied = ref(false)

function onCopy() {
  isCopied.value = true
}

const nsec = computed(() => {
  const privateKeyBytes = hexToBytes(store.privateKey)
  return nsecEncode(privateKeyBytes)
})

onMounted(() => {
  store = useProfileStore()

  profileInitializer.init()
})
</script>

<template>
  <div class="private-key-page -create-page">
    <div class="content">
      <div class="copy">
        <p class="-step">5 of 10</p>
        <h1>Your private key</h1>
        <p class="-description">This is super important. Copy it, save it in a secure place, and never share it. You may need it to log into Nostr clients. Best is to use a browser extension like <a href="https://getalby.com/" rel="nofollow noopener noreferrer" target="_blank">Alby</a> or <a href="https://chrome.google.com/webstore/detail/nos2x/kpgefcfmnafjgpblomihpgmejjdanjjp" rel="nofollow noopener noreferrer" target="_blank">nos2x</a>.</p>
      </div>
    </div>
    <div class="options">
      <client-only>
        <UiCopyBox
          :code="nsec"
          @copy="onCopy"
        />
      </client-only>
    </div>
    <nav>
      <UiButton 
        to="/create/recovery-phrase" 
        icon="arrowLeft" 
        size="small"
      ></UiButton>
      <UiButton 
        to="/create/public-key" 
        icon="arrowRight" 
        size="small"
        :disabled="!isCopied"
      >Next</UiButton>
    </nav>
  </div>
</template>

<style scoped lang="scss">

.private-key-page {
  
}

</style>