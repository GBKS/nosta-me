<script setup>
import { useProfileStore } from '@/stores/profile'
import profileInitializer from '@/helpers/create/profileInitializer.js'

const store = useProfileStore()

function toggleItem(id) {
  let item
  for(let i=0; i<store.relays.length; i++) {
    item = store.relays[i]
    if(item.id == id) {
      item.added = !item.added
    }
  }
}

onMounted(() => {
  profileInitializer.init()
})
</script>

<template>
  <div class="relay-list">
    <client-only>
      <CreateRelayItem
        v-for="(info, index) in store.relays"
        :key="info.id"
        :info="info"
        @toggle="toggleItem"
      />
      <CreateAddRelay v-if="false" />
    </client-only>
  </div>
</template>

<style scoped lang="scss">

.relay-list {
  display: flex;
  flex-direction: column;
  justify-content: stretch;
  align-items: stretch;
  width: 100%;
}

</style>
