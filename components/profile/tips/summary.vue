<script setup>
import Icons from '@/helpers/icons'
import profileTipHelper from '@/helpers/profileTipHelper.js'

const props = defineProps([
  'profileData',
  'relayData',
  'followData',
  'badgeData',
  'handlerData',
  'listsData',
  'stallData',
  'productData',
  'sentZapsData',
  'receivedZapsData',
  'reportsData',
  'fileData',
  'liveData',
  'eventsData',
  'classifiedsData',
  'zapGoalData',
  'userStatusData',
  'labelData',
])

const emit = defineEmits(['navigate'])

const tipList = computed(() => {
  return profileTipHelper.getTips({
    profile: props.profileData,
    follows: props.followData,
    relays: props.relayData,
    badges: props.badgeData,
    handlers: props.handlerData,
    lists: props.listsData,
    stalls: props.stallData,
    products: props.productData,
    sentZaps: props.sentZapsData,
    receivedZaps: props.receivedZapsData,
    reports: props.reportsData,
    files: props.fileData,
    live: props.liveData,
    events: props.eventsData,
    classifieds: props.classifiedsData,
    zapGoals: props.zapGoalData,
    userStatuses: props.userStatusData,
    labels: props.labelData
  })
})

const count = computed(() => {
  return tipList.value ? tipList.value.length : 0
})

const titleCopy = computed(() => {
  let result = 'No tips yet'

  if(count.value > 0) {
    result = count.value + ' tip' + (count.value == 1 ? '' : 's')
  }

  return result
})

function navigate() {
  emit('navigate', 'tips')
}
</script>

<template>
  <div
    v-if="count > 0" 
    class="tips-summary -theme-content-frame"
    role="button"
    @click="navigate"
  >
    <div class="icons">
      <div v-html="Icons.bitcoin" />
      <div v-html="Icons.badge" />
      <div v-html="Icons.app" />
      <div v-html="Icons.account" />
    </div>
    <div class="copy">
      <h3>{{ titleCopy }}</h3>
      <p>Do more on Nostr and your activity will show up on your profile.</p>
    </div>
  </div>
</template>

<style scoped lang="scss">

.tips-summary {
  margin-top: 25px;
  border-radius: 25px;
  @include r('padding', 15, 25);
  width: 100%;
  max-width: 800px;
  box-sizing: border-box;
  display: flex;
  gap: 15px;
  cursor: pointer;

  &:hover {
    .copy {
      h3 {
        text-decoration: underline;
      }
    }
  }

  .icons {
    position: relative;
    width: 100px;

    > * {
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: red;
      border-radius: 100px;
      width: 40px;
      height: 40px;
      color: white;
      background: linear-gradient(135deg, #22A2FF 0%, #6B10FF 100%); 
      box-shadow: 0px 2px 2px 0px rgba(0, 0, 0, 0.15), 0px 4px 4px 0px rgba(0, 0, 0, 0.15), 0px 8px 8px 0px rgba(0, 0, 0, 0.15), 0px 16px 16px 0px rgba(0, 0, 0, 0.15), 0px 32px 32px 0px rgba(0, 0, 0, 0.15);

      :deep(svg) {
        width: 20px;
        height: 20px;
      }

      &:nth-child(2),
      &:nth-child(3),
      &:nth-child(4) { position: absolute; top: 0; }

      &:nth-child(2) { 
        background: linear-gradient(135deg, #FF6422 0%, #FF1074 100%);
        
        left: 20px; 
      }

      &:nth-child(3) { 
        background: linear-gradient(135deg, #90FF22 0%, #10A9FF 100%);
        left: 40px;
      }

      &:nth-child(4) { 
        background: linear-gradient(135deg, #FFCB12 0%, #FF8310 100%);
        left: 60px;
      }
    }
  }

  .copy {
    h3 {
      @include r('font-size', 13, 15);
      font-weight: 600;
      color: var(--theme-front);
    }

    p {
      margin-top: 3px;
      @include r('font-size', 13, 15);
      color: rgba(var(--theme-front-rgb), 0.75);
    }
  }
}

</style>
