<script setup>

const props = defineProps([
  'info',
  'max',
  'align'
])

const items = computed(() => {
  let result = props.info.tags.filter(tag => tag[0] == 't')

  if(props.max && result.length > props.max) {
    result = result.splice(0, props.max)
  }

  return result
})

const classObject = computed(() => {
  return [
    'tags',
    '-' + (props.align ? props.align : 'center')
  ].join(' ')
})
</script>

<template>
  <div 
    v-if="items.length > 0" 
    :class="classObject"
  >
    <p
      v-for="(item, index) in items"
      :key="index"
    >{{ item[1] }}</p>
  </div>
</template>

<style scoped lang="scss">

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;

  p {
    padding: 3px 7px;
    border-radius: 5px;
    font-size: 13px;
    font-weight: 600;
    color: var(--theme-front);
    background-color: rgba(var(--theme-back-rgb), 0.2);
    opacity: 0.75;
  }

  &.-center {
    justify-content: center;
  }

  &.-left {

  }
}

</style>
