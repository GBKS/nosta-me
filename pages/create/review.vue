<script setup>
import { useProfileStore } from '@/stores/profile'

definePageMeta({
  layout: "create",
  pageTransition: {
    name: 'slide-right'
  },
  middleware (to, from) {
    if(to.name == 'create-review' && from.name == 'create-save') {
      to.meta.pageTransition.name = 'slide-left'
      from.meta.pageTransition.name = 'slide-left'
    } else {
      to.meta.pageTransition.name = 'slide-right'
      from.meta.pageTransition.name = 'slide-right'
    }
  }
});

const store = useProfileStore()
</script>

<template>
  <div class="review-page -create-page">
    <div class="content">
      <div class="copy">
        <p class="-step">Almost done!</p>
        <h1>Let's review</h1>
        <p class="-description">Before we save your profile, take a quick look and make sure everything is the way you want it.</p>
      </div>
    </div>
    <div class="options">
      <CreateReviewItem
        name="Name"
        type="name"
        :value="store.name" />
      <CreateReviewItem 
        name="About" 
        type="about" 
        :value="store.about" />
      <CreateReviewItem 
        name="Website" 
        type="website" 
        :value="store.website" />
      <CreateReviewItem 
        name="Picture" 
        type="picture" 
        :value="store.picture" />
      <CreateReviewItem 
        name="Handle" 
        type="handle" 
        :value="store.handle" />
      <CreateReviewItem 
        name="Bitcoin" 
        type="bitcoin" 
        :value="store.bitcoin" />
      <CreateReviewItem 
        name="Follow" 
        type="follows" 
        :value="store.follows" />
      <CreateReviewItem 
        name="Relays" 
        type="relays" 
        :value="store.relays" />
      <CreateReviewItem 
        v-if="false" 
        name="Theme" 
        type="theme" 
        :value="store.theme" />
    </div>
    <nav>
      <UiButton
        to="/create/relays" 
        icon="arrowLeft" 
        size="small"
      ></UiButton>
      <UiButton 
        to="/create/save" 
        size="small"
      >Looks good</UiButton>
    </nav>
  </div>
</template>

<style scoped lang="scss">

.review-page {
  .options {
    // justify-content: flex-start !important;
    // overflow-y: scroll;
    align-items: stretch !important;
  }
}

</style>