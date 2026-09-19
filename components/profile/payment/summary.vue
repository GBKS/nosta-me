<script setup>
// info is a list of payment targets as returned by paymentTargetHelper.targets()
const props = defineProps([
  'info'
])

const count = computed(() => {
  return props.info ? props.info.length : 0
})

const titleCopy = computed(() => {
  return 'Shares ' + count.value + ' payment address' + (count.value == 1 ? '' : 'es')
})
</script>

<template>
  <div v-if="count > 0" class="payment-summary">
    <ProfileSectionTitle :title="titleCopy" />
    <p>Click to copy an address.</p>
    <div class="items">
      <ProfilePaymentItem
        v-for="item in info"
        :key="item.type + item.address"
        :info="item"
      />
    </div>
  </div>
</template>

<style scoped lang="scss">

.payment-summary {
  > p {
    margin-top: 2px;
    font-size: 17px;
    font-weight: 500;
    color: rgba(var(--theme-front-rgb), 0.75);
  }

  .items {
    margin-top: 15px;
    display: flex;
    flex-wrap: wrap;
    @include r('gap', 10, 15);

    > * {
      flex-basis: 26%;
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
