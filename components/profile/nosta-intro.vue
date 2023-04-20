<script setup>
import { useSessionStore } from '@/stores/session'

const sessionStore = useSessionStore()
const isLoggedIn = computed(() => { return sessionStore.isLoggedIn })
</script>

<template>
  <div v-if="!isLoggedIn" class="nosta-intro -theme-content-frame">
    <h3>This is a Nostr profile</h3>
    <p>Nostr is an open protocol for social media and other applications. Nosta, this website, is a way to set up and browse profiles. <NuxtLink to="/">Get started</NuxtLink>.</p>
  </div>
</template>

<style scoped lang="scss">

.nosta-intro {
  margin-top: 25px;
  border-radius: 25px;
  @include r('padding', 15, 25);
  width: 100%;
  max-width: 800px;
  box-sizing: border-box;

  h3 {
    @include r('font-size', 13, 15);
    font-weight: 600;
    color: var(--theme-front);
  }

  p {
    margin-top: 3px;
    @include r('font-size', 13, 15);
    color: rgba(var(--theme-front-rgb), 0.75);

    a {
      color: rgba(var(--theme-front-rgb), 0.75);

      &:hover {
        color: var(--theme-front);
      }
    }
  }
}

</style>
