<script setup>
import { ref, computed, onMounted } from 'vue'
import { useProfileStore } from '@/stores/profile'
import { useSessionStore } from '@/stores/session'

const profileStore = useProfileStore()
const sessionStore = useSessionStore()

const isLoggedIn = computed(() => {
  return sessionStore.isLoggedIn
})

const userProfileLink = computed(() => {
  return '/'+sessionStore.publicKey
})

function logOut() {
  sessionStore.setLoginType(null)
  sessionStore.setPublicKey(null)
  sessionStore.setLoggedIn(false)
}
</script>

<template>
  <div class="home-page">
    <div class="wrap">
      <h1>Nosta</h1>
      <p>Create and view Nostr profiles. So easy, a 2-day old baby can do it asleep in 7 seconds*.</p>
      <p class="-small">*Using time-travel telekinesis probably.</p>
      <nav>
        <template v-if="isLoggedIn">
          <UiButton :to="userProfileLink">View my profile</UiButton>
          <UiButton @click="logOut" size="small">Log out</UiButton>
        </template>

        <template v-if="!isLoggedIn">
          <UiButton to="/create/welcome">Create a new profile</UiButton>
          <UiButton to="/login/options">Log in</UiButton>
        </template>

        <NuxtLink to="/about">What the...?</NuxtLink>
      </nav>

      <HomeProfiles />
    </div>
  </div>
</template>

<style scoped lang="scss">

.home-page {
  display: flex;

  .wrap {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 20px;

    h1 {
      @include r('font-size', 80, 80);
      font-family: 'Moonrocks';
      color: var(--theme-front);
    }

    p {
      margin: 0;
      @include r('font-size', 27, 27);
      color: var(--theme-front);
      text-align: center;
      font-weight: 600;
      max-width: 600px;

      a {
        color: var(--theme-front);
        text-decoration: underline;
      }

      & + p {
        margin-top: 10px;
      }

      &.-small {
        opacity: 0.75;
        @include r('font-size', 16, 18);
      }
    }

    nav {
      margin: 50px 0 0 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 20px;

      a:last-child {
        @include r('font-size', 24, 24);
        font-weight: 500;
        color: var(--theme-front);
        text-decoration: none;

        &:hover {
          text-decoration: underline;
        }
      }
    }
  }

  @include media-query(small) {

  } 

  @include media-query(medium-up) {
    justify-content: center;
    align-items: center;
    min-height: 100vh;
  } 
}

</style>