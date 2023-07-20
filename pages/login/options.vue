<script setup>
import { ref, computed, onMounted } from 'vue'
import { useSessionStore } from '@/stores/session'
import Icons from '@/helpers/icons'

const router = useRouter()
const sessionStore = useSessionStore()

const browserSupport = ref(false)
const browserLoggedIn = ref(false)
const browserLoggedInRejected = ref(false)

const classObject = computed(() => {
  const c = ['options-page']

  if(!browserSupport.value) {
    c.push('-no-browser-support')
  }

  return c.join(' ')  
})

// Looks like some extensions have an enabled variable and an enabled function, 
// others don't.
function loginWithBrowser() {
  console.log('loginWithBrowser', window.nostr)
  
  if(!window.nostr.enabled && window.nostr.enable) {
    enableBrowser()
  } else if(window.nostr.enabled === true || window.nostr.getPublicKey) {
    loadPublicKey()
  } else {
    console.log('Something is not right...')
  }
}

function enableBrowser() {
  window.nostr.enable()
    .then(onEnableBrowser)
    .catch(onEnableBrowserFailed)
}

function onEnableBrowser() {
  browserLoggedIn.value = true

  // Store for later.
  sessionStore.setLoginType('browser')
  sessionStore.setLoggedIn(true)

  window.emitter.emit('user-login')

  loadPublicKey()
}

function onEnableBrowserFailed() {
  console.log('onEnableBrowserFailed', arguments)
  browserLoggedInRejected.value = true
}

function loadPublicKey() {
  window.nostr.getPublicKey() 
    .then(onPublicKey)
    .catch(onPublicKeyFailed)
}

function onPublicKey(publicKey) {
  console.log('onPublicKey', publicKey)

  if(publicKey) {
    browserLoggedIn.value = true

    // Store for later.
    sessionStore.setLoginType('browser')
    sessionStore.setPublicKey(publicKey)
    sessionStore.setLoggedIn(true)

    router.push('/'+publicKey)
  }
}

function onPublicKeyFailed() {
  browserLoggedInRejected.value = true
}

onMounted(() => {
  if(window.nostr) {
    browserSupport.value =  true

    if(window.nostr.enabled === true) {
      browserLoggedIn.value = true
    }
  }
})
</script>

<template>
  <div :class="classObject">
    <h1>Come on in</h1>
    <p>We’ve got two options for you...</p>

    <div class="options">
      <button
        class="option"
        :disabled="!browserSupport"
        @click="loginWithBrowser"
      >
        <div class="info">
          <h3>Browser extension</h3>
          <p>Good security. Requires a plug-in like Alby.</p>
        </div>
        <div class="icon" v-html="Icons.arrowRight" />
      </button>
      <NuxtLink class="option" to="/login/private-key">
        <div class="info">
          <h3>Private key </h3>
          <p>Less secure. Enter a private key or recovery phrase.</p>
        </div>
        <div class="icon" v-html="Icons.arrowRight" />
      </NuxtLink>
    </div>

    <p class="-small">If you need a browser extension, check <a href="https://getalby.com/" rel="nofollow noopener noreferrer" target="_blank">Alby</a> or <a href="https://chrome.google.com/webstore/detail/nos2x/kpgefcfmnafjgpblomihpgmejjdanjjp" rel="nofollow noopener noreferrer" target="_blank">nos2x</a>.</p>

  </div>
</template>

<style scoped lang="scss">

.options-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-left: 15px;
  padding-right: 15px;
  padding-bottom: 30px;
  @include r('padding-top', 30, 100);

  &.-no-browser-support {
    .options {
      .option {
        &:first-child {
          order: 2;
        }

        &:last-child {
          order: 1;
        }
      }
    }
  }

  h1 {
    @include r('font-size', 80, 80);
    font-family: 'Moonrocks';
    color: white;
  }

  p {
    margin: 0;
    @include r('font-size', 27, 27);
    color: white;
    text-align: center;
    font-weight: 600;
    max-width: 600px;
    text-wrap: balance;

    a {
      color: white;
      text-decoration: underline;
    }

    & + p {
      margin-top: 10px;
    }

    &.-small {
      @include r('margin-top', 25, 50);
      @include r('font-size', 16, 18);
      opacity: 0.75;
    }
  }

  .options {
    margin: 50px 0 0 0;
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 20px;

    .option {
      display: flex;
      gap: 10px;
      align-items: center;
      background-color: white;
      border-radius: 15px;
      border-width: 0;
      padding: 20px;
      text-decoration: none;

      .info {
        display: flex;
        flex-direction: column;
        gap: 3px;
        flex-grow: 1;

        h3 {
          font-size: 24px;
          font-weight: 500;
          color: black;
          text-align: left;
        }

        p {
          font-size: 19px;
          font-weight: 400;
          color: rgba(black, 0.75);
          text-align: left;
        }
      }

      .icon {
        :deep(svg) {
          width: 20px;
          height: 20px;
          color: black;
        }
      }

      &:disabled {
        opacity: 0.35;
      }

      &:not(:disabled) {
        cursor: pointer;

        &:hover {
          .icon {
            animation: arrowHover 350ms $ease infinite alternate;
          }
        }
      }
    }
  }
}

@keyframes arrowHover {
  0% {
    transform: translateX(0px);
  }

  100% {
    transform: translateX(5px);
  }
}

</style>
