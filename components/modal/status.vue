<script setup>
/*

Sets the status (NIP-38) of the logged-in user, from their profile.

Opened with show-modal { id: 'status', events }, where events are the status
events the profile found. A status replaces the previous one, so there is
nothing to keep from the old event. Once a relay has it, the profile is told
with user-status-published so it shows right away.

 */

import { useSessionStore, LOGIN_TYPE } from '@/stores/session'
import relayPublishRequest from '@/helpers/relayPublishRequest.js'
import relayManager from '@/helpers/relayManager.js'
import sessionRelayService from '@/helpers/sessionRelayService.js'
import publishTracker, { OUTCOME } from '@/helpers/create/publishTracker.js'
import browserHelper from '@/helpers/browserHelper.js'
import userStatusHelper, { MAX_LENGTH, DURATIONS } from '@/helpers/userStatusHelper.js'
import { finalizeEvent } from 'nostr-tools/pure'
import Icons from '@/helpers/icons'
import ToolBox from '@/helpers/toolBox'

const sessionStore = useSessionStore()

// Each request gives up after 10 seconds. This is for the ones that don't.
const MAX_WAIT = 15000

const active = ref(false)
const dialog = ref(null)

let tracker = null
let timeout = null
let announced = false

const text = ref('')
const link = ref('')
const durationId = ref(DURATIONS[0].id)

const events = ref([])
const isSaving = ref(false)
const result = ref(null) // { outcome, accepted, relays, cleared }
const signFailed = ref(false)

function onShowModal(data) {
  const isActive = data.id === 'status'

  if(isActive) {
    events.value = Array.isArray(data.events) ? data.events.slice() : []
    resetForm()
  }

  active.value = isActive

  if(isActive) {
    setTimeout(showDialog, 50)
  }
}

function showDialog() {
  if(dialog.value) dialog.value.showModal()
}

function onHideModal(data) {
  if(data.id === 'status') {
    active.value = false
  }
}

function close() {
  window.emitter.emit('hide-modal', { id: 'status' })
}

// Starts from the status that is up now.
function resetForm() {
  const current = userStatusHelper.current(events.value)

  text.value = current ? current.content : ''
  link.value = current ? (userStatusHelper.link(current) || '') : ''
  durationId.value = DURATIONS[0].id
  result.value = null
  signFailed.value = false
}

const currentStatus = computed(() => {
  return userStatusHelper.current(events.value)
})

const currentDateText = computed(() => {
  const event = currentStatus.value
  if(!event) return null

  let result = 'Your current status was set ' + ToolBox.formatRelativeDate(event.created_at, true)

  const expiration = userStatusHelper.expiration(event)
  if(expiration) {
    result += ', disappears ' + new Date(expiration * 1000).toLocaleString([], {
      weekday: 'short', hour: 'numeric', minute: '2-digit'
    })
  }

  return result
})

const title = computed(() => {
  return currentStatus.value ? 'Update your status' : 'Set a status'
})

const hasText = computed(() => {
  return text.value.trim().length > 0
})

const linkInvalid = computed(() => {
  return link.value.trim().length > 0 && !userStatusHelper.normalizeLink(link.value)
})

const canSave = computed(() => {
  return hasText.value && !linkInvalid.value && !isSaving.value
})

const canClear = computed(() => {
  return !!currentStatus.value && !isSaving.value
})

const resultText = computed(() => {
  if(signFailed.value) return 'Your status was not signed, so nothing was saved.'

  const info = result.value
  if(!info) return null

  const relays = info.relays + ' relay' + (info.relays == 1 ? '' : 's')
  const action = info.cleared ? 'cleared' : 'saved'

  switch(info.outcome) {
    case OUTCOME.PENDING:
      return info.cleared ? 'Clearing your status...' : 'Saving your status...'
    case OUTCOME.SUCCESS:
    case OUTCOME.PARTIAL:
      return 'Your status was ' + action + ' on ' + info.accepted + ' of ' + relays + '.'
    default:
      return 'Your status could not be ' + action + '. None of the ' + relays + ' accepted it. Please try again.'
  }
})

const resultClass = computed(() => {
  const failed = signFailed.value || (result.value && result.value.outcome == OUTCOME.ERROR)
  return failed ? 'result -error' : 'result'
})

// The relays of the session, so the user's other apps see it, and the big one
// the publishers of this site always add.
function publishRelayIds() {
  const relayIds = sessionRelayService.relayIds
  const result = Array.isArray(relayIds) ? relayIds.slice() : Object.keys(relayIds || {})

  const relayId = relayManager.addRelayByUrl('wss://relay.damus.io')
  if(relayId && result.indexOf(relayId) === -1) result.push(relayId)

  return result
}

async function signEvent(event) {
  switch(sessionStore.loginType) {
    case LOGIN_TYPE.PRIVATE_KEY:
      return finalizeEvent(event, ToolBox.privateKeyToBytes(sessionStore.privateKey))
    case LOGIN_TYPE.BROWSER:
      return await browserHelper.signNostrEvent(event)
  }

  return null
}

