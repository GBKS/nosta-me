<script setup>
import { useUserStore } from "@/stores/users.js"
import { useRelayStore } from '@/stores/relays'

const userStore = useUserStore()
const relayStore = useRelayStore()

const loadCallback = onLoadProfile.bind(this)
const profileData = ref(null)
const profileContent = ref(null)

const props = defineProps([
  'publicKey'
])

const imageLoaded = ref(false)
function onImageLoaded() {
  imageLoaded.value = true
}

const imageClass = computed(() => {
  return imageLoaded.value ? 'image -loaded' : 'image'
})

const profile = computed(() => {
  let result = profileData.value

  // console.log('follow-item.profile', result)
  if(!result) {
    result = userStore.getUser(props.publicKey)
  }

  return result
})

const name = computed(() => {
  // console.log('follow-item.name', profileContent.value)
  return profileContent.value ? profileContent.value.name : null
})

const description = computed(() => {
  return profileContent.value ? profileContent.value.about : null
})

const image = computed(() => {
  return profileContent.value ? profileContent.value.picture : null
})

const profileLink = computed(() => {
  let result = ''

  // Create an nprofile
  // let {type, data} = window.NostrTools.nip19.decode(nprofile)

  if(profileData.value && profileData.value.relay) {
    const relay = relayStore.getRelay(profileData.value.relay)
    // result += '?r=' + encodeURIComponent(relay.url)

    const nprofile = window.NostrTools.nip19.nprofileEncode({
      pubkey: props.publicKey,
      relays: [relay.url]
    })

    result = '/'+nprofile
  } else {
    result = '/'+props.publicKey
  }

  return result
})

function onLoadProfile(data) {
  profileData.value = data

  let content = data.content
  if(typeof content == 'string' && content.length > 0) {
    content = JSON.parse(data.content)
  }

  profileContent.value = content

  // console.log('follow-item.onLoadProfile', data, profileContent.value.relay)

  window.emitter.off('profile-'+props.publicKey, loadCallback)
}

function refreshProfileContent() {
  const data = userStore.getUser(props.publicKey)
  // console.log('refreshProfileContent', data, props.publicKey)
  if(data) {
    let content = data.content
    if(typeof content == 'string') {
      content = JSON.parse(data.content)
    }
  
    profileContent.value = content
  }
}

refreshProfileContent()

onMounted(() => {
  // console.log('follow-item.onMounted', props.publicKey)
  // console.log('profile', profile)
  // console.log('profileContent', profileContent)
  if(!profile.value) {
    window.emitter.on('profile-'+props.publicKey, loadCallback)
  }
})

onBeforeUnmount(() => {
  window.emitter.off('profile-'+props.publicKey, loadCallback)
})
</script>

<template>
  <Transition name="fade" appear>
    <div class="follow-item">
      <NuxtLink :to="profileLink">
        <template v-if="profileContent">
          <div :class="imageClass">
            <img 
              v-if="image"
              :src="image" 
              :alt="name"
              @load="onImageLoaded" 
            />
          </div>
          <div class="text">
            <h3>{{ name }}</h3>
            <p>{{ description }}</p>
          </div>
        </template>
        <template v-if="!profileContent">
          <div :class="imageClass" />
          <div class="text">
            <p 
              class="-key"
              :title="publicKey"
            >{{ publicKey.substr(0, 5) + '...' + publicKey.substr(-5) }}</p>
          </div>
        </template>
      </NuxtLink>
    </div>
  </Transition>
</template>

<style scoped lang="scss">

.follow-item {
  display: flex;

  a {
    display: flex;
    text-decoration: none;
    padding: 10px;
    width: 100%;
    border-radius: 10px;
    @include r('gap', 10, 20);
    transition: all 150ms $ease;

    .image {
      background-color: rgba(black, 0.2);
      flex-basis: 50px;
      flex-shrink: 0;
      width: 50px;
      height: 50px;
      border-radius: 100px;
      line-height: 0;

      img {
        width: 50px;
        height: 50px;
        border-radius: 100px;
        opacity: 0;
        transition: opacity 250ms $ease;
      }

      &.-loaded {
        img {
          opacity: 1;
        }
      }
    }

    .text {
      display: flex;
      flex-direction: column;

      h3 {
        font-size: 17px;
        font-weight: 600;
        color: var(--theme-front);
        word-break: break-all;
      }

      p {
        font-size: 15px;
        color: rgba(var(--theme-front-rgb), 0.65);
        word-break: break-all;
      }
    }

    &:hover {
      background-color: rgba(var(--theme-active-rgb), 0.1);
    }
  }

  @include media-query(large) {

  }
}

</style>
