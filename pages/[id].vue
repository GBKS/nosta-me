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
const handlerData = ref(null)
const badgeData = ref(null)
const reportsData = ref(null)
const sentZapsData = ref(null)
const receivedZapsData = ref(null)
const stallData = ref(null)
const productData = ref(null)
const fileData = ref(null)
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
  'zaps-sent': {
    name: 'Zaps sent'
  },
  'zaps-received': {
    name: 'Zaps received'
  },
  'files': {
    name: 'Files'
  },
  'lists': {
    name: 'Lists'
  },
  'list': {
    name: 'List',
    info: null
  },
  'stalls': {
    name: 'Stalls',
    info: null
  },
  'stall': {
    name: 'Stall',
    info: null
  },
  'handlers': {
    name: 'Handlers'
  },
  'handler': {
    name: 'Handler',
    info: null
  }
})
const activeTabId = ref(null)

function selectTab(value, info) {
  // console.log('selectTab', value, info)
  activeTabId.value = value
  if(tabInfo.value[value] && info) {
    tabInfo.value[value].info = info
  }
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

  if(newRouteId != routeId.value) {
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

const baseUrl = computed(() => {
  return '/' + route.params.id
})

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
  } else if(data.kind == 30017) {
    // A stall
    handleLoadedStallEvent(data)
  } else if(data.kind == 30018) {
    // A product
    handleLoadedProductEvent(data)
  } else if(data.kind == 1984) {
    // A report
    handleLoadedReportEvent(data)
  } else if(data.kind == 1063) {
    // A file
    handleLoadedFileEvent(data)
  } else if(data.kind == 31989) {
    // A handler
    handleLoadedHandlerEvent(data)
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
  storeEvent(listsData, data)
}

function handleLoadedBadgeEvent(data) {
  storeEvent(badgeData, data)
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

      if(relayData.value.indexOf(relayId) === -1) {
        relayData.value.push(relayId)

        if(profileService) {
          profileService.addRelay(relayId)
        }
      }
    }
  }

  const count = data.tags.length
  tabInfo.value.relays.name = count + ' Relay' + (count !== 1 ? 's' : '')
}

function handleLoadedReportEvent(data) {
  storeEvent(reportsData, data)
}

function handleLoadedFileEvent(data) {
  storeEvent(fileData, data)
}

function handleLoadedHandlerEvent(data) {
  storeEvent(handlerData, data)
}

function storeEvent(location, data) {
  if(!location.value) {
    location.value = []
  }

  // Ensure it's not already added.
  let alreadyAdded = false
  for(let i=0; i<location.value.length; i++) {
    if(location.value[i].id == data.id) {
      alreadyAdded = true
      break
    }
  }

  if(!alreadyAdded) {
    location.value.push(data)
  }
}

function handleLoadedZapEvent(data) {
  // console.log('handleLoadedZapEvent', data)

  const isSender = data.pubkey == publicKey.value

  if(isSender && !sentZapsData.value) {
    sentZapsData.value = []
  }

  if(!isSender && !receivedZapsData.value) {
    receivedZapsData.value = []
  }

  const zapArray = isSender ? sentZapsData : receivedZapsData

  // Ensure it's not already added.
  let alreadyAdded = false
  for(let i=0; i<zapArray.value.length; i++) {
    if(zapArray.value[i].id == data.id) {
      alreadyAdded = true
      break
    }
  }
  
  if(!alreadyAdded) {
    zapArray.value.push(data)

    // const count = zapsData.value.length
    // tabInfo.value.zaps.name = count + ' Zap' + (count !== 1 ? 's' : '')
  }
}

function handleLoadedStallEvent(data) {
  // console.log('handleLoadedStallEvent', data)

  if(typeof data.content == 'string' && data.content.length > 0) {
    data.content = JSON.parse(data.content)
  }

  if(!stallData.value) {
    stallData.value = []
  }

  // Ensure it's not already added.
  let alreadyAdded = false
  let addedIndex = 0
  let addedIsOlder = false
  for(let i=0; i<stallData.value.length; i++) {
    if(stallData.value[i].content.id == data.content.id) {
      alreadyAdded = true
      addedIndex = i
      addedIsOlder = stallData.value[i].created_at < data.created_at
      break
    }
  }

  // Already added, but we have newer data, so remove the old one
  if(alreadyAdded && addedIsOlder) {
    stallData.value.splice(addedIndex, 1)
    alreadyAdded = false
  }

  if(!alreadyAdded) {
    stallData.value.push(data)

    const count = stallData.value.length
    tabInfo.value.stalls.name = count + ' Stall' + (count !== 1 ? 's' : '')
  }
}

