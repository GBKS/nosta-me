<script setup>
import relayManager from '@/helpers/relayManager.js'
import profileService from '@/helpers/profileService.js'
import themes from '@/data/themes.json'
import { useUserStore } from '@/stores/users'
import { useSessionStore } from '@/stores/session'
import ToolBox from '@/helpers/toolBox'
import * as nip19 from 'nostr-tools/nip19'
import { queryProfile } from 'nostr-tools/nip05'

const logEnabled = false
const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const sessionStore = useSessionStore()
const routeId = ref('')
const queryRelayIds = ref(null)
const profileData = ref(null)
const profileDataEvents = ref(null)
const relayData = ref(null)
const relayEvent = ref(null)
const relayDataEvents = ref(null)
const followData = ref(null)
const followDataEvents = ref(null)
const handlerData = ref(null)
const badgeData = ref(null)
const reportsData = ref(null) // Reports the user has made
const reportedData = ref(null) // The user has been reported
const shortNotesData = ref(null)
const longNotesData = ref(null)
const sentZapsData = ref(null)
const receivedZapsData = ref(null)
const zapGoalData = ref(null)
const userStatusData = ref(null)
const liveData = ref(null)
const eventsData = ref(null)
const calendarData = ref(null)
const classifiedsData = ref(null)
const stallData = ref(null)
const productData = ref(null)
const fileData = ref(null)
const labelData = ref(null)
const listsData = ref(null)
const pinstrData = ref(null)
const cashuData = ref(null)
const status = ref(null)
let nip05Data = null
let loadCallback = null
const publicKey = ref(null)
const loading = ref(true)
const showDataOverlay = ref(false)
const profileDataStats = ref(null)
const activeTabId = ref(null)

const tabInfo = ref({
  'following': { name: 'Following' },
  'badges': { name: 'Badges' },
  'relays': { name: 'Relays' },
  'reports': { name: 'Reports' },
  'zaps-sent': { name: 'Zaps sent' },
  'zaps-received': { name: 'Zaps received' },
  'files': { name: 'Files' },
  'lists': { name: 'Lists' },
  'stalls': { name: 'Stalls' },
  'stall': { name: 'Stall', info: null },
  'handlers': { name: 'Handlers' },
  'handler': { name: 'Handler', info: null },
  'live': { name: 'Live events' },
  'classifieds': { name: 'Classifieds' },
  'classified': { name: 'Classified', info: null },
  'calendars': { name: 'Calendars', info: null },
  'events': { name: 'Events', info: null },
  'tips': { name: 'Tips' },
  'pinstr': { name: 'Pinstr' }
})

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
  const name = ToolBox.digDeep(profileData.value, ['profile.display_name', 'profile.name', 'profile.displayName', 'profile.username'], null, true)
  return name ? (name + ' | Nosta') : 'Nosta'
})

