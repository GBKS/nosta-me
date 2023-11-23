<script setup>
const props = defineProps([
  'info',
  'profileService'
])

const emit = defineEmits(['back'])

const reportCount = computed(() => {
  return props.info.length
})

const title = computed(() => {
  return reportCount.value + ' report' + (reportCount.value == 1 ? '' : 's')
})
</script>

<template>
  <div v-if="info" class="report-list">
    <ProfileSectionBack @select="$emit('back')" />
    <ProfileSectionTitle :title="title" />
    <p v-if="false">Report are not checked by anyone, so make sure to see if these are valid.</p>
    <div class="list">
      <ProfileReportItem
        v-for="(item, index) in info"
        :key="item.id"
        :info="item"
      />
    </div>
  </div>
</template>

<style scoped lang="scss">

.report-list {
  display: flex;
  flex-direction: column;
  align-items: flex-start;

  > p {
    text-align: center;
    color: var(--theme-front);
    opacity: 0.5;
    font-weight: 500;
  }

  .list {
    margin-top: 10px;
  }
}

</style>
