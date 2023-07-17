<script setup>
import relayManager from '@/helpers/relayManager.js'

const props = defineProps([
  'info',
  'count',
  'baseUrl'
])

const titleCopy = computed(() => {
  let result = 'No following anyone yet'

  if(props.count > 0) {
    result = 'Follows ' + props.count + ' other' + (props.count == 1 ? '' : 's')
  }

  return result
})

const followerOne = computed(() => {
  return prepFollowerInfo(0)
})

const followerTwo = computed(() => {
  return prepFollowerInfo(1)
})

const followerThree = computed(() => {
  return prepFollowerInfo(2)
})

const followerFour = computed(() => {
  return prepFollowerInfo(3)
})

const followerFive = computed(() => {
  return prepFollowerInfo(4)
})

function prepFollowerInfo(index) {
  let result
  let relayIds
  let publicKey

  if(props.info.tags.length > index) {
    publicKey = props.info.tags[index][1]
  }

  // Try to get relays
  if(props.info.content.length > 0) {
    const relayData = JSON.parse(props.info.content)
    relayIds = []
    let relayUrl, relayId
    for(relayUrl in relayData) {
      relayId = relayManager.addRelayByUrl(relayUrl)
      relayIds.push(relayId)
    }
  } else {
    // TODO: No relays provided, how do we fill this in?
  }

  return  {
    publicKey,
    relayIds
  }
}

const classObject = computed(() => {
  return [
    'avatars',
    props.count > 4 ? '_5' : ('_' + props.count)
  ].join(' ')
})

const emit = defineEmits(['navigate'])

function navigate() {
  emit('navigate', 'following')
}
</script>

<template>
  <Transition name="fade" appear>
    <div v-if="count > 0" class="follow-summary">
      <div :class="classObject">
        <UiUsername
          v-if="followerOne"
          :key="followerOne.publicKey"
          :publicKey="followerOne.publicKey" 
          :relayIds="followerOne.relayIds"
          hideName="true"
          showAvatar="true"
          avatarSize="huge"
        />
        <UiUsername
          v-if="count > 1 && followerTwo"
          :key="followerTwo.publicKey" 
          :publicKey="followerTwo.publicKey" 
          :relayIds="followerTwo.relayIds"
          hideName="true"
          showAvatar="true"
          avatarSize="huge"
        />
        <UiUsername
          v-if="count > 2 && followerThree"
          :key="followerThree.publicKey"
          :publicKey="followerThree.publicKey" 
          :relayIds="followerThree.relayIds"
          hideName="true"
          showAvatar="true"
          avatarSize="huge"
        />
        <UiUsername
          v-if="count > 3 && followerFour"
          :key="followerFour.publicKey" 
          :publicKey="followerFour.publicKey" 
          :relayIds="followerFour.relayIds"
          hideName="true"
          showAvatar="true"
          avatarSize="huge"
        />
        <UiUsername
          v-if="count > 4 && followerFive"
          :key="followerFive.publicKey" 
          :publicKey="followerFive.publicKey" 
          :relayIds="followerFive.relayIds"
          hideName="true"
          showAvatar="true"
          avatarSize="huge"
        />
      </div>
      <div class="copy">
        <ProfileSectionTitle
          :title="titleCopy"
          :clickable="true"
          @select="navigate"
        />

        <p v-if="count > 0">
          Including 
          <UiUsername
            :key="followerOne.publicKey"
            :publicKey="followerOne.publicKey" 
            :relayIds="followerOne.relayIds"
          />
          <template v-if="count == 2"> and </template>
          <template v-if="count > 2">, </template>
          <UiUsername
            v-if="count > 1"
            :key="followerTwo.publicKey"
            :publicKey="followerTwo.publicKey" 
            :relayIds="followerTwo.relayIds"
          />
          <template v-if="count > 2">, and </template>
          <UiUsername
            v-if="count > 2"
            :key="followerThree.publicKey"
            :publicKey="followerThree.publicKey" 
            :relayIds="followerThree.relayIds"
          />.
        </p>
      </div>
    </div>
  </Transition>
</template>

<style scoped lang="scss">

.follow-summary {
  display: flex;
  gap: 30px;

  .avatars {
    display: flex;
    width: 275px;
    height: 75px;
    position: relative;
    flex-shrink: 0;

    :deep(a) {
      position: absolute;
      top: 0;
    }

    > a:nth-child(2) { left: 50px; }
    > a:nth-child(3) { left: 100px; }
    > a:nth-child(4) { left: 150px; }
    > a:nth-child(5) { left: 200px; }

    &._1 { width: 75px; }
    &._2 { width: 125px; }
    &._3 { width: 175px; }
    &._4 { width: 225px; }
  }

  .copy {
    p {
      margin-top: 2px;
      font-size: 17px;
      font-weight: 500;
      color: rgba(var(--theme-front-rgb), 0.75);
    }
  }

  @include media-query(small) {
    flex-direction: column;
  }

  @include media-query(medium-up) {
    align-items: center;
  }
}

</style>
