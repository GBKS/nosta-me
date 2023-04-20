<script setup>
import { useProfileStore } from '@/stores/profile'
import profileInitializer from '@/helpers/create/profileInitializer.js'

definePageMeta({
  layout: "create",
  pageTransition: {
    name: 'slide-right'
  },
  middleware (to, from) {
    if(to.name == 'create-public-key' && from.name == 'create-handle-enter') {
      to.meta.pageTransition.name = 'slide-left'
      from.meta.pageTransition.name = 'slide-left'
    } else {
      to.meta.pageTransition.name = 'slide-right'
      from.meta.pageTransition.name = 'slide-right'
    }
  }
})

let store
const isCopied = ref(false)

function onCopy() {
  isCopied.value = true
}

onMounted(() => {
  store = useProfileStore()

  profileInitializer.init()
})
</script>

<template>
  <div class="public-key-page -create-page">
    <div class="content">
      <div class="copy">
        <p class="-step">6 of 10</p>
        <h1>Your public key</h1>
        <p class="-description">This is your public ID. Feel free to share it with others so they find your profile and follow you.</p>
      </div>
    </div>
    <div class="options">
      <client-only>
        <UiCopyBox
          :code="store.npub"
          @copy="onCopy"
        />
      </client-only>
    </div>
    <nav>
      <UiButton 
        to="/create/private-key" 
        icon="arrowLeft" 
        size="small"
      ></UiButton>
      <UiButton 
        to="/create/handle-enter" 
        icon="arrowRight" 
        size="small"
        :disabled="!isCopied"
      >Next</UiButton>
    </nav>
  </div>
</template>

<style scoped>

.public-key-page {
  
}

</style>