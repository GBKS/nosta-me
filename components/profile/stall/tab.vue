<script setup>
import ToolBox from '@/helpers/toolBox'

const props = defineProps([
  'info',
  'products'
])

const emit = defineEmits(['back'])

const itemCount = computed(() => {
  return props.info.length
})

const title = computed(() => {
  return itemCount.value + ' store' + (itemCount.value == 1 ? '' : 's')
})

function navigate(info) {
  emit('navigate', 'stall', info)
}
</script>

<template>
  <Transition name="fade" appear>
    <div v-if="info" class="stalls-tab">
      <ProfileSectionBack @select="$emit('back')" />
      <ProfileSectionTitle :title="title" />
      <div class="items">
        <ProfileStallItem
          v-for="(item, index) in info"
          :key="item.id"
          :info="item"
          :products="products"
          layout="box"
          @select="navigate"
        />
      </div>
    </div>
  </Transition>
</template>

<style scoped lang="scss">

.stalls-tab {
  .items {
    margin-top: 25px;
    display: flex;
    gap: 20px;
    flex-wrap: wrap;

    > * {
      flex-grow: 1;
    }
  }

  @include media-query(small) {
    .items {
      > * {
        flex-basis: 40%;
      }
    }
  }

  @include media-query(medium) {
    .items {
      > * {
        flex-basis: 30%;
      }
    }
  }

  @include media-query(large) {
    .items {
      > * {
        flex-basis: 20%;
      }
    }
  }
}

</style>
