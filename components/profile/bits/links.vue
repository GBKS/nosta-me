<script setup>

const props = defineProps([
  'info'
])

const items = computed(() => {
  let result = props.info.tags.filter(tag => tag[0] == 'r')

  if(props.max && result.length > props.max) {
    result = result.splice(0, props.max)
  }

  return result
})
</script>

<template>
  <div v-if="links.length > 0" class="links">
    <a
      v-for="(item, index) in items"
      :key="index"
      :href="item[1]"
      target="_blank"
      rel="nofollow noreferrer"
    >{{ item[1] }}</a>
  </div>
</template>

<style scoped lang="scss">

.links {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 5px;

  a {
    font-size: 13px;
    color: var(--theme-front);
    opacity: 0.75;
    text-decoration: none;
    transition: all 150ms $ease;

    &:hover {
      opacity: 1;
      text-decoration: underline;
    }
  }
}

</style>
