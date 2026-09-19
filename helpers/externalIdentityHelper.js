/*

Finds the accounts on other platforms a user links to (NIP-39).

These are "i" tags like ["i", "github:gbks", "<proof>"]. They used to be on the
profile event (kind 0) and have moved to an event of their own, kind 10011.
Many users still only have them on their profile, so that is the fallback.

NIP-51 uses kind 10011 for something else as well ("favorite follow sets", with
"a" tags). An event like that has no "i" tags and is skipped.

 */

export const EXTERNAL_IDENTITIES_KIND = 10011

function identityTags(event) {
  if(!event || !Array.isArray(event.tags)) return []

  const seen = {}

  return event.tags.filter(tag => {
    // "platform:identity", with something on both sides of the colon.
    if(tag[0] != 'i' || typeof tag[1] != 'string') return false

    const split = tag[1].indexOf(':')
    if(split < 1 || split == tag[1].length - 1) return false

    if(seen[tag[1]]) return false
    seen[tag[1]] = true

    return true
  })
}

export default {
  // Takes the profile event (kind 0) and any kind 10011 events that were found.
  // Returns "i" tags.
  identities(profileEvent, identityEvents) {
    // Relays can hold different versions of the list, newest first.
    const events = (identityEvents || [])
      .filter(event => event && event.kind == EXTERNAL_IDENTITIES_KIND)
      .sort((a, b) => b.created_at - a.created_at)

    for(const event of events) {
      const tags = identityTags(event)
      if(tags.length > 0) return tags
    }

    return identityTags(profileEvent)
  }
}
