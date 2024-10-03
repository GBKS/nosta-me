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
    <NuxtLink to="/edit/profile">Info</NuxtLink>
    <NuxtLink to="/edit/relays">Relays</NuxtLink>
    <NuxtLink v-if="false" to="/edit/follow">Follow</NuxtLink>
    <NuxtLink v-if="false" :to="profileLink">Back to profile</NuxtLink>
  </nav>
</template>

<style scoped lang="scss">

nav {
  display: flex;
  gap: 10px;

  a {
    display: block;
    text-decoration: none;
    background-color: rgba(var(--front-rgb), 0.075);
    color: var(--front);
    border-radius: 100px;
    padding: 3px 15px;
    min-width: 100px;
    text-align: center;
    
    &.router-link-exact-active {
      background-color: var(--front);
      color: var(--back);
    }
  }
}

</style>
