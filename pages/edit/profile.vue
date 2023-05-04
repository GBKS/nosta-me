<script setup>
import { useSessionStore } from '@/stores/session'
import { useProfileStore } from '@/stores/profile'
import { useRelayStore } from '@/stores/relays'
import multiRelayRequest from '@/helpers/multiRelayRequest.js'

const profileStore = useProfileStore()
const sessionStore = useSessionStore()
const relayStore = useRelayStore()
const router = useRouter()

let service = null

const name = ref('')
const about = ref('')
const website = ref('')
const bitcoin = ref('')
const handle = ref('')
const picture = ref('')
const banner = ref('')

const isSaving = ref(false)
const relayIds = ref([])
const loadedProfileEvents = ref([])
const loadedRelayEvents = ref([])

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

function validate() {

}

function cancelChanges() {
  if(confirm('Get ouf of here?')) {
    router.push('/'+sessionStore.publicKey)
  }
}

function saveChanges() {

}

function loadData() {
  console.log('loadData')

  if(!service) {
    service = multiRelayRequest()
    service.init(onDataLoaded)
  }

  const relaysToCheck = relayStore.getAll

  service.start(relaysToCheck, [{
      kinds: [0, 2],
      authors: [sessionStore.publicKey]
  }])
}

function onDataLoaded(data) {
  console.log('onDataLoaded', data)

  if(data.kind == 0) {
    loadedProfileEvents.value.push(data)
  } else if(data.kind == 2) {
    loadedRelayEvents.value.push(data)
  }

  updateInfoFromFoundProfiles()
}

function updateInfoFromFoundProfiles() {
  let content, event

  const sortedEvents = loadedProfileEvents.value.sort((a, b) => {
    if(a.created_at < b.created_at) return -1
    if(a.created_at > b.created_at) return 1
    return 0
  })

  for(let i=0; i<sortedEvents.length; i++) {
    event = sortedEvents[i]
    content = JSON.parse(event.content)

    if(content.name) { name.value = content.name }
    if(content.about) { about.value = content.about }
    if(content.website) { website.value = content.website }
    if(content.picture) { picture.value = content.picture }
    if(content.banner) { banner.value = content.banner }
    if(content.lud16) { bitcoin.value = content.lud16 }
    if(content.nip05) { handle.value = content.nip05 }

    if(relayIds.value.indexOf(event.relay) === -1) {
      relayIds.value.push(event.relay)
    }
  }

  console.log('updateInfoFromFoundProfiles', relayIds.value)
}

const foundRelayIds = computed(() => {
  const result = []

  for(let i=0; i<loadedRelayEvents.value.length; i++) {
    
  }

  return result
})

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
    <div class="modal">
      <div class="content">
        <div class="copy">
          <p class="-disabled">🪩 This page does not work yet. But it will be awesome once it does.</p>
          <h1>Update your profile</h1>
          <p>This is just for your basic information. You can edit who you follow and which relays to post to on your profile page.</p>
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
            <label>Bitcoin lightning address</label>
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
                placeholder="Enter your picture..."
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
                placeholder="Enter your banner..."
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
        <div class="relays">
          <h2>Relays</h2>
          <p>Your profile was found on these relays. Saving changes will update them.</p>
          <RelaySaveList
            :active="isSaving"
            :relayIds="relayIds"
          />
        </div>
        <div class="options">
          <UiButton
            size="small"
            @click="cancelChanges" 
          >Cancel</UiButton>
          <UiButton 
            size="small"
            :disabled="true"
            @click="saveChanges" 
          >Save changes</UiButton>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">

.edit-profile-page {
  display: flex;
  justify-content: center;
  padding-left: 15px;
  padding-right: 15px;
  min-height: 100vh;
  box-sizing: border-box;

  .modal {
    background-color: white;
    border-radius: 25px;
    position: relative;
    display: flex;

    .content {
      display: flex;
      flex-direction: column;
      box-sizing: border-box;
      max-width: 700px;
      width: 100%;
      @include r('padding-left', 20, 60);
      @include r('padding-right', 20, 60);
      @include r('padding-top', 20, 40);
      @include r('padding-bottom', 20, 40);
      @include r('gap', 10, 20);

      .copy {
        display: flex;
        flex-direction: column;
        gap: 10px;

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

        h2 {
          @include r('font-size', 16, 18);
          font-weight: 500;
        }
      }

      .options {
        display: flex;
        gap: 20px;
        justify-content: space-between;
      }
    }
  }

  @include media-query(medium-down) {
    padding: 0 15px 15px 15px;
  }

  @include media-query(large) {
    padding: 50px;
  }
}

</style>