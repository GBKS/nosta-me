<script setup>
const props = defineProps([
  'info',
  'profileService',
  'direction'
])

const emit = defineEmits(['back'])

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
          v-for="(item, index) in info"
          :key="item.id"
          :info="item"
          :direction="props.direction"
        />
      </div>
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
