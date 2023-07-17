<script setup>
const props = defineProps([
  'info',
  'profileService',
  'direction'
])

const emit = defineEmits(['back'])

const currentPage = ref(0)
const perPage = 20

function selectPage(page) {
  currentPage.value = page
}

const pageCount = computed(() => {
  return Math.ceil(count.value / perPage)
})

const sortedZaps = computed(() => {
  return props.info.sort(function(a, b) {
    if(a.created_at > b.created_at) return -1
    if(a.created_at < b.created_at) return 1
    return 0
  })
})

const count = computed(() => {
  return sortedZaps.value ? sortedZaps.value.length : 0
})

const visibleZaps = computed(() => {
  let result = null

  if(count.value > 0) {
    result = sortedZaps.value.slice(currentPage.value*perPage, (currentPage.value+1)*perPage)
  }

  return result
})

const zapCount = computed(() => {
  return props.info.length
})

const title = computed(() => {
  return zapCount.value + ' zap' + (zapCount.value == 1 ? '' : 's') + ' ' + props.direction
})
</script>

<template>
  <Transition name="fade" appear>
    <div v-if="info" class="zap-list">
      <ProfileSectionBack @select="$emit('back')" />
      <ProfileSectionTitle :title="title" />
      <p>Zaps are bitcoin payments to other Nostr users.</p>
      <div class="list">
        <ProfileZapItem
          v-for="(item, index) in visibleZaps"
          :key="item.id"
          :info="item"
          :direction="props.direction"
        />
      </div>
      <UiPagination
        v-if="pageCount > 1"
        :activeIndex="currentPage"
        :max="pageCount"
        @selectPage="selectPage"
      />
    </div>
  </Transition>
</template>

<style scoped lang="scss">

.zap-list {
  > p {
    color: var(--theme-front);
    opacity: 0.5;
    font-weight: 500;
  }

  .list {
    margin-top: 20px;
    display: flex;
  }

  .pagination {
    margin-top: 20px;
  }

  @include media-query(small) {
    .list {
      flex-direction: column;
      gap: 15px;
    }
  }

  @include media-query(medium-up) {
    .list {
      flex-wrap: wrap;
      gap: 30px;

      .zap-item {
        flex-basis: 35%;
        flex-grow: 1;
      }
    }
  }
}

</style>
