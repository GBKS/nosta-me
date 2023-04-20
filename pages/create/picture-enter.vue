<script setup>
/*

Assuming the user doesn't skip this page
1.1 Enter a URL and press load image
1.2 Focus input field and paste - test image right away

We want the user to only move forward with valid input
- Test if image is valid when clicking next

Image is valid if it's been successfully loaded


 */

import { useProfileStore } from '@/stores/profile'

definePageMeta({
  layout: "create",
  pageTransition: {
    name: 'slide-right'
  },
  middleware (to, from) {
    if(to.name == 'create-picture-enter' && from.name == 'create-recovery-phrase') {
      to.meta.pageTransition.name = 'slide-left'
      from.meta.pageTransition.name = 'slide-left'
    } else {
      to.meta.pageTransition.name = 'slide-right'
      from.meta.pageTransition.name = 'slide-right'
    }
  }
})

const router = useRouter()
const store = useProfileStore()
const canvasWidth = 500
const canvasHeight = 500
const imageUrl = ref('')
const loadImageClicked = ref(false)
const imageLoadWorked = ref(false)

watch(imageUrl, (newUrl, OldUrl) => {
  // loadImageClicked.value = false
})

const inputValid = computed(() => {
  let result = false

  if(store.handle.length > 5) {
    if(store.handle.indexOf('.') !== -1) {
      result = true
    }
  }

  return result
})

const styleObject = computed(() => {
  const result = {}

  if(loadImageClicked.value && imageUrl.value.length > 0) {
    result.backgroundImage = `url('${imageUrl.value}')`
  }

  return result
})

const imageSource = computed(() => {
  return imageUrl.value.length > 0
})

function loadImage() {
  loadImageClicked.value = true

  console.log('store.picture', store.picture)
  console.log('imageUrl', imageUrl.value)
  store.picture = imageUrl.value
}

const hasInput = computed(() => {
  return imageUrl.value.length > 0
})

const isInputValid = computed(() => {
  return hasInput.value && imageUrl.value.indexOf('.') !== -1 && imageUrl.value.length > 5
})

const buttonLabel = computed(() => {
  return hasInput.value ? 'Next' : 'Skip'
})

const showImage = computed(() => {
  console.log('showImage', hasInput.value, loadImageClicked.value)
  return hasInput.value && loadImageClicked.value
})

function clickNext() {
  if(nextAllowed) {
    router.push('/create/recovery-phrase')
  }
}

const nextAllowed = computed(() => {
  console.log('nextAllowed', isInputValid.value)
  return !hasInput.value || (isInputValid.value && imageLoadWorked.value)
})

function inputChange(stuff) {
  console.log('inputChange', stuff)

  imageLoadWorked.value = false
}

function imageLoadSuccess(stuff) {
  console.log('imageLoadSuccess', stuff)

  imageLoadWorked.value = true
}

function imageLoadError(stuff) {
  console.log('imageLoadError', stuff)

  imageLoadWorked.value = false
}

function clickClear() {
  imageUrl.value = ''
  store.picture = ''
  loadImageClicked.value = false
  imageLoadWorked.value = false
}

function inputPaste() {
  loadImageClicked.value = true
}

onMounted(() => {
  console.log('onMounted', store.picture)
  if(store.picture.length > 0) {
    imageUrl.value = store.picture
    loadImageClicked.value = true
  }
})
</script>

<template>
  <div class="picture-enter-page -create-page">
    <div class="content">
      <div class="copy">
        <p class="-step">3 of 10</p>
        <h1>Add a profile pic</h1>
        <p class="-description">Nostr does not store images, so you need to upload them elsewhere, like <a href="https://nostr.build" rel="nofollow noopener noreferrer" target="_blank">nostr.build</a> or <a href="https://imgur.com" rel="nofollow noopener noreferrer" target="_blank">imgur</a>. Then enter the image URL here.</p>
      </div>
    </div>
    <div class="options">
      <div class="pic">
        <div class="pic-wrap">
          <img
            v-if="showImage"
            :src="imageUrl"
            @load="imageLoadSuccess"
            @error="imageLoadError"
          >
        </div>
        <UiButton
          v-if="loadImageClicked"
          icon="cross"
          size="small"
          title="Clear image"
          @click="clickClear"
        />
      </div>
      <UiInput
        placeholder="https://domain.com/image.jpg"
        v-model="imageUrl"
        @paste="inputPaste"
      />
      <UiButton 
        @click="loadImage"
        size="small"
      >Load image</UiButton>
    </div>
    <nav>
      <UiButton 
        to="/create/info" 
        icon="arrowLeft" 
        size="small"></UiButton>
      <UiButton 
        icon="arrowRight" 
        size="small"
        :disabled="!nextAllowed"
        @click="clickNext"
      >{{ buttonLabel }}</UiButton>
    </nav>
  </div>
</template>

<style scoped lang="scss">

.picture-enter-page {
  .options {
    gap: 20px;

    .pic {
      position: relative;

      .pic-wrap {
        background-color: #f4f4f4;
        line-height: 0;
        border-radius: 75px;
        width: 150px;
        height: 150px;
        background-size: cover;
        background-position: center center;
      }

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        border-radius: 75px;
      }

      &:after {
        display: block;
        position: absolute;
        left: 0;
        top: 0;
        width: 150px;
        height: 150px;
        box-sizing: border-box;
        border: 1px solid rgba(black, 0.1);
        border-radius: 75px;
        content: '';
        pointer-events: none;
      }

      :deep(button) {
        position: absolute;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
        opacity: 0;

        p {
          padding-left: 8px;
          padding-right: 8px;
        }
      }

      &:hover {
        :deep(button) {
            opacity: 1;
        }
      }
    }
  }

  nav {
    :deep(a) {
      &:last-child {
        width: 175px;
      }
    }
  }
}

</style>