<script setup>
/*

This page is for editing your profile

Two scenarios:
- You don't have a profile yet (maybe using brand new keys)
- You have profile data

Other features:
- Highlight when multiple versions of a profile were found
  and let the user know that saving will update them

 */

import { useSessionStore } from '@/stores/session'
import { useProfileStore } from '@/stores/profile'
import { useRelayStore } from '@/stores/relays'
import multiRelayRequest from '@/helpers/multiRelayRequest.js'
import metaPublisher from '@/helpers/create/metaPublisher.js'
import sessionRelayService from '@/helpers/sessionRelayService.js'
import ToolBox from '@/helpers/toolBox'
import profileFormHelper from '@/helpers/profileFormHelper.js'

const profileStore = useProfileStore()
const sessionStore = useSessionStore()
const relayStore = useRelayStore()
const router = useRouter()

definePageMeta({
  layout: "edit"
})

const log = false
let service = null
let publisher = null
let publishStatus = ref(null)

// If nothing was loaded after a while, show a message.
let timer = null
const timeOutDelay = 10000
const timedOut = ref(false)

const name = ref('')
const about = ref('')
const website = ref('')
const bitcoin = ref('')
const handle = ref('')
const picture = ref('')
const banner = ref('')
let editEvent = null // The profile event we're editing, the newest one found
let editContent = {}
let editTags = [] // Tags of the profile event we're editing, kept as they are

const isSaving = ref(false)
const relayIds = ref([])
const loadedProfileEvents = ref([])

function startTimer() {
  stopTimer()
  timer = setTimeout(onTimer, timeOutDelay)
}

function stopTimer() {
  clearTimeout(timer)
  timer = null
}

function onTimer() {
  timedOut.value = true
}

const picturePreviewClass = computed(() => {
  const c = ['picture-preview']

  if(picture.value.length == 0) {
    c.push('-blank')
  }

  return c.join(' ')
})

const picturePreviewStyle = computed(() => {
  const result = {}

  if(picture.value.length > 0) {
    result.backgroundImage = "url('"+picture.value+"')"
  }

  return result
})

const bannerPreviewClass = computed(() => {
  const c = ['banner-preview']

  if(banner.value.length == 0) {
    c.push('-blank')
  }

  return c.join(' ')
})

const bannerPreviewStyle = computed(() => {
  const result = {}

  if(banner.value.length > 0) {
    result.backgroundImage = "url('"+banner.value+"')"
  }

  return result
})

const enableForm = computed(() => {
  return loadedProfileEvents.value.length > 0
})

const hasFormChanged = computed(() => {
  return (editContent && (
    (name.value != editContent.name) || 
    (about.value != editContent.about) || 
    (website.value != editContent.website) || 
    (picture.value != editContent.picture) || 
    (name.banner != editContent.banner) || 
    (handle.value != editContent.nip05) || 
    (bitcoin.value != editContent.lud16)
  ))
})

function cancelChanges() {
  if(!hasFormChanged.value || confirm('Get ouf of here?')) {
    router.push('/'+sessionStore.publicKey)
  }
}

function publishResult(status) {
  if(log) {
  }

  publishStatus.value = status
}

// Send to the Blastr relay
function saveChanges() {
  if(publisher) {
    publisher.kill()
    publisher = null
  }

  // Get content from profile we're editing to preserve other properties.
  const content = editContent
  content.name = name.value
  content.about = about.value
  content.website = website.value
  content.picture = picture.value
  content.banner = banner.value
  content.nip05 = handle.value
  content.lud16 = bitcoin.value

  ToolBox.migrateDeprecatedProfileFields(content)

  if(log) {

  }

  // Publish it
  publisher = metaPublisher()
  publisher.showNotifications = true
  publisher.init()
  publisher.publish(publishResult, content, relayIds.value, editTags)

  // Update what we have stored in cache
}

function loadData() {
  if(log) {
  }

  if(!service) {
    service = multiRelayRequest()
    service.init(onDataLoaded)
  }

  let relaysToCheck = sessionRelayService.relayIds
  if(!relayIds || relayIds.length == 0) {
    relaysToCheck = relayStore.getAll
  }

  service.start(relaysToCheck, [{
      kinds: [0],
      authors: [sessionStore.publicKey]
  }])
}

function onDataLoaded(data) {
  if(log) {
  }

  if(data.kind == 0) {
    loadedProfileEvents.value.push(data)
  }

  updateInfoFromFoundProfiles()
}

const profileVersions = computed(() => {
  const dates = []
  const relays = []
  const versions = {}
  let i=0, version
  for(; i<loadedProfileEvents.value.length; i++) {
    version = loadedProfileEvents.value[i]

    if(dates.indexOf(version.created_at) === -1) {
      dates.push(version.created_at)
    }

    if(relays.indexOf(version.relay) === -1) {
      relays.push(version.relay)
    }

    if(!versions[version.created_at]) {
      versions[version.created_at] = []
    }
    versions[version.created_at].push(version)
  }

  if(log) {
  }

  return { dates, relays, versions }
})

function formValues() {
  return {
    name: name.value,
    about: about.value,
    website: website.value,
    picture: picture.value,
    banner: banner.value,
    bitcoin: bitcoin.value,
    handle: handle.value
  }
}

