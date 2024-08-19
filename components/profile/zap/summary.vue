<script setup>
import bolt11Decoder from 'light-bolt11-decoder'

const props = defineProps([
  'info',
  'count',
  'publicKey',
  'direction'
])

const zapsParsed = []
const summaries = ref(null)
const zappedAmountValue = ref(0)

const zappedAmount = computed(() => {
  if(props.info) {
    let i=0, zap
    for(; i<props.info.length; i++) {
      zap = props.info[i]

      if(zapsParsed.indexOf(zap.id) === -1) {
        parseZap(zap)
      }
    }
  }

  return zappedAmountValue.value
})

function parseZaps() {
  if(props.info) {
    let i=0, zap
    for(; i<props.info.length; i++) {
      zap = props.info[i]

      if(zapsParsed.indexOf(zap.id) === -1) {
        parseZap(zap)
      }
    }
  }
}

function parseZap(info) {
  const result = {
    id: info.id
  }

  // console.log('parseZap', info)

  let i=0, tag, amountSection
  for(; i<info.tags.length; i++) {
    tag = info.tags[i]

    if(tag[0] == 'bolt11') {
      try {
        result.invoice = bolt11Decoder.decode(tag[1])
        amountSection = findSection(result.invoice, 'amount')
        if(amountSection) {
          result.amount = amountSection.value
        }
      } catch(error) {
        console.log('ZapItem could not decode', tag[1])
      }
      // console.log('dd', invoice.value)
    } else if(tag[0] == 'description') {
      try {
        result.targetUserPublicKey = JSON.parse(tag[1]).pubkey
      } catch(error) {
        console.log('ZapSummary.parseZap could not parse JSON', tag[1])
      }
    }
  }

  if(!summaries.value) {
    summaries.value = []
  }

  if(result.amount) {
    zappedAmountValue.value += Math.round(parseInt(result.amount) / 1000)
  }

  zapsParsed.push(result.id)
  summaries.value.push(result)
}

function findSection(invoice, name) {
  let result = null

  let i, section
  for(i=0; i<invoice.sections.length; i++) {
    section = invoice.sections[i]

    if(section.name == name) {
      result = section
      break
    }
  }

  return result
}

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

const uniqueRecipientEvents = computed(() => {
  let result

  let publicKeys = [], event, publicKey, descriptionTag
  for(let i=0; i<props.info.length; i++) {
    event = props.info[i]

    publicKey = event.pubkey

    // if(props.direction == 'sent') {
    //   descriptionTag = ToolBox.findTag(event, 'description')
    //   publicKey = JSON.parse(descriptionTag[0]).pubkey
    // } else {
    //   publicKey = event.pubkey
    // }

    if(publicKeys.indexOf(event.pubkey) === -1) {
      publicKeys.push(event.pubkey)

      if(!result) result = []
      result.push(event)
    }
  }

  return result
})

const uniqueRecipientEventCount = computed(() => {
  return uniqueRecipientEvents.value ? uniqueRecipientEvents.value.length : 0
})

function prepRecipientInfo(index) {
  let result

  if(uniqueRecipientEvents.value && uniqueRecipientEvents.value.length >= index) {
    const event = uniqueRecipientEvents.value[index]

    result = {
      publicKey: event.pubkey,
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