const pageDescription = computed(() => {
  return ToolBox.dig(profileData.value, 'profile.about', 'Nostr profile', true)
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
  try {
    let {type, data} = nip19.decode(npub)

    status.value = {state: 'loading', npub: npub}

    if(data) {
      loadPublicKey(data, queryRelayIds)
    } else {
      console.log('loadNpub no data', npub, type, data)
      status.value = {state: 'no-data', npub: npub}
    }
  } catch(error) {
    console.log('loadNpub error', npub, error)

    status.value = {state: 'error', npub: npub}
  }
}

function loadNprofile(nprofile) {
  try {
    let {type, data} = nip19.decode(nprofile)

    status.value = {state: 'loading', nprofile: nprofile}

    logger('loadNprofile', nprofile, type, data)

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
    } else {
      console.log('loadNprofile no data', nprofile, type, data)
      status.value = {state: 'no-data', nprofile: nprofile}
    }
  } catch(error) {
    console.log('loadNprofile error', nprofile, error)

    status.value = {state: 'error', nprofile: nprofile}
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
  status.value = {state: 'loading', nip05: profileId}

  // const trimmedProfileId = profileId.split('@').join('')

  let cleanProfileId = profileId
  if(cleanProfileId.charAt(0) === '@') {
    cleanProfileId = '_'+cleanProfileId
  }

  let data = await queryProfile(cleanProfileId)

  logger('loadNip05', cleanProfileId, data)

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
  status.value = {state: 'loading', publicKey: newPublicKey}

  publicKey.value = newPublicKey

  logger('loadPublicKey', newPublicKey, relayIds)

  profileService.findProfile(newPublicKey, relayIds, onLoadProfileEvent, onEndProfileEvents)

  // Check if we already have a cached version. If so, use it.
  const profileEvent = userStore.getUser(newPublicKey)
  if(profileEvent) {
    onLoadProfileEvent(profileEvent)
  }
}

function onLoadProfileEvent(data) {
  logger('onLoadProfile', data.kind, data)

  switch(data.kind) {
    case 0:
      // Profile info
      status.value = {state: 'loaded', event: data}
      saveProfileInfo(data)
      loading.value = false
      break
    case 1:
      storeEvent(shortNotesData, data)
      break
    case 2:
      handleLoadedRecommendedRelay(data)
      break
    case 3:
      handleLoadedContactList(data)
      break
    case 1063:
      storeEvent(fileData, data)
      break
    case 1984:
      handleLoadedReportEvent(data)
      break
    case 1985:
      storeEvent(labelData, data)
      break
    case 9041:
      storeEvent(zapGoalData, data)
      break
    case 9735:
      handleLoadedZapEvent(data)
      break
    case 10000:
    case 10001:
    case 10003:
    case 10004:
    case 10005:
    case 10006:
    case 10007:
    case 10015:
    case 10030:
    case 30000:
    case 30002:
    case 30003:
    case 30004:
    case 30015:
    case 30030: 
      storeEvent(listsData, data)
      break
    case 10002:
      handleLoadedRelayList(data)
      break
    case 30008:
      storeEvent(badgeData, data)
      break
    case 30017:
      handleLoadedStallEvent(data)
      break
    case 30018:
      handleLoadedProductEvent(data)
      break
    case 30023:
      storeEvent(longNotesData, data)
      break
    case 30311:
      storeEvent(liveData, data)
      break
    case 30315:
      storeEvent(userStatusData, data)
      break
    case 30402:
      storeEvent(classifiedsData, data)
      break
    case 31922:
      storeEvent(eventsData, data)
      break
    case 31923:
      storeEvent(eventsData, data)
      break
    case 31924:
      storeEvent(calendarData, data)
      break
    case 31989:
      storeEvent(handlerData, data)
      break
    case 33889:
      storeEvent(pinstrData, data)
      break
    case 37375:
      storeEvent(cashuData, data)
      break
  }

  // Track event
  if(!profileDataStats.value) {
    profileDataStats.value = {
      count: 0,
      relays: {}
    }
  }

  profileDataStats.value.count++
  const relays = profileDataStats.value.relays
  if(!relays[data.relay]) {
    relays[data.relay] = 0 
  } else {
    relays[data.relay]++
  }
}

function onEndProfileEvents() {
  logger('onEndProfileEvents')
}

function handleLoadedContactList(data) {
  // console.log('handleLoadedContactList', data)
  if(data.tags && data.tags.length > 0) {
    let saveIt = true

    storeEvent(followDataEvents, data)

    if(!followData.value || eventData.created_at > followData.value.created_at) {
      followData.value = data
    }
  }
}

function handleLoadedRecommendedRelay(data) {
  logger('handleLoadedRecommendedRelay', data)

  if(!relayData.value) {
    relayData.value = []
  }

  relayEvent.value = data
  // console.log('Loaded relays', data)

  const relayId = relayManager.addRelayByUrl(data.content)
  relayData.value.push(relayId)
}

function handleLoadedRelayList(data) {
  logger('handleLoadedRelayList', data)

  const newEvent = storeEvent(relayDataEvents, data)

  if(!relayData.value) {
    relayData.value = []
  }

  if(newEvent) {
    let i, tag, relayId, relaysToAdd = 3
    const tags = data.tags.filter(tag => tag[0] == 'r')
    for(i=0; i<tags.length; i++) {
      tag = tags[i]

      if(tag.length == 2 || (tag.length == 3 && tag[2] == 'write')) {
        relayId = relayManager.addRelayByUrl(tag[1])

        if(relayData.value.indexOf(relayId) === -1) {
          relayData.value.push(relayId)

          if(profileService) {
            profileService.addRelay(relayId)
            relaysToAdd--
          }
        }
      }

      if(relaysToAdd <= 0) break
    }
  }
}

function handleLoadedReportEvent(data) {
  if(data.pubkey == publicKey.value) {
    // User made a report
    storeEvent(reportsData, data)
  } else {
    // User got reported
    storeEvent(reportedData, data)
  }
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

  return !alreadyAdded
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
  }
}

