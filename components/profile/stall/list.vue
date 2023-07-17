<script setup>
import ToolBox from '@/helpers/toolBox'

const props = defineProps([
  'info',
  'products'
])

const emit = defineEmits(['navigate', 'back'])
const currentPage = ref(0)
const perPage = 10

function selectPage(page) {
  currentPage.value = page
}

const pageCount = computed(() => {
  return Math.ceil(count.value / perPage)
})

const stallProducts = computed(() => {
  let result = null

  if(props.products) {
    for(let i=0; i<props.products.length; i++) {
      if(props.products[i].content.stall_id == props.info.content.id) {
        if(!result) result = []
        result.push(props.products[i])
      }
    }
  }

  return result
})

const visibleProducts = computed(() => {
  let result = null

  if(count.value > 0) {
    result = stallProducts.value.slice(currentPage.value*perPage, (currentPage.value+1)*perPage)
  }

  return result
})

const count = computed(() => {
  return stallProducts.value ? stallProducts.value.length : 0
})

function back() {
  emit('navigate')
}
</script>

<template>
  <div v-if="info" class="stall-list">
    <ProfileSectionBack @select="back" />
    <ProfileStallItem
      :info="info"
      :products="products"
    />
    <div class="items">
      <ProfileProductItem
        v-for="item in visibleProducts"
        :key="item.id"
        :info="item"
      />
    </div>
    <UiPagination
      v-if="pageCount > 1"
      :activeIndex="currentPage"
      :max="pageCount"
      @selectPage="selectPage"
    />
  </div>
</template>

<style scoped lang="scss">

.stall-list {
  .items {
    margin-top: 10px;
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 20px;
  }
}

</style>
