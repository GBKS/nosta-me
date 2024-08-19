<script setup>
import multiRelayRequest from '@/helpers/multiRelayRequest.js'
import ToolBox from '@/helpers/toolBox'
import { useRelayStore } from '@/stores/relays'
import useAssets from  '@/composables/useAssets.js'

const props = defineProps([
  'info'
])

let rawUserData = null
const userData = ref(null)
const relayStore = useRelayStore()
let reportType = null
let userId = null
let noteId = null

function parseInfo() {
  let tag, i
  for(i=0; i<props.info.tags.length; i++) {
    tag = props.info.tags[i]

    switch(tag[0]) {
      case 'p':
        userId = tag[1]
        break
      case 'e':
        noteId = tag[1]
        break
      case 'report':
        reportType = tag[1]
        break
    }

    if(tag.length > 2) {
      reportType = tag[2]
    }
  }
}

function loadUserData() {
  const filter = {
    kinds: [0],
    authors: [userId],
    limit: 1
  }

  // console.log('requestUserData', tag, filter)

  const request = multiRelayRequest()
  request.init(onUserData)
  request.start(relayStore.getAll, [filter])

  // const request = relayRequest()
  // request.init(onBadgeData, false)
  // request.start(
  //   props.info.relay,
  //   filter
  // )
}

function onUserData(data) {
  // console.log('onUserData', data)

  let content = data.content
  if(typeof content == 'string' && content.length > 0) {
    content = JSON.parse(data.content)
  }
  
  data.content = content
  rawUserData = data

  userData.value = data
}

const formattedType = computed(() => {
  let result = null

  if(reportType) {
    result = reportType.charAt(0).toUpperCase() + reportType.substr(1)
  }

  return result
})

const userLink = computed(() => {
  let result = '/' + userId

  if(userData.value) {
    const relay = relayStore.getRelay(userData.value.relay)
    const nprofile = window.NostrTools.nip19.nprofileEncode({
      pubkey: userData.value.pubkey,
      relays: [relay.url]
    })
    result = '/' + nprofile
  }

  return result
})

const userName = computed(() => {
  return userData.value ? userData.value.content.name : 'unknown'
})

const noteLink = computed(() => {
  return 'https://snort.social/e/' + noteId
})

const formattedDate = computed(() => {
  return ToolBox.formatRelativeDate(props.info.created_at)
})

const formattedDescription = computed(() => {
  let result = null

  if(noteId) {
    result = 'Reported '
  } else {

  }

  return result
})

onBeforeMount(() => {
  parseInfo()
})

onMounted(() => {
  loadUserData()
})
</script>

<template>
  <div class="report-item">
    <ProfileReportIcon :type="reportType" />
    <div class="copy">
      <p v-if="noteId">Reported a <NuxtLink :to="noteLink" target="_blank" rel="nofollow noopener noreferrer">note</NuxtLink> by <NuxtLink :to="userLink">{{ userName }}</NuxtLink> for <b>{{ reportType }}</b> on {{ formattedDate }}.</p> 
      <p v-if="!noteId">Reported <NuxtLink :to="userLink">{{ userName }}</NuxtLink> for <b>{{ reportType }}</b> on {{ formattedDate }}.</p> 
    </div>
  </div>
</template>

<style scoped lang="scss">

.report-item {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 10px 0;

  .icon {
    flex-basis: 50px;
    flex-shrink: 0;
    width: 50px;
    height: 50px;
    border-radius: 100px;
    overflow: hidden;
    box-shadow: 
      0px 32px 32px rgba(0, 0, 0, 0.15), 
      0px 16px 16px rgba(0, 0, 0, 0.15), 
      0px 8px 8px rgba(0, 0, 0, 0.15), 
      0px 4px 4px rgba(0, 0, 0, 0.15), 
      0px 2px 2px rgba(0, 0, 0, 0.15);

    img {
      width: 50px;
      height: 50px;
    }
  }

  .copy {
    h5 {
      font-size: 17px;
      font-weight: 600;
      color: var(--theme-front);
    }

    p {
      margin-top: 3px;
      font-size: 15px;
      color: rgba(var(--theme-front-rgb), 0.75);

      b {
        font-weight: 600;
        color: var(--theme-front-rgb);
      }

      a {
        color: var(--theme-front);
        opacity: 1;
        text-decoration: none;

        &:hover {
          text-decoration: underline;
        }
      }
    }
  }
}

</style>
