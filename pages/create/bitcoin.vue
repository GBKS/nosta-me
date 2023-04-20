<script setup>
import { useProfileStore } from '@/stores/profile'

definePageMeta({
  layout: "create",
  pageTransition: {
    name: 'slide-right'
  },
  middleware (to, from) {
    if(to.name == 'create-bitcoin' && from.name == 'create-relays') {
      to.meta.pageTransition.name = 'slide-left'
      from.meta.pageTransition.name = 'slide-left'
    } else {
      to.meta.pageTransition.name = 'slide-right'
      from.meta.pageTransition.name = 'slide-right'
    }
  }
});

const store = useProfileStore()

const hasInput = computed(() => {
  return store.bitcoin.length > 0
})

const buttonLabel = computed(() => {
  return hasInput.value ? 'Next' : 'Skip'
})
</script>

<template>
  <div class="bitcoin-page -create-page">
    <div class="content">
      <div class="copy">
        <p class="-step">9 of 10</p>
        <h1>Receive bitcoin</h1>
        <p class="-description">Let others send you bitcoin by sharing your lightning address. You can get one for free with services like <a href="https://getalby.com/" rel="nofollow noopener noreferrer" target="_blank">Alby</a>.</p>
      </div>
    </div>
    <div class="options">
      <UiInput
        placeholder="Enter your lightning address..."
        v-model="store.bitcoin"
      />
    </div>
    <nav>
      <UiButton
        to="/create/follow"
        icon="arrowLeft" 
        size="small"
      ></UiButton>
      <UiButton 
        to="/create/relays" 
        icon="arrowRight" 
        size="small"
      >{{ buttonLabel }}</UiButton>
    </nav>
  </div>
</template>

<style scoped lang="scss">

.bitcoin-page {
  nav {
    :deep(a) {
      &:last-child {
        // width: 175px;
      }
    }
  }
}

</style>