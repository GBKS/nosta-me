<script setup>
import relayManager from '@/helpers/relayManager.js'
import profileService from '@/helpers/profileService.js'
import themes from '@/data/themes.json'
import { useSessionStore } from '@/stores/session'

const route = useRoute()
const router = useRouter()
const sessionStore = useSessionStore()
const routeId = ref('')
const queryRelayIds = ref(null)
const profileData = ref(null)
const relayData = ref(null)
const relayEvent = ref(null)
const followData = ref(null)
const badgeData = ref(null)
const reportsData = ref(null)
const zapsData = ref(null)
const listsData = ref(null)
const status = ref(null)
let nip05Data = null
let loadCallback = null
const publicKey = ref(null)
const loading = ref(true)
const showDataOverlay = ref(false)
const profileDataStats = ref(null)

const tabInfo = ref({
  'following': {
    name: 'Following'
  },
  'badges': {
    name: 'Badges'
  },
  'relays': {
    name: 'Relays'
  },
  'reports': {
    name: 'Reports'
  },
  'zaps': {
    name: 'Zaps'
  },
  'lists': {
    name: 'Lists'
  }
})
const activeTabId = ref('following')

function selectTab(value) {
  activeTabId.value = value
}

function updateFromRoute() {
  const newRouteId = route.params.id

  if(route.query.r) {
    queryRelayIds.value = route.query.r.split(',')

    for(let i=0; i<queryRelayIds.value.length; i++) {
      relayManager.addRelayByUrl(queryRelayIds.value[i])
    }
  } else {
    queryRelayIds.value = null
  }

  // console.log('updateFromRoute', queryRelayIds, route.query.r)

  if(route.query.t && themes[sessionStore.theme]) {
    sessionStore.theme = route.query.t
  }

  if(newRouteId != routeId) {
    routeId.value = newRouteId

    reset()
    loadFromRouteId()
  }
}

watch(() => route.query, () => updateFromRoute)

onBeforeMount(() => {
  updateFromRoute()
})

const theme = computed(() => {
  return themes[sessionStore.theme]
})

const pageTitle = computed(() => {
  return profileData.value ? (profileData.value.profile.name + ' | Nosta') : 'Nosta'
})

const pageDescription = computed(() => {
  return profileData.value ? profileData.value.profile.about : 'Nostr profile'
})

const lightningMetaTag = computed(() => {
  let result = null

  if(profileData.value && profileData.value.profile && profileData.value.profile.lud16) {
    result = 'lnurlp:' + profileData.value.profile.lud16
  }

  return result
})

function updateHead() {
  useHead({
    title: pageTitle,
    meta: [
      { name: "description", content: pageDescription },
      { name: "lightning", content: lightningMetaTag }
    ]
  })
}

function loadFromRouteId() {
  // console.log('routeId', routeId.value)
  // console.log('npub', routeId.value.indexOf('npub'))
  // console.log('nprofile', routeId.value.indexOf('nprofile'))
  
  if(routeId.value.indexOf('npub') === 0) {
    loadNpub(routeId.value, queryRelayIds.value)
  } else if(routeId.value.indexOf('nprofile') === 0) {
    loadNprofile(routeId.value, queryRelayIds.value)
  } else if(routeId.value.indexOf('@') !== -1 || routeId.value.indexOf('.') !== -1) {
    loadNip05(routeId.value, queryRelayIds.value)
  } else {
    // Check if it's a public key
    loadPublicKey(routeId.value, queryRelayIds.value)
  }
}

function loadNpub(npub, queryRelayIds) {
  status.value = 'Loading npub: '+npub
  let {type, data} = window.NostrTools.nip19.decode(npub)

  if(data) {
    loadPublicKey(data, queryRelayIds)
  }
}

function loadNprofile(nprofile) {
  status.value = 'Loading nprofile: '+nprofile
  let {type, data} = window.NostrTools.nip19.decode(nprofile)

  console.log('loadNprofile', nprofile, type, data)

  if(data) {
    let relayIds = null

    if(data.relays && data.relays.length > 0) {
      relayIds = []
      let relayId
      for(let i=0; i<data.relays.length; i++) {
        relayId = relayManager.addRelayByUrl(data.relays[i])
        relayIds.push(relayId)
      }
    }

    loadPublicKey(data.pubkey, relayIds)
  }
}

