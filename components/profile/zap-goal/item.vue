<script setup>
import multiRelayRequest from '@/helpers/multiRelayRequest.js'
import relayManager from '@/helpers/relayManager.js'
import { useRelayStore } from '@/stores/relays'
import linkHelper from '@/helpers/linkHelper.js'
import zapGoalHelper from '@/helpers/zapGoalHelper.js'
import zapReceiptHelper from '@/helpers/zapReceiptHelper.js'
import zapProviderService, { PROVIDER_STATUS } from '@/helpers/zapProviderService.js'

// info is a goal as returned by zapGoalHelper.parse()
const props = defineProps([
  'info',
  'lightningAddress', // Of the profile, to check who signed the zap receipts
  'relayListEvent', // Of the profile (kind 10002), zap receipts are sent to those relays
  'handlers'
])

const relayStore = useRelayStore()
const zaps = ref([])
const provider = ref(null)
let request = null

const MAX_PROFILE_RELAYS = 6

// Zaps only count when the receipt was signed by the lightning provider of the
// profile, see zapProviderService. If we can't ask, the checks that
// zapReceiptHelper makes on every receipt have to do.
const countedZaps = computed(() => {
  if(!provider.value) return []

  if(provider.value.status == PROVIDER_STATUS.FOUND) {
    return zaps.value.filter(zap => zapReceiptHelper.isFromProvider(zap, provider.value.publicKey))
  }

  return provider.value.status == PROVIDER_STATUS.NONE ? [] : zaps.value
})

const progress = computed(() => {
  return zapGoalHelper.progress(props.info, countedZaps.value)
})

const amountCopy = computed(() => {
  return progress.value.sats.toLocaleString() + ' of ' + props.info.targetSats.toLocaleString() + ' sats'
})

const zapCountCopy = computed(() => {
  const count = progress.value.count
  return count + ' zap' + (count == 1 ? '' : 's')
})

const link = computed(() => {
  try {
    return linkHelper.event(props.info.id, props.info.relays[0] || null, 9041, props.handlers, linkHelper.njump.any)
  } catch(error) {
    return null
  }
})

function onZapReceipt(event) {
  const zap = zapReceiptHelper.parse(event)

  if(zap && !zapReceiptHelper.isDuplicate(zap, zaps.value)) {
    zaps.value.push(zap)
  }
}

// Receipts are published to the relays named in the zap request. That should be
// the relays of the goal, and is often the relays of the person who gets zapped.
// Asking more relays finds more zaps, so the total is "at least".
function relayIdsToAsk() {
  const relayIds = Object.keys(relayStore.getAll).filter(relayId => relayManager.isConnected(relayId))

  const listTags = props.relayListEvent && Array.isArray(props.relayListEvent.tags) ? props.relayListEvent.tags : []
  const listUrls = listTags.filter(tag => tag[0] == 'r' && typeof tag[1] == 'string').map(tag => tag[1]).slice(0, MAX_PROFILE_RELAYS)

  for(const url of props.info.relays.concat(listUrls)) {
    const relayId = relayManager.addRelayByUrl(url)
    if(relayId && relayIds.indexOf(relayId) === -1) relayIds.push(relayId)
  }

  return relayIds
}

function startRequest() {
  if(request) request.kill()

  request = multiRelayRequest()
  request.init(onZapReceipt)
  request.start(relayIdsToAsk(), [{ kinds: [9735], '#e': [props.info.id], limit: 500 }])
}

async function load() {
  startRequest()

  provider.value = props.lightningAddress
    ? await zapProviderService.find(props.lightningAddress)
    : { status: PROVIDER_STATUS.UNKNOWN }
}

// The relay list can arrive after the goal. Ask again then, zaps are only counted once.
watch(() => props.relayListEvent ? props.relayListEvent.id : null, (id) => {
  if(id) startRequest()
})

onMounted(() => {
  load()
})

onBeforeUnmount(() => {
  if(request) request.kill()
})
</script>

<template>
  <component
    :is="link ? 'a' : 'div'"
    class="zap-goal-item"
    :href="link"
    :target="link ? '_blank' : null"
    :rel="link ? 'nofollow noopener noreferrer' : null"
  >
    <h5>{{ info.text }}</h5>
    <div
      class="bar"
      role="progressbar"
      aria-valuemin="0"
      aria-valuemax="100"
      :aria-valuenow="progress.percent"
      :aria-label="'Raised ' + progress.percent + ' percent'"
    >
      <div :style="{ width: progress.percent + '%' }" />
    </div>
    <p><b>{{ amountCopy }}</b> · {{ progress.percent }}% · {{ zapCountCopy }}</p>
  </component>
</template>

<style scoped lang="scss">

.zap-goal-item {
  display: block;
  text-decoration: none;
  padding: 15px;
  border-radius: 15px;
  background-color: rgba(var(--theme-back-rgb), 0.2);
  border: 1px solid rgba(var(--theme-front-rgb), 0.2);
  transition: all 250ms $ease;
  min-width: 0;

  h5 {
    font-size: 17px;
    font-weight: 600;
    color: var(--theme-front);
    overflow-wrap: anywhere;
  }

  .bar {
    margin-top: 12px;
    height: 8px;
    border-radius: 100px;
    overflow: hidden;
    background-color: rgba(var(--theme-front-rgb), 0.15);

    > div {
      height: 100%;
      min-width: 2px;
      border-radius: 100px;
      background-color: var(--theme-active);
      transition: width 400ms $ease;
    }
  }

  p {
    margin-top: 10px;
    font-size: 15px;
    color: var(--theme-front);
    opacity: 0.75;

    b {
      font-weight: 600;
    }
  }
}

a.zap-goal-item:hover {
  background-color: rgba(var(--theme-back-rgb), 0.3);
  border-color: rgba(var(--theme-front-rgb), 0.3);
}

</style>
