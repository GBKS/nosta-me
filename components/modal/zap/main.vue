<script setup>
import zapHelper from '@/helpers/zapHelper.js'
import Icons from '@/helpers/icons'
import useAssets from  '@/composables/useAssets.js'
import ToolBox from '@/helpers/toolBox'

const active = ref(false)
const dialog = ref(null)
const profileEvent = ref(null)
const comment = ref('')
const commentVisible = ref(false)
const paymentNote = ref(null)
const amount = ref(100)
const info = ref()
const status = ref('input')

const ranks = computed(() => {
  return [
    {
      name: '100',
      amount: 100,
      active: amount.value == 100,
      rank: 'bronze',
      image: useAssets('/assets/images/texture-bronze.jpg')
    },
    {
      name: '1000',
      amount: 1000,
      active: amount.value == 1000,
      rank: 'silver',
      image: useAssets('/assets/images/texture-silver.jpg')
    },
    {
      name: '10K',
      amount: 10000,
      active: amount.value == 10000,
      rank: 'gold',
      image: useAssets('/assets/images/texture-gold.jpg')
    },
    {
      name: '100K',
      amount: 100000,
      active: amount.value == 100000,
      rank: 'emerald',
      image: useAssets('/assets/images/texture-emerald.jpg')
    },
    {
      name: '1M',
      amount: 1000000,
      active: amount.value == 1000000,
      rank: 'neon',
      image: useAssets('/assets/images/texture-neon.jpg')
    }
  ]
})

const currentRank = computed(() => {
  let result = ranks.value[0]

  for(let i=0; i<ranks.value.length; i++) {
    if(amount.value >= ranks.value[i].amount) {
      result = ranks.value[i]
    }
  }

  return result
})

function onShowModal(data) {
  const isActive = data.id === 'zap'

  if(isActive && data.event) {
    info.value = data
    profileEvent.value = toRaw(data.event)
  }

  active.value = isActive

  if(isActive) {
    setTimeout(showDialog, 50)
  }
}

function showDialog() {
  dialog.value.showModal()
}

function onHideModal(data) {
  if(data.id === 'zap') {
    active.value = false
    reset()
  }
}

function reset() {
  amount.value = 100
  status.value = 'input'
  comment.value = ''
  commentVisible.value = false
  paymentNote.value = null
}

function close() {
  window.emitter.emit('hide-modal', {id: 'zap'})
}

onMounted(() => {
  window.emitter.on('show-modal', onShowModal)
  window.emitter.on('hide-modal', onHideModal)

  // info.value = {
  //   event: {
  //     kind: 0,
  //     content: {
  //       lud16: 'gbks@getalby.com'
  //     }
  //   }
  // }
})

onBeforeUnmount(() => {
  window.emitter.off('show-modal', onShowModal)
  window.emitter.off('hide-modal', onHideModal)
})

function randomizeAmount() {
  amount.value = Math.round(Math.random()*10000)
}

function changeAmount(newAmount) {
  if(status.value == 'input') {
    amount.value = newAmount
  }
}

function selectPreset(newAmount) {
  if(status.value == 'input') {
    amount.value = newAmount
  }
}

async function send() {
  if(status.value == 'input') {
    status.value = 'send'

    const zapper = zapHelper()
    const zapResult = await zapper.start(
      profileEvent.value,
      {
        amount: amount.value * 1000, // Milisats
        comment: comment.value.length > 0 ? comment.value : null,
        authorId: profileEvent.value.pubkey,
        noteId: null,
        relays: [profileEvent.value.relay]
      }
    )

    console.log('ZapModal.send zapResult', zapResult)

    if(zapResult.status == 'error') {
      status.value = 'input'

      switch(zapResult.error) {
        case 'fetch-invoice-failed':
          break; 
        case 'enable-webln-failed':
          break;
        case 'webln-sendpayment-failed':
          break;
      }
    } else if(zapResult.status == 'success') {
      status.value = 'sent'

      paymentNote.value = ToolBox.dig(zapResult, 'invoice.successAction.message', null)
    }
  } else if(status.value == 'sent') {
    close()
  }
}

function addComment() {
  commentVisible.value = true
}

const buttonLabel = computed(() => {
  let result = 'Approve'

  switch(status.value) {
    case 'send':
      result = 'Sending...'
      break
    case 'sent':
      result = 'Close'
      break
  }

  return result
})

const title = computed(() => {
  let result = 'How many sats to send?'

  if(status.value == 'sent') {
    result = 'Success!'
  }

  return result
})

const classObject = computed(() => {
  const c = [
    'zap-modal',
    '-modal',
    '-'+status.value
  ]

  return c.join(' ')
})
</script>

<template>
  <Transition v-if="active" name="modal" appear>
    <dialog 
      :class="classObject"
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
          <div class="info">
            <UiUsername
              v-if="profileEvent && profileEvent.pubkey"
              :publicKey="profileEvent.pubkey"
              :relayIds="[profileEvent.relay]"
              showAvatar="true"
              layout="horizontal"
              avatarSize="small"
            />
            <h3>{{ title }}</h3>
          </div>
          <UiEffectCard :image="currentRank.image">
            <div class="numbers">
              <ModalZapNumbers
                :amount="amount"
                :disabled="status !== 'input'"
                @changeAmount="changeAmount"
              />
            </div>
          </UiEffectCard>
          <template v-if="status !== 'sent'">
            <ModalZapPresets 
              :options="ranks" 
              :amount="amount"
              :disabled="status !== 'input'"
              @select="selectPreset"
            />
            <UiButton
              v-if="!commentVisible" 
              size="tiny"
              look="outline"
              @click="addComment" 
            >Add comment</UiButton>
            <UiInput
              v-if="commentVisible"
              multiline="true"
              size="small"
              v-model="comment"
            />
          </template>
          <template v-if="status == 'sent' && paymentNote">
            <p class="payment-note">"{{ paymentNote }}"</p>
          </template>
          <UiButton
            size="small"
            :disabled="status == 'send'"
            @click="send"
          >{{ buttonLabel }}</UiButton>
        </div>
      </div>
    </dialog>
  </Transition>
</template>

<style scoped lang="scss">

.zap-modal {
  max-width: calc(100% - 30px);
  max-height: calc(100% - 30px);
  border-width: 0;
  z-index: 1337;

  &::backdrop {

  }

  .wrap {
    padding: 0;
    box-sizing: border-box;

    .content {
      max-width: 400px;
      display: flex;
      flex-direction: column;
      gap: 25px;
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
        opacity: 0.5;
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

      .info {
        display: flex;
        flex-direction: column;
        gap: 5px;
      }

      :deep(.username) {
        color: var(--front);
        align-items: center;
      }

      h3 {
        @include r('font-size', 17, 19);
        font-weight: 600;
        margin-bottom: 5px;
        text-align: center;
        color: var(--front);
      }

      .numbers {
        padding-top: 35px;
        padding-bottom: 20px;
      }

      .payment-note {
        text-align: center;
        font-weight: 600;
        @include r('font-size', 15, 19);
      }

      &.slide-enter-active,
      &.slide-leave-active {
        transition: all 350ms $ease;
      }
      &.slide-enter-from,
      &.slide-leave-to {
        opacity: 0;
        transform: translateY(-5px) scale(0.9, 0.9);
      }
    }
  }

  @include media-query(medium-down) {
    
  }

  @include media-query(large) {
    .wrap {

    }
  }
}

</style>