function getProfileUrl() {
  let result = ''
  const bits = []

  // Profile ID (public key, npub, nprofile, handle)
  result += '/' + route.params.id

  // Relay
  if(route.query.r) {
    bits.push('r='+encodeURIComponent(route.query.r))
  }

  // Theme 
  if(sessionStore.theme != 'space') {
    bits.push('t='+sessionStore.theme)
  }

  if(bits.length > 0) {
    result += '?' + bits.join('&')
  }

  return result
}

async function loadNip05(profileId, queryRelayIds) {
  status.value = 'Loading NIP-05: '+profileId

  // const trimmedProfileId = profileId.split('@').join('')

  let cleanProfileId = profileId
  if(cleanProfileId.charAt(0) === '@') {
    cleanProfileId = '_'+cleanProfileId
  }

  let data = await window.NostrTools.nip05.queryProfile(cleanProfileId)

  console.log('loadNip05', cleanProfileId, data)

  if(data && data.pubkey) {
    nip05Data = data

    let relayIds = null
    if(data.relays && data.relays.length > 0) {
      relayIds = []

      if(!relayData.value) {
        relayData.value = []
      }

      let relayId
      for(let i=0; i<data.relays.length; i++) {
        relayId = relayManager.addRelayByUrl(data.relays[i])
        relayIds.push(relayId)
        relayData.value.push(relayId)
      }
    } else {
      relayIds = queryRelayIds
    }

    loadPublicKey(data.pubkey, relayIds)
  }
}

function loadPublicKey(newPublicKey, relayIds) {
  status.value = 'Loading public key: '+newPublicKey

  publicKey.value = newPublicKey

  console.log('loadPublicKey', newPublicKey, relayIds)

  profileService.findProfile(newPublicKey, relayIds, onLoadProfileEvent)
}

function onLoadProfileEvent(data) {
  status.value = 'Loaded a profile event'

  // console.log('onLoadProfile', data.kind, data)

  if(data.kind === 0) {
    // Profile info
    saveProfileInfo(data)

    loading.value = false
  } else if(data.kind == 2) {
    // Recommended relay
    handleLoadedRecommendedRelay(data)
  } else if(data.kind == 3) {
    // Contact list
    if(!(followData.value && data.tags.length == 0)) {
      followData.value = data

      const count = data.tags.length
      tabInfo.value.following.name = count + ' Following'
    }
  } else if(data.kind == 10000) {
    // A list of muted people
    handleListsEvent(data)
  } else if(data.kind == 10001) {
    // A list of pinned notes
    handleListsEvent(data)
  } else if(data.kind == 10002) {
    // Relays they read from and write to
    handleLoadedRelayList(data)
  } else if(data.kind == 30000) {
    // A list of categorized people
    handleListsEvent(data)
  } else if(data.kind == 30001) {
    // A list of categorized bookmarks
    handleListsEvent(data)
  } else if(data.kind == 30008) {
    // A badge
    handleLoadedBadgeEvent(data)
  } else if(data.kind == 1984) {
    // A report
    handleLoadedReportEvent(data)
  } else if(data.kind == 9735) {
    // A zap
    handleLoadedZapEvent(data)
  }

  // Track event
  if(!profileDataStats.value) {
    profileDataStats.value = {
      count: 0,
      relays: {}
    }
  }

  profileDataStats.value.count++
  if(!profileDataStats.value.relays[data.relay]) {
    profileDataStats.value.relays[data.relay] = 0 
  } else {
    profileDataStats.value.relays[data.relay]++
  }
}

function handleLoadedRecommendedRelay(data) {
  if(!relayData.value) {
    relayData.value = []
  }

  relayEvent.value = data
  // console.log('Loaded relays', data)

  const relayId = relayManager.addRelayByUrl(data.content)
  relayData.value.push(relayId)
}

