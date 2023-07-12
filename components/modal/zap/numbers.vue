<script setup>
const props = defineProps([
  'amount',
  'disabled'
])

const emit = defineEmits(['changeAmount'])

const amountModel = ref(0)
const hasFocus = ref(false)
const inputField = ref(null)
const cursorPosition = ref(null)
const numberElements = []
let cursorTimer = null
const cursorX = ref(0)
const cursorWidth = ref(3)
const blinkingCursor = ref(true)

const numberBits = computed(() => {
  // const formatted = Intl.NumberFormat().format(amountModel.value)
  // return formatted.split('')
  return amountModel.value.toString().split('')
})

function inputFocus() {
  hasFocus.value = true
  cursorPosition.value = inputField.value.selectionStart

  clearTimeout(cursorTimer)
  cursorTimer = setInterval(updateCursorPosition, 100)
}

function inputBlur() {
  hasFocus.value = false
  cursorPosition.value = null

  clearTimeout(cursorTimer)
}

const classObject = computed(() => {
  const c = ['zap-numbers']

  if(hasFocus.value) {
    c.push('-focus')

    if(blinkingCursor.value) {
      c.push('-blink')
    }
  }

  return c.join(' ')
})

const cursorStyle = computed(() => {
  return {
    left: cursorX.value + 'px'
  }
})

const selectionStyle = computed(() => {
  return {
    left: cursorX.value + 'px', 
    width: cursorWidth.value + 'px'
  }
})

watch(() => props.amount, (newAmount, oldAmount) => {
  amountModel.value = newAmount
})

watch(amountModel, async(newAmount, oldAmount) => {
  if(hasFocus.value) {
    cursorPosition.value = inputField.value.selectionStart
  }

  if(newAmount > 1000000) {
    amountModel.value = 1000000
  }

  emit('changeAmount', amountModel.value)
})

function setNumberElement(data) {
  numberElements[data.index] = data.element
}

function updateCursorPosition() {
  // console.log('updateCursorPosition', numberElements)

  // Trim removed elements
  let i=0, element
  for(; i<numberElements.length; i++) {
    element = numberElements[i]
    if(element && element.offsetLeft == 0) {
      numberElements.splice(i)
      break
    }
  }
  
  if(hasFocus.value) {
    const numberStart = inputField.value.selectionStart
    const numberEnd = inputField.value.selectionEnd
    // console.log('selection', numberStart, numberElements.length)

    blinkingCursor.value = numberStart == numberEnd

    let elementStart, elementEnd
    let left, right, width

    if(numberStart == numberEnd) {
      cursorWidth.value = 3

      if(numberStart == numberElements.length) {
        elementStart = numberElements[numberStart-1]
        if(elementStart) {
          cursorX.value = elementStart.offsetLeft + elementStart.offsetWidth
        }
      } else {
        elementStart = numberElements[numberStart]
        if(elementStart) {
          cursorX.value = elementStart.offsetLeft
        }
      }
    } else {
      elementStart = numberElements[numberStart]
      cursorX.value = elementStart.offsetLeft

      if(numberEnd == numberElements.length) {
        elementEnd = numberElements[numberEnd-1]
        if(elementStart) {
          right = elementEnd.offsetLeft + elementEnd.offsetWidth
        }
      } else {
        elementEnd = numberElements[numberEnd]
        if(elementStart) {
          right = elementEnd.offsetLeft
        }
      }

      if(right) {
        cursorWidth.value = right - cursorX.value
      }
    }
  }
}

onBeforeUnmount(() => {
  clearTimeout(cursorTimer)
})

onMounted(() => {
  amountModel.value = props.amount
})
</script>

<template>
    <div :class="classObject">
      <TransitionGroup class="numbers" tag="div" name="zap-number-list">
        <ModalZapNumber
          v-for="(numberBit, index) in numberBits"
          :key="index"
          :index="index"
          :info="numberBit"
          :focus="hasFocus"
          @setElement="setNumberElement"
        />
      </TransitionGroup>
      <div class="cursor" :style="cursorStyle" />
      <div class="selection" :style="selectionStyle" />
      <input
        ref="inputField"
        type="text"
        placeholder="100"
        max="1000000"
        v-model="amountModel"
        :disabled="disabled"
        @focus="inputFocus"
        @blur="inputBlur"
      />
    </div>
</template>

<style scoped lang="scss">

.zap-number-list-move,
.zap-number-list-enter-active,
.zap-number-list-leave-active {
  transition: all 0.35s $ease;
}

.zap-number-list-enter-from,
.zap-number-list-leave-to {
  opacity: 0;
}

.zap-number-list-leave-active {
  position: absolute;
}

@keyframes cursorBlink {
  0% {
    opacity: 0;
  }

  50% {
    opacity: 1;
  }

  100% {
    opacity: 0;
  }
}

.zap-numbers {
  position: relative;

  .numbers {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    gap: 0px;
    justify-content: center;
    // align-items: center;
    // background-color: white;
    pointer-events: none;
  }

  .cursor,
  .selection {
    position: absolute;
    top: 3px;
    width: 3px;
    height: calc(100% - 17px);
    transition: opacity 150ms $ease; 
    opacity: 0;
    // background-color: var(--blue);
    background-color: white;
    transform: translateX(-1px);
  }

  &.-focus {
    .cursor {
      opacity: 1;
      animation: cursorBlink 1s $ease infinite;
    }

    .selection {
      opacity: 0.2;
    }
  }

  input {
    display: block;
    opacity: 0.01;
    font-size: 48px;
    line-height: 1;
    font-weight: 600;
    padding: 0;
    width: 100%;
    border-width: 0;
    text-align: center;
    -moz-appearance: textfield;
    appearance: none;

    &:focus {
      outline: none;
    }

    &::-webkit-outer-spin-button,
    &::-webkit-inner-spin-button {
      -webkit-appearance: none;
      margin: 0;
    }
  }
}

</style>
