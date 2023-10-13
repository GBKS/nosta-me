<script setup>

const props = defineProps([
  'index',
  'info'
])

const classObject = computed(() => {
  const c = ['tips-item']

  return c.join(' ')
})

const link = computed(() => {
  return 'https://nostrapp.link/kind/' + props.info.kind
})
</script>

<template>
  <div :class="classObject">
    <div class="index">{{ index+1 }}</div>
    <div class="copy">
      <h5>
        <a
          :href="link"
          target="_blank"
          rel="nofollow noopener noreferrer"
        >{{ info.title }}</a>
      </h5>
      <p>{{ info.description }}</p>
    </div>
  </div>
</template>

<style scoped lang="scss">

.tips-item {
  display: flex;
  gap: 15px;

  .index {
    background-color: rgba(var(--theme-front-rgb), 0.15);
    border-radius: 100px;
    width: 20px;
    height: 20px;
    line-height: 20px;
    text-align: center;
    color: var(--theme-front);
    font-size: 15px;
    font-weight: 600;
  }

  .copy {
    h5 {
      font-size: 17px;
      font-weight: 600;

      a {
        color: var(--theme-front);
        text-decoration: none;

        &:hover {
          text-decoration: underline;
        }
      }
    }

    > p {
      margin-top: 3px;
      font-size: 15px;
      color: var(--theme-front);
      opacity: 0.75;
    }
  }
}

</style>
