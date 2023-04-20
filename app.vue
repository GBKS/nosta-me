<script setup>
import { ref, computed, onMounted, onBeforeMount } from 'vue'
import relayManager from '@/helpers/relayManager.js'
import { useSessionStore } from '@/stores/session'
import themes from '@/data/themes.json'

import mitt from 'mitt'

const route = useRoute()
const sessionStore = useSessionStore()

const isMounted = ref(false)

const wrapStyle = computed(() => {
  const result = {}

  if(theme.value) {
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

  if(theme.value && isMounted.value) {
    c.push('-theme-'+activeThemeId.value)
    c.push('-brightness-'+theme.value.brightness)
  }

  return c.join(' ')
})

relayManager.init()

watch(() => route.query, () => updateFromRoute)

function updateFromRoute() {
  if(route.query.t && themes[route.query.t]) {
    sessionStore.setTheme(route.query.t)
  }
}

onBeforeMount(() => {
  const emitter = mitt()
  window.emitter = emitter

  updateFromRoute()
})

onMounted(() => {
  isMounted.value = true
})

updateFromRoute()
</script>

<template>
  <div :class="classObject" :style="wrapStyle">
    <client-only>
      <SiteBackground
        :themeId="activeThemeId"
        :theme="theme"
      />
      <ModalSearch />
      <ModalRelays />
      <ModalThemes />
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
