<script setup>
/*

Shows a loader and if it loads too long shows a timeout and some tips

- Restart when the public key changes
- Stop when events pop in

*/

const props = defineProps([
  'status',
  'events',
  'isOwner' // The logged-in user is looking at their own profile
])

const steps = [
  {
    emoji: null,
    copy: null,
    timer: 2500
  },
  {
    emoji: "🔎",
    copy: "Looking...",
    timer: 2500
  },
  {
    emoji: "🕵️",
    copy: "Investigating...",
    timer: 2500
  },
  {
    emoji: "🧐",
    copy: "Inspecting...",
    timer: 2500
  },
  {
    emoji: "🤨",
    copy: "Rummaging...",
    timer: 2500
  },
  {
    emoji: "🫤",
    copy: 'Sorry, could not find a profile with the {type} <span>"{id}"</span>.',
    timer: null
  }
]

const errorState = {
    emoji: "🫠",
    copy: 'Oh no, this profile name or Id is not valid: <span>"{id}"</span>.',
}

let timerStep = ref(-1)
let timer = null
const copy = ref(null)
const emoji = ref(null)

watch(() => props.status, (newStatus, oldStatus) => {
  evaluateStatus(newStatus)
})

watch(() => props.events, (newEvents, oldEvents) => {
  if(newEvents && newEvents.length > 0) {
    stop()
  }
})

function evaluateStatus(status) {
  if(status) {
    if(status.state == 'loading') {
      start()
    } else if(status.state == 'loaded') {
      stop()
    } else if(status.state == 'error') {
      stop()
      showError()
    }
  }
}

function start() {
  timerStep.value = -1
  nextStep()
}

function stop() {
  clearTimeout(timer)
  emoji.value = null
  copy.value = null
}

function showError() {
  clearTimeout(timer)
  displayInfo(errorState, props.status)
}

function displayInfo(info, data) {
  emoji.value = info.emoji

  let copyText = info.copy
  if(copyText) {
    const replace = {}
    if(data.npub) {
      replace.type = 'npub'
      replace.id = data.npub
    } else if(data.nprofile) {
      replace.type = 'nprofile'
      replace.id = data.nprofile
    } else if(data.nip05) {
      replace.type = 'nip05'
      replace.id = data.nip05
    } else if(data.publicKey) {
      replace.type = 'publicKey'
      replace.id = data.publicKey
    }

    for(let i in replace) {
      copyText = copyText.split('{'+i+'}').join(escapeHtml(replace[i]))
    }
  }
  copy.value = copyText
}

// The id comes from the URL and the copy is rendered with v-html.
function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function nextStep() {
  clearTimeout(timer)

  if(timerStep.value < (steps.length-1)) {
    timerStep.value = timerStep.value + 1

    const step = steps[timerStep.value]

    displayInfo(step, props.status)

    if(step.timer) {
      timer = setTimeout(nextStep, step.timer)
    }
  }
}

// The last step is "could not find a profile"
const showSetUp = computed(() => {
  const state = props.status ? props.status.state : null
  return props.isOwner && state != 'error' && timerStep.value == steps.length - 1
})

const statusId = computed(() => {
  let result = 'default_'+timerStep.value

  if(props.status) {
    for(let i in props.status) {
      result += '_'+i+'_'+props.status[i]
    }
  }

  return result
})

onMounted(() => {
  evaluateStatus(props.status)
})
</script>

<template>
  <Transition name="fade" :key="statusId" :tets="statusId" appear>
    <div v-if="copy" class="profile-loader">
      <p v-if="emoji">{{ emoji }}</p>
      <p v-html="copy" />
      <!-- Nothing found, and it's the user's own key: they can create the profile here. -->
      <div v-if="showSetUp" class="set-up">
        <p>This is your key. If you have no profile yet, you can create one now.</p>
        <UiButton to="/edit/profile" size="small">Set up your profile</UiButton>
      </div>
    </div>
  </Transition>
</template>

<style scoped lang="scss">

.profile-loader {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  display: flex;
  flex-direction: column;
  padding: 75px;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;

  > p {
    text-align: center;

    &:first-child {
      font-size: 48px;
    }

    &:nth-child(2) {
      margin-top: 15px;
      font-size: 15px;
      line-height: 1.6;
      font-weight: 600;
      color: rgba(var(--theme-front-rgb), 0.75);

      :deep(span) {
        word-break: break-all;
        color: var(--theme-front);
      }
    }
  }

  .set-up {
    margin-top: 25px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 15px;

    p {
      text-align: center;
      font-size: 15px;
      line-height: 1.6;
      font-weight: 600;
      color: rgba(var(--theme-front-rgb), 0.75);
    }
  }
}

</style>
