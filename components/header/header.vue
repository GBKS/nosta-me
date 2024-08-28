<script setup>

</script>

<template>
  <header>
    <NuxtLink to="/">Nosta</NuxtLink>
    <div class="options">
      <HeaderTheme />
      <HeaderRelays />
      <HeaderSearch />
      <client-only>
        <HeaderAccount />
      </client-only>
    </div>
  </header>
</template>

<style scoped lang="scss">

header {
  position: relative;
  z-index: 143;

  > a {
    display: block;
    font-family: 'Moonrocks';
    font-size: 36px;
    line-height: 1;
    text-decoration: none;
    color: white;
    transition: all 150ms $ease;

    &:hover {
      opacity: 0.75;
      color: var(--theme-active);
    }
  }

  .options {
    display: flex;
    gap: 15px;
  }

  @include media-query(medium-down) {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 15px;
  }

  @include media-query(large) {
    > a {
      position: fixed;
      top: 15px;
      left: 15px;
    }

    .options {
      position: absolute;
      right: 15px;
      top: 15px;
    }
  }
}

.-brightness-light {
  header {
    > a {
      color: black;
    }
  }
}

</style>
