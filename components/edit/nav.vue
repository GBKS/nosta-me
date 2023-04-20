<script setup>
import { useProfileStore } from '@/stores/profile'
import { computed } from 'vue'

const profileLink = computed(() => {
  return '/'+store.publicKey
})

const store = useProfileStore()
</script>

<template>
  <nav>
    <NuxtLink to="/edit/info">Info</NuxtLink>
    <NuxtLink to="/edit/relays">Relays</NuxtLink>
    <NuxtLink to="/edit/follow">Follow</NuxtLink>
    <NuxtLink :to="profileLink">View profile</NuxtLink>
  </nav>
</template>

<style scoped lang="scss">

nav {
  display: flex;
  flex-direction: column;
}

</style>
