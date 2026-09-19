/*

Reads highlights (kind 9802, NIP-84): passages a user marked in an article, a
note or a web page. The content is the passage. Tags say where it is from:

- "a" or "e" for something on Nostr
- "r" for a web page. A highlight with a comment can have more "r" tags for the
  links in the comment, those are marked "mention". The source is marked
  "source", or not marked at all by older clients.

A "comment" tag holds what the user had to say about the passage.

 */

export const HIGHLIGHT_KIND = 9802

const MAX_TEXT_LENGTH = 320
const MAX_COMMENT_LENGTH = 200

function shorten(text, maxLength) {
  const clean = text.replace(/\s+/g, ' ').trim()
  return clean.length > maxLength ? clean.substr(0, maxLength - 1).trim() + '…' : clean
}

// Only links to web pages. The tag is text from a user, and could be anything.
function webUrl(value) {
  if(typeof value != 'string') return null

  try {
    const url = new URL(value.trim())
    return url.protocol == 'https:' || url.protocol == 'http:' ? url : null
  } catch(error) {
    return null
  }
}

function findSource(tags) {
  const webTags = tags.filter(tag => tag[0] == 'r' && tag[2] != 'mention')
  const webTag = webTags.find(tag => tag[2] == 'source') || webTags[0]
  const url = webTag ? webUrl(webTag[1]) : null

  if(url) {
    return { type: 'web', url: url.toString(), name: url.hostname.replace(/^www\./, '') }
  }

  const addressTag = tags.find(tag => tag[0] == 'a' && typeof tag[1] == 'string')
  if(addressTag) {
    // "<kind>:<pubkey>:<identifier>", and the identifier may contain colons
    const bits = addressTag[1].split(':')
    const kind = parseInt(bits[0])

    if(kind > 0 && /^[0-9a-f]{64}$/.test(bits[1] || '') && bits.length >= 3) {
      return {
        type: 'address',
        kind,
        pubkey: bits[1],
        identifier: bits.slice(2).join(':'),
        relay: addressTag[2] || null
      }
    }
  }

  const eventTag = tags.find(tag => tag[0] == 'e' && /^[0-9a-f]{64}$/.test(tag[1] || ''))
  if(eventTag) {
    return { type: 'event', id: eventTag[1], relay: eventTag[2] || null }
  }

  return null
}

export default {
  // Returns { id, text, comment, source, created_at }, or null if there is no passage.
  parse(event) {
    if(!event || event.kind != HIGHLIGHT_KIND || typeof event.content != 'string') return null

    const text = shorten(event.content, MAX_TEXT_LENGTH)
    if(text.length == 0) return null

    const tags = Array.isArray(event.tags) ? event.tags : []
    const commentTag = tags.find(tag => tag[0] == 'comment' && typeof tag[1] == 'string')
    const comment = commentTag ? shorten(commentTag[1], MAX_COMMENT_LENGTH) : ''

    return {
      id: event.id,
      text,
      comment: comment.length > 0 ? comment : null,
      source: findSource(tags),
      created_at: event.created_at
    }
  },

  // Newest first, the same passage only once.
  latest(events, count) {
    const seen = {}
    const result = []

    const sorted = (events || []).slice().sort((a, b) => b.created_at - a.created_at)

    for(const event of sorted) {
      const highlight = this.parse(event)
      if(!highlight || seen[highlight.text]) continue

      seen[highlight.text] = true
      result.push(highlight)

      if(count && result.length >= count) break
    }

    return result
  }
}
