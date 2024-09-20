<script setup>
import Icons from '@/helpers/icons'
import { useRelayStore } from '@/stores/relays'

const props = defineProps([
  'isOwner',
  'info',
  'infoEvents',
  'publicKey',
  'relayData',
  'followData',
  'followDataEvents',
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
  'reportedData',
  'fileData',
  'liveData',
  'eventsData',
  'calendarData',
  'classifiedsData',
  'zapGoalData',
  'userStatusData',
  'pinstrData',
  'labelData',
  'stats'
])

const relayStore = useRelayStore()
const emit = defineEmits(['close'])

const zapCount = computed(() => {
  const sent = props.sentZapsData ? props.sentZapsData.length : 0 
  const received = props.receivedZapsData ? props.receivedZapsData.length : 0 
  return sent + received
})

const navOptions = computed(() => {
  return [
    {
      id: 'profile',
      name: 'Profile',
      count: props.infoEvents ? props.infoEvents.length : 0 
    },
    {
      id: 'following',
      name: 'Following',
      count: props.followDataEvents ? props.followDataEvents.length : 0 
    },
    {
      id: 'relays',
      name: 'Relays',
      count: props.relayData ? props.relayData.length : 0 
    },
    {
      id: 'userstatuses',
      name: 'Status',
      count: props.userStatusData ? props.userStatusData.length : 0 
    },
    {
      id: 'short-notes',
      name: 'Short notes',
      count: props.shortNotesData ? props.shortNotesData.length : 0 
    },
    {
      id: 'long-notes',
      name: 'Long notes',
      count: props.longNotesData ? props.longNotesData.length : 0 
    },
    {
      id: 'stalls',
      name: 'Stalls',
      count: props.stallData ? props.stallData.length : 0 
    },
    {
      id: 'products',
      name: 'Products',
      count: props.productData ? props.productData.length : 0 
    },
    {
      id: 'apps',
      name: 'Apps',
      count: props.handlerData ? props.handlerData.length : 0 
    },
    {
      id: 'lists',
      name: 'Lists',
      count: props.listsData ? props.listsData.length : 0 
    },
    {
      id: 'badges',
      name: 'Badges',
      count: props.badgeData ? props.badgeData.length : 0 
    },
    {
      id: 'zaps',
      name: 'Zaps',
      count: zapCount.value
    },
    {
      id: 'zapgoals',
      name: 'Zap goals',
      count: props.zapGoalData ? props.zapGoalData.length : 0 
    },
    {
      id: 'reports',
      name: 'Reports',
      count: props.reportsData ? props.reportsData.length : 0 
    },
    {
      id: 'files',
      name: 'Files',
      count: props.fileData ? props.fileData.length : 0 
    },
    {
      id: 'live',
      name: 'Live',
      count: props.liveData ? props.liveData.length : 0 
    },
    {
      id: 'events',
      name: 'Events',
      count: props.eventsData ? props.eventsData.length : 0 
    },
    {
      id: 'calendars',
      name: 'Calendars',
      count: props.calendarData ? props.calendarData.length : 0 
    },
    {
      id: 'classifieds',
      name: 'Classifieds',
      count: props.classifiedsData ? props.classifiedsData.length : 0 
    },
    {
      id: 'pinstr',
      name: 'Pinstr',
      count: props.pinstrData ? props.pinstrData.length : 0 
    },
    {
      id: 'labels',
      name: 'Labels',
      count: props.labelData ? props.labelData.length : 0 
    }
  ]
})
const activeNavOptionId = ref(navOptions.value[0].id)

function setActiveNavOption(id) {
  activeNavOptionId.value = id
}

const formattedStats = computed(() => {
  let result = null

  if(props.stats && props.stats.count > 0) {
    const relayCount = Object.keys(props.stats.relays).length
    result = 'Found ' + props.stats.count + ' note' + (props.stats.count == 1 ? '' : 's') + ' across ' + relayCount + ' relay' + (relayCount == 1 ? '' : 's') + '.'
    // return JSON.stringify(props.stats, undefined, 2)
  }

  return result
})

function close() {
  emit('close')
}
</script>

