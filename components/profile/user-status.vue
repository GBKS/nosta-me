<script setup>
import ToolBox from '@/helpers/toolBox'
import Icons from '@/helpers/icons'

const props = defineProps([
  'info'
])

const classObject = computed(() => {
  const c = ['user-status']

  if(statusType.value) c.push('-'+statusType.value)

  return c.join(' ')
})

const latestStatus = computed(() => {
  let result = null

  if(props.info && props.info.length > 0) {
    const sorted = props.info.sort((a, b) => {
      if(a.created_at > b.created_at) return -1
      if(a.created_at < b.created_at) return 1
      return 0
    })

    result = sorted[0]
  }

  return result
})

// The status MAY include an r, p, e or a tag linking to a URL, profile, note, or parameterized replaceable event.
const link = computed(() => {
  let result = null

  const tag = latestStatus.value.tags.find(tag => tag[0] == 'r')
  if(tag) {
    result = tag[1]
  }

  return result
})

const statusType = computed(() => {
  let result = null

  const tag = latestStatus.value.tags.find(tag => tag[0] == 'd')
  if(tag) {
    result = tag[1]
  }

  return result
})

const type = computed(() => {
  return link.value ? 'a' : 'div'
})

const linkTarget = computed(() => {
  return link.value ? '_blank' : null
})

const icon = computed(() => {
  return statusType.value == 'music' ? Icons.music : null
})

const linkRel = computed(() => {
  return link.value ? 'nofollow noopener noreferrer' : null
})

const content = computed(() => {
  let result = null

  const content = latestStatus.value.content
  if(content && content.length > 0) {
    result = ToolBox.trim(latestStatus.value.content, 40)
  }

  return result
})

const visible = computed(() => {
  return props.info && content.value
})

/*
Different tip copy for static/expiring and music/general statuses

Listened 1h ago
Listenting for 10 more seconds...
Finished 1h ago
For 10 more seconds...
Status set 1h ago
 */
const dateText = computed(() => {
  let result = null

  const expirationTag = latestStatus.value.tags.find(tag => tag[0] == 'expiration')
  if(expirationTag) {
    const time = new Date(parseInt(expirationTag[1])*1000)
    const isExpired = time < new Date()
    if(statusType.value == 'music') {
      if(isExpired) {
        result = 'Listened '+ToolBox.formatRelativeDate(latestStatus.value.created_at, true)
      } else {
        const secondsToGo = time - new Date()
        result = 'Listening for '+secondsToGo+' more seconds...'
      }
    } else {
      if(isExpired) {
        result = 'Finished '+ToolBox.formatRelativeDate(latestStatus.value.created_at, true)
      } else {
        const secondsToGo = time - new Date()
        result = 'For '+secondsToGo+' more seconds...'
      }
    }
  } else {
    result = 'Status set '+ToolBox.formatRelativeDate(latestStatus.value.created_at, true)
  }

  return result
})

</script>

<template>
  <component
    v-if="visible"
    :class="classObject" 
    :is="type"
    :href="link"
    :target="linkTarget"
    :rel="linkRel"
    :title="dateText"
  >
    <p><span v-if="icon" v-html="icon" />{{ content }}</p>
  </component>
</template>

<style scoped lang="scss">

.user-status {
  padding: 3px 8px;
  align-self: flex-start;
  border-radius: 3px;
  background-color: rgba(var(--theme-active-rgb), 0.1);
  transition: background-color 150ms $ease;

  &:is(a) {
    text-decoration: none;

    &:hover {
      background-color: rgba(var(--theme-active-rgb), 0.25);
    }
  }

  p {
    color: var(--theme-text-medium);
    font-size: 13px;
    font-weight: 500;

    span {
      padding-right: 5px;
      
      :deep(svg) {
        width: 15px;
        height: 15px;
        vertical-align: middle;
      }
    }
  }
}



</style>