function handleLoadedProductEvent(data) {
  // console.log('handleLoadedProductEvent', data)

  if(!productData.value) {
    productData.value = []
  }

  // Ensure it's not already added.
  let alreadyAdded = false
  for(let i=0; i<productData.value.length; i++) {
    if(productData.value[i].id == data.id) {
      alreadyAdded = true
      break
    }
  }

  if(!alreadyAdded) {
    if(typeof data.content == 'string' && data.content.length > 0) {
      data.content = JSON.parse(data.content)
    }

    productData.value.push(data)

    const count = productData.value.length
    tabInfo.value.products.name = count + ' Product' + (count !== 1 ? 's' : '')
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
  sentZapsData.value = null
  receivedZapsData.value = null
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
            v-if="false"
            :activeId="activeTabId"
            :info="tabInfo"
            theme="theme"
            @selectTab="selectTab"
          />
          <div class="lists">
            <template v-if="!activeTabId">
              <ProfileFollowSummary
                :info="followData"
                :count="followData ? followData.tags.length : null"
                @navigate="selectTab"
              />
              <ProfileStallSummary
                :info="stallData"
                :products="productData"
                :count="stallData ? stallData.length : null"
                @navigate="selectTab"
              />
              <ProfileZapSummary
                :info="sentZapsData"
                :count="sentZapsData ? sentZapsData.length : null"
                :publicKey="publicKey"
                direction="sent"
                @navigate="selectTab"
              />
              <ProfileZapSummary
                :info="receivedZapsData"
                :count="receivedZapsData ? receivedZapsData.length : null"
                direction="received"
                @navigate="selectTab"
              />
              <ProfileBadgeSummary
                :info="badgeData"
                :count="badgeData ? badgeData.length : null"
                @navigate="selectTab"
              />
              <ProfileListsSummary
                :info="listsData"
                :count="listsData ? listsData.length : null"
                @navigate="selectTab"
              />
              <ProfileFileSummary
                :info="fileData"
                :count="fileData ? fileData.length : null"
                @navigate="selectTab"
              />
              <ProfileHandlerSummary
                :info="handlerData"
                :count="handlerData ? handlerData.length : null"
                @navigate="selectTab"
              />
              <ProfileRelaySummary
                :info="relayData"
                :count="relayData ? relayData.length : null"
                @navigate="selectTab"
              />
              <ProfileReportSummary
                :info="reportsData"
                :count="reportsData ? reportsData.length : null"
                @navigate="selectTab"
              />
            </template>
            <ProfileFollowList
              v-if="activeTabId == 'following' && followData" 
              :info="followData"
              :profileService="profileService"
              @back="selectTab"
            />
            <ProfileBadgeList
              v-if="activeTabId == 'badges'" 
              :info="badgeData"
              :profileService="profileService"
              @back="selectTab"
            />
            <ProfileRelayList 
              v-if="activeTabId == 'relays'" 
              :info="relayData" 
              @back="selectTab"
            />
            <ProfileReportList 
              v-if="activeTabId == 'reports'" 
              :info="reportsData" 
              @back="selectTab"
            />
            <ProfileZapList 
              v-if="activeTabId == 'zaps-sent'" 
              :info="sentZapsData"
              direction="sent" 
              @back="selectTab"
            />
            <ProfileZapList 
              v-if="activeTabId == 'zaps-received'" 
              :info="receivedZapsData"
              direction="received"
              @back="selectTab"
            />
            <ProfileFileList 
              v-if="activeTabId == 'files'" 
              :info="fileData" 
              @navigate="selectTab"
              @back="selectTab"
            />
            <ProfileListsList 
              v-if="activeTabId == 'lists'" 
              :info="listsData" 
              @navigate="selectTab"
              @back="selectTab"
            />
            <ProfileListList 
              v-if="activeTabId == 'list'" 
              :info="tabInfo.list.info" 
              @navigate="selectTab"
              @back="selectTab"
            />
            <ProfileStallList 
              v-if="activeTabId == 'stall'"
              :info="tabInfo.stall.info"
              :products="productData" 
              @navigate="selectTab"
              @back="selectTab"
            />
            <ProfileHandlerTab 
              v-if="activeTabId == 'handlers'"
              :info="handlerData"
              @back="selectTab"
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
      gap: 30px;

      > * {
        padding-top: 30px;
        border-top: 1px solid rgba(var(--theme-front-rgb), 0.1);
      }
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