function handleListsEvent(data) {
  if(!listsData.value) {
    listsData.value = []
  }

  // Ensure it's not already added.
  let alreadyAdded = false
  for(let i=0; i<listsData.value.length; i++) {
    if(listsData.value[i].id == data.id) {
      alreadyAdded = true
      break
    }
  }

  if(!alreadyAdded) {
    listsData.value.push(data)

    const count = listsData.value.length
    tabInfo.value.lists.name = count + ' List' + (count !== 1 ? 's' : '')
  }
}

function handleLoadedBadgeEvent(data) {
  if(!badgeData.value) {
    badgeData.value = []
  }

  // Ensure it's not already added.
  let alreadyAdded = false
  for(let i=0; i<badgeData.value.length; i++) {
    if(badgeData.value[i].id == data.id) {
      alreadyAdded = true
      break
    }
  }

  if(!alreadyAdded) {
    badgeData.value.push(data)

    const count = badgeData.value.length
    tabInfo.value.badges.name = count + ' Badge' + (count !== 1 ? 's' : '')
  }
}

function handleLoadedRelayList(data) {
  // console.log('handleLoadedRelayList', data)

  if(!relayData.value) {
    relayData.value = []
  }
  
  let i, tag, relayId
  for(i=0; i<data.tags.length; i++) {
    tag = data.tags[i]

    if(tag.length == 2 || (tag.length == 3 && tag[2] == 'write')) {
      relayId = relayManager.addRelayByUrl(tag[1])

      relayData.value.push(relayId)

      if(profileService) {
        profileService.addRelay(relayId)
      }
    }
  }

  const count = data.tags.length
  tabInfo.value.relays.name = count + ' Relay' + (count !== 1 ? 's' : '')
}

function handleLoadedReportEvent(data) {
  // console.log('handleLoadedReportEvent', data)

  if(!reportsData.value) {
    reportsData.value = []
  }

  // Ensure it's not already added.
  let alreadyAdded = false
  for(let i=0; i<reportsData.value.length; i++) {
    if(reportsData.value[i].id == data.id) {
      alreadyAdded = true
      break
    }
  }

  if(!alreadyAdded) {
    reportsData.value.push(data)

    const count = reportsData.value.length
    tabInfo.value.reports.name = count + ' Report' + (count !== 1 ? 's' : '')
  }
}

function handleLoadedZapEvent(data) {
  // console.log('handleLoadedZapEvent', data)

  if(!zapsData.value) {
    zapsData.value = []
  }

  // Ensure it's not already added.
  let alreadyAdded = false
  for(let i=0; i<zapsData.value.length; i++) {
    if(zapsData.value[i].id == data.id) {
      alreadyAdded = true
      break
    }
  }
  
  if(!alreadyAdded) {
    zapsData.value.push(data)

    const count = zapsData.value.length
    tabInfo.value.zaps.name = count + ' Zap' + (count !== 1 ? 's' : '')
  }
}

function saveProfileInfo(eventData) {
  let data = eventData.content
  if(typeof data == 'string') {
    data = JSON.parse(data)
  }
  
  let saveIt = true

  for(let i=0; i<eventData.tags.length; i++) {
    if(eventData.tags[i][0] == 'i') {
      console.log('Found an external identity', eventData.tags[i])
    }
  }

  // console.log('saveProfileInfo', eventData)

  if(profileData.value) {
    // Only store if newer than existing data.
    if(eventData.created_at < profileData.value.event.created_at) {
      saveIt = false
    }
  }

  if(saveIt) {
    profileData.value = {
      profile: data,
      event: eventData
    }

    updateHead()
  }
}

function reset() {
  if(loadCallback) {
    window.emitter.off('profile-'+publicKey, loadCallback)
    loadCallback = null
  }

  if(profileService) {
    profileService.reset()
  }

  profileData.value = null
  relayData.value = null
  relayEvent.value = null
  followData.value = null
  nip05Data = null
  publicKey.value = null
  reportsData.value = null
  zapsData.value = null
  badgeData.value = null
  listsData.value = null
  profileDataStats.value = null
}

function updateHistory() {
  const url = getProfileUrl()
  navigateTo(url, { replace: true })
}

const activeThemeId = computed(() => {
  return sessionStore.theme
})

