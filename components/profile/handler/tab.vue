<script setup>
import ToolBox from '@/helpers/toolBox'

const props = defineProps([
  'info'
])

const emit = defineEmits(['back'])

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

  console.log('HandlerTab.groupedHandlers', result)

  return result
})

const handlerCount = computed(() => {
  return Object.keys(groupedHandlers.value).length
})

const title = computed(() => {
  return handlerCount.value + ' recommended app' + (handlerCount.value == 1 ? '' : 's')
})
</script>

<template>
  <Transition name="fade" appear>
    <div v-if="info" class="handler-tab">
      <ProfileSectionBack @select="$emit('back')" />
      <ProfileSectionTitle :title="title" />
      <ProfileHandlerList
        class="handlers"
        :info="groupedHandlers" 
        layout="grid"
        theme="theme"
      />
    </div>
  </Transition>
</template>

<style scoped lang="scss">

.handler-tab {
  .handlers {
    margin-top: 25px;
    display: flex;
    gap: 20px;
    flex-wrap: wrap;

    > * {
      flex-grow: 1;
    }
  }

  @include media-query(small) {
    .handlers {
      > * {
        flex-basis: 40%;
      }
    }
  }

  @include media-query(medium) {
    .handlers {
      > * {
        flex-basis: 30%;
      }
    }
  }

  @include media-query(large) {
    .handlers {
      > * {
        flex-basis: 20%;
      }
    }
  }
}

</style>
