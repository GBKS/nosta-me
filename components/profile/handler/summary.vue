<script setup>
import Icons from '@/helpers/icons'
import ToolBox from '@/helpers/toolBox'

const props = defineProps([
  'info',
  'count',
  'baseUrl'
])

const emit = defineEmits(['navigate'])

const visibleHandlers =  computed(() => {
  let result = null

  if(props.count > 0) {
    const handlers = groupedHandlers.value
    let keys = Object.keys(handlers).slice(0, 5)
    result = {}
    let i=0, key
    for(; i<keys.length; i++) {
      key = keys[i]
      result[key] = handlers[key]
    }
  }

  // console.log('visibleHandlers', result)

  return result
})

const detailUrl = computed(() => {
  return props.baseUrl + '/handlers'
})

const titleCopy = computed(() => {
  let result = 'No app recommendations yet'

  const count = Object.keys(groupedHandlers.value).length
  if(count > 0) {
    result = 'Recommends ' + count + ' app' + (count == 1 ? '' : 's')
  }

  return result
})

// Group by application ID
const groupedHandlers = computed(() => {
  const result = {}

  let i=0, item, tag, bits, appId
  for(; i<props.info.length; i++) {
    item = props.info[i]

    tag = ToolBox.findTag(item, 'a')

    if(tag) {
      bits = tag[0].split(':')
      appId = bits[1]

      if(!result[appId]) {
        result[appId] = {
          appId: appId,
          kind: parseInt(bits[0]),
          identifier: bits[2],
          relay: tag[1],
          platform: tag[2],
          events: []
        }
      }

      result[appId].events.push(item)
    }
  }

  // console.log('groupedHandlers', result)

  return result
})

function navigate() {
  emit('navigate', 'handlers')
}
</script>

<template>
  <div v-if="count > 0" class="handler-summary">
    <ProfileSectionTitle
      :title="titleCopy"
      :clickable="true"
      @select="navigate"
    />
    <div class="handlers">
      <ProfileHandlerList 
        :info="visibleHandlers"
        layout="icon"
        theme="theme"
      />
    </div>
  </div>
</template>

<style scoped lang="scss">

.handler-summary {
  .handlers {
    margin-top: 25px;
    display: flex;
    @include r('gap', 10, 25);
  }
}

</style>
