<script setup>
import ToolBox from '@/helpers/toolBox'

const props = defineProps([
  'info',
  'handlers'
])

const emit = defineEmits(['back'])

const itemCount = computed(() => {
  return props.info.length
})

const title = computed(() => {
  return itemCount.value + ' classified' + (itemCount.value == 1 ? '' : 's')
})
</script>

<template>
  <Transition name="fade" appear>
    <div v-if="info" class="classifieds-tab">
      <ProfileSectionBack @select="$emit('back')" />
      <ProfileSectionTitle :title="title" />
      <ProfileClassifiedsList
        class="items"
        :info="info" 
        :handlers="handlers"
      />
    </div>
  </Transition>
</template>

<style scoped lang="scss">

.classifieds-tab {
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
