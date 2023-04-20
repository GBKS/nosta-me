<script setup>
const props = defineProps([
  'info',
  'verify',
  'clickIndex'
])

const emit = defineEmits(['select'])
const shakeIt = ref(false)

const classObject = computed(() => {
  const c = ['recovery-phrase-word']

  if(shakeIt.value) {
    c.push('-shake')
  }

  if(props.verify) {
    c.push('-active')

    if(props.info.clicked) {
      if(props.info.correct) {
        c.push('-correct')
      } else {
        c.push('-incorrect')
      }
    }
  }

  return c.join(' ')
})

const buttonNumber = computed(() => {
  return props.info.clickIndex !== null ? props.info.clickIndex + 1 : ''
})

function click() {
  if(!props.info.clicked || !props.info.correct) {
    if(props.info.index == props.clickIndex) {
      emit('select', props.info.word)
    } else {
      shakeIt.value = true
      setTimeout(endShake, 600)
    }
  }
}

function endShake() {
  shakeIt.value = false
}
</script>

<template>
  <button
    v-if="verify"
    :class="classObject"
    @click="click"
  >
    <span>{{ buttonNumber }}</span>
    <span>{{ info.word }}</span>
  </button>
  <div
    v-if="!verify"
    class="recovery-phrase-word"
  >
    <span>{{ info.index+1 }}</span>
    <span>{{ info.word }}</span>
  </div>
</template>

<style scoped lang="scss">

.recovery-phrase-word {
  display: flex;
  flex-basis: 35%;
  flex-grow: 1;
  background-color: #ededed;
  border-radius: 5px;
  // font-family: monospace;
  font-size: 17px;
  padding: 0;
  transition: all 150ms $ease;

  span {
    line-height: 35px;
    transition: all 150ms $ease;

    &:first-child {
      width: 35px;
      text-align: center;
      border-top-left-radius: 5px;
      border-bottom-left-radius: 5px;
    }

    &:last-child {
      padding-left: 10px;
      padding-right: 10px;
      border-left: 1px solid white;
      border-top-right-radius: 5px;
      border-bottom-right-radius: 5px;
    }
  }

  &.-active {
    span {
      &:first-child {
        opacity: 0;
      }
    }

    &.-correct {
      cursor: default;

      span {
        &:first-child {
          opacity: 1;
          color: white;
          background-color: var(--green);
        }
      }
    }

    &.-incorrect {
      span {
        &:first-child {
          opacity: 1;
          background-color: var(--red);
        }
      }
    }
  }

  &.-shake {
    animation: word-shake 250ms 2 $easeInOutSine;
  }
}

button.recovery-phrase-word {
  cursor: pointer;
  appearance: none;
  border-width: 0;
}

@keyframes word-shake {
  0% {
    transform: translateX(0);
  }

  25% {
    transform: translateX(-10px);
  }

  50% {
    transform: translateX(0);
  }

  75% {
    transform: translateX(10px);
  }

  100% {
    transform: translateX(0);
  }
}

</style>
