<script setup>
import { useProfileStore } from '@/stores/profile'
import profileInitializer from '@/helpers/create/profileInitializer.js'
import localProfiles from '@/data/nostr-band-profiles.json'
import sampleFollows from '@/data/sample-follows.json'

const store = useProfileStore()
const profiles = ref([])

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

function toggleItem(npub) {
  let profile
  for(let i=0; i<profiles.value.length; i++) {
    profile = profiles.value[i]
    if(profile.npub == npub) {
      profile.added = !profile.added

      if(profile.added) {
        store.addFollow(profile)
      } else {
        store.removeFollow(profile)
      }
    }
  }
}

function loadData() {
  const url = 'https://api.nostr.band/v0/trending/profiles'
  fetch(url, {headers: {'accept': 'application/nostr+json'}})
    .then((response) => response.json())
    .then(onLoadData)
}

function onLoadData(data) {
  console.log('Follow.onLoadData', data)

  if(data && data.profiles && data.profiles.length > 5) {
    prepareLoadedProfiles(data.profiles)
  } else {
    prepareLocalProfiles()
  }

  prepareStoreFollows()
}

function prepareLocalProfiles() {
  prepareLocalProfiles(localProfiles.profiles)
}

function pickValue(object, props) {
  let result = null, i=0, prop

  for(; i<props.length; i++) {
    prop = object[props[i]]
    if(prop && prop.length > 0) {
      result = prop
      break
    }
  }

  return result
}

function prepareSampleProfiles() {
  let i=0, profile, content, name, about, picture
  for(; i<sampleFollows.follows.length; i++) {
    profile = sampleFollows.follows[i]

    profiles.value.push(profile)
  }
}

function sortProfiles(profiles) {
  return profiles.sort(function(a, b) {
    if(a.new_followers_count > b.new_followers_count) return -1
    if(a.new_followers_count < b.new_followers_count) return 1
    return 0
  })
}

function prepareLoadedProfiles(newProfiles) {
  const sortedProfiles = sortProfiles(newProfiles)

  let i=0, profile, content, name, about, picture
  for(; i<sortedProfiles.length; i++) {
    profile = sortedProfiles[i]
    content = JSON.parse(profile.profile.content)

    name = pickValue(content, ['name', 'display_name', 'username'])
    about = pickValue(content, ['about'])
    picture = pickValue(content, ['picture'])

    if(name && about && picture) {
      profiles.value.push({
        npub: profile.pubkey,
        name: name,
        about: about,
        picture: picture,
        relay: profile.relays[0]
      })
    }
  }
}

// Mark all profiles added/followed in the local store.
function prepareStoreFollows() {
  const storePublicKeys = []
  
  let i=0, profile
  for(; i<store.follows.length; i++) {
    storePublicKeys.push(store.follows[i].npub)
  }

  for(i=0; i<profiles.value.length; i++) {
    profile = profiles.value[i]
    profile.added = storePublicKeys.indexOf(profile.npub) !== -1
  }
}

const followCount = computed(() => {
  let result = 'Pick a few profiles...'

  if(store.follows.length > 0) {
    result = 'Following ' + store.follows.length + '.'
  }

  return result
})

const buttonLabel = computed(() => {
  return store.follows.length > 0 ? 'Next' : 'Skip'
})

onMounted(() => {
  profileInitializer.init()

  prepareSampleProfiles()

  loadData()
  // prepareLocalProfiles()

  prepareStoreFollows()
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
      <p>{{ followCount }}</p>
      <CreateFollowItem
        v-for="item in profiles"
        :key="item.npub"
        :info="item"
        @toggle="toggleItem"
      />
    </div>
    <nav>
      <UiButton 
        to="/create/handle-enter" 
        icon="arrowLeft" 
        size="small"
      ></UiButton>
      <UiButton 
        to="/create/bitcoin" 
        icon="arrowRight" 
        size="small"
      >{{ buttonLabel }}</UiButton>
    </nav>
  </div>
</template>

<style scoped lang="scss">

.follow-page {
  .options {
    justify-content: flex-start !important;
    align-items: stretch !important;
    overflow: scroll;
    padding-right: 20px;
    margin-right: -20px;

    > p {
      position: sticky;
      top: 0;
      background-color: var(--back);
      z-index: 1;
      font-size: 15px;
      padding: 0 0 5px 0;
      font-weight: 500;
    }
  }

  @include media-query(small) {
    .options {
      margin-left: -10px;

      > p {
        padding-left: 10px;
      }
    }
  }
}

</style>