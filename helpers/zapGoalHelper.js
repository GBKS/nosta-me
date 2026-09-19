/*

Reads zap goals (kind 9041, NIP-75): a fundraising goal with a target amount.
People contribute by zapping the goal event, and the zap receipts that point at
it add up to the progress.

Two apps use kind 9041 for something else, without an amount. Those are skipped.

 */

export const ZAP_GOAL_KIND = 9041

const MAX_TEXT_LENGTH = 140
const MAX_RELAYS = 3
const MAX_AGE_WITHOUT_END = 180 * 24 * 60 * 60 // Seconds

function tagValue(event, name) {
  const tag = event.tags.find(tag => tag[0] == name && typeof tag[1] == 'string')
  return tag ? tag[1] : null
}

function shorten(text, maxLength) {
  const clean = text.replace(/\s+/g, ' ').trim()
  return clean.length > maxLength ? clean.substr(0, maxLength - 1).trim() + '…' : clean
}

export default {
  // Returns { id, pubkey, text, targetSats, closedAt, relays, created_at }, or
  // null if it is not a goal we can show.
  parse(event) {
    if(!event || event.kind != ZAP_GOAL_KIND || !Array.isArray(event.tags)) return null

    // The amount is in millisats
    const amount = tagValue(event, 'amount')
    const targetSats = amount && /^[0-9]+$/.test(amount) ? Math.floor(parseInt(amount) / 1000) : 0
    if(!(targetSats > 0) || !Number.isSafeInteger(targetSats)) return null

    const text = shorten(typeof event.content == 'string' && event.content.trim() ? event.content : (tagValue(event, 'summary') || ''), MAX_TEXT_LENGTH)
    if(text.length == 0) return null

    const closed = tagValue(event, 'closed_at')
    const closedAt = closed && /^[0-9]+$/.test(closed) ? parseInt(closed) : null

    // Where the zaps for this goal are sent to, and tallied from
    const relaysTag = event.tags.find(tag => tag[0] == 'relays') || []
    const relays = relaysTag.slice(1)
      .filter(url => typeof url == 'string' && /^wss:\/\/[^\s]+$/.test(url.trim()))
      .map(url => url.trim())
      .slice(0, MAX_RELAYS)

    return {
      id: event.id,
      pubkey: event.pubkey,
      text,
      targetSats,
      closedAt,
      relays,
      created_at: event.created_at
    }
  },

  // Almost nobody sets "closed_at", so a goal without one would be open forever.
  // After half a year we take it that the goal is history.
  isOpen(goal, now) {
    if(goal.closedAt) return goal.closedAt > now

    return goal.created_at > now - MAX_AGE_WITHOUT_END
  },

  // Goals that still take contributions, newest first. Some accounts post the
  // same goal again every day, that one is shown once.
  // now is in seconds.
  openGoals(events, now, count) {
    const seen = {}
    const result = []

    const sorted = (events || []).slice().sort((a, b) => b.created_at - a.created_at)

    for(const event of sorted) {
      const goal = this.parse(event)
      if(!goal || seen[goal.id] || seen[goal.text] || !this.isOpen(goal, now)) continue

      seen[goal.id] = true
      seen[goal.text] = true
      result.push(goal)

      if(count && result.length >= count) break
    }

    return result
  },

  // zaps: zaps as returned by zapReceiptHelper.parse()
  // Returns { sats, count, percent } for the zaps that count towards the goal.
  progress(goal, zaps) {
    const seen = {}
    let sats = 0, count = 0

    for(const zap of (zaps || [])) {
      if(!zap || zap.eventId != goal.id) continue

      // The goal is the author's. Zaps to someone else don't raise it.
      if(zap.recipient != goal.pubkey) continue

      // Zaps after the goal has closed don't count.
      if(goal.closedAt && zap.created_at > goal.closedAt) continue

      if(seen[zap.requestId]) continue
      seen[zap.requestId] = true

      sats += zap.sats
      count++
    }

    return {
      sats,
      count,
      percent: Math.min(100, Math.floor(sats / goal.targetSats * 100))
    }
  }
}
