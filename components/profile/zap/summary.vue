<script setup>
const props = defineProps([
  'info',
  'count',
  'publicKey',
  'direction'
])

// Every receipt has a "zap", parsed by zapReceiptHelper when it was loaded.
const zappedAmount = computed(() => {
  return (props.info || []).reduce((total, event) => total + event.zap.sats, 0)
})

const zapCount = computed(() => {
  return props.info.length
})

const titleCopy = computed(() => {
  let result = props.direction == 'sent' ? 'No zaps sent' : 'No zaps received'

  if(zapCount.value > 0) {
    if(props.direction == 'sent') {
      result = 'Sent ' + zapCount.value + ' zap' + (zapCount.value == 1 ? '' : 's recently')
    } else {
      result = 'Received ' + zapCount.value + ' zap' + (zapCount.value == 1 ? '' : 's recently')
    }
  }

  return result
})

const formattedAmount = computed(() => {
  let result = zappedAmount.value

  if(result >= 1000000000) {
    result = (Math.round(result/100000000)/10).toLocaleString() + 'B'
  } else if(result >= 1000000) {
    result = (Math.round(result/100000)/10).toLocaleString() + 'M'
  } else if(result >= 1000) {
    result = (Math.round(result/100)/10).toLocaleString() + 'K'
  } else {
    result = result.toLocaleString()
  }

  return result
})

const formattedUnit = computed(() => {
  return 'sat' + (zappedAmount.value == 1 ? '' : 's')
})

const recipientOne = computed(() => {
  return prepRecipientInfo(0)
})

const recipientTwo = computed(() => {
  return prepRecipientInfo(1)
})

const recipientThree = computed(() => {
  return prepRecipientInfo(2)
})

// The people on the other end of the zaps. The receipt itself is published by
// the lightning provider, so event.pubkey is not one of them.
const uniqueRecipientEvents = computed(() => {
  let result

  let publicKeys = [], event, publicKey
  for(let i=0; i<props.info.length; i++) {
    event = props.info[i]

    publicKey = props.direction == 'sent' ? event.zap.recipient : event.zap.sender

    if(publicKeys.indexOf(publicKey) === -1) {
      publicKeys.push(publicKey)

      if(!result) result = []
      result.push({ publicKey, relay: event.relay })
    }
  }

  return result
})

const uniqueRecipientEventCount = computed(() => {
  return uniqueRecipientEvents.value ? uniqueRecipientEvents.value.length : 0
})

function prepRecipientInfo(index) {
  let result

  if(uniqueRecipientEvents.value && uniqueRecipientEvents.value.length > index) {
    const event = uniqueRecipientEvents.value[index]

    result = {
      publicKey: event.publicKey,
      relayIds: [event.relay]
    }
  }

  // console.log('prepRecipientInfo', index, result)
   
  return result
}

const emit = defineEmits(['navigate'])

function navigate() {
  emit('navigate', 'zaps-'+props.direction)
}
</script>

<template>
  <div v-if="info" class="zap-summary">
    <ProfileZapIcon :amount="zappedAmount" />
    <div class="copy">
      <ProfileSectionTitle
        :title="titleCopy"
        :clickable="true"
        @select="navigate"
      />

      <p v-if="uniqueRecipientEventCount > 0">
        <template v-if="direction == 'sent'">To </template> 
        <template v-if="direction != 'sent'">From </template> 
        <UiUsername
          :publicKey="recipientOne.publicKey" 
          :relayIds="recipientOne.relayIds"
        />
        <template v-if="uniqueRecipientEventCount == 2"> and </template>
        <template v-if="uniqueRecipientEventCount > 2">, </template>
        <UiUsername
          v-if="uniqueRecipientEventCount > 1"
          :publicKey="recipientTwo.publicKey" 
          :relayIds="recipientTwo.relayIds"
        />
        <template v-if="uniqueRecipientEventCount > 3">, </template>
        <UiUsername
          v-if="uniqueRecipientEventCount > 2"
          :publicKey="recipientThree.publicKey" 
          :relayIds="recipientThree.relayIds"
        />
        <template v-if="uniqueRecipientEventCount > 4">, and others</template>.
      </p>
    </div>
  </div>
</template>

<style scoped lang="scss">

.zap-summary {
  display: flex;
  align-items: center;
  gap: 20px;

  .copy {
    p {
      margin-top: 2px;
      font-size: 17px;
      font-weight: 500;
      color: rgba(var(--theme-front-rgb), 0.75);
    }
  }
}

</style>
