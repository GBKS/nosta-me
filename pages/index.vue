<script setup>
import { ref, computed, onMounted } from 'vue'
import { useProfileStore } from '@/stores/profile'
import { useSessionStore } from '@/stores/session'

const profileStore = useProfileStore()
const sessionStore = useSessionStore()
const isMounted = ref(false)

const isLoggedIn = computed(() => {
  return isMounted.value ? sessionStore.isLoggedIn : false
})

const userProfileLink = computed(() => {
  return '/'+sessionStore.publicKey
})

function logOut() {
  sessionStore.setLoginType(null)
  sessionStore.setPublicKey(null)
  sessionStore.setLoggedIn(false)
}

const classObject = computed(() => {
  return [
    'home-page',
    isLoggedIn.value ? '-friend' : '-stranger'
  ].join(' ')
})

onMounted(() => {
  isMounted.value = true
})
</script>

<template>
  <div :class="classObject">
    <div class="wrap">
      <div class="intro">
        <h1>Nosta</h1>
        <p v-if="!isLoggedIn">New to <NuxtLink to="#details">Nostr</NuxtLink>? You're in the right place. Here you can easily set up your profile, discover apps, and browse other profiles.</p>
        <p v-if="isLoggedIn">Welcome back.</p>
        <nav>
          <client-only>        
            <template v-if="isLoggedIn">
              <UiButton :to="userProfileLink">View my profile</UiButton>
              <UiButton @click="logOut" size="tiny">Log out</UiButton>
            </template>

            <template v-if="!isLoggedIn">
              <UiButton to="/create/welcome">Create a new profile</UiButton>
              <UiButton to="/login/options">Log in</UiButton>
            </template>
          </client-only>
        </nav>
      </div>

      <HomeProfiles />

      <div class="details" id="details" v-if="!isLoggedIn">
        <h2>So what's this about?</h2>
        <p>Nostr is an open communication protocol. It's like your favorite social media service, but no company or group controls it. It's open for everyone to use and build on. A bit like old-fashioned email.</p>

        <p>And this website here is for getting you set up with a profile. Tap a few buttons and you're off on your own journey. You can post updated, blog, live stream, sell products, organize events, collect badges, send payments, and more. So will that journey be fun? That's up to you.<br><br/><NuxtLink to="/about">More about Nosta</NuxtLink>
        </p>
      </div>

      <div class="details" id="details" v-if="isLoggedIn">
        <p>
          <NuxtLink to="/directory">App directory</NuxtLink><br/>
          <NuxtLink to="/about">About Nosta</NuxtLink>
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">

.home-page {
  display: flex;
  scroll-behavior: smooth;

  .wrap {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 50px 20px;

    .intro,
    .details {
      p {
        margin: 0;
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
          // opacity: 0.75;
          @include r('font-size', 16, 18);
        }
      }
    }

    .intro {
      display: flex;
      flex-direction: column;
      align-items: center;

      h1 {
        @include r('font-size', 80, 80);
        font-family: 'Moonrocks';
        color: var(--theme-front);
      }

      p {
        @include r('font-size', 27, 27);
        text-wrap: balance;
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

    .details {
      display: flex;
      flex-direction: column;
      align-items: center;
      @include r('margin-top', 50, 100);

      h2 {
        @include r('font-size', 21, 30);
        font-weight: 600;
        color: var(--theme-front);
      }

      p {
        @include r('margin-top', 10, 20);
        @include r('font-size', 15, 21);
        text-wrap: balance;
      }
    }
  }

  &.-friend {

  }

  &.-stranger {

  }

  @include media-query(small) {

  } 

  @include media-query(medium-up) {
    padding-top: 50px;
    justify-content: center;
    // align-items: center;
    min-height: 100vh;
  } 
}

</style>