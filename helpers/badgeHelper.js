/*

Works out which badges a user displays on their profile (NIP-58).

Profile badges are a kind 10008 list of "a" and "e" tag pairs, one pair per
badge. The "a" tag points at the badge definition (kind 30009), the "e" tag at
the award (kind 8). Before 10008 existed this was a kind 30008 event with a "d"
tag of "profile_badges", which is deprecated but still what many users have.
Both are read, and the newer one wins.

Kind 30008 with any other "d" tag is a badge set, a way to group badges. Those
are not shown.

 */

const PROFILE_BADGES_KIND = 10008
const LEGACY_PROFILE_BADGES_KIND = 30008
const LEGACY_PROFILE_BADGES_ID = 'profile_badges'
const BADGE_DEFINITION_KIND = 30009

export default {
  isProfileBadgesEvent(event) {
    if(!event || !Array.isArray(event.tags)) return false

    if(event.kind == PROFILE_BADGES_KIND) return true

    return event.kind == LEGACY_PROFILE_BADGES_KIND &&
      event.tags.some(tag => tag[0] == 'd' && tag[1] == LEGACY_PROFILE_BADGES_ID)
  },

  // Relays can hold different versions of the list, only the newest counts.
  latestProfileBadgesEvent(events) {
    let result = null

    for(const event of (events || [])) {
      if(!this.isProfileBadgesEvent(event)) continue

      if(!result || event.created_at > result.created_at) {
        result = event
      }
    }

    return result
  },

  // Returns [{ address, kind, pubkey, identifier, awardId, relayHint }]
  profileBadges(events) {
    const event = this.latestProfileBadgesEvent(events)
    const result = []

    if(!event) return result

    const tags = event.tags
    const seen = {}

    for(let i=0; i<tags.length - 1; i++) {
      const definitionTag = tags[i]
      const awardTag = tags[i + 1]

      // An "a" tag without the "e" tag right after it is to be ignored.
      if(definitionTag[0] != 'a' || awardTag[0] != 'e') continue
      if(typeof definitionTag[1] != 'string' || typeof awardTag[1] != 'string') continue

      // The identifier is the last part and may itself contain colons.
      const bits = definitionTag[1].split(':')
      const kind = parseInt(bits[0])
      const pubkey = bits[1]
      const identifier = bits.slice(2).join(':')

      if(kind != BADGE_DEFINITION_KIND || !pubkey || bits.length < 3) continue

      if(seen[definitionTag[1]]) continue
      seen[definitionTag[1]] = true

      result.push({
        address: definitionTag[1],
        kind,
        pubkey,
        identifier,
        awardId: awardTag[1],
        relayHint: awardTag[2] || definitionTag[2] || null
      })
    }

    return result
  }
}
