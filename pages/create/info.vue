<script setup>
import { useProfileStore } from '@/stores/profile'

definePageMeta({
  layout: "create",
  pageTransition: {
    name: 'slide-right'
  },
  middleware (to, from) {
    if(to.name == 'create-info' && from.name == 'create-picture-enter') {
      to.meta.pageTransition.name = 'slide-left'
      from.meta.pageTransition.name = 'slide-left'
    } else {
      to.meta.pageTransition.name = 'slide-right'
      from.meta.pageTransition.name = 'slide-right'
    }
  }
})

const store = useProfileStore()
</script>

<template>
  <div class="info-page -create-page">
    <div class="content">
      <div class="copy">
        <p class="-step">2 of 10</p>
        <h1>Who are you?</h1>
        <p class="-description">Share a bit about yourself.</p>
      </div>
    </div>
    <div class="options">
      <UiInput
        placeholder="Enter your name..."
        v-model="store.name"
      />
      <UiInput
        placeholder="And 1-2 sentences about yourself..."
        v-model="store.about"
        :multiline="true"
      />
      <UiInput
        placeholder="Do you have a website?"
        v-model="store.website"
      />
    </div>
    <nav>
      <UiButton 
        to="/create/welcome" 
        icon="arrowLeft" 
        size="small"
      ></UiButton>
      <UiButton 
        to="/create/picture-enter" 
        icon="arrowRight" 
        size="small"
      >Next</UiButton>
    </nav>
  </div>
</template>

<style scoped lang="scss">

.info-page {
  .options {
    gap: 25px;

    :deep(textarea) {
      height: 200px;
    }
  }
}

</style>