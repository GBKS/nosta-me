<script setup>
import relayManager from '@/helpers/relayManager.js'

const users = ref(null)

onMounted(() => {
  const damusId = relayManager.addRelayByUrl('wss://relay.damus.io')
  const snortId = relayManager.addRelayByUrl('wss://relay.snort.social')
  const primalId = relayManager.addRelayByUrl('wss://relay.primal.net')
  const relayIds = [damusId, snortId, primalId]
  
  users.value = [
    { // Nosta
      publicKey: '128bc05aa6fd421d00c3c3389329f39cfc750b035db6cdad2eb0f983bff5629f', 
      relayIds: relayIds,
      theme: 'space'
    },
    { // Bitcoin design
      publicKey: '8c29b321d0f3c61343882ea49623e84771690cd0566e40b90f08e5d34336aaa0',
      relayIds: relayIds,
      theme: 'space'
    }, 
    { // GBKS
      publicKey: 'b731e7fbde5c192d793ff520a6ec91f6965f5d8fa1b64e12171089a65e540525',
      relayIds: relayIds,
      theme: 'winter'
    },
    { // Karnage
      publicKey: '1bc70a0148b3f316da33fe3c89f23e3e71ac4ff998027ec712b905cd24f6a411',
      relayIds: relayIds,
      theme: 'black'
    },
    { // fishcake
      publicKey: '8fb140b4e8ddef97ce4b821d247278a1a4353362623f64021484b372f948000c',
      relayIds: relayIds,
      theme: 'city'
    },
    { // Pavlenex
      publicKey: '175f568d77fb0cb7400f0ddd8aed1738cd797532b314ef053a1669d4dba7433a',
      relayIds: relayIds,
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
