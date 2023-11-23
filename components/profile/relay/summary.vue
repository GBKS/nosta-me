<script setup>
import Icons from '@/helpers/icons'
import { useRelayStore } from '@/stores/relays'

const store = useRelayStore()

const props = defineProps([
  'info',
  'count',
  'baseUrl'
])

const visibleRelays =  computed(() => {
  const relays = props.count > 0 ? props.info.slice(0, 3) : null

  const result = []

  for(let i=0; i<relays.length; i++) {
    result.push(store.getRelay(relays[i]))
  }

  return result
})

const titleCopy = computed(() => {
  let result = 'No relays yet'

  if(props.count > 0) {
    result = 'Uses ' + props.count + ' relay' + (props.count == 1 ? '' : 's')
  }

  return result
})

const emit = defineEmits(['navigate'])

function navigate() {
  emit('navigate', 'relays')
}
</script>

<template>
  <div v-if="count > 0" class="relay-summary">
    <ProfileSectionTitle
      :title="titleCopy"
      :clickable="true"
      @select="navigate"
    />
    <div class="relays">
      <ModalRelayItem
        v-for="(item, index) in visibleRelays"
        :key="item.id"
        :info="item"
        :showStatus="true"
        theme="theme"
      />
    </div>
  </div>
</template>

<style scoped lang="scss">

.relay-summary {
  .relays {
    margin-top: 10px;
    display: flex;
    @include r('gap', 10, 25);
  }

  @include media-query(small) {
    .relays {
      flex-direction: column;
    }
  }
}

</style>
