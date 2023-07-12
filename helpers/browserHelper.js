
/*

Loads profiles from a kind 3 event.

 */

export default { 
  log: !false,

  isWebLNAvailable() {
    return window !== undefined && window.webln !== undefined
  },

  isNostrAvailable() {
    return window !== undefined && window.nostr !== undefined
  },

  async enableWebLN() {
    try {
      await window.webln.enable()
      return true
    } catch(error) {
      return false
    }
  },

  async enableNostr() {
    try {
      await window.enable.enable()
      return true
    } catch(error) {
      return false
    }
  },

  async signNostrEvent(zapEvent, callback) {
    if(this.isNostrAvailable()) {
      try {
        return await window.nostr.signEvent(zapEvent)
      } catch(error) {
        // Either user rejected signage or the event was invalid
        if(callback) {
          callback({
            message: 'sign-event-failed',
            error,
            zapEvent
          })
        }
        return null
      }
    } else {
      if(callback) {
        callback({
          message: 'nostr-not-available'
        })
      }
      return null
    }
  }
}