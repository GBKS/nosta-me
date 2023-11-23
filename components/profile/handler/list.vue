<script setup>
const props = defineProps([
  'layout',
  'theme',
  'info'
])

const classObject = computed(() => {
  return [
    'handler-list',
    '-' + props.layout
  ].join(' ')
})
</script>

<template>
  <div v-if="info" :class="classObject">
    <ProfileHandlerItem
      v-for="(item, appId) in info"
      :key="appId"
      :appId="appId"
      :layout="layout"
      :info="item"
      :theme="theme"
    />
  </div>
</template>

<style scoped lang="scss">

.handler-list {
  display: flex;
    
  > * {
    flex-grow: 1;
  }

  &.-icon {
    flex-wrap: wrap;
    gap: 10px;
    
    > * {
      flex-basis: 18%;
    }
  }

  &.-grid {
    flex-wrap: wrap;
    gap: 20px;

    > * {
      flex-basis: 40%;
    }
  }

  &.-full {
      
  }
}

</style>