async function publish(statusText) {
  const cleared = statusText.trim().length == 0

  const event = userStatusHelper.buildEvent({
    publicKey: sessionStore.publicKey,
    text: statusText,
    link: link.value,
    durationId: durationId.value
  })

  isSaving.value = true
  result.value = null
  signFailed.value = false

  const signedEvent = await signEvent(event)
  if(!signedEvent) {
    // The user did not sign it, or there is no way to.
    signFailed.value = true
    isSaving.value = false
    return
  }

  const relayIds = publishRelayIds()

  tracker = publishTracker()
  tracker.expect('status', relayIds)
  announced = false
  report(signedEvent, cleared)

  clearTimeout(timeout)
  timeout = setTimeout(() => {
    tracker.giveUp()
    report(signedEvent, cleared)
  }, MAX_WAIT)

  for(const relayId of relayIds) {
    const request = relayPublishRequest()
    request.publish(relayId, signedEvent, (data) => {
      tracker.record('status', data.relayId, data.status)
      report(signedEvent, cleared)
    })
  }
}

function report(signedEvent, cleared) {
  const summary = tracker.summary()
  const info = summary.events.status

  result.value = {
    outcome: summary.outcome,
    accepted: info ? info.accepted : 0,
    relays: info ? info.relays : 0,
    cleared
  }

  // A relay has it, so it is the status now.
  if(info && info.accepted > 0 && !announced) {
    announced = true
    events.value.push(signedEvent)
    window.emitter.emit('user-status-published', signedEvent)

    if(cleared) {
      text.value = ''
      link.value = ''
    }
  }

  if(summary.outcome != OUTCOME.PENDING) {
    clearTimeout(timeout)
    isSaving.value = false
  }
}

function saveStatus() {
  if(canSave.value) publish(text.value)
}

// Enter in a text field saves, like a form would.
function onEnter(event) {
  if(event.target && event.target.tagName == 'INPUT') saveStatus()
}

function clearStatus() {
  if(canClear.value) publish('')
}

onMounted(() => {
  window.emitter.on('show-modal', onShowModal)
  window.emitter.on('hide-modal', onHideModal)
})

onBeforeUnmount(() => {
  window.emitter.off('show-modal', onShowModal)
  window.emitter.off('hide-modal', onHideModal)
  clearTimeout(timeout)
})
</script>

<template>
  <Transition v-if="active" name="modal" appear>
    <dialog
      class="modal-status -modal"
      ref="dialog"
      @close="close"
    >
      <div class="wrap">
        <div class="content">
          <button
            class="-close"
            title="Close"
            v-html="Icons.cross"
            @click="close"
          />
          <h3>{{ title }}</h3>
          <p class="description">Let people know what you are up to. It shows under your name here and in other Nostr apps that support statuses.</p>
          <p class="current" v-if="currentStatus">{{ currentDateText }}</p>
          <div class="fields" @keydown.enter="onEnter">
            <div class="field-set">
              <label>Status</label>
              <UiInput
                placeholder="What are you up to?"
                size="small"
                :maxlength="MAX_LENGTH"
                v-model="text"
              />
            </div>
            <div class="field-set">
              <label>Link (optional)</label>
              <UiInput
                placeholder="https://..."
                size="small"
                v-model="link"
              />
              <p class="hint -error" v-if="linkInvalid">That doesn't look like a website address.</p>
            </div>
            <div class="field-set">
              <label>Clear after</label>
              <div class="durations">
                <button
                  v-for="duration in DURATIONS"
                  :key="duration.id"
                  type="button"
                  :class="duration.id == durationId ? '-active' : null"
                  @click="durationId = duration.id"
                >{{ duration.label }}</button>
              </div>
            </div>
          </div>
          <p :class="resultClass" v-if="resultText">{{ resultText }}</p>
          <div class="options">
            <UiButton
              size="tiny"
              look="outline"
              :disabled="!canClear"
              @click="clearStatus"
            >Clear status</UiButton>
            <UiButton
              size="tiny"
              :disabled="!canSave"
              @click="saveStatus"
            >Save status</UiButton>
          </div>
        </div>
      </div>
    </dialog>
  </Transition>
</template>

<style scoped lang="scss">

.modal-status {
  max-width: calc(100% - 30px);
  max-height: calc(100% - 30px);
  align-items: center;

  .wrap {
    padding: 0;
    box-sizing: border-box;
    width: 100%;
    max-width: 420px;

    .content {
      display: flex;
      flex-direction: column;
      gap: 15px;
      @include r('padding', 20, 30);
      position: relative;
      background-color: white;
      border-radius: 15px;
      box-sizing: border-box;
      color: var(--front);

      button.-close {
        position: absolute;
        top: 15px;
        right: 15px;
        padding: 10px;
        appearance: none;
        background-color: transparent;
        border-width: 0;
        opacity: 0.35;
        cursor: pointer;
        transition: all 150ms $ease;

        :deep(svg) {
          width: 16px;
          height: 16px;
          color: black;
        }

        &:hover {
          opacity: 1;
        }
      }

      h3 {
        @include r('font-size', 17, 19);
        font-weight: 600;
        padding-right: 30px;
      }

      .description {
        font-size: 14px;
        color: var(--text-light);
      }

      .current {
        font-size: 13px;
        color: var(--text-light);
      }

      label {
        font-weight: 500;
      }

      .fields {
        display: flex;
        flex-direction: column;
        gap: 15px;

        .field-set {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
      }

      .durations {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;

        button {
          border: none;
          cursor: pointer;
          font: inherit;
          font-size: 13px;
          background-color: rgba(var(--front-rgb), 0.075);
          color: var(--front);
          border-radius: 100px;
          padding: 3px 11px;

          &.-active {
            background-color: var(--front);
            color: var(--back);
          }
        }
      }

      .hint,
      .result {
        font-size: 14px;

        &.-error {
          color: var(--red);
        }
      }

      .options {
        display: flex;
        gap: 20px;
        justify-content: space-between;
        margin-top: 5px;
      }
    }
  }
}

</style>
