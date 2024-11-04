<script setup>
import { ref, onMounted } from 'vue'
import profileInitializer from '@/helpers/create/profileInitializer.js'

definePageMeta({
  layout: "create",
  pageTransition: {
    name: 'slide-right'
  },
  middleware (to, from) {
    if(to.name == 'create-welcome' && from.name == 'create-info') {
      to.meta.pageTransition.name = 'slide-left'

      if(from.meta.pageTransition) {
        from.meta.pageTransition.name = 'slide-left'
      }
    } else {
      if(to.meta.pageTransition) {
        to.meta.pageTransition.name = 'slide-right'
      }

      if(from.meta.pageTransition) {
        from.meta.pageTransition.name = 'slide-right'
      }
    }
  }
})

const image = ref()
const retinaImage = ref()

async function updateImages() {
  image.value = await useAssets('/assets/images/baby-nostrich.jpg')
  retinaImage.value = await useAssets('/assets/images/baby-nostrich@2x.jpg')
}

const imageSource = computed(() => {
  return image.value
})

const imageSourceSet = computed(() => {
  return image.value + ' 1x, ' + retinaImage.value + ' 2x'
})

onMounted(() => {
  updateImages()

  profileInitializer.init()
})

// Only navigate back home after confirming cancel
onBeforeRouteLeave((to, from) => {
  if(to.name == 'index' && from.name == 'create-welcome') {
    if(confirm('Sure you want to cancel setting your profile?')) {
      return true
    } else {
      return false
    }
  } else {
    return true
  }
})
</script>

<template>
  <div class="welcome-page -create-page">
    <div class="content">
      <div class="copy">
        <p class="-step">1 of 10</p>
        <h1>Welcome</h1>
        <p class="-description">So great that you decided to join Nostr.<br/><br/>We’ll now take you through a few steps to set up your profile the way you want.</p>
      </div>
    </div>
    <div class="options">
      <img
        :src="imageSource"
        :srcset="imageSourceSet"
        width="600"
        height="600"
        alt="A purple baby Nostrich."
      />
    </div>
    <nav>
      <UiButton to="/" icon="arrowLeft" size="small"></UiButton>
      <UiButton to="/create/info" icon="arrowRight" size="small">Next</UiButton>
    </nav>
  </div>
</template>

<style scoped lang="scss">

.welcome-page {
  .options {
    overflow: hidden;

    img {
      object-fit: cover;
      width: 100%;
      height: 100%;
    }
  }
}

</style>