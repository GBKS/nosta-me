<script setup>
import Icons from '@/helpers/icons'

const props = defineProps([
  'info',
  'count',
  'baseUrl'
])

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

const emit = defineEmits(['navigate'])

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
  // padding: 10px;
  // border-radius: 15px;
  // transition: all 150ms $ease;

  .badges {
    margin-top: 25px;
    display: flex;
    @include r('gap', 10, 25);
  }

  // &:hover {
  //   background-color: rgba(var(--theme-active-rgb), 0.1);
  // }
}

</style>
