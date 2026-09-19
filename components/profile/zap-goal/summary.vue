<script setup>
import zapGoalHelper from '@/helpers/zapGoalHelper.js'

// info is a list of zap goal events (kind 9041)
const props = defineProps([
  'info',
  'lightningAddress',
  'handlers'
])

// Open goals only. A goal that has closed is history, and most never close.
const goals = computed(() => {
  return zapGoalHelper.openGoals(props.info, Math.floor(Date.now() / 1000), 2)
})

const titleCopy = computed(() => {
  return goals.value.length == 1 ? 'Raising funds' : 'Raising funds for ' + goals.value.length + ' goals'
})
</script>

<template>
  <div v-if="goals.length > 0" class="zap-goal-summary">
    <ProfileSectionTitle :title="titleCopy" />
    <div class="items">
      <ProfileZapGoalItem
        v-for="item in goals"
        :key="item.id"
        :info="item"
        :lightningAddress="lightningAddress"
        :handlers="handlers"
      />
    </div>
  </div>
</template>

<style scoped lang="scss">

.zap-goal-summary {
  .items {
    margin-top: 15px;
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
