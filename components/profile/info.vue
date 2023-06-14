<script setup>
import linkifyStr from "linkify-string"
import Icons from '@/helpers/icons'
import { useSessionStore } from '@/stores/session'

const props = defineProps([
  'info',
  'publicKey',
  'relayData',
  'followData',
  'hasBanner'
])

const emit = defineEmits(['showDataOverlay'])

const sessionStore = useSessionStore()
const optionsVisible = ref(false)

const imageLoaded = ref(false)
function onImageLoaded() {
  imageLoaded.value = true
}

const imageClass = computed(() => {
  return imageLoaded.value ? 'image -loaded' : 'image'
})

const name = computed(() => {
  let result = 'Anonymous'

  if(hasName.value) {
    result = props.info.profile.name
  }

  return result
})

const hasName = computed(() => {
  return props.info && props.info.profile && props.info.profile.name.length > 0
})

const description = computed(() => {
  let result = null

  // console.log('description', props.info)

  if(props.info && props.info.profile && props.info.profile.about) {
    result = linkifyStr(props.info.profile.about, {
      rel: 'nofollow noopener noreferrer',
      target: '_blank'
    })
  }

  return result
})

const image = computed(() => {
  let result = null

  if(props.info && props.info.profile) {
    result = props.info.profile.picture
  }

  return result
})

const isLoggedIn = computed(() => { return sessionStore.isLoggedIn })

const isOwner = computed(() => {
  return isLoggedIn.value && sessionStore.publicKey == props.publicKey
})

const classObject = computed(() => {
  return [
    'profile-info',
    props.hasBanner ? '-banner' : 'no-banner',
    image.value ? '-image' : 'no-image',
    hasName.value ? '-name' : 'no-name'
  ].join(' ')
})

function toggleOptions() {
  optionsVisible.value = !optionsVisible.value
}

function showDataOverlay() {
  emit('showDataOverlay')
  toggleOptions()
}
</script>

<template>
  <div :class="classObject">
    <div :class="imageClass" v-if="image">
      <img 
        :src="image"
        :alt="name"
        @load="onImageLoaded" 
      />
    </div>
    <div class="text">
      <h1>{{ name }}</h1>
      <p 
        v-if="description" 
        v-html="description"
      />
      <div class="links">
        <ProfileNostrAddress :info="info" />
        <ProfileLightningAddress :info="info" />
        <ProfileWebsite :info="info" />
        <ProfilePublicKey :publicKey="publicKey" />
      </div>
    </div>
    <div class="options">
      <div class="options-wrap">
        <ProfileShareButton
          :active="optionsVisible"
          @click="toggleOptions"
        />
        <ProfileShareOptions
          :active="optionsVisible"
          :info="info"
          :publicKey="publicKey"
          :relayData="relayData"
          :followData="followData"
          @showDataOverlay="showDataOverlay"
        />
      </div>
      <ProfileFollowButton v-if="false && isLoggedIn && !isOwner" />
      <ProfileEditButton v-if="isOwner" />
    </div>
  </div>
</template>

<style scoped lang="scss">

.profile-info {
  display: flex;
  align-items: flex-start;
  position: relative;
  @include r('gap', 10, 20);

  .image {
    background-color: rgba(black, 0.2);
    border-radius: 100px;
    line-height: 0;
    @include r('width', 75, 150);
    @include r('height', 75, 150);

    img {
      @include r('width', 75, 150);
      @include r('height', 75, 150);
      border-radius: 100px;
      opacity: 0;
      transition: opacity 250ms $ease;
      object-fit: cover;
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

    h1 {
      font-family: 'Moonrocks';
      @include r('font-size', 40, 64);
      color: var(--theme-text-bright);
      word-break: break-word;
    }

    p {
      color: var(--theme-text-medium);

      :deep(a) {
        color: var(--theme-text-medium);
        font-weight: 600;
        text-decoration: none;

        &:hover {
          text-decoration: underline;
          color: var(--theme-active);
        }
      }
    }

    .links {
      margin-top: 10px;
      display: flex;
      flex-direction: column;
      align-items: flex-start;
    }
  }

  .options {
    position: absolute;
    z-index: 4;
    @include r('top', 0, -20);
    @include r('right', 0, -20);
    display: flex;
    gap: 10px;

    .options-wrap {
      position: relative;

      .options-button {

      }
    }
  }

  &.-banner {
    flex-direction: column;
    gap: 10px;

    .image {
      position: absolute;
      left: 0;
      bottom: 100%;
      transform: translateY(20px);
    }

    .text {
      padding-top: 30px;
    }
  }

  &.-no-name {
    .text {
      h1 {
        opacity: 0.5;
      }
    }
  }

  @include media-query(small) {
    &.-no-banner {
      flex-direction: column;
    }
  }

  @include media-query(medium) {

  }

  @include media-query(medium-up) {

  }

  @include media-query(large) {

  }
}

</style>
