<script setup>
import { storeToRefs } from 'pinia'
import ToolBox from '@/helpers/toolBox'
// import { useHandlerStore } from "@/stores/handlers.js"
import { useRelayStore } from '@/stores/relays'
import linkHelper from '@/helpers/linkHelper.js'

// const handlerStore = useHandlerStore()
const relayStore = useRelayStore()

// const { handlers } = storeToRefs(handlerStore)

const props = defineProps([
  'info',
  'handlers'
])

const created = computed(() => {
  return ToolBox.formatRelativeDate(props.info.created_at, true)
})

const url = computed(() => {
  const relay = relayStore.getRelay(props.info.relay)

  return linkHelper.event(
    props.info.id, 
    relay.url,
    props.info.kind, 
    props.handlers,
    linkHelper.primal.event
  )
})

const parentNote = computed(() => {
  let result = null
  
  // TODO: Check if there's a tag with 'root'
  const tags = props.info.tags.filter(tag => tag[0] == 'e')
  if(tags.length > 0) {
    result = tags[0]
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

const threadTags = computed(() => {
  const result = []
  
  let url, bech, relay
  if(parentNote.value) {
    url = linkHelper.event(
      parentNote.value[1], 
      parentNote.value[2],
      1, 
      props.handlers,
      linkHelper.primal.event
    )

    result.push({
      name: 'Thread',
      url: url,
      target: '_blank',
      rel: 'nofollow noopener noreferrer'
    })
  }
  
  if(previousNote.value) {
    url = linkHelper.event(
      previousNote.value[1], 
      previousNote.value[2],
      1, 
      props.handlers,
      linkHelper.primal.event
    )

    result.push({
      name: 'Parent',
      url: url,
      target: '_blank',
      rel: 'nofollow noopener noreferrer'
    })
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
