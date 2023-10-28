<script setup>
import { storeToRefs } from 'pinia'
import ToolBox from '@/helpers/toolBox'
import { useHandlerStore } from "@/stores/handlers.js"
import { useRelayStore } from '@/stores/relays'

const handlerStore = useHandlerStore()
const relayStore = useRelayStore()

const { handlers } = storeToRefs(handlerStore)

const props = defineProps([
  'info'
])

const created = computed(() => {
  return ToolBox.formatRelativeDate(props.info.created_at, true)
})

const url = computed(() => {
  return 'https://primal.net/e/' + props.info.id
})

const parentNote = computed(() => {
  let result = null
  
  const tags = props.info.tags.filter(tag => tag[0] == 'e')
  if(tags.length > 0) {
    result = tags[0]
  }

  return result
})

const parentNoteUrl = computed(() => {
  let result = null
  
  if(parentNote.value) {
    result = 'https://primal.net/e/' + parentNote.value[1]
  }

  return result
})

const previousNote = computed(() => {
  let result = null
  
  const tags = props.info.tags.filter(tag => tag[0] == 'e')
  if(tags.length > 1) {
    result = tags[1]
  }

  return result
})

const previousNoteUrl = computed(() => {
  let result = null
  
  if(previousNote.value) {
    result = 'https://primal.net/e/' + previousNote.value[1]
  }

  return result
})

const threadTags = computed(() => {
  const result = []
  
  let url, bech, relay
  if(parentNote.value) {
    relay = relayStore.getRelay(props.info.relay)

    bech = window.NostrTools.nip19.neventEncode({
      id: parentNote.value[1],
      relays: [relay.url],
      kind: 1
    })

    if(handler.value) {
      url = handler.value.replace('<bech32>', bech)
    } else {
      url = 'https://primal.net/e/' + parentNote.value[1]
    }

    result.push({
      name: 'Thread',
      url: url,
      target: '_blank',
      rel: 'nofollow noopener noreferrer'
    })
  }
  
  if(previousNote.value) {
    relay = relayStore.getRelay(props.info.relay)

    bech = window.NostrTools.nip19.neventEncode({
      id: previousNote.value[1],
      relays: [relay.url],
      kind: 1
    })

    if(handler.value) {
      url = handler.value.replace('<bech32>', bech)
    } else {
      url = 'https://primal.net/e/' + previousNote.value[1]
    }

    result.push({
      name: 'Parent',
      url: url,
      target: '_blank',
      rel: 'nofollow noopener noreferrer'
    })
  }

  return result
})

// See if the profile has defined a preferred handler for short notes.
// TODO: Fallback to the logged in users preferred handler
// TODO: Make this platform specific (on iOS, look for iOS handlers)
const handler = computed(() => {
  let result = null

  let handler, kindTag, eventTag
  for(let id in handlers.value) {
    handler = handlers.value[id]

    kindTag = handler.tags.find(tag => tag[0] == 'k' && tag[1] == '1')
    eventTag = handler.tags.find(tag => tag[0] == 'web' && tag[2] == 'nevent')

    if(kindTag && eventTag) {
      result = eventTag[1]
      break
    }
  }

  return result
})
</script>

<template>
  <div class="short-notes-item">
    <UiTags
      v-if="threadTags.length > 0"
      :info="threadTags"
    />
    <ProfileBitsNote
      :text="info.content"
      :info="info"
    />
    <a
      :href="url"
      target="_blank"
      rel="nofollow noreferrer"
      class="-date"
    >{{ created }}</a>
  </div>
</template>

<style scoped lang="scss">

.short-notes-item {
  border: 1px solid rgba(var(--theme-front-rgb), 0.1);
  border-radius: 10px;
  padding: 15px;

  .tags {
    & + .note {
      margin-top: 10px;
    }
  }

  a.-date {
    display: inline-block;
    margin-top: 5px;
    color: var(--theme-text-medium);
    font-weight: 600;
    text-decoration: none;
    font-size: 13px;

    &:hover {
      text-decoration: underline;
      color: var(--theme-active);
    }
  }
}

</style>
