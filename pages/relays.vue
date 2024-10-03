<script setup>
import relayList from '@/data/relays.json'

const currentRelay = ref('')
const currentRelayId = ref('')
const relayData = ref({})
let currentRelayIndex = -1

function checkNextRelay() {
  currentRelayIndex++

  currentRelay.value = relayList.relays[currentRelayIndex]

  currentRelayId.value = currentRelay.value.split('wss://').join('')

  let currentRelayUrl = 'https://' + currentRelayId.value

  fetch(currentRelayUrl, {headers: {'accept': 'application/nostr+json'}})
    .then((response) => response.json())
    .then(onRelayData)

  setTimeout(checkNextRelay, 1000)
}

function onRelayData(data) {
  relayData.value[currentRelayId.value] = data
}

onMounted(() => {
  checkNextRelay()
})

</script>

<template>
  <div class="relays-page">
    <h1>Yo</h1>
    <p>{{ currentRelay }}</p>
    <div class="items">
      <div 
        v-for="(item, relayId) in relayData" 
        :key="relayId"
        class="item"
      >
        <h3>{{ item.name }}</h3>
        <p>{{ item.description }}</p>
        <p>{{ item.contact }}</p>
        <p>{{ item.pubkey }}</p>
        <p>{{ relayId }}</p>
        <p class="-s">{{ item.software }}</p>
        <p class="-s">{{ item.version }}</p>
        <p class="-s">{{ item.supported_nips.join(', ') }}</p>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">

.relays-page {
  .items {
    display: flex;
    flex-wrap: wrap;
    padding: 20px;
    gap: 20px;

    .item {
      margin-top: 20px;
      flex-basis: 16%;
      flex-grow: 1;
      background-color: white;
      border-radius: 15px;
      padding: 15px;

      h3 {
        font-size: 17px;
        font-weight: 600;
      }

      p {
        font-size: 15px;

        &.-s {
          font-size: 13px;
        }
      }
    }
  }
}

</style>
