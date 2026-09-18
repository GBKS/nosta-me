<script setup>
import ToolBox from '@/helpers/toolBox'
import useAssets from  '@/composables/useAssets.js'

const props = defineProps([
  'info',
  'direction'
])

const rankImage = ref()

// Parsed by zapReceiptHelper when the receipt was loaded
const zap = computed(() => {
  return props.info.zap
})

const hasContent = computed(() => {
  return zap.value.comment.length > 0
})

const amount = computed(() => {
  return zap.value.sats
})

// The receipt is published by the lightning provider, so it's not info.pubkey.
const otherPublicKey = computed(() => {
  return props.direction == 'sent' ? zap.value.recipient : zap.value.sender
})

const rank = computed(() => {
  const ranks = [
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
  let rank = 'bronze'
  for(let i=0; i<ranks.length; i++) {
    if(amount.value >= ranks[i].amount) {
      rank = ranks[i].rank
    }
  }
  return rank
})

async function updateRankImage() {
  rankImage.value = await useAssets('/assets/images/zap-'+rank.value+'.jpg')
}

const rankStyle = computed(() => {
  return {
    backgroundImage: 'url("'+rankImage.value+'")'
  }
})

const formattedAmount = computed(() => {
  let result = amount.value

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
  return 'sat' + (amount.value == 1 ? '' : 's')
})

const formattedDate = computed(() => {
  return ToolBox.formatRelativeDate(props.info.created_at)
})

const classObject = computed(() => {
  return [
    'zap-item',
    '-'+rank.value
  ].join(' ')
})

onMounted(() => {
  updateRankImage()
})
</script>

<template>
  <div
     v-if="zap"
     :class="classObject"
    >
    <div class="icon" :style="rankStyle">
      <p><b>{{ formattedAmount }}</b><br /><span>{{ formattedUnit }}</span></p>
    </div>
    <div class="copy">
      <p class="amount">
        {{ direction == 'sent' ? 'To' : 'From' }} <UiUsername
        :publicKey="otherPublicKey"
        :relayIds="[info.relay]" 
      /></p>
      <p v-if="hasContent" class="content">"{{ zap.comment }}"</p>
      <p class="date">{{ formattedDate }}</p>
    </div>
  </div>
</template>

<style scoped lang="scss">

.zap-item {
  display: flex;
  align-items: center;
  gap: 10px;
  // background-color: rgba(var(--theme-front-rgb), 0.025);
  // border: 1px solid rgba(var(--theme-front-rgb), 0.05);
  // border-radius: 10px;
  // padding: 10px;

  .icon {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 75px;
    height: 75px;
    border-radius: 15px;
    box-shadow: 0 4px 8px -2px rgba(black, 0.5);
    background-size: cover;

    p {
      color: white;
      text-align: center;
      line-height: 1;
      text-shadow: 0px 2px 4px #000000;

      b {
        font-size: 17px;
      }

      span {
        font-size: 12px;
        text-transform: uppercase;
        font-weight: 600;
      }
    }
  }

  .copy {
    display: flex;
    flex-direction: column;
    align-items: flex-start;

    p {
      margin-top: 3px;
      font-size: 15px;
      color: white;

      &.amount {
        display: flex;
        gap: 3px;
        // align-items: center;
        font-weight: 500;
        opacity: 1;
      }

      &.recipient {
        display: flex;
        gap: 3px;
      }

      &.content {
        opacity: 0.75;
      }

      &.date {
        opacity: 0.75;
        font-size: 12px;
      }
    }

    .username {
      color: white;
    }
  }

  &.-bronze {
    .icon {
      width: 45px;
      height: 45px;
      border-radius: 10px;

      p {
        line-height: 0.8;

        b {
          font-size: 15px;
        }

        span {
          font-size: 10px;
        }
      }
    }
  }

  &.-silver {
    .icon {
      width: 55px;
      height: 55px;
      border-radius: 12px;

      p {
        line-height: 0.9;

        b {
          font-size: 16px;
        }

        span {
          font-size: 11px;
        }
      }
    }
  }

  &.-gold {
    .icon {
      width: 65px;
      height: 65px;
    }
  }

  &.-emerald {
    .icon {

    }
  }

  &.-neon {
    .icon {
      box-shadow: -5px -5px 15px rgba(197, 27, 226, 0.5), 5px 5px 15px rgba(4, 249, 239, 0.35);
    }
  }
}

</style>
