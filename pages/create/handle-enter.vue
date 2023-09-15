<script setup>
import { useProfileStore } from '@/stores/profile'

const store = useProfileStore()
const handleCheckStatus = ref(null)

definePageMeta({
  layout: "create",
  pageTransition: {
    name: 'slide-right'
  },
  middleware (to, from) {
    if(to.name == 'create-handle-enter' && from.name == 'create-follow') {
      to.meta.pageTransition.name = 'slide-left'
      from.meta.pageTransition.name = 'slide-left'
    } else {
      to.meta.pageTransition.name = 'slide-right'
      from.meta.pageTransition.name = 'slide-right'
    }
  }
})

const hasInput = computed(() => {
  return store.handle.length > 0
})

const isValidEmail = computed(() => {
  const containsAt = store.handle.indexOf('@') !== -1
  const containsDot = store.handle.indexOf('.') !== -1
  const longEnough = store.handle.length > 5
  return containsAt && containsDot && longEnough
})

watch(() => store.handle, (newValue, oldValue) => {
  handleCheckStatus.value = null
})

const inputValid = computed(() => {
  const hasValidInput = store.handle.length > 5 ? isValidEmail.value : true
  return !hasInput.value || (hasValidInput && handleCheckStatus.value == 'valid')
})

const buttonLabel = computed(() => {
  return hasInput.value ? 'Next' : 'Skip'
})

const checkButtonLabel = computed(() => {
  let result = 'Check it'

  switch(handleCheckStatus.value) {
    case 'loading':
      result = 'Loading...'
      break
    case 'invalid':
      result = 'Not a valid handle...'
      break
    case 'not-found':
      result = 'Not found...?'
      break
    case 'valid':
      result = 'Looks good!'
      break
  }

  return result
})

const checkButtonEnabled = computed(() => {
  return hasInput.value 
    && isValidEmail.value 
    && handleCheckStatus.value !== 'loading'
})

function validate() {
  // If it's a valid email format, check that server for info
  if(isValidEmail.value) {
    handleCheckStatus.value = 'loading'
    loadNip05(store.handle)
  } else {
    handleCheckStatus.value = 'invalid'
  }
}

async function loadNip05(handle) {
  let cleanHandle = handle
  if(handle.charAt(0) === '@') {
    cleanHandle = '_'+cleanHandle
  }

  try {
    const data = await window.NostrTools.nip05.queryProfile(cleanHandle)

    if(data) {
      handleCheckStatus.value = 'valid'
    } else {
      handleCheckStatus.value = 'not-found'
    }
  } catch(error) {
    handleCheckStatus.value = 'not-found'
  }
}
</script>

<template>
  <div class="handle-enter-page -create-page">
    <div class="content">
      <div class="copy">
        <p class="-step">7 of 10</p>
        <h1>Enter your handle</h1>
        <p class="-description">Public keys are impossible to remember. Handles look like emails, and are an easy way for others to find you. You can get a handle via services like <a href="https://snort.social/" rel="nofollow noopener noreferrer" target="_blank">Snort</a> and <a href="https://nostrplebs.com/" rel="nofollow noopener noreferrer" target="_blank">Nostrplebs</a>.</p>
      </div>
    </div>
    <div class="options">
      <UiInput
        placeholder="name@domain.com"
        v-model="store.handle"
      />
      <UiButton 
        @click="validate"
        size="small"
        :disabled="!checkButtonEnabled"
      >{{ checkButtonLabel }}</UiButton>
    </div>
    <nav>
      <UiButton 
        to="/create/public-key" 
        icon="arrowLeft" 
        size="small"
      />
      <UiButton 
        to="/create/follow" 
        icon="arrowRight" 
        size="small"
        :disabled="!inputValid"
      >{{ buttonLabel }}</UiButton>
    </nav>
  </div>
</template>

<style scoped lang="scss">

.handle-enter-page {
  .options {
    gap: 20px;
  }
}

</style>