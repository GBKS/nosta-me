<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useUserStore } from "@/stores/users.js"
import eventTracker from '@/helpers/eventTracker.js'

const userStore = useUserStore()
const unloadedProfiles = ref([])
const loadedProfiles = ref([])
const loadProfileCallback = onLoadProfile.bind(this)
const loadEventTracker = eventTracker()
const currentPage = ref(0)
const perPage = 10
loadEventTracker.init(onLoadProfile)

const props = defineProps([
  'info',
  'profileService'
])

const emit = defineEmits(['back'])

const name = computed(() => {
  let result = null

  return result
})

const followCount = computed(() => {
  return combinedProfileList.value.length
})

const title = computed(() => {
  return 'Following ' + followCount.value + ' other' + (followCount.value == 1 ? '' : 's')
})

const combinedProfileList = computed(() => {
  return loadedProfiles.value.concat(unloadedProfiles.value)
})

const displayProfileList = computed(() => {
  return combinedProfileList.value.slice(currentPage.value*perPage, (currentPage.value+1)*perPage)
})

function selectPage(page) {
  currentPage.value = page

  props.profileService.loadContactsPage(page)
}

const pageCount = computed(() => {
  return Math.ceil(combinedProfileList.value.length / perPage)
})

function setupUnloadedProfiles() {
  // console.log('setupUnloadedProfiles', props.info)
  let publicKey, userData
  for(let i=0; i<props.info.tags.length; i++) {
    publicKey = props.info.tags[i][1]

    // Is it already in the list?
    if(unloadedProfiles.value.indexOf(publicKey) === -1) {
      // Is it already loaded?
      userData = userStore.getUser(publicKey)
      if(userData) {
        if(loadedProfiles.value.indexOf(publicKey) === -1) {
          loadedProfiles.value.push(publicKey)
        }
      } else {
        unloadedProfiles.value.push(publicKey)

        loadEventTracker.add('profile-'+publicKey)
      }
    }
  }
  // console.log('unloadedProfiles', unloadedProfiles.value, loadedProfiles.value)
}

function onLoadProfile(data) {
  // console.log('onLoadProfile', data)

  const index = unloadedProfiles.value.indexOf(data.pubkey)
  if(index !== -1) {
    unloadedProfiles.value.splice(index, 1)

    loadEventTracker.remove('profile-'+data.pubkey)
  }

  loadedProfiles.value.push(data.pubkey)
  // console.log('loadedProfiles', loadedProfiles)
}

if(props.info) {
  setupUnloadedProfiles()
}

onMounted(() => {
  // console.log('FollowList.onMounted', props.profileService)

  if(props.info) {
    setupUnloadedProfiles()
  }
})

onBeforeUnmount(() => {
  loadEventTracker.kill()
})

watch(() => props.info, () => setupUnloadedProfiles)

const showLoader = computed(() => {
  return displayProfileList.length > 0
})

// console.log('follow-list', props.info)
</script>

<template>
  <Transition name="fade" appear>
    <div v-if="info && info.tags" class="follow-list">
      <ProfileSectionBack @select="$emit('back')" />
      <ProfileSectionTitle :title="title" />
      <UiLoadIndicator
        v-if="showLoader"
      />
      <template v-if="!showLoader">
        <div class="items">
          <ProfileFollowItem
            v-for="(publicKey, index) in displayProfileList"
            :key="publicKey"
            :publicKey="publicKey"
          />
        </div>
        <UiPagination
          v-if="pageCount > 1"
          :activeIndex="currentPage"
          :max="pageCount"
          @selectPage="selectPage"
        />
      </template>
    </div>
  </Transition>
</template>

<style scoped lang="scss">

.follow-list {
  display: flex;
  flex-direction: column;
  align-items: flex-start;

  .items {
    margin-top: 10px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .pagination {
    margin-top: 20px;
    width: 100%;
    justify-content: center;
  }
}

</style>
