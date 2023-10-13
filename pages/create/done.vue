<script setup>
import { useProfileStore } from '@/stores/profile'

definePageMeta({
  layout: "create",
  pageTransition: {
    name: 'slide-right'
  },
  middleware (to, from) {
    if(to.name == 'create-done' && from.name == 'create-dead-end') {
      to.meta.pageTransition.name = 'slide-left'
      from.meta.pageTransition.name = 'slide-left'
    } else {
      to.meta.pageTransition.name = 'slide-right'
      from.meta.pageTransition.name = 'slide-right'
    }
  }
})

const store = useProfileStore()

const profileLink = computed(() => {
  // Send to nprofile if possible so the relay is baked in
  const npro = nprofile.value
  if(npro) {
    return '/' + npro
  } else {
    return '/' + store.npub
  }
})

const nprofile = computed(() => {
  let result = null

  let relay
  let relays = []
  for(let i=0; i<store.relays.length; i++) {
    relay = store.relays[i]

    if(relay.added) {
      relays.push(relay.url)
    }

    if(relays.length >= 5) {
      // Stop at 5 relays
      break
    }
  }

  if(relays.length > 0) {
    result = window.NostrTools.nip19.nprofileEncode({
      pubkey: store.publicKey,
      relays: relays
    })
  }

  return result
})

</script>

<template>
  <div class="done-page -create-page">
    <div class="content">
      <div class="copy">
        <p class="-step">Done!</p>
        <h1>You’re ready to go</h1>
        <p class="-description">Nosta is just for managing your profile. To start posting and see what others post, use one of the many Nostr clients out there. To the right are a few examples to get you started. Find more in the <NuxtLink to="/directory" target="_blank">directory</NuxtLink>.</p>
      </div>
    </div>
    <div class="options">
      <CreateDoneList />
    </div>
    <nav>
      <UiButton :to="profileLink" icon="arrowRight" size="small">View my profile</UiButton>
    </nav>
  </div>
</template>

<style scoped lang="scss">

.done-page {

}

</style>