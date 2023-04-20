<script setup>
definePageMeta({
  layout: "create",
  pageTransition: {
    name: 'slide-right'
  },
  middleware (to, from) {
    if(to.name == 'create-relays' && from.name == 'create-review') {
      to.meta.pageTransition.name = 'slide-left'
      from.meta.pageTransition.name = 'slide-left'
    } else {
      to.meta.pageTransition.name = 'slide-right'
      from.meta.pageTransition.name = 'slide-right'
    }
  }
})
</script>

<template>
  <div class="relays-page -create-page">
    <div class="content">
      <div class="copy">
        <p class="-step">10 of 10</p>
        <h1>Let’s connect</h1>
        <p class="-description">Relays are servers that store your profile and posts. We’ll get you started with a good default list that you can adjust over time.</p>
      </div>
    </div>
    <div class="options">
      <CreateRelayList />
    </div>
    <nav>
      <UiButton 
        to="/create/bitcoin" 
        icon="arrowLeft" 
        size="small"
      ></UiButton>
      <UiButton 
        to="/create/review" 
        icon="arrowRight" 
        size="small"
      >Next</UiButton>
    </nav>
  </div>
</template>

<style scoped lang="scss">

.relays-page {
  .options {
    align-items: stretch !important;
  }
}

</style>