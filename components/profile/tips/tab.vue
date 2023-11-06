<script setup>
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
  'shortNotesData',
  'longNotesData',
  'reportsData',
  'fileData',
  'liveData',
  'eventsData',
  'classifiedsData',
  'zapGoalData',
  'userStatusData',
  'labelData',
])

const emit = defineEmits(['back'])

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
    shortNotes: props.shortNotesData,
    longNotes: props.longNotesData,
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

const itemCount = computed(() => {
  return tipList.value ? tipList.value.length : 0
})

const title = computed(() => {
  return itemCount.value + ' profile tip' + (itemCount.value == 1 ? '' : 's')
})
</script>

<template>
  <Transition name="fade" appear>
    <div v-if="tipList" class="tips-tab">
      <ProfileSectionBack @select="$emit('back')" />
      <ProfileSectionTitle :title="title" />
      <p>There's a lot you can do on Nostr. Click each tip to find apps that help you do those activities.</p>
      <ProfileTipsList
        class="items"
        :info="tipList" 
      />
    </div>
  </Transition>
</template>

<style scoped lang="scss">

.tips-tab {
  > p {
    margin-top: 5px;
    color: var(--theme-front);
  }
}

</style>
