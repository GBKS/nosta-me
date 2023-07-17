<script setup>
import useAssets from  '@/composables/useAssets.js'

const props = defineProps([
  'amount',
  'relativeSize'
])

const ranks = [
  {
    amount: 1000,
    rank: 'silver'
  },
  {
    amount: 10000,
    rank: 'gold'
  },
  {
    amount: 100000,
    rank: 'emerald'
  },
  {
    amount: 1000000,
    rank: 'neon'
  }
]

const rank = computed(() => {
  let rank = 'bronze'
  for(let i=0; i<ranks.length; i++) {
    if(props.amount >= ranks[i].amount) {
      rank = ranks[i].rank
    }
  }
  return rank
})

const rankImage = computed(() => {
  const image =  '/assets/images/zap-'+rank.value+'.jpg'
  return useAssets(image)
})

const formattedAmount = computed(() => {
  let result = props.amount

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
  return 'sat' + (props.amount == 1 ? '' : 's')
})

const classObject = computed(() => {
  const c = ['zap-icon', '-'+rank.value]

  if(props.relativeSize) {
    c.push('-relative-size')
  }
    
  return c.join(' ')
})

const styleObject = computed(() => {
  return {
    backgroundImage: 'url("'+rankImage.value+'")'
  }
})
</script>

<template>
  <div :class="classObject" :style="styleObject">
    <p><b>{{ formattedAmount }}</b><br /><span>{{ formattedUnit }}</span></p>
  </div>
</template>

<style scoped lang="scss">

.zap-icon {
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

  &.-bronze {
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

  &.-silver {
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

  &.-gold {

  }

  &.-emerald {

  }

  &.-neon {
    box-shadow: -5px -5px 15px rgba(197, 27, 226, 0.5), 5px 5px 15px rgba(4, 249, 239, 0.35);
  }

  &.-relative-size {
    &.-bronze {
      width: 45px;
      height: 45px;
    }

    &.-silver {
      width: 55px;
      height: 55px;
    }

    &.-gold {
      width: 65px;
      height: 65px;
    }
  }
}

</style>
