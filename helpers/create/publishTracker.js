/*

Keeps track of how saving a new profile is going.

A new profile is three events (profile, relay list, follows), each sent to
several relays. Relays answer one after the other, some not at all. This says
when saving is over and how it went:

- "success": every event was accepted by at least one relay. That is enough
  for the profile to exist, so there is no need to wait for slow relays.
- "partial": all relays have answered or timed out, some events made it.
- "error": all relays have answered or timed out, nothing made it.
- "pending": still waiting.

 */

export const OUTCOME = {
  PENDING: 'pending',
  SUCCESS: 'success',
  PARTIAL: 'partial',
  ERROR: 'error'
}

export default function publishTracker() {
  return {
    // Event name to { relayId: 'pending' | 'success' | 'error' | 'timeout' }
    events: {},

    // Call for every relay an event is sent to, before results come in.
    expect(eventName, relayIds) {
      if(!this.events[eventName]) this.events[eventName] = {}

      for(const relayId of (relayIds || [])) {
        if(relayId && !this.events[eventName][relayId]) {
          this.events[eventName][relayId] = 'pending'
        }
      }
    },

    record(eventName, relayId, status) {
      if(!this.events[eventName]) this.events[eventName] = {}

      // A relay can time out and still accept the event later. Not the other way around.
      if(this.events[eventName][relayId] == 'success') return

      this.events[eventName][relayId] = status == 'success' ? 'success' : (status || 'error')
    },

    // Marks everything that hasn't answered as timed out. For when waiting is over.
    giveUp() {
      for(const eventName in this.events) {
        for(const relayId in this.events[eventName]) {
          if(this.events[eventName][relayId] == 'pending') {
            this.events[eventName][relayId] = 'timeout'
          }
        }
      }
    },

    summary() {
      const events = {}
      let total = 0, saved = 0, pending = 0

      for(const eventName in this.events) {
        const statuses = Object.values(this.events[eventName])
        const info = {
          relays: statuses.length,
          accepted: statuses.filter(status => status == 'success').length,
          pending: statuses.filter(status => status == 'pending').length
        }
        info.saved = info.accepted > 0

        events[eventName] = info
        total++
        if(info.saved) saved++
        pending += info.pending
      }

      let outcome = OUTCOME.PENDING
      if(total > 0 && saved == total) {
        outcome = OUTCOME.SUCCESS
      } else if(total > 0 && pending == 0) {
        outcome = saved > 0 ? OUTCOME.PARTIAL : OUTCOME.ERROR
      }

      return { outcome, events }
    }
  }
}
