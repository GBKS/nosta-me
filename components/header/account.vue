<script setup>
import { storeToRefs } from 'pinia'
import { useSessionStore } from '@/stores/session'

const sessionStore = useSessionStore()

const { isLoggedIn } = storeToRefs(sessionStore)

const title = computed(() => {
  return isLoggedIn ? 'View profile' : 'Sign in'
})

const link = computed(() => {
  return isLoggedIn ? '/'+sessionStore.publicKey : '/login/options'
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
