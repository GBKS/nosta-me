<script setup>
import relayManager from '@/helpers/relayManager.js'

const users = ref(null)

onMounted(() => {
  const damusId = relayManager.addRelayByUrl('wss://relay.damus.io')
  
  users.value = [
    {
      publicKey: '8c29b321d0f3c61343882ea49623e84771690cd0566e40b90f08e5d34336aaa0', // Bitcoin design
      relayIds: [damusId],
      theme: 'space'
    },
    {
      publicKey: '4f260791d78a93d13e09f1965f4ba1e1f96d1fcb812123a26d95737c9d54802b', // Bolt fun
      relayIds: [damusId],
      theme: 'bubbles'
    },
    {
      publicKey: 'b731e7fbde5c192d793ff520a6ec91f6965f5d8fa1b64e12171089a65e540525', // GBKS
      relayIds: [damusId],
      theme: 'winter'
    },
    {
      publicKey: '1bc70a0148b3f316da33fe3c89f23e3e71ac4ff998027ec712b905cd24f6a411', // Karnage
      relayIds: [damusId],
      theme: 'black'
    },
    {
      publicKey: '8fb140b4e8ddef97ce4b821d247278a1a4353362623f64021484b372f948000c', // fishcake
      relayIds: [damusId],
      theme: 'city'
    },
    {
      publicKey: '175f568d77fb0cb7400f0ddd8aed1738cd797532b314ef053a1669d4dba7433a', // Pavlenex
      relayIds: [damusId],
      theme: 'flowers'
    }
  ]
})

</script>

<template>
    <div 
      v-if="users"
      class="home-profiles"
    >
      <h3>Check out a few profiles</h3>
      <div class="list">
        <UiUsername
          v-for="(item, index) in users"
          :key="item.publicKey"
          :publicKey="item.publicKey"
          :relayIds="item.relayIds"
          :theme="item.theme"
          :showAvatar="true"
          avatarSize="big"
          avatarStyle="shadow"
          layout="vertical"
        />
      </div>
    </div>
</template>

<style scoped lang="scss">

.home-profiles {
  margin-top: 60px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 25px;

  h3 {
    @include r('font-size', 18, 21);
    font-weight: 500;
    color: var(--theme-front);
  }

  .list {
    display: flex;
    justify-content: center;
    flex-wrap: wrap;
    @include r('gap', 10, 30);

    .username {
      flex-basis: 5%;
      flex-grow: 1;
    }
  }

  @include media-query(small) {
    .list {
      .username {
        flex-basis: 26%;
      }
    }
  }
}

</style>
