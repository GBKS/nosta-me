<script setup>
const props = defineProps([
  'info',
  'profileService'
])

const zapCount = computed(() => {
  return props.info.length
})
</script>

<template>
  <Transition name="fade" appear>
    <div v-if="info" class="zap-list">
      <h2 v-if="false">Zaps <span v-if="zapCount > 0">({{ zapCount }})</span></h2>
      <p>Zaps are bitcoin payments to other Nostr users.</p>
      <div class="list">
        <ProfileZapItem
          v-for="(item, index) in info"
          :key="item.id"
          :info="item"
        />
      </div>
    </div>
  </Transition>
</template>

<style scoped lang="scss">

.zap-list {
  display: flex;
  flex-direction: column;
  flex-basis: 20%;
  flex-grow: 1;

  h2 {
    margin-bottom: 10px;
    font-size: 24px;
    font-weight: 600;
    color: var(--theme-front);
  }

  > p {
    text-align: center;
    color: var(--theme-front);
    opacity: 0.5;
    font-weight: 500;
  }

  .list {
    margin-top: 20px;
    display: flex;
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
      gap: 20px;

      .zap-item {
        flex-basis: 35%;
        flex-grow: 1;
      }
    }
  }
}

</style>