function handleLoadedProductEvent(data) {
  // console.log('handleLoadedProductEvent', data)

  if(!productData.value) {
    productData.value = []
  }

  if(typeof data.content == 'string' && data.content.length > 0) {
    data.content = JSON.parse(data.content)
  }

  // Ensure it's not already added.
  let alreadyAdded = false, matchIndex, isNewer, i=0, product
  for(; i<productData.value.length; i++) {
    product = productData.value[i]

    // Event and product ID can match.
    if(product.id == data.id || product.content.id == data.content.id) {
      alreadyAdded = true
      matchIndex = i
      // Keep the newer one in case of a match.
      isNewer = data.created_at > product.created_at
      break
    }
  }

  if(alreadyAdded && isNewer) {
    productData.value[matchIndex] = data
  } else if(!alreadyAdded) {
    productData.value.push(data)
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

  if(profileData.value) {
    // Only store if newer than existing data.
    if(eventData.created_at < profileData.value.event.created_at) {
      saveIt = false
    }
  }

  storeEvent(profileDataEvents, eventData)

  // console.log('saveProfileInfo', eventData, profileDataEvents)

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
  profileDataEvents.value = null
  relayData.value = null
  relayEvent.value = null
  relayDataEvents.value = null
  followData.value = null
  followDataEvents.value = null
  handlerData.value = null
  nip05Data = null
  publicKey.value = null
  shortNotesData.value = null
  longNotesData.value = null
  reportsData.value = null
  reportedData.value = null
  sentZapsData.value = null
  receivedZapsData.value = null
  zapGoalData.value = null
  userStatusData.value = null
  badgeData.value = null
  listsData.value = null
  profileDataStats.value = null
  liveData.value = null
  stallData.value = null
  productData.value = null
  fileData.value = null
  pinstrData.value = null
  labelData.value = null
  eventsData.value = null
  calendarData.value = null
  classifiedsData.value = null
  cashuData.value = null
}

function updateHistory() {
  const url = getProfileUrl()
  navigateTo(url, { replace: true })
}

const activeThemeId = computed(() => {
  return sessionStore.theme
})

const isOwner = computed(() => {
  return sessionStore.isLoggedIn && sessionStore.publicKey == publicKey.value
})

const classObject = computed(() => {
  return [
    'profile-page',
    '-theme-'+activeThemeId.value,
    hasBanner.value ? '-banner' : '-no-banner'
  ].join(' ')
})

const hasBanner = computed(() => {
  const banner = ToolBox.dig(profileData.value, 'profile.banner', null, true)
  return banner && banner.length > 0
})

// https://github.com/BitcoinAndLightningLayerSpecs/rfc/issues/1
function listenToLightningPayments() {
  // console.log('listenToLightningPayments')
  document.addEventListener('lightning:transaction', onLightningPayment)
}

function onLightningPayment(event) {
  logger('onLightningPayment')
  logger(event.type)
  logger(event.detail)
  logger(event.detail.preimage)
}

function onShowDataOverlay() { showDataOverlay.value = true }
function closeDataOverlay() { showDataOverlay.value = false }

function logger(...args) {
  if(logEnabled) {
    console.log('[id]]', ...args)
  }
}

onMounted(() => {
  if(process.client) {
    listenToLightningPayments()
  }

  window.emitter.on('set-theme', updateHistory)
})

</script>

<template>
  <div :class="classObject">
    <div class="content -theme-content-frame" :key="publicKey">
      <p v-if="false && !profileData && status">{{ status }}</p>

      <ProfileLoader
        :status="status"
        :events="profileDataEvents"
      />

      <template v-if="profileData">
        <ProfileBanner :info="profileData" />
        <div class="wrap">
          <ProfileInfo
            :info="profileData"
            :publicKey="publicKey"
            :relayData="relayEvent"
            :followData="followData"
            :userStatusData="userStatusData"
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
              <ProfileShortNotesSummary
                :info="shortNotesData"
                :count="shortNotesData ? shortNotesData.length : null"
                :handlers="handlerData"
              />
              <ProfileLongNotesSummary
                :info="longNotesData"
                :count="longNotesData ? longNotesData.length : null"
                :handlers="handlerData"
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
              <ProfileLiveSummary
                :info="liveData"
                :count="liveData ? liveData.length : null"
                :handlers="handlerData"
                @navigate="selectTab"
              />
              <ProfileEventSummary
                :info="eventsData"
                :count="eventsData ? eventsData.length : null"
                :handlers="handlerData"
                @navigate="selectTab"
              />
              <ProfileCalendarSummary
                :info="calendarData"
                :count="calendarData ? calendarData.length : null"
                :handlers="handlerData"
                @navigate="selectTab"
              />
              <ProfileClassifiedsSummary
                :info="classifiedsData"
                :count="classifiedsData ? classifiedsData.length : null"
                :handlers="handlerData"
                @navigate="selectTab"
              />
              <ProfileBadgeSummary
                :info="badgeData"
                :count="badgeData ? badgeData.length : null"
                :handlers="handlerData"
                @navigate="selectTab"
              />
              <ProfileListsSummary
                :info="listsData"
                :count="listsData ? listsData.length : null"
                :handlers="handlerData"
                @navigate="selectTab"
              />
              <ProfilePinstrSummary
                :info="pinstrData"
                :count="pinstrData ? pinstrData.length : null"
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
              <ProfileCashuSummary
                :info="cashuData"
                :count="cashuData ? cashuData.length : null"
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
              :handlers="handlerData"
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
            <ProfileListsTab 
              v-if="activeTabId == 'lists'" 
              :info="listsData" 
              :handlers="handlerData"
              @navigate="selectTab"
              @back="selectTab"
            />
            <ProfileStallTab 
              v-if="activeTabId == 'stalls'"
              :info="stallData"
              :products="productData"
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
            <ProfileLiveTab 
              v-if="activeTabId == 'live'"
              :info="liveData"
              :handlers="handlerData"
              @back="selectTab"
            />
            <ProfileClassifiedsTab 
              v-if="activeTabId == 'classifieds'"
              :info="classifiedsData"
              :handlers="handlerData"
              @back="selectTab"
            />
            <ProfileEventTab 
              v-if="activeTabId == 'events'"
              :info="eventsData"
              :handlers="handlerData"
              @back="selectTab"
            />
            <ProfileCalendarTab 
              v-if="activeTabId == 'calendars'"
              :info="calendarData"
              :handlers="handlerData"
              @back="selectTab"
            />
            <ProfilePinstrTab 
              v-if="activeTabId == 'pinstr'"
              :info="pinstrData"
              @back="selectTab"
            />
            <ProfileTipsTab
              v-if="activeTabId == 'tips'"
              :profileData="profileData"
              :relayData="relayDataEvents"
              :followData="followData"
              :badgeData="badgeData"
              :handlerData="handlerData"
              :listsData="listsData"
              :stallData="stallData"
              :productData="productData"
              :sentZapsData="sentZapsData"
              :receivedZapsData="receivedZapsData"
              :zapGoalData="zapGoalData"
              :userStatusData="userStatusData"
              :shortNotesData="shortNotesData"
              :longNotesData="longNotesData"
              :reportsData="reportsData"
              :fileData="fileData"
              :liveData="liveData"
              :eventsData="eventsData"
              :calendarData="calendarData"
              :labelData="labelData"
              :classifiedsData="classifiedsData"
              :pinstrData="pinstrData"
              @back="selectTab"
            />
          </div>
        </div>
      </template>
    </div>
    <ProfileDataOverlayModal
      v-if="showDataOverlay"
      :isOwner="isOwner"
      :info="profileData"
      :infoEvents="profileDataEvents"
      :publicKey="publicKey"
      :relayData="relayDataEvents"
      :followData="followData"
      :followDataEvents="followDataEvents"
      :badgeData="badgeData"
      :handlerData="handlerData"
      :listsData="listsData"
      :stallData="stallData"
      :productData="productData"
      :sentZapsData="sentZapsData"
      :receivedZapsData="receivedZapsData"
      :zapGoalData="zapGoalData"
      :userStatusData="userStatusData"
      :shortNotesData="shortNotesData"
      :longNotesData="longNotesData"
      :reportsData="reportsData"
      :reportedData="reportedData"
      :fileData="fileData"
      :liveData="liveData"
      :eventsData="eventsData"
      :calendarData="calendarData"
      :pinstrData="pinstrData"
      :labelData="labelData"
      :classifiedsData="classifiedsData"
      :stats="profileDataStats"
      @close="closeDataOverlay"
    />
    <ProfileNostaIntro v-if="profileData" />
    <ProfileTipsSummary
      v-if="isOwner && activeTabId != 'tips'"
      :profileData="profileData"
      :relayData="relayDataEvents"
      :followData="followData"
      :badgeData="badgeData"
      :handlerData="handlerData"
      :listsData="listsData"
      :stallData="stallData"
      :productData="productData"
      :sentZapsData="sentZapsData"
      :receivedZapsData="receivedZapsData"
      :zapGoalData="zapGoalData"
      :userStatusData="userStatusData"
      :shortNotesData="shortNotesData"
      :longNotesData="longNotesData"
      :reportsData="reportsData"
      :fileData="fileData"
      :liveData="liveData"
      :eventsData="eventsData"
      :calendarData="calendarData"
      :labelData="labelData"
      :classifiedsData="classifiedsData"
      :pinstrData="pinstrData"
      @navigate="selectTab"
    />
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
