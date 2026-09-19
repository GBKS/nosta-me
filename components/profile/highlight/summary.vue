<script setup>
import highlightHelper from '@/helpers/highlightHelper.js'

// info is a list of highlight events (kind 9802)
const props = defineProps([
  'info',
  'handlers'
])

const latestHighlights = computed(() => {
  return highlightHelper.latest(props.info, 2)
})
</script>

<template>
  <div v-if="latestHighlights.length > 0" class="highlight-summary">
    <ProfileSectionTitle title="Latest highlights" />
    <div class="items">
      <ProfileHighlightItem
        v-for="item in latestHighlights"
        :key="item.id"
        :info="item"
        :handlers="handlers"
      />
    </div>
  </div>
</template>

<style scoped lang="scss">

.highlight-summary {
  display: flex;
  flex-direction: column;
  gap: 20px;

  .items {
    display: flex;
    gap: 15px;

    > * {
      flex-basis: 40%;
      flex-grow: 1;
    }
  }

  @include media-query(small) {
    .items {
      flex-direction: column;
    }
  }
}

</style>
