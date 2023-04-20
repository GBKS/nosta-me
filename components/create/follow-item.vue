<script setup>
const props = defineProps([
  'info'
])

const emit = defineEmits(['toggle'])

function toggleFollow() {
  emit('toggle', props.info.id)
}

const buttonLabel = computed(() => {
  return props.info.added ? 'Following' : 'Follow'
})

const link = computed(() => {
  return '/'+props.info.npub
})

const look = computed(() => {
  return props.info.added ? null : 'outline'
})
</script>

<template>
  <div class="create-follow-item">
    <NuxtLink
      :to="link"
      target="_blank"
    >
      <img
        :src="info.picture"
        :alt="info.name"
      >
      <p>{{ info.name }}</p>
    </NuxtLink>
    <UiButton
      size="tiny"
      :look="look"
      @click="toggleFollow"
    >{{ buttonLabel }}</UiButton>
  </div>
</template>

<style scoped lang="scss">

.create-follow-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 0;
  border-bottom: 1px solid rgba(var(--frontRGB), 0.2);

  a {
    display: flex;
    align-items: center;
    flex-grow: 1;
    gap: 10px;
    text-decoration: none;

    img {
      width: 40px;
      height: 40px;
      border-radius: 20px;
    }

    p {
      @include r('font-size', 17, 22);
      flex-grow: 1;
    }

    &:hover {
      p {
        color: black;
      }
    }
  }

  :deep(button) {
    min-width: 110px;
  }

  &:last-child {
    border-bottom-width: 0px;
  }
}

</style>