const classObject = computed(() => {
  return [
    'profile-page',
    '-theme-'+activeThemeId.value,
    hasBanner.value ? '-banner' : '-no-banner'
  ].join(' ')
})

const hasBanner = computed(() => {
  return profileData.value && profileData.value.profile && profileData.value.profile.banner && profileData.value.profile.banner.length > 0
})

// https://github.com/BitcoinAndLightningLayerSpecs/rfc/issues/1
function listenToLightningPayments() {
  // console.log('listenToLightningPayments')
  document.addEventListener('lightning:transaction', onLightningPayment)
}

function onLightningPayment(event) {
  console.log('onLightningPayment')
  console.log(event.type)
  console.log(event.detail)
  console.log(event.detail.preimage)
}

function onShowDataOverlay() { showDataOverlay.value = true }
function closeDataOverlay() { showDataOverlay.value = false }

onMounted(() => {
  if(process.client) {
    listenToLightningPayments()
  }

  // console.log('mounted', process.client)
  window.emitter.on('set-theme', updateHistory)
})

</script>

<template>
  <div :class="classObject">
    <div class="content -theme-content-frame" :key="publicKey">
      <p v-if="false && !profileData && status">{{ status }}</p>

      <template v-if="profileData">
        <ProfileBanner :info="profileData" />
        <div class="wrap">
          <ProfileInfo
            :info="profileData"
            :publicKey="publicKey"
            :relayData="relayEvent"
            :followData="followData"
            :hasBanner="hasBanner"
            @showDataOverlay="onShowDataOverlay"
          />
          <UiTabs
            :activeId="activeTabId"
            :info="tabInfo"
            theme="theme"
            @selectTab="selectTab"
          />
          <div class="lists">
            <ProfileFollowList
              v-if="activeTabId == 'following' && followData" 
              :info="followData"
              :profileService="profileService"
            />
            <ProfileBadgeList
              v-if="activeTabId == 'badges'" 
              :info="badgeData"
              :profileService="profileService"
            />
            <ProfileRelayList 
              v-if="activeTabId == 'relays'" 
              :info="relayData" 
            />
            <ProfileReportList 
              v-if="activeTabId == 'reports'" 
              :info="reportsData" 
            />
            <ProfileZapList 
              v-if="activeTabId == 'zaps'" 
              :info="zapsData" 
            />
            <ProfileListsList 
              v-if="activeTabId == 'lists'" 
              :info="listsData" 
            />
          </div>
        </div>
      </template>
    </div>
    <ProfileDataOverlay
      v-if="showDataOverlay"
      :info="profileData"
      :publicKey="publicKey"
      :relayData="relayEvent"
      :followData="followData"
      :stats="profileDataStats"
      @close="closeDataOverlay"
    />
    <ProfileNostaIntro v-if="profileData" />
  </div>
</template>

<style scoped lang="scss">

.profile-page {
  display: flex;
  flex-direction: column;
  align-items: center;

  .content {
    display: flex;
    flex-direction: column;
    width: 100%;
    max-width: 800px;
    box-sizing: border-box;
    border-radius: 25px;
    // background-color: rgba(#2B3455, 0.85);
    min-height: 300px;

    .tabs {
      margin-top: 20px;
    }

    .lists {
      margin-top: 30px;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
  }

  &.-banner {
    .content {
      .wrap {
        @include r('padding', 20, 50);

        .tabs {
          @include r('margin-left', -20, -50);
          @include r('margin-right', -20, -50);
          padding-left: 20px;
          padding-right: 20px;
        }
      }
    }
  }

  &.-no-banner {
    .content {
      @include r('padding', 20, 50);

      .wrap {
        .tabs {
          @include r('margin-left', -20, -50);
          @include r('margin-right', -20, -50);
          padding-left: 20px;
          padding-right: 20px;
        }
      }
    }
  }

  @include media-query(medium-down) {
    padding: 0 15px 15px 15px;
    
    .content {
      .wrap {
        .tabs {
          justify-content: flex-start;
        }
      }
    }
  }

  @include media-query(large) {
    padding: 50px;
  }
}

</style>