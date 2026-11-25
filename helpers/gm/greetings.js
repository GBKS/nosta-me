import zapReceiptHelper from '@/helpers/zapReceiptHelper.js'

/*

The data behind the gm sky.

Every person who said gm gets one sun, everyone who said gn one moon. Each
of them keeps all of that person's greetings from the loaded time span, and
each greeting keeps its pile-ins (reactions and zaps) with their timestamps.
That way the sky can be drawn for any moment, which is what the replay does.

 */

export const DAY = 86400

const GM = /^(?:g+m+(?![a-z])|good\s*morning|guten\s*morgen|moin|buenos\s*d[ií]as|bom\s*dia|bonjour|ohay[oō]+u?|おはよう|早安|早上好|☀|🌅|🌞|🌄)/iu
const GN = /^(?:g+n+(?![a-z])|good\s*night|gute\s*nacht|buenas\s*noches|boa\s*noite|bonne\s*nuit|oyasumi|おやすみ|晚安|🌙|😴)/iu

// 'gm', 'gn' or null. Only short top-level notes count, not replies.
export function greetingOf(event) {
  if(!event || event.kind != 1 || !Array.isArray(event.tags)) return null
  if(event.tags.some(tag => tag[0] == 'e')) return null

  const content = typeof event.content == 'string' ? event.content.trim() : ''
  if(!content || content.length > 280) return null

  if(GM.test(content)) return 'gm'
  if(GN.test(content)) return 'gn'
  return null
}

// A stable number between 0 and 1 from a hex string, for placing suns.
export function hash01(hex, offset = 0) {
  return parseInt(hex.slice(offset, offset + 8), 16) / 4294967296
}

export function createSky() {
  return {
    people: new Map(), // 'gm:<pubkey>' → person
    byId: new Map()    // greeting event id → greeting
  }
}

function newGreeting(event, person) {
  return {
    id: event.id,
    t: event.created_at,
    event,
    person,
    piles: [],
    reactors: new Set(),
    j: hash01(event.id)
  }
}

// Adds a greeting note. Returns { person, greeting, isNewPerson } or null if
// it isn't a greeting or is a duplicate.
export function addGreeting(sky, event) {
  const type = greetingOf(event)
  if(!type || sky.byId.has(event.id)) return null

  const key = type + ':' + event.pubkey
  let person = sky.people.get(key)
  const isNewPerson = !person

  if(!person) {
    person = { key, type, pubkey: event.pubkey, greetings: [] }
    sky.people.set(key, person)
  }

  // One greeting per person per half day. People sometimes say gm twice in
  // a morning; the first one is the one others piled onto.
  const near = person.greetings.find(other => Math.abs(other.t - event.created_at) < DAY / 2)
  if(near) {
    if(near.t <= event.created_at) return null
    person.greetings.splice(person.greetings.indexOf(near), 1)
    sky.byId.delete(near.id)
  }

  const greeting = newGreeting(event, person)
  person.greetings.push(greeting)
  person.greetings.sort((a, b) => a.t - b.t)
  sky.byId.set(event.id, greeting)

  return { person, greeting, isNewPerson }
}

// The greeting a reaction or zap is about: NIP-25 says the last e tag.
function targetOf(sky, event) {
  const eTags = event.tags.filter(tag => tag[0] == 'e' && typeof tag[1] == 'string')
  if(eTags.length == 0) return null
  return sky.byId.get(eTags[eTags.length - 1][1]) || null
}

// Turns a reaction (kind 7) or zap receipt (kind 9735) into a pile-in.
// Returns { greeting, pile } or null. Doesn't add it yet, so the caller can
// animate it first.
export function pileFromEvent(sky, event) {
  if(!event || !Array.isArray(event.tags)) return null

  if(event.kind == 7) {
    const greeting = targetOf(sky, event)
    if(!greeting || event.content == '-' || greeting.reactors.has(event.pubkey)) return null
    return { greeting, pile: { t: event.created_at, pubkey: event.pubkey, zap: false, sats: 0 } }
  }

  if(event.kind == 9735) {
    const zap = zapReceiptHelper.parse(event)
    if(!zap) return null
    const greeting = targetOf(sky, event)
    if(!greeting || greeting.piles.some(pile => pile.id == zap.id)) return null
    return { greeting, pile: { id: zap.id, t: zap.created_at, pubkey: zap.sender, zap: true, sats: zap.sats } }
  }

  return null
}

export function addPile(greeting, pile) {
  if(!pile.zap) {
    if(greeting.reactors.has(pile.pubkey)) return false
    greeting.reactors.add(pile.pubkey)
  }
  greeting.piles.push(pile)
  return true
}

// The greeting a person shows at moment T: their latest one from the 24
// hours before T.
export function activeGreeting(person, T) {
  for(let i = person.greetings.length - 1; i >= 0; i--) {
    const greeting = person.greetings[i]
    if(greeting.t <= T && greeting.t > T - DAY) return greeting
  }
  return null
}

// How big a greeting is at moment T. A zap counts twice.
export function pileAt(greeting, T) {
  let count = 0
  for(const pile of greeting.piles) {
    if(pile.t <= T) count += pile.zap ? 2 : 1
  }
  return count
}

export function statsAt(greeting, T) {
  let people = 0
  let zaps = 0
  let sats = 0

  for(const pile of greeting.piles) {
    if(pile.t > T) continue
    if(pile.zap) {
      zaps++
      sats += pile.sats
    } else {
      people++
    }
  }

  return { people, zaps, sats }
}
