<script setup>
import { computed } from 'vue'
import Icons from '@/helpers/icons'

const props = defineProps([
  'name',
  'value',
  'type'
])

const classObject = computed(() => {
  const c = ['review-item', '-'+props.type]

  if(isEmpty.value) {
    c.push('-empty')
  }

  return c.join(' ')  
})

const isEmpty = computed(() => {
  return !(props.value && props.value.length > 0)
})

const isImage = computed(() => {
  return props.type == 'picture' || props.type == 'banner'
})

const formattedValue = computed(() => {
  let result = props.value
  let plural, count, i

  if(isEmpty.value) {
    result = 'None given'
  } else if(props.type == 'relays') {
    result = formatAddedCount(props.value, 'relay', 'relays')
  } else if(props.type == 'follows') {
    result = formatAddedCount(props.value, 'profile', 'profiles')   
  }

  return result
})

function formatAddedCount(list, singular, plural) {
  let count = 0
  for(let i=0; i<list.length; i++) {
    if(list[i].added) count++
  }

  const noun = count == 1 ? singular : plural
  return count + ` ${noun} selected`
}
</script>

<template>
  <div :class="classObject">
    <p>{{ name }}</p>
    <p>{{ formattedValue }}</p>
    <img
      v-if="isImage && !isEmpty"
      :src="value"
    />
  </div>
</template>

<style scoped lang="scss">

.review-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 5px 0;
  border-bottom: 1px solid rgba(var(--front-rgb), 0.2);

  p {
    font-size: 17px;

    &:nth-child(2n+1) {
      font-weight: 500;
      color: black;
      flex-basis: 150px;
      flex-shrink: 0;
    }

    &:nth-child(2n) {
      flex-grow: 1;
      text-overflow: ellipsis;
    }
  }

  &.-picture {
    img {
      width: 40px;
      height: 40px;
      border-radius: 20px;
    }
  }

  &.-empty {
    p:nth-child(2n) {
      opacity: 0.5;
    }
  }

  &:last-child {
    border-bottom-width: 0px;
  }
}

</style>
