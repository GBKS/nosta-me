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
  return props.info.url
})

// For things that can be done on this site, the tip opens the modal for it.
function openModal() {
  window.emitter.emit('show-modal', { id: props.info.modal })
}
</script>

<template>
  <div :class="classObject">
    <div class="index">{{ index+1 }}</div>
    <div class="copy">
      <h5>
        <button
          v-if="info.modal"
          type="button"
          @click="openModal"
        >{{ info.title }}</button>
        <a
          v-else
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

      a,
      button {
        color: var(--theme-front);
        text-decoration: none;

        &:hover {
          text-decoration: underline;
        }
      }

      button {
        appearance: none;
        border-width: 0;
        background-color: transparent;
        padding: 0;
        font: inherit;
        text-align: left;
        cursor: pointer;
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
