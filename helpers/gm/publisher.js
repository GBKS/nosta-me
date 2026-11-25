import { finalizeEvent } from 'nostr-tools/pure'
import { useSessionStore, LOGIN_TYPE } from '@/stores/session'
import { useRelayStore } from '@/stores/relays.js'
import sessionRelayService from '@/helpers/sessionRelayService.js'
import browserHelper from '@/helpers/browserHelper.js'
import ToolBox from '@/helpers/toolBox.js'

/*

Saying gm or gn on the sky, and piling in on someone else's.

A gm is a normal short note, so it reads as "gm ☀️" in every other app. A
pile-in is a reaction (NIP-25) with a sun or moon emoji. Both go to the
user's own relays, plus a few big ones and the search relay the sky reads
from, so the greeting shows up in everyone's sky.

 */

export const PUBLISH_RELAYS = ['wss://relay.ditto.pub', 'wss://relay.damus.io', 'wss://nos.lol', 'wss://relay.primal.net']

const CONTENT = { gm: 'gm ☀️', gn: 'gn 🌙' }
const EMOJI = { gm: '☀️', gn: '🌙' }

export function greetingTemplate(type, now = Math.floor(Date.now() / 1000)) {
  return {
    kind: 1,
    created_at: now,
    tags: [],
    content: CONTENT[type] || CONTENT.gm
  }
}

export function pileTemplate(greetingEvent, type, now = Math.floor(Date.now() / 1000)) {
  return {
    kind: 7,
    created_at: now,
    tags: [
      ['e', greetingEvent.id],
      ['p', greetingEvent.pubkey],
      ['k', String(greetingEvent.kind)]
    ],
    content: EMOJI[type] || EMOJI.gm
  }
}

// Why signing can't happen, or null if it can.
export function signingProblem() {
  const session = useSessionStore()
  if(!session.isLoggedIn || !session.publicKey) return 'not-logged-in'
  if(session.loginType == LOGIN_TYPE.PRIVATE_KEY && session.privateKey) return null
  if(session.loginType == LOGIN_TYPE.BROWSER) return browserHelper.isNostrAvailable() ? null : 'no-extension'
  return 'unsupported-login'
}

// The signed event, or throws an Error whose message says why not.
export async function sign(template) {
  const problem = signingProblem()
  if(problem) throw new Error(problem)

  const session = useSessionStore()
  const event = { ...template, pubkey: session.publicKey }

  if(session.loginType == LOGIN_TYPE.PRIVATE_KEY) {
    return finalizeEvent(event, ToolBox.privateKeyToBytes(session.privateKey))
  }

  const signed = await browserHelper.signNostrEvent(event)
  if(!signed) throw new Error('rejected')
  if(signed.pubkey != session.publicKey) throw new Error('wrong-key')
  return signed
}

// The user's own relays plus the default ones, without duplicates.
export function publishRelays() {
  const urls = new Set(PUBLISH_RELAYS)
  const relayStore = useRelayStore()

  // A list of relay ids, or (when it fell back to the defaults) the relay
  // store's object of relays keyed by id.
  const relayIds = sessionRelayService.relayIds
  const ids = Array.isArray(relayIds) ? relayIds : Object.keys(relayIds || {})

  for(const relayId of ids) {
    const relay = relayStore.getRelay(relayId)
    if(relay && typeof relay.url == 'string' && relay.url.startsWith('wss://')) urls.add(relay.url)
  }

  return [...urls]
}

// Explains a failure in a sentence for the sky.
export function problemText(problem) {
  switch(problem) {
    case 'not-logged-in': return 'Log in to say gm.'
    case 'no-extension': return "Your Nostr browser extension isn't available right now."
    case 'unsupported-login': return "This kind of login can't sign yet."
    case 'rejected': return 'Signing was cancelled.'
    case 'wrong-key': return 'Your extension signed with a different key than the one you logged in with.'
    case 'no-relay': return "Couldn't reach any relay. Nothing was published."
    default: return 'Something went wrong. Nothing was published.'
  }
}
