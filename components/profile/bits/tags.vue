<script setup>

const props = defineProps([
  'info',
  'max', // Hide after a certain amount and show a '+x' button to view all
  'align'
])

const expanded = ref(false)

const allItems = computed(() => {
  return props.info.tags.filter(tag => tag[0] == 't')
})

const visibleItems = computed(() => {
  let result = allItems.value

  if(!expanded.value && props.max && result.length > props.max) {
    result = result.slice(0, result.length - hiddenCount.value)
  }

  return result
})

const hiddenCount = computed(() => {
  let result = 0

  if(props.max) {
    result = Math.max(0, allItems.value.length - props.max)
  }

  if(result == 1) {
    result = 0
  }

  return result
})

const classObject = computed(() => {
  return [
    'tags',
    '-' + (props.align ? props.align : 'center')
  ].join(' ')
})

function expand(event) {
  expanded.value = true
}
</script>

<template>
  <div 
    v-if="visibleItems.length > 0" 
    :class="classObject"
  >
    <p
      v-for="(item, index) in visibleItems"
      :key="index"
    >{{ item[1] }}</p>
    <button
      v-if="!expanded && hiddenCount > 0"
      title="View all"
      @click="expand"
    >+{{ hiddenCount }}</button>
  </div>
</template>

<style scoped lang="scss">

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;

  p,
  button {
    padding: 3px 7px;
    border-radius: 5px;
    font-size: 13px;
    font-weight: 600;
    color: var(--theme-front);
    background-color: rgba(var(--theme-back-rgb), 0.2);
    opacity: 0.75;
  }

  button {
    appearance: none;
    border-width: 0;
    cursor: pointer;
  }

  &.-center {
    justify-content: center;
  }

  &.-left {

  }
}

</style>
