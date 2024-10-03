<script setup>

import options from '@/data/directory.json'

</script>

<template>
  <div class="directory-page">
    <h1>Nostr apps</h1>
    <p>Tear up the Nostr metaverse with these badass works of software&nbsp;artistry.</p>

    <div class="apps">
      <ProfileShareAppOption
        v-for="(item, index) in options.apps"
        :key="index"
        :name="item.name"
        :description="item.description"
        :platform="item.platform"
        :url="item.url"
        :image="item.image"
        size="big"
      />
    </div>
  </div>
</template>

<style scoped lang="scss">

.directory-page {
  max-width: 800px;
  margin-left: auto;
  margin-right: auto;
  padding: 50px 20px;

  h1 {
    font-family: 'PoetsenOne';
    color: var(--theme-front);
    @include r('font-size', 64, 120);
    text-align: center;
  }

  p {
    color: rgba(var(--theme-front-rgb), 0.5);
    font-weight: 600;
    @include r('font-size', 18, 24);
    text-align: center;

    & + p {
      margin-top: 20px;
    }
  }

  .apps {
    margin-top: 30px;
    background-color: white;
    border-radius: 15px;
    display: flex;
    justify-content: center;
    @include r('gap', 10, 40);
    @include r('padding', 15, 40);
    flex-wrap: wrap;
    box-sizing: border-box;
    box-shadow: 0 15px 30px -8px rgba(black, 0.25);
    
    :deep(.share-app-option) {
      flex-grow: 1;
    }
  }
}

</style>
