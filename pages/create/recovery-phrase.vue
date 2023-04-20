<script setup>
import { useProfileStore } from '@/stores/profile'
import profileInitializer from '@/helpers/create/profileInitializer.js'

definePageMeta({
  layout: "create",
  pageTransition: {
    name: 'slide-right'
  },
  middleware (to, from) {
    if(to.name == 'create-recovery-phrase' && from.name == 'create-recovery-phrase-verify') {
      to.meta.pageTransition.name = 'slide-left'
      from.meta.pageTransition.name = 'slide-left'
    } else {
      to.meta.pageTransition.name = 'slide-right'
      from.meta.pageTransition.name = 'slide-right'
    }
  }
})

const isCopied = ref(false)
let store = null

function copyToClipboard() {
  navigator.clipboard.writeText(store.mnemonic)
  isCopied.value = true

  setTimeout(resetCopied, 2000)
}

function resetCopied() {
  isCopied.value = false
}

const copyLabel = computed(() => {
  return isCopied.value ? 'Copied!' : 'Copy'
})

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
        <h1>Your recovery phrase</h1>
        <p class="-description">These words let you recreate your account in case you lose access. Write them down in a safe place (hint: the next step is to verify the words).</p>
      </div>
    </div>
    <div class="options">
      <client-only>
        <CreateRecoveryPhrase
          :words="store.mnemonic"
          :verify="false"
        />
        <UiButton
          size="small"
          @click="copyToClipboard"
        >{{ copyLabel }}</UiButton>
      </client-only>
    </div>
    <nav>
      <UiButton to="/create/picture-enter" icon="arrowLeft" size="small"></UiButton>
      <UiButton to="/create/recovery-phrase-verify" icon="arrowRight" size="small">Next</UiButton>
    </nav>
  </div>
</template>

<style scoped lang="scss">

.recovery-phrase-page {
  .options {
    gap: 30px;
    align-items: stretch !important;
  }
}

</style>