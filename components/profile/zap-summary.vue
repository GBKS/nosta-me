<script setup>
import bolt11Decoder from 'light-bolt11-decoder'
import useAssets from  '@/composables/useAssets.js'

const props = defineProps([
  'info',
  'count',
  'publicKey',
  'direction'
])

const ranks = [
  {
    amount: 1,
    rank: 'bronze'
  },
  {
    amount: 100,
    rank: 'silver'
  },
  {
    amount: 1000,
    rank: 'gold'
  },
  {
    amount: 10000,
    rank: 'emerald'
  },
  {
    amount: 100000,
    rank: 'neon'
  }
]

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
      result = 'Sent ' + zapCount.value + ' zap' + (zapCount.value == 1 ? '' : 's')
    } else {
      result = 'Received ' + zapCount.value + ' zap' + (zapCount.value == 1 ? '' : 's')
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

const rank = computed(() => {
  let rank = 'bronze'
  for(let i=0; i<ranks.length; i++) {
    if(zappedAmount.value >= ranks[i].amount) {
      rank = ranks[i].rank
    }
  }
  return rank
})

const rankImage = computed(() => {
  const image =  '/assets/images/zap-'+rank.value+'.jpg'
  return useAssets(image)
})

const rankStyle = computed(() => {
  return {
    backgroundImage: 'url("'+rankImage.value+'")'
  }
})

const recipientOne = computed(() => {
  return prepRecipientInfo(props.info[0])
})

const recipientTwo = computed(() => {
  return prepRecipientInfo(props.info[1])
})

const recipientThree = computed(() => {
  return prepRecipientInfo(props.info[2])
})

function prepRecipientInfo(event) {
  let publicKey, description
  for(let i=0; i<event.tags.length; i++) {
    // if(event.tags[i][0] == 'p') {
    //   publicKey = event.tags[i][1]
    //   break
    // }

    if(event.tags[i][0] == 'description') {
      publicKey = JSON.parse(event.tags[i][1]).pubkey
      break
    }
  }

  // console.log('prep', publicKey, event.pubkey)

  return {
    publicKey: event.pubkey,
    relayIds: [event.relay]
  }
}

const emit = defineEmits(['navigate'])

function navigate() {
  emit('navigate', 'zaps-'+props.direction)
}
</script>

<template>
  <Transition name="fade" appear>
    <div v-if="info" class="zap-summary">
      <ProfileZapIcon :amount="zappedAmount" />
      <div class="copy">
        <ProfileSectionTitle
          :title="titleCopy"
          :clickable="true"
          @select="navigate"
        />

        <p v-if="info.length > 0">
          <template v-if="direction == 'sent'">To </template> 
          <template v-if="direction != 'sent'">From </template> 
          <UiUsername
            :publicKey="recipientOne.publicKey" 
            :relayIds="recipientOne.relayIds"
          />
          <template v-if="info.length == 1"> and </template>
          <template v-if="info.length > 1">, </template>
          <UiUsername
            v-if="info.length > 1"
            :publicKey="recipientTwo.publicKey" 
            :relayIds="recipientTwo.relayIds"
          />
          <template v-if="info.length > 2">, </template>
          <UiUsername
            v-if="info.length > 2"
            :publicKey="recipientThree.publicKey" 
            :relayIds="recipientThree.relayIds"
          />
          <template v-if="info.length > 3">, and others</template>.
        </p>
      </div>
    </div>
  </Transition>
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
