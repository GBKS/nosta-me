<script setup>
import { useProfileStore } from '@/stores/profile'

definePageMeta({
  layout: "edit",
  pageTransition: {
    name: 'slide-right'
  },
  middleware (to, from) {
    if(to.name == 'create-relays' && from.name == 'create-link') {
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
  <div class="relays-page -edit-page">
    <div class="content">
      <div class="copy">
        <h1>Let’s connect</h1>
        <p class="-description">Your profile will be posted to several relays where others will be able to see it. You can update it anytime. Here’s a list of relays to get started with.</p>
      </div>
    </div>
    <div class="options">
      <CreateRelayList />
    </div>
  </div>
</template>

<style scoped lang="scss">

.relays-page {
  
}

</style>