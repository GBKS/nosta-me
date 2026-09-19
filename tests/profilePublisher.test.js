import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { generateSecretKey, getPublicKey, verifyEvent } from 'nostr-tools/pure'
import { bytesToHex } from 'nostr-tools/utils'

// Stand-ins for the relays: nothing is connected to or published. Each publish
// is kept, so that a test can answer it like a relay would.
const fake = vi.hoisted(() => ({ published: [] }))

vi.mock('@/helpers/relayManager.js', () => {
  return { default: { addRelayByUrl: (url) => url ? url.replace('wss://', '') : undefined } }
})

vi.mock('@/helpers/relayPublishRequest.js', () => {
  return {
    default: () => ({
      publish(relayId, event, callback) {
        fake.published.push({ relayId, event, answer: (status) => callback({ status, event, relayId }) })
      }
    })
  }
})

import profilePublisher from '@/helpers/create/profilePublisher.js'
import { OUTCOME } from '@/helpers/create/publishTracker.js'
import { useProfileStore } from '@/stores/profile'
import { useSessionStore } from '@/stores/session'

const KINDS = { meta: 0, follows: 3, relays: 10002 }

function answer(kind, relayId, status) {
  fake.published.filter(item => item.event.kind == kind && item.relayId == relayId).forEach(item => item.answer(status))
}

function answerAll(status, except = []) {
  fake.published.filter(item => except.indexOf(item.relayId) === -1).forEach(item => item.answer(status))
}

describe('profilePublisher', () => {
  let outcomes

  function publish() {
    outcomes = []
    const publisher = profilePublisher()
    publisher.publish(status => { if(status.summary) outcomes.push(status.summary.outcome) })
    return publisher
  }

  beforeEach(() => {
    vi.useFakeTimers()
    fake.published = []

    const key = generateSecretKey()
    const store = useProfileStore()
    store.privateKey = bytesToHex(key)
    store.publicKey = getPublicKey(key)
    store.name = 'Test'
    store.relays = [{ url: 'wss://one.example.com', added: true }, { url: 'wss://two.example.com', added: true }, { url: 'wss://skipped.example.com', added: false }]
    store.follows = [{ npub: 'a'.repeat(64), relay: 'wss://one.example.com', name: 'Alice', added: true }]

    useSessionStore().isLoggedIn = false
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('sends all three events to the relays the user picked and the two for discovery', () => {
    publish()

    const targets = ['one.example.com', 'two.example.com', 'relay.damus.io', 'purplepag.es'].sort()

    for(const kind of Object.values(KINDS)) {
      const relays = fake.published.filter(item => item.event.kind == kind).map(item => item.relayId).sort()
      expect(relays, 'kind ' + kind).toEqual(targets)
    }

    // Signed by the new profile, and valid
    expect(fake.published.every(item => verifyEvent(item.event))).toBe(true)
    expect(fake.published.every(item => item.event.pubkey == useProfileStore().publicKey)).toBe(true)
  })

  it('is done as soon as each event was accepted by one relay', () => {
    publish()

    answer(KINDS.meta, 'one.example.com', 'success')
    answer(KINDS.relays, 'purplepag.es', 'success')
    expect(outcomes.at(-1)).toBe(OUTCOME.PENDING)

    answer(KINDS.follows, 'two.example.com', 'success')
    expect(outcomes.at(-1)).toBe(OUTCOME.SUCCESS)
  })

  it('succeeds when one relay is down, which used to hang the page', () => {
    publish()

    answerAll('success', ['relay.damus.io'])
    answerAll('timeout')

    expect(outcomes).toContain(OUTCOME.SUCCESS)
    expect(outcomes).not.toContain(OUTCOME.ERROR)
    expect(outcomes.at(-1)).toBe(OUTCOME.SUCCESS)
  })

  it('ends with an error when no relay accepts anything', () => {
    publish()
    answerAll('error')

    expect(outcomes.at(-1)).toBe(OUTCOME.ERROR)
  })

  it('ends as partial when only the profile made it', () => {
    publish()

    answer(KINDS.meta, 'one.example.com', 'success')
    fake.published.filter(item => item.event.kind != KINDS.meta || item.relayId != 'one.example.com').forEach(item => item.answer('timeout'))

    expect(outcomes.at(-1)).toBe(OUTCOME.PARTIAL)
  })

  it('stops waiting after 20 seconds, even if relays never answer', () => {
    publish()
    answer(KINDS.meta, 'one.example.com', 'success')

    vi.advanceTimersByTime(19000)
    expect(outcomes.at(-1)).toBe(OUTCOME.PENDING)

    vi.advanceTimersByTime(2000)
    expect(outcomes.at(-1)).toBe(OUTCOME.PARTIAL)
  })

  it('reports nothing after it was stopped', () => {
    const publisher = publish()
    publisher.kill()

    answerAll('success')
    vi.advanceTimersByTime(30000)

    expect(outcomes).toEqual([])
  })
})
