<script setup>
const props = defineProps([
  'index',
  'info',
  'focus'
])

const emit = defineEmits(['setElement'])

const numberZero = ref(null)
const numberOne = ref(null)
const numberTwo = ref(null)
const numberThree = ref(null)
const numberFour = ref(null)
const numberFive = ref(null)
const numberSix = ref(null)
const numberSeven = ref(null)
const numberEight = ref(null)
const numberNine = ref(null)
const numberPeriod = ref(null)
const numberComma = ref(null)
const canvas = ref()

const activeNumber = computed(() => {
  let result = numberZero.value
  switch(props.info) {
    case '1':
      result = numberOne.value
      break
    case '2':
      result = numberTwo.value
      break
    case '3':
      result = numberThree.value
      break
    case '4':
      result = numberFour.value
      break
    case '5':
      result = numberFive.value
      break
    case '6':
      result = numberSix.value
      break
    case '7':
      result = numberSeven.value
      break
    case '8':
      result = numberEight.value
      break
    case '9':
      result = numberNine.value
      break
    case '.':
      result = numberPeriod.value
      break
    case ',':
      result = numberComma.value
      break
  }

  return result
})

const styleObject = computed(() => {
  const s = {}

  if(activeNumber.value) {
    s.width = activeNumber.value.offsetWidth + 'px'
    s.height = activeNumber.value.offsetHeight + 'px'
  }

  return s
})

const listStyle = computed(() => {
  const s = {}

  if(activeNumber.value) {
    s.transform = 'translateY(-' + activeNumber.value.offsetTop + 'px)'
  }


  return s
})

const classObject = computed(() => {
  const c = ['zap-number']

  if(props.focus) {
    c.push('-focus')
  }

  return c.join(' ')
})

onMounted(() => {
  emit('setElement', {
    index: props.index, 
    element: canvas.value
  })
})

</script>

<template>
  <div :class="classObject" :style="styleObject" ref="canvas">
    <ol :style="listStyle">
      <li ref="numberZero">0</li>
      <li ref="numberOne">1</li>
      <li ref="numberTwo">2</li>
      <li ref="numberThree">3</li>
      <li ref="numberFour">4</li>
      <li ref="numberFive">5</li>
      <li ref="numberSix">6</li>
      <li ref="numberSeven">7</li>
      <li ref="numberEight">8</li>
      <li ref="numberNine">9</li>
      <li ref="numberPeriod">.</li>
      <li ref="numberComma">,</li>
    </ol>
  </div>
</template>

<style scoped lang="scss">

.zap-number {
  overflow: hidden;
  transition: all 350ms $ease;

  ol {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    margin: 0;
    padding: 0;
    list-style-type: none;
    transition: all 350ms $ease;

    li {
      font-size: 48px;
      line-height: 1;
      font-weight: 900;
      text-shadow: 1px 2px 3px rgba(black, 0.5);
      color: white;
    }
  }

  &.-focus {
    ol {
      li {
        // color: var(--blue);
      }
    }
  }
}

</style>
