<script setup>
import { useProfileStore } from '@/stores/profile'

definePageMeta({
  layout: "edit",
  pageTransition: {
    name: 'slide-right'
  },
  middleware (to, from) {
    if(to.name == 'create-follow' && from.name == 'create-bitcoin') {
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
  <div class="login-page -edit-page">
    <div class="content">
      <div class="copy">
        <h1>Login</h1>
        <p class="-description">Your profile will be posted to several relays where others will be able to see it. You can update it anytime. Here’s a list of relays to get started with.</p>
      </div>
    </div>
    <div class="options">
      
    </div>
  </div>
</template>

<style scoped lang="scss">

.login-page {
  
}

</style>