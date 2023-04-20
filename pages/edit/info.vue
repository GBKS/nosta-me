<script setup>
import { useProfileStore } from '@/stores/profile'

definePageMeta({
  layout: "edit",
  pageTransition: {
    name: 'slide-right'
  },
  middleware (to, from) {
    if(to.name == 'create-info' && from.name == 'create-relays') {
      to.meta.pageTransition.name = 'slide-left'
      from.meta.pageTransition.name = 'slide-left'
    } else {
      to.meta.pageTransition.name = 'slide-right'
      from.meta.pageTransition.name = 'slide-right'
    }
  }
})

const store = useProfileStore()
</script>

<template>
  <div class="info-page -edit-page">
    <div class="content">
      <div class="copy">
        <p class="-step">4 of 10</p>
        <h1>Who are you?</h1>
        <p class="-description">What should your name be on Nostr?<br/><br/>Share a bit about yourself</p>
      </div>
      <nav>
        <UiButton to="/create/public-key" icon="arrowLeft"></UiButton>
        <UiButton to="/create/relays" icon="arrowRight">Next</UiButton>
      </nav>
    </div>
    <div class="options">
      <UiInput
        placeholder="Enter your name..."
        v-model="store.name"
      />
      <UiInput
        placeholder="And 1-2 sentences about yourself..."
        v-model="store.about"
      />
      <UiInput
        placeholder="Do you have a website?"
        v-model="store.website"
      />
    </div>
  </div>
</template>

<style scoped lang="scss">

.info-page {
  
}

</style>