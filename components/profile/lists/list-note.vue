<script setup>
import relayRequest from '@/helpers/relayRequest.js'
import multiRelayRequest from '@/helpers/multiRelayRequest.js'
import { useRelayStore } from '@/stores/relays'
import ToolBox from '@/helpers/toolBox'

const props = defineProps([
  'publicKey',
  'relayId'
])

let rawNoteData = null
const noteData = ref(null)
const relayStore = useRelayStore()
let noteTag = null

function loadNoteData() {
  const filter = {
    kinds: [1],
    ids: [props.publicKey],
    limit: 1
  }

  const request = multiRelayRequest()
  request.init(onNoteData)
  request.start(relayStore.getAll, [filter])
}

function onNoteData(data) {
  // console.log('onNoteData', data)

  noteData.value = data
}

const subject = computed(() => {
  let result

  if(noteData.value && noteData.value.subject) {
    result = noteData.value.subject
  }

  return result
})

const content = computed(() => {
  let result

  if(noteData.value) {
    result = noteData.value.content
  }

  return result
})

const meta = computed(() => {
  let result

  if(noteData.value) {
    result = ToolBox.formatRelativeDate(noteData.value.created_at)
  }

  return result
})

onMounted(() => {
  loadNoteData()
})
</script>

<template>
  <Transition name="fade" appear>
    <div
      v-if="noteData"
      class="note-item"
    >
      <div class="top">
        <UiUsername
          :publicKey="noteData.pubkey"
          :relayIds="[noteData.relay]"
        />
        <p v-if="meta">{{ meta }}</p>
      </div>
      <h5 v-if="subject">{{ subject }}</h5>
      <p v-if="content">{{ content }}</p>
    </div>
  </Transition>
</template>

<style scoped lang="scss">

.note-item {
  img {
    width: 125px;
    height: 125px;
    object-fit: contain;
  }

  .top {
    display: flex;
    justify-content: space-between;
    gap: 10px;
  }

  h5 {
    margin-top: 20px;
    font-size: 17px;
    font-weight: 600;
    color: var(--theme-front);
  }

  p {
    margin-top: 3px;
    font-size: 15px;
    color: var(--theme-front);
    opacity: 0.75;
    word-break: break-all;
  }
}

</style>
