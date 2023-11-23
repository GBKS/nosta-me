<script setup>
import Icons from '@/helpers/icons'

const props = defineProps([
  'info',
  'products',
  'count',
  'baseUrl'
])

const emit = defineEmits(['navigate'])

const visibleStalls =  computed(() => {
  return props.count > 0 ? props.info.slice(0, 3) : null
})

const titleCopy = computed(() => {
  let result = 'No stores yet'

  if(props.count > 0) {
    result = props.count + ' store' + (props.count == 1 ? '' : 's')
  }

  return result
})

function navigate(info) {
  emit('navigate', 'stalls')
}

function navigateToStall(info) {
  emit('navigate', 'stall', info)
}
</script>

<template>
  <div v-if="count > 0" class="stall-summary">
    <ProfileSectionTitle
      :title="titleCopy"
      :clickable="true"
      @select="navigate"
    />
    <div class="stalls">
      <ProfileStallItem
        v-for="(item, index) in visibleStalls"
        :key="item.id"
        :info="item"
        :products="products"
        layout="box"
        @select="navigateToStall"
      />
    </div>
  </div>
</template>

<style scoped lang="scss">

.stall-summary {
  .stalls {
    margin-top: 10px;
    display: flex;
    @include r('gap', 10, 25);
  }

  @include media-query(small) {
    .stalls {
      flex-direction: column;
    }
  }
}

</style>
