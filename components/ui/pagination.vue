<script setup>
import themes from '@/data/themes.json'

const props = defineProps([
  'activeIndex',
  'max',
  'theme'
])

const emit = defineEmits([
  'selectPage'
])

function selectPage(tabId) {
  emit('selectPage', tabId)
}

const visibleNumbers = computed(() => {
  const result = []

  let isZero, isMax, isInRange
  for(let i=0; i<props.max; i++) {
    isZero = i == 0
    isMax = i == (props.max - 1)
    isInRange = i > (props.activeIndex-3) && i < (props.activeIndex+3)
    if(isZero || isMax || isInRange) {
      result.push(i)
    }
  }

  // console.log('visibleNumbers', result, props.activeIndex, props.max)

  return result
})

const showFirstDots = computed(() => {
  return props.max > 6 && props.activeIndex > 4
})

const showLastDots = computed(() => {
  return props.max > 6 && props.activeIndex < (props.max - 3)
})
</script>

<template>
  <div class="pagination">
    <div v-if="showFirstDots" class="dots -first">...</div>
    <div v-if="showLastDots" class="dots -last">...</div>
    <UiPaginationPage
      v-for="index in visibleNumbers"
      :key="index"
      :index="index"
      :activeIndex="activeIndex"
      :theme="theme"
      @select="selectPage"
    />
  </div>
</template>

<style scoped lang="scss">

.pagination {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  justify-content: center;

  .dots {
    display: flex;
    color: rgba(var(--theme-front-rgb), 0.5);

    &.-first {
      order: 2;
    }

    &.-last {
      order: 999;
    }
  }

  :deep(.pagination-page) {
    &:nth-of-type(1) { order: 1; }
    &:nth-of-type(2) { order: 3; }
    &:nth-of-type(3) { order: 4; }
    &:nth-of-type(4) { order: 5; }
    &:nth-of-type(5) { order: 6; }
    &:nth-of-type(6) { order: 7; }
    &:nth-of-type(7) { order: 8; }
    &:nth-of-type(8) { order: 9; }

    &:last-of-type {
      order: 1000;
    }
  }
}

</style>
