/*

Builds NIP-38 user status events (kind 30315) for the logged-in user.

A status is addressable by its "d" tag. This site only sets the "general" one;
"music" is for players that post what is playing. Publishing a new one replaces
the old one. An empty status clears it. An "r" tag links it to a website, an
"expiration" tag (NIP-40) has clients hide it after that time.

 */

export const STATUS_KIND = 30315
export const GENERAL = 'general'

// Longer ones get cut off on profiles.
export const MAX_LENGTH = 80

// How long a status stays up. Seconds, null for until it's changed.
export const DURATIONS = [
  { id: 'never', label: 'Keep it', seconds: null },
  { id: '30m', label: '30 minutes', seconds: 30 * 60 },
  { id: '1h', label: '1 hour', seconds: 60 * 60 },
  { id: '4h', label: '4 hours', seconds: 4 * 60 * 60 },
  { id: '1d', label: '1 day', seconds: 24 * 60 * 60 },
  { id: '1w', label: '1 week', seconds: 7 * 24 * 60 * 60 }
]

function tagValue(event, name) {
  const tag = (event && Array.isArray(event.tags)) ? event.tags.find(tag => tag[0] == name) : null
  return tag ? tag[1] : null
}

export default {

  // A website for the "r" tag, or null if there is none or it isn't one.
  // "example.com" becomes "https://example.com".
  normalizeLink(link) {
    const text = (link || '').trim()
    if(text.length == 0) return null

    const withScheme = /^[a-z][a-z0-9+.-]*:/i.test(text) ? text : 'https://' + text

    try {
      const url = new URL(withScheme)
      if(url.protocol != 'https:' && url.protocol != 'http:') return null
      if(!url.hostname.includes('.')) return null
      return url.href
    } catch(error) {
      return null
    }
  },

  // The unsigned event. Without text, it clears the status.
  // now is in seconds, for tests.
  buildEvent({ publicKey, text, link, durationId, now }) {
    const createdAt = now || Math.floor(Date.now() / 1000)
    const content = (text || '').trim().slice(0, MAX_LENGTH)
    const tags = [['d', GENERAL]]

    if(content.length > 0) {
      const url = this.normalizeLink(link)
      if(url) tags.push(['r', url])

      const duration = DURATIONS.find(item => item.id == durationId)
      if(duration && duration.seconds) {
        tags.push(['expiration', String(createdAt + duration.seconds)])
      }
    }

    return {
      pubkey: publicKey,
      created_at: createdAt,
      kind: STATUS_KIND,
      tags,
      content
    }
  },

  // The general status that is up now, out of the ones relays sent, or null.
  // now is in seconds, for tests.
  current(events, now) {
    const time = now || Math.floor(Date.now() / 1000)

    const newest = (events || [])
      .filter(event => event && event.kind == STATUS_KIND && tagValue(event, 'd') == GENERAL)
      .sort((a, b) => b.created_at - a.created_at)[0]

    if(!newest || !newest.content || newest.content.length == 0) return null

    const expiration = parseInt(tagValue(newest, 'expiration'))
    if(expiration && expiration <= time) return null

    return newest
  },

  link(event) {
    return tagValue(event, 'r')
  },

  expiration(event) {
    const value = parseInt(tagValue(event, 'expiration'))
    return value ? value : null
  }
}
