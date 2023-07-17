<script setup>
import Icons from '@/helpers/icons'

const props = defineProps([
  'info',
  'count',
  'baseUrl'
])

const emit = defineEmits(['navigate'])

const visibleBadges =  computed(() => {
  return props.count > 0 ? props.info.slice(0, 5) : null
})

const detailUrl = computed(() => {
  return props.baseUrl + '/badges'
})

const titleCopy = computed(() => {
  let result = 'No badges yet'

  if(props.count > 0) {
    result = 'Received ' + props.count + ' badge' + (props.count == 1 ? '' : 's')
  }

  return result
})

function navigate() {
  emit('navigate', 'badges')
}
</script>

<template>
  <Transition name="fade" appear>
    <div v-if="count > 0" class="badge-summary">
      <ProfileSectionTitle
        :title="titleCopy"
        :clickable="true"
        @select="navigate"
      />
      <div class="badges">
        <ProfileBadgeItem
          v-for="(item, index) in visibleBadges"
          :key="item.id"
          :info="item"
        />
      </div>
    </div>
  </Transition>
</template>

<style scoped lang="scss">

.badge-summary {
  .badges {
    margin-top: 25px;
    display: flex;
    @include r('gap', 10, 25);
  }
}

</style>
