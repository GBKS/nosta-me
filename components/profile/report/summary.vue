<script setup>
import relayManager from '@/helpers/relayManager.js'

const props = defineProps([
  'info',
  'count',
  'baseUrl'
])

const titleCopy = computed(() => {
  let result = 'No reports yet'

  if(props.count > 0) {
    result = 'Created ' + props.count + ' report' + (props.count == 1 ? '' : 's')
  }

  return result
})

const reportOne = computed(() => {
  return prepReportInfo(0)
})

const reportTwo = computed(() => {
  return prepReportInfo(1)
})

function prepReportInfo(index) {
  let publicKey, reason

  const event = props.info[index]

  // console.log('prepReportInfo', props.info, index, event)

  let tag, i
  for(i=0; i<event.tags.length; i++) {
    tag = event.tags[i]

    switch(tag[0]) {
      case 'p':
        publicKey = tag[1]
        break
      case 'report':
        reason = tag[1]
        break
    }

    if(tag.length > 2) {
      reason = tag[2]
    }
  }

  const relayIds = [event.relay]

  // console.log('prepReportInfo', index, event, publicKey, relayIds)

  return {
    publicKey,
    relayIds,
    reason
  }
}

const emit = defineEmits(['navigate'])

function navigate() {
  emit('navigate', 'reports')
}
</script>

<template>
  <div v-if="count > 0" class="report-summary">
    <ProfileReportIcon :type="reportOne.reason" />
    <div class="copy">
      <ProfileSectionTitle
        :title="titleCopy"
        :clickable="true"
        @select="navigate"
      />

      <p v-if="count > 0">
        <UiUsername
          :publicKey="reportOne.publicKey" 
          :relayIds="reportOne.relayIds"
        />
        for {{ reportOne.reason }}
        <template v-if="count > 1">
          , 
          <UiUsername
            :publicKey="reportTwo.publicKey" 
            :relayIds="reportTwo.relayIds"
          />
          for {{ reportTwo.reason }}
        </template>
        <template v-if="count > 2">, and more</template>.
      </p>
    </div>
  </div>
</template>

<style scoped lang="scss">

.report-summary {
  display: flex;
  align-items: center;
  gap: 20px;

  .copy {
    p {
      margin-top: 2px;
      font-size: 17px;
      font-weight: 500;
      color: rgba(var(--theme-front-rgb), 0.75);
    }
  }
}

</style>
