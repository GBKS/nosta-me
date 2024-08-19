<script setup>
import { useSessionStore } from '@/stores/session'
import { useRelayStore } from '@/stores/relays'
import Icons from '@/helpers/icons'
import QRCodeStyling from "qr-code-styling";
import ToolBox from '@/helpers/toolBox'
import useAssets from  '@/composables/useAssets.js'

const sessionStore = useSessionStore()
const relayStore = useRelayStore()
const profileEvent = ref(null)
const active = ref(false)
const dialog = ref(null)
const canvas = ref(null)
let code = null

function onShowModal(data) {
  const isActive = data.id === 'qr'

  if(isActive && data.event) {
    profileEvent.value = toRaw(data.event)
  }

  active.value = isActive

  if(isActive) {
    setTimeout(showDialog, 50)
  }
}

function showDialog() {
  dialog.value.showModal()

  renderCode()
}

function onHideModal(data) {
  if(data.id === 'qr') {
    active.value = false
  }
}

async function renderCode() {
  const image = await useAssets('/assets/images/nosta-qr.jpg')

  const relay = relayStore.getRelay(profileEvent.value.relay)
  const nprofile = window.NostrTools.nip19.nprofileEncode({
    pubkey: profileEvent.value.pubkey,
    relays: [relay.url]
  })
  const url = "https://nosta.me/" + nprofile

  code = new QRCodeStyling({
    width: 300,
    height: 300,
    type: 'svg',
    data: url,
    image: image,
    dotsOptions: {
      color: '#000000',
      type: 'rounded'
    },
    imageOptions: {
      crossOrigin: 'anonymous',
      margin: 10
    }
  })

  code.append(canvas.value)
}

onMounted(() => {
  window.emitter.on('show-modal', onShowModal)
  window.emitter.on('hide-modal', onHideModal)
})

onBeforeUnmount(() => {
  window.emitter.off('show-modal', onShowModal)
  window.emitter.off('hide-modal', onHideModal)
})

function close() {
  window.emitter.emit('hide-modal', {id: 'qr'})
}

function download() {
  code.download({ 
    name: "qr", 
    extension: "jpeg"
  })
}

const title = computed(() => {
  let result = null

  const name = ToolBox.dig(profileEvent.value, 'content.name', null)
  if(name) {
    result = name + "'s QR code"
  }

  if(sessionStore.isLoggedIn && sessionStore.publicKey == profileEvent.value.pubkey) {
    result = 'Your QR code'
  }

  return result
})

const profileImage = computed(() => {
  let result = null

  const picture = ToolBox.dig(profileEvent.value, 'content.picture', null)
  if(picture) {
    result = picture
  }

  return result
})
</script>

<template>
  <Transition v-if="active" name="modal" appear>
    <dialog 
      class="modal-qr -modal"
      ref="dialog"
      @close="close"
    >
      <div class="wrap">
        <div class="content">
          <button
            class="-close"
            title="Close"
            v-html="Icons.cross"
            @click="close"
          />
          <h3>{{ title }}</h3>
          <div ref="canvas" class="canvas">
            <div class="pic" v-if="profileImage">
              <img :src="profileImage" />
            </div>
          </div>
          <button @click="download">Download</button>
        </div>
      </div>
    </dialog>
  </Transition>
</template>

<style scoped lang="scss">

.modal-qr {
  max-width: calc(100% - 30px);
  max-height: calc(100% - 30px);
  align-items: center;

  &::backdrop {

  }

  .wrap {
    padding: 0;
    box-sizing: border-box;
    width: 100%;
    max-width: 350px;

    .content {
      display: flex;
      flex-direction: column;
      @include r('padding', 15, 25);
      position: relative;
      background-color: white;
      border-radius: 15px;
      box-sizing: border-box;

      button.-close {
        position: absolute;
        top: 15px;
        right: 15px;
        padding: 10px;
        appearance: none;
        background-color: transparent;
        border-width: 0;
        opacity: 0.35;
        transition: all 150ms $ease;

        :deep(svg) {
          width: 16px;
          height: 16px;
          color: black;
        }

        &:hover {
          opacity: 1;
        }
      }

      h3 {
        @include r('font-size', 17, 19);
        font-weight: 600;
        margin-bottom: 5px;
        text-align: center;
        color: var(--front);
      }

      .canvas {
        width: 100%;
        max-width: 300px;
        aspect-ratio: 1;
        position: relative;

        :deep(svg) {
          width: 100%;
          height: 100%;
        }

        .pic {
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          background-color: white;
          padding: 5px;
          box-sizing: border-box;

          img {
            display: block;
            width: 65px;
            height: 65px;
            object-fit: cover;
            border-radius: 5px;
          }
        }
      }

      > button {
        appearance: none;
        background-color: transparent;
        border-width: 0;

        &:hover {
          text-decoration: underline;
          cursor: pointer;
        }
      }
    }
  }
}

</style>