<template>
  <div class="profile-data-overlay">
    <div class="wrap">
      <div class="content">
        <button
          class="-close"
          title="Close"
          v-html="Icons.cross"
          @click="close"
        />

        <h1>Profile data</h1>
        <p v-if="formattedStats">{{ formattedStats }}</p>

        <div class="columns">
          <ProfileDataOverlayNav
            :info="navOptions"
            :activeId="activeNavOptionId"
            @select="setActiveNavOption"
          />

          <ProfileDataOverlayMeta
            v-if="activeNavOptionId == 'profile'"
            :isOwner="isOwner"
            :publicKey="publicKey"
            :info="infoEvents"
          />

          <ProfileDataOverlayFollowing
            v-if="activeNavOptionId == 'following'"
            :isOwner="isOwner"
            :info="followDataEvents"
          />

          <ProfileDataOverlayRelays
            v-if="activeNavOptionId == 'relays'"
            :info="relayData"
          />

          <ProfileDataOverlayShortNotes
            v-if="activeNavOptionId == 'short-notes'"
            :info="shortNotesData"
          />

          <ProfileDataOverlayLongNotes
            v-if="activeNavOptionId == 'long-notes'"
            :info="longNotesData"
          />

          <ProfileDataOverlayStalls
            v-if="activeNavOptionId == 'stalls'"
            :info="stallData"
          />

          <ProfileDataOverlayProducts
            v-if="activeNavOptionId == 'products'"
            :info="productData"
          />

          <ProfileDataOverlayApps
            v-if="activeNavOptionId == 'apps'"
            :info="handlerData"
          />

          <ProfileDataOverlayLists
            v-if="activeNavOptionId == 'lists'"
            :info="listsData"
          />

          <ProfileDataOverlayBadges
            v-if="activeNavOptionId == 'badges'"
            :info="badgeData"
          />

          <ProfileDataOverlayZaps
            v-if="activeNavOptionId == 'zaps'"
            :sentInfo="sentZapsData"
            :receivedInfo="receivedZapsData"
          />

          <ProfileDataOverlayReports
            v-if="activeNavOptionId == 'reports'"
            :info="reportsData"
          />

          <ProfileDataOverlayFiles
            v-if="activeNavOptionId == 'files'"
            :info="fileData"
          />

          <ProfileDataOverlayLive
            v-if="activeNavOptionId == 'live'"
            :info="liveData"
          />

          <ProfileDataOverlayEvents
            v-if="activeNavOptionId == 'events'"
            :info="eventsData"
          />

          <ProfileDataOverlayCalendars
            v-if="activeNavOptionId == 'calendars'"
            :info="calendarData"
          />

          <ProfileDataOverlayClassifieds
            v-if="activeNavOptionId == 'classifieds'"
            :info="classifiedsData"
          />

          <ProfileDataOverlayUserStatuses
            v-if="activeNavOptionId == 'userstatuses'"
            :info="userStatusData"
          />

          <ProfileDataOverlayZapGoals
            v-if="activeNavOptionId == 'zapgoals'"
            :info="zapGoalData"
          />

          <ProfileDataOverlayPinstr
            v-if="activeNavOptionId == 'pinstr'"
            :info="pinstrData"
          />

          <ProfileDataOverlayLabels
            v-if="activeNavOptionId == 'labels'"
            :info="labelData"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">

.profile-data-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(black, 0.2);
  z-index: 144;

  .wrap {
    padding: 20px;
    width: 100%;
    height: 100%;
    overflow-y: scroll;
    box-sizing: border-box;

    .content {
      max-width: 800px;
      margin-left: auto;
      margin-right: auto;
      background-color: white;
      border-radius: 15px;
      padding: 20px;
      position: relative;

      button.-close {
        position: absolute;
        top: 15px;
        right: 15px;
        padding: 10px;
        appearance: none;
        background-color: transparent;
        border-width: 0;
        line-height: 0;
        border-radius: 3px;
        transition: all 150ms $ease;
        opacity: 0.5;
        cursor: pointer;

        :deep(svg) {
          width: 16px;
          height: 16px;
          color: black;
        }

        &:hover {
          opacity: 1;
          background-color: rgba(var(--front-rgb), 0.05);
        }
      }

      h1 {
        @include r('font-size', 36, 64);
      }

      .columns {
        display: flex;
        max-width: 100%;
        @include r('margin-top', 15, 30);

        :deep(> div > h3) {
          font-size: 18px;
          font-weight: 600;
        }

        :deep(> div > h4) {
          font-size: 16px;
          font-weight: 600;
        }

        :deep(> div > p) {
          font-size: 16px;

          a {
            text-decoration: none;
            color: var(--front);

            &:hover {
              text-decoration: underline;
            }
          }
        }
      }

      h6 {
        font-weight: 600;

        span {
          font-weight: 400;
          color: #808080;

          a {
            color: #808080;
            text-decoration: none;

            &:hover {
              color: var(--red);
              text-decoration: underline;
            }
          }
        }

        & + p {
          margin-top: 5px;
        }
      }

      > p {
        & + h6 {
          margin-top: 20px;
        }

        a {
          color: black;
          text-decoration: none;

          &:hover {
            text-decoration: underline;
          }
        }
      }

      code {
        word-break: break-all;
      }

      > pre {
        border: 1px dashed #dedede;
        background-color: #f8f8f8;
        overflow-x: auto;
        // white-space: pre-wrap;
        border-radius: 5px;
        padding: 10px;

        & + h6 {
          margin-top: 20px;
        }
      }
    }
  }

  @include media-query(small) {
    .wrap {
      .content {
        .columns {
          flex-direction: column;
          gap: 20px;
        }
      }
    }
  }

  @include media-query(medium-up) {
    .wrap {
      .content {
        .columns {
          gap: 30px;
        }
      }
    }
  }
}

</style>
