<script setup>
useHead({
  title: 'gm · Nosta',
  meta: [
    { name: 'description', content: 'Everyone on Nostr who said gm in the last day, as a sky full of suns.' }
  ]
})
</script>

<template>
  <div class="gm-page">
    <ClientOnly>
      <GmSky />
      <template #fallback>
        <div class="gm-loading">gm</div>
      </template>
    </ClientOnly>
  </div>
</template>

<style scoped lang="scss">

.gm-loading {
  position: fixed;
  inset: 0;
  display: grid;
  place-items: center;
  background-color: #070a1f;
  color: rgba(255, 255, 255, 0.5);
  font-family: 'PoetsenOne';
  font-size: 48px;
}

</style>
