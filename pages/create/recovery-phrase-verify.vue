<script setup>
import { useProfileStore } from '@/stores/profile'
import profileInitializer from '@/helpers/create/profileInitializer.js'

definePageMeta({
  layout: "create",
  pageTransition: {
    name: 'slide-right'
  },
  middleware (to, from) {
    if(to.name == 'create-recovery-phrase-verify' && from.name == 'create-private-key') {
      to.meta.pageTransition.name = 'slide-left'
      from.meta.pageTransition.name = 'slide-left'
    } else {
      to.meta.pageTransition.name = 'slide-right'
      from.meta.pageTransition.name = 'slide-right'
    }
  }
})

let store = null
const completed = ref(false)

function copyToClipboard() {
  navigator.clipboard.writeText(store.mnemonic)
}

function onComplete() {
  completed.value = true
}

onMounted(() => {
  store = useProfileStore()

  profileInitializer.init()
})
</script>

<template>
  <div class="recovery-phrase-page -create-page">
    <div class="content">
      <div class="copy">
        <p class="-step">4 of 10</p>
        <h1>Let's check</h1>
        <p class="-description">Tap the words in the order they appear in your recovery phrase.</p>
      </div>
    </div>
    <div class="options">
      <client-only>
        <CreateRecoveryPhrase
          :words="store.mnemonic"
          :verify="true"
          @complete="onComplete"
        />
      </client-only>
    </div>
    <nav>
      <UiButton 
        to="/create/recovery-phrase" 
        icon="arrowLeft" 
        size="small"
      />
      <UiButton
        to="/create/private-key" 
        icon="arrowRight" 
        size="small"
        :disabled="!completed"
      >Next</UiButton>
    </nav>
  </div>
</template>

<style scoped lang="scss">

.recovery-phrase-page {
  
}

</style>