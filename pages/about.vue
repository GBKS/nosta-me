<template>
  <div class="about-page">
    <h1>Yo</h1>
    <p><NuxtLink to="https://nostr.com/" target="_blank" rel="nofollow noopener noreferrer">Nostr</NuxtLink> is an open communication thingy that is really easy to build apps on. But it's still a bit hard to get started and set up your profile. That's what this website here is for. Click a few buttons, tap some keys, and you're good to go.</p>

    <p>Lots of cool stuff will be built on Nostr, but maybe not every service needs to build their own profile setup feature. Nosta could also be a place to outsource that. But we'll see. So far it's just an experiment.</p>

    <p>This site is a total playground and work-in-progress. It probably doesn't properly work right now. You can find the code for this website on <NuxtLink to="https://github.com/GBKS/nosta-me" target="_blank" rel="nofollow noopener noreferrer">GitHub</NuxtLink>, and you're invited to leave feedback and contribute.</p>
  </div>
</template>

<style scoped lang="scss">

.about-page {
  max-width: 800px;
  margin-left: auto;
  margin-right: auto;
  padding: 50px 20px;

  h1 {
    font-family: 'Moonrocks';
    color: var(--theme-front);
    @include r('font-size', 64, 120);
    text-align: center;
  }

  p {
    color: rgba(var(--theme-front-rgb), 0.95);
    font-weight: 500;
    @include r('font-size', 18, 24);
    text-align: center;
    text-wrap: balance;

    & + p {
      margin-top: 20px;
    }

    a {
      color: rgba(var(--theme-front-rgb), 0.85);
    }
  }
}

</style>
