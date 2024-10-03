<script setup>
import { ref, computed, onMounted, onBeforeMount } from 'vue'
import relayManager from '@/helpers/relayManager.js'
import { useSessionStore } from '@/stores/session'
import sessionRelayService from '@/helpers/sessionRelayService.js'
import themes from '@/data/themes.json'
import * as linkify from "linkifyjs"
import mitt from 'mitt'

const route = useRoute()
const sessionStore = useSessionStore()
const isMounted = ref(false)
const showTheme = ref(false)

watch(() => route.query, (newValue, oldValue) => updateFromRoute(newValue, oldValue))
watch(() => route.path, (newValue, oldValue) => updateFromRoutePath(newValue, oldValue))

const wrapStyle = computed(() => {
  const result = {}

  if(showTheme.value && theme.value) {
    result.backgroundColor = theme.value.color
  }

  return result
})

const activeThemeId = computed(() => {
  return sessionStore.theme || 'space'
})

const theme = computed(() => {
  return themes[activeThemeId.value]
})

const classObject = computed(() => {
  const c = ['site-wrap']

  if(route.name.indexOf('create-') === 0) {
    c.push('-create')
  }

  if(showTheme.value && theme.value && isMounted.value) {
    c.push('-theme-'+activeThemeId.value)
    c.push('-brightness-'+theme.value.brightness)
  } else if(!showTheme.value) {
    c.push('-brightness-light')
  }

  return c.join(' ')
})

relayManager.init()

function updateFromRoute() {
  if(route.query.t && themes[route.query.t]) {
    sessionStore.setTheme(route.query.t)
  }
}

function updateFromRoutePath() {
  const noThemePages = ['/', '/about']
  showTheme.value = noThemePages.indexOf(route.path) === -1
}

onBeforeMount(() => {
  const emitter = mitt()
  window.emitter = emitter

  updateFromRoute()
  updateFromRoutePath()
})

onMounted(() => {
  linkify.registerCustomProtocol('nostr', true)

  isMounted.value = true

  if(sessionStore.isLoggedIn) {
    sessionRelayService.init()
  }
})

updateFromRoute()
updateFromRoutePath()
</script>

<template>
  <div :class="classObject" :style="wrapStyle">
    <client-only>
      <SiteBackground
        v-if="showTheme"
        :themeId="activeThemeId"
        :theme="theme"
      />
      <ModalSearch />
      <ModalRelays />
      <ModalThemes />
      <ModalHandler />
      <ModalZapMain />
      <ModalQr />
      <NotificationDrawer />
    </client-only>
    <Header />
    <div class="site-content">
      <NuxtLayout>
        <NuxtPage />
      </NuxtLayout>
    </div>
  </div>
</template>

<style scoped lang="scss">

.site-wrap {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-size: cover;
  background-position: center center;
  background-attachment: fixed;
  transition: all 400ms $ease;

  .site-content {
    position: relative;
  }

  &.-create {
    @include media-query(small) {
      .site-content {
        flex-grow: 1;
        display: flex;
        flex-direction: column;
        padding-bottom: 15px;
      }
    }
  }
}

</style>
