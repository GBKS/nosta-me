<script setup>
import { useProfileStore } from '@/stores/profile'
import profileInitializer from '@/helpers/create/profileInitializer.js'

const store = useProfileStore()
let options = ref(null)

function toggleItem(id) {
  let item
  for(let i=0; i<store.relays.length; i++) {
    item = store.relays[i]
    if(item.id == id) {
      item.added = !item.added
    }
  }
}

onMounted(() => {
  profileInitializer.init()

  options.value = [
    {
      id: 'damus',
      name: 'Damus',
      description: 'Social media',
      platform: 'iOS',
      url: 'https://snort.social/p/' + store.npub,
      image: 'damus'
    },
    {
      id: 'amethyst',
      name: 'Amethyst',
      description: 'Social media',
      platform: 'Android',
      url: 'https://play.google.com/store/apps/details?id=com.vitorpamplona.amethyst',
      image: 'amethyst'
    },
    {
      id: 'snort',
      name: 'Snort',
      description: 'Social media',
      platform: 'Web',
      url: 'https://snort.social/p/' + store.npub,
      image: 'snort'
    },
    {
      id: 'blogstack',
      name: 'Blogstack',
      description: 'Blogging',
      platform: 'Web',
      url: 'https://hamstr.to/profile/' + store.npub,
      image: 'blogstack'
    }
  ]
})
</script>

<template>
  <div class="done-list" v-if="options">
    <ProfileShareAppOption
      v-for="(item, index) in options"
      :key="index"
      :name="item.name"
      :description="item.description"
      :platform="item.platform"
      :url="item.url"
      :image="item.image"
      size="big"
    />
  </div>
</template>

<style scoped lang="scss">

.done-list {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  gap: 20px;
  @include r('padding-left', 10, 30);
  @include r('padding-right', 10, 30);

  :deep(.share-app-option) {
    flex-basis: 40%;
    flex-grow: 1;
  }
}

</style>
