<script setup>
import ToolBox from '@/helpers/toolBox'

const props = defineProps([
  'info',
  'products',
  'layout'
])

const emit = defineEmits(['select'])

const title = computed(() => {
  let result = props.info.content.name ? props.info.content.name : null

  if(props.layout == 'box' && result.length > 50) {
    result = result.substr(0, 48) + '...'
  }

  return result
})

const description = computed(() => {
  let result = props.info.content.description ? props.info.content.description : null

  if(props.layout == 'box' && result.length > 50) {
    result = result.substr(0, 48) + '...'
  }

  return result
})

const productCountText = computed(() => {
  return productCount.value + ' product' + (productCount.value == 1 ? '' : 's')
})

const productCount = computed(() => {
  let result = 0

  for(let i=0; i<props.products.length; i++) {
    if(props.products[i].content.stall_id == props.info.content.id) {
      result ++
    }
  }

  return result
})

const classObject = computed(() => {
  const c = ['stall-item']

  if(productCount.value === 0) {
    c.push('-empty')
  }

  c.push(props.layout ? ('-'+props.layout) : '-list')

  return c.join(' ')
})

const type = computed(() => {
  return props.layout == 'box' ? 'button' : 'div'
})

function click() {
  emit('select', props.info)
}
</script>

<template>
  <component
    :is="type"
    :class="classObject"
    @click="click"
  >
    <div class="copy">
      <h5>{{ title }}</h5>
      <p class="-info" v-if="description && description != title">{{ description }}</p>
      <p class="-meta">{{ productCountText }}</p>
    </div>
  </component>
</template>

<style scoped lang="scss">

.stall-item {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 10px 0;
  appearance: none;
  background-color: transparent;
  border-width: 0;
  text-align: left;

  .copy {
    h5 {
      font-size: 17px;
      font-weight: 600;
      color: var(--theme-front);
      word-break: break-word;
    }

    p {
      font-size: 15px;
      color: white;

      &:first-of-type {
        opacity: 0.75;
      }
    }
  }

  &.-empty {

  }

  &.-list {
    &:not(.-empty) + .lists-item.-empty {
      margin-top: 10px;
    }

    &.-empty {
      padding: 5px 0;

      .icon {
        flex-basis: 25px;
        width: 25px;
        height: 25px;

        img {
          width: 25px;
          height: 25px;
        }
      }

      .copy {
        display: flex;
        align-items: center;
        gap: 10px;

        h5 {
          font-size: 17px;
          font-weight: 400;
        }
      }
    }
  }

  &.-box {
    cursor: pointer;
    flex-direction: column;
    align-items: flex-start;
    padding: 15px;
    border-radius: 15px;
    background-color: rgba(var(--theme-back-rgb), 0.2);
    border: 1px solid rgba(var(--theme-front-rgb), 0.2);
    transition: all 250ms $ease;

    .copy {
      flex-direction: column;
      align-items: flex-start;
    }

    &:hover {
      background-color: rgba(var(--theme-back-rgb), 0.3);
      border: 1px solid rgba(var(--theme-front-rgb), 0.3);
    }
  }
}

</style>
