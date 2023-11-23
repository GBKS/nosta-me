<script setup>
import * as linkify from "linkifyjs"
import linkifyStr from "linkify-string"
import Icons from '@/helpers/icons'
import { useSessionStore } from '@/stores/session'
import UiUsername from '@/components/ui/username'
import ToolBox from '@/helpers/toolBox'
import relayManager from '@/helpers/relayManager.js'

const props = defineProps([
  'info',
  'publicKey',
  'relayData',
  'followData',
  'userStatusData',
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
  return ToolBox.digDeep(props, [
    'info.profile.display_name',
    'info.profile.name',
    'info.profile.displayName',
    'info.profile.username'
  ], 'Anonymous')
})

const hasName = computed(() => {
  return props.info && props.info.profile && props.info.profile.name.length > 0
})

const description = computed(() => {
  return ToolBox.dig(props, 'info.profile.about', null, true)
})

// Split description by URLs and nostr: links and build a virtual DOM
// with the proper components
const DescriptionNode = () => {
  const text = description.value

  let children = []
  const tokens = linkify.tokenize(text)

  let i=0, token
  for(; i<tokens.length; i++) {
    token = tokens[i]

    if(token.t == 'url') {
      if(token.v.indexOf('nostr:npub') === 0) {
        const publicKey = window.NostrTools.nip19.decode(token.v.split(':')[1]).data;
        children.push(h(UiUsername, { publicKey }))
      } else if(token.v.indexOf('nostr:nprofile') === 0) {
        children.push(turnNProfileToNode(token.v))
      } else {
        children.push(h('a', {
          href: token.v,
          innerHTML: token.v,
          rel: 'nofollow noopener noreferrer',
          target: '_blank'
        }))
      }
    } else {
      children.push(token.v)
    }
  }

  return h('p', null, children)
}

function turnNProfileToNode(text) {
  const { pubkey, relays } = window.NostrTools.nip19.decode(text.split(':')[1]).data;
  const relayIds = []
  if(relays) {
    let i=0, relayId
    for(; i<relays.length; i++) {
      relayId = relayManager.addRelayByUrl(relays[i])
      if(relayId) {
        relayIds.push(relayId)
      }
    }
  }
  return h(UiUsername, { publicKey: pubkey, relayIds })
}

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
    props.hasBanner ? '-banner' : '-no-banner',
    image.value ? '-image' : '-no-image',
    hasName.value ? '-name' : '-no-name'
  ].join(' ')
})

const externalIdentities = computed(() => {
  return props.info.event.tags.filter(tag => tag[0] == 'i')
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
      <ProfileUserStatus :info="userStatusData" />
      <DescriptionNode v-if="description" />
      <div class="links">
        <div class="internal">
          <ProfileNostrAddress :info="info" />
          <ProfileLightningAddress :info="info" />
          <ProfileWebsite :info="info" />
          <ProfilePublicKey :publicKey="publicKey" />
        </div>
        <div class="external" v-if="externalIdentities">
          <ProfileExternalIdentity
            v-for="info in externalIdentities"
            :key="info[2]"
            :info="info"
          />
        </div>
      </div>
    </div>
    <div class="options">
      <div class="options-wrap">
        <ProfileShareButton
          :active="optionsVisible"
          @click="toggleOptions"
        />
        <ProfileQrButton :info="info" />
        <ProfileZapButton :info="info" />
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
      // white-space: nowrap;
    }

    .user-status {
      & + p {
        margin-top: 10px;
      }
    }

    p {
      color: var(--theme-text-medium);
      text-wrap: balance;
      word-wrap: break-word;
      white-space: normal;

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

      .internal,
      .external {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        min-width: 0;
      }
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
      display: flex;
      gap: 10px;

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
        // opacity: 0.5;
      }
    }
  }

  @include media-query(small) {
    &.-no-banner {
      flex-direction: column;

      .text {
        h1 {
          
        }
      }
    }
  }

  @include media-query(medium) {

  }

  @include media-query(medium-up) {
    .text {
      .links {
        display: flex;
        gap: 25px;
      }
    }
  }

  @include media-query(large) {

  }
}

</style>
