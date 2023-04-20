<script setup>
import { useSessionStore } from '@/stores/session'

const sessionStore = useSessionStore()

const title = computed(() => {
  if(sessionStore.isLoggedIn) {
    return 'View profile'
  } else {
    return 'Sign in'
  }
})

const link = computed(() => {
  if(sessionStore.isLoggedIn) {
    return '/'+sessionStore.publicKey
  } else {
    return '/login/options'
  }
})
</script>

<template>
  <HeaderIconButton
    icon="account"
    :title="title"
    :to="link"
  />
</template>

<style scoped lang="scss">

.account {

}

</style>
