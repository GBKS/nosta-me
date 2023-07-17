<script setup>
const props = defineProps([
  'info'
])

const emit = defineEmits(['navigate', 'back'])

const title = computed(() => {
  const count = props.info.length
  return count + ' file'  + (count == 1 ? '' : 's')
})

function navigate(info) {
  emit('navigate', 'file', info)
}
</script>

<template>
  <div v-if="info" class="files-list">
    <ProfileSectionBack @select="emit('back')" />
    <ProfileSectionTitle :title="title" />
    <div class="items">
      <ProfileFileItem
        v-for="(item, index) in info"
        :key="item.id"
        :info="item"
      />
    </div>
  </div>
</template>

<style scoped lang="scss">

.files-list {
  .items {
    margin-top: 25px;
    display: flex;
    flex-wrap: wrap;
    @include r('gap', 10, 25);

    > * {
      flex-grow: 1;
    }
  }

  @include media-query(small) {
    .items {
      > * {
        flex-basis: 35%;
      }
    }
  }

  @include media-query(medium) {
    .items {
      > * {
        flex-basis: 25%;
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
