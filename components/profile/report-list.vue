<script setup>
const props = defineProps([
  'info',
  'profileService'
])

const reportCount = computed(() => {
  return props.info.length
})
</script>

<template>
  <Transition name="fade" appear>
    <div v-if="info" class="report-list">
      <h2 v-if="false">Reports <span v-if="reportCount > 0">({{ reportCount }})</span></h2>
      <p>Report are not checked by anyone, so make sure to see if these are valid.</p>
      <div class="list">
        <ProfileReportItem
          v-for="(item, index) in info"
          :key="item.id"
          :info="item"
        />
      </div>
    </div>
  </Transition>
</template>

<style scoped lang="scss">

.report-list {
  display: flex;
  flex-direction: column;

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
  }
}

</style>
