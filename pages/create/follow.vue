<script setup>
import { useProfileStore } from '@/stores/profile'
import profileInitializer from '@/helpers/create/profileInitializer.js'

const store = useProfileStore()

definePageMeta({
  layout: "create",
  pageTransition: {
    name: 'slide-right'
  },
  middleware (to, from) {
    if(to.name == 'create-follow' && from.name == 'create-bitcoin') {
      to.meta.pageTransition.name = 'slide-left'
      from.meta.pageTransition.name = 'slide-left'
    } else {
      to.meta.pageTransition.name = 'slide-right'
      from.meta.pageTransition.name = 'slide-right'
    }
  }
})

function toggleItem(id) {
  let item
  for(let i=0; i<store.follows.length; i++) {
    item = store.follows[i]
    if(item.id == id) {
      item.added = !item.added
    }
  }
}

onMounted(() => {
  profileInitializer.init()
})
</script>

<template>
  <div class="follow-page -create-page">
    <div class="content">
      <div class="copy">
        <p class="-step">8 of 10</p>
        <h1>Follow others</h1>
        <p class="-description">As you explore Nostr, you’ll find friends and interesting people to follow. To get you started, here are a few we like. You can also browse lists like <a href="https://nostr.directory/" rel="nofollow noopener noreferrer" target="_blank">nostr.directory</a>.</p>
      </div>
    </div>
    <div class="options">
      <CreateFollowItem
        v-for="(item, index) in store.follows"
        :key="item.id"
        :info="item"
        @toggle="toggleItem"
      />
    </div>
    <nav>
      <UiButton to="/create/handle-enter" icon="arrowLeft" size="small"></UiButton>
      <UiButton to="/create/bitcoin" icon="arrowRight" size="small">Next</UiButton>
    </nav>
  </div>
</template>

<style scoped lang="scss">

.follow-page {
  .options {
    align-items: stretch !important;
  }
}

</style>