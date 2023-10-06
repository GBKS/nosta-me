<script setup>
import ToolBox from '@/helpers/toolBox'
import Icons from '@/helpers/icons'

const imageLoadError = ref(false)

const props = defineProps([
  'info'
])

const emit = defineEmits(['toggle'])

function toggleFollow() {
  emit('toggle', props.info.npub)
}

function onImageLoadError() {
  imageLoadError.value = true
}

const buttonLabel = computed(() => {
  return props.info.added ? 'Following' : 'Follow'
})

const link = computed(() => {
  return '/'+props.info.npub
})

const formattedAbout = computed(() => {
  return ToolBox.trim(props.info.about, 50, 'end')
})
</script>

<template>
  <div class="create-follow-item">
    <button
      title="Tap to follow"
      @click="toggleFollow"
    >
      <img
        v-if="info.picture && !imageLoadError"
        :src="info.picture"
        :alt="info.name"
        @error="onImageLoadError"
      >
      <div
        v-if="!info.picture || imageLoadError"
        class="pic"
      />
      <div class="copy">
        <h5>{{ info.name }}</h5>
        <p v-if="info.about">{{ formattedAbout }}</p>
      </div>
      <UiCheck
        :interactive="false"
        :active="info.added"
        title="Click to follow"
      />
    </button>
    <NuxtLink
      :to="link"
      target="_blank"
      v-html="Icons.link"
    >
    </NuxtLink>
  </div>
</template>

<style scoped lang="scss">

.create-follow-item {
  position: relative;
  // border-bottom: 1px solid rgba(var(--front-rgb), 0.2);

  button {
    width: 100%;
    display: flex;
    align-items: center;
    flex-grow: 1;
    gap: 10px;
    text-decoration: none;
    appearance: none;
    background-color: transparent;
    border-width: 0;
    text-align: left;
    cursor: pointer;
    padding: 10px;
    border-radius: 10px;
    transition: all 150ms $ease;

    &:hover {
      background-color: rgba(var(--front-rgb), 0.05);
    }

    img,
    .pic {
      width: 40px;
      height: 40px;
      border-radius: 20px;
      background-color: rgba(var(--front-rgb), 0.1);
    }

    .copy {
      flex-grow: 1;
      padding-right: 30px;

      h5 {
        @include r('font-size', 15, 17);
        font-weight: 500;
      }

      p {
        @include r('font-size', 13, 15);
      }
    }

    .check {
      flex-basis: 24px;
      flex-grow: 0;
      flex-shrink: 0;
    }

    &:hover {
      p {
        color: black;
      }
    }
  }

  > a {
    position: absolute;
    right: 40px;
    top: 50%;
    transform: translateY(-50%);
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border: 1px solid var(--front);
    color: var(--front);
    opacity: 0.25;
    border-radius: 143px;
    transition: all 150ms $ease;
    line-height: 0;
    box-sizing: border-box;

    :deep(svg) {
      stroke-width: 1.5px;
      width: 14px;
      height: 14px;
    }
    
    &:hover {
      opacity: 1;
    }
  }

  :deep(button) {
    // min-width: 110px;
  }

  &:last-child {
    border-bottom-width: 0px;
  }
}

</style>
