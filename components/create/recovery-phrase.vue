<script setup>
const props = defineProps([
  'words',
  'verify'
])

const emit = defineEmits(['complete'])
const sortedWords = ref(null)
const clickIndex = ref(0)

function sortWords() {
  const wordArray = props.words.split(' ')

  let result = []
  for(let i=0; i<wordArray.length; i++) {
    result.push({
      index: i,
      word: wordArray[i],
      clicked: false, // Was it clicked or not
      clickIndex: null, // What was the index when clicked
    })
  }

  if(props.verify) {
    result.sort(() => Math.random() - 0.5)
  }

  return result
}

function toggleWord(info) {
  const words = sortedWords.value
  let i, item
  for(i=0; i<words.length; i++) {
    item = words[i]
    if(item.index == info.index) {
      item.clicked = !item.clicked

      if(item.clicked === true) {
        item.clickIndex = clickIndex.value
        item.correct = item.clickIndex === item.index

        if(clickIndex.value == (sortedWords.value.length-1)) {
          emit('complete')        
        }

        clickIndex.value ++
      } else {
        item.clickIndex = null
        item.correct = null
        clickIndex.value --
      }

      break
    }
  }
}

onMounted(() => {
  sortedWords.value = sortWords()
})
</script>

<template>
  <div class="recovery-phrase" v-if="sortedWords">
    <CreateRecoveryPhraseWord
      v-for="(item, index) in sortedWords"
      :key="item.word"
      :info="item"
      :verify="verify"
      :clickIndex="clickIndex"
      @select="toggleWord"
    />
  </div>
</template>

<style scoped lang="scss">

.recovery-phrase {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
}

</style>
