<script setup>
const props = defineProps([
  'info',
  'profileService'
])

const emit = defineEmits(['back'])

const badgeCount = computed(() => {
  return props.info.length
})

const title = computed(() => {
  return badgeCount.value + ' badge' + (badgeCount.value == 1 ? '' : 's')
})
</script>

<template>
  <Transition name="fade" appear>
    <div v-if="info" class="badge-list">
      <ProfileSectionBack @select="$emit('back')" />
      <ProfileSectionTitle :title="title" />
      <div class="badges">
        <ProfileBadgeItem
          v-for="(item, index) in info"
          :key="item.id"
          :info="item"
        />
      </div>
    </div>
  </Transition>
</template>

<style scoped lang="scss">

.badge-list {
  .badges {
    margin-top: 10px;
    display: flex;
    gap: 20px;
    flex-wrap: wrap;

    > * {
      flex-grow: 1;
    }
  }

  @include media-query(small) {
    .badges {
      > * {
        flex-basis: 40%;
      }
    }
  }

  @include media-query(medium) {
    .badges {
      > * {
        flex-basis: 30%;
      }
    }
  }

  @include media-query(large) {
    .badges {
      > * {
        flex-basis: 20%;
      }
    }
  }
}

</style>