function updateInfoFromFoundProfiles() {
  let event

  // The newest version is the one to edit. Relays answer one after the other,
  // so it can show up when the user is already typing. What they have typed
  // stays, the fields they haven't touched get the newer values.
  const newestEvent = profileFormHelper.newest(loadedProfileEvents.value)

  if(newestEvent && (!editEvent || newestEvent.id != editEvent.id)) {
    const content = profileFormHelper.content(newestEvent)
    const values = profileFormHelper.merge(formValues(), editEvent ? editContent : null, content)

    name.value = values.name
    about.value = values.about
    website.value = values.website
    picture.value = values.picture
    banner.value = values.banner
    bitcoin.value = values.bitcoin
    handle.value = values.handle

    // Store for updating and publishing later.
    editEvent = newestEvent
    editContent = content
    editTags = Array.isArray(newestEvent.tags) ? JSON.parse(JSON.stringify(newestEvent.tags)) : []
  }

  const sortedEvents = loadedProfileEvents.value

  // Store relays we found profiles on.
  for(let i=0; i<sortedEvents.length; i++) {
    event = sortedEvents[i]

    if(relayIds.value.indexOf(event.relay) === -1) {
      relayIds.value.push(event.relay)
    }
  }

  if(log) {
  }
}

onMounted(() => {
  if(sessionStore.isLoggedIn) {
    loadData()
  } else {
    router.push('/')
  }
})

</script>

<template>
  <div class="edit-profile-page">
    <div class="content">
      <div 
        v-if="profileVersions.dates.length > 1"
        class="copy" 
      >
        <p>{{ profileVersions.dates.length }} versions of your profile were found across {{ profileVersions.relays.length }} relays. Saving via this page will make them consistent.</p>
      </div>
      <div class="fields">
        <div class="field-set">
          <label>Name</label>
          <UiInput
            placeholder="Enter your handle..."
            size="small"
            v-model="name"
          />
        </div>
        <div class="field-set">
          <label>About</label>
          <UiInput
            placeholder="Enter your about..."
            size="small"
            multiline="true"
            v-model="about"
          />
        </div>
        <div class="field-set">
          <label>Website</label>
          <UiInput
            placeholder="Enter your website..."
            size="small"
            v-model="website"
          />
        </div>
        <div class="field-set">
          <label>Handle</label>
          <UiInput
            placeholder="Enter your handle..."
            size="small"
            v-model="handle"
          />
        </div>
        <div class="field-set">
          <div class="top">
            <label>Bitcoin lightning address</label>
            <UiTip
              v-if="false"
              text="Looks like an email, but for receiving bitcoin."
              link="https://lightningaddress.com"
            />
          </div>
          <UiInput
            placeholder="Enter your bitcoin..."
            size="small"
            v-model="bitcoin"
          />
        </div>
        <div class="field-set-wrap">
          <div class="field-set">
            <label>Profile picture</label>
            <UiInput
              placeholder="Enter your picture URL..."
              size="small"
              v-model="picture"
            />
          </div>
          <div
            :class="picturePreviewClass"
            :style="picturePreviewStyle"
          />
        </div>
        <div class="field-set-wrap">
          <div class="field-set">
            <label>Profile banner</label>
            <UiInput
              placeholder="Enter your banner URL..."
              size="small"
              v-model="banner"
            />
          </div>
          <div
            :class="bannerPreviewClass"
            :style="bannerPreviewStyle"
          />
        </div>
      </div>
      <div class="options">
        <UiButton
          size="tiny"
          look="outline"
          @click="cancelChanges" 
        >Cancel</UiButton>
        <UiButton 
          size="tiny"
          :disabled="!hasFormChanged"
          @click="saveChanges" 
        >Save changes</UiButton>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">

.edit-profile-page {
  display: flex;
  flex-direction: column;
  justify-content: stretch;
  // padding-left: 15px;
  // padding-right: 15px;
  // min-height: 100vh;
  box-sizing: border-box;

  .content {
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
    // max-width: 700px;
    // width: 100%;
    // @include r('padding-left', 20, 60);
    // @include r('padding-right', 20, 60);
    // @include r('padding-top', 20, 40);
    // @include r('padding-bottom', 20, 40);
    // @include r('gap', 20, 40);

    .copy {
      display: flex;
      flex-direction: column;
      gap: 10px;
      @include r('margin-top', 10, 20);

      h1 {
        @include r('font-size', 32, 48);
      }

      p {

      }
    }

    .fields {
      display: flex;
      flex-direction: column;
      gap: 20px;
      @include r('margin-top', 10, 20);

      .field-set-wrap {
        display: flex;
        gap: 30px;

        .field-set {
          flex-grow: 1;
        }
      }

      .field-set {
        display: flex;
        flex-direction: column;
        gap: 10px;

        label {
          font-weight: 500;
        }

        .top {
          display: flex;
          align-items: center;
          gap: 7px;
        }
      }

      .banner-preview ,
      .picture-preview {
        background-color: #f4f4f4;
        background-size: cover;
        background-position: center center;
      }

      .banner-preview {
        border-radius: 5px;  
        width: 250px;
        height: 80px;        
      }

      .picture-preview {
        border-radius: 100px;
        width: 70px;
        height: 70px;
      }
    }

    .relays {
      display: flex;
      flex-direction: column;
      gap: 10px;
      @include r('margin-top', 20, 40);

      h2 {
        @include r('font-size', 16, 24);
        font-weight: 500;
      }
    }

    .options {
      display: flex;
      gap: 20px;
      justify-content: space-between;
      @include r('margin-top', 20, 40);
    }
  }
}

</style>