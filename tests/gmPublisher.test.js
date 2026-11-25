import { describe, it, expect, afterEach } from 'vitest'
import { generateSecretKey, getPublicKey, verifyEvent } from 'nostr-tools/pure'
import { bytesToHex } from 'nostr-tools/utils'
import { useSessionStore, LOGIN_TYPE } from '@/stores/session'
import { greetingTemplate, pileTemplate, signingProblem, sign, publishRelays, PUBLISH_RELAYS } from '@/helpers/gm/publisher.js'
import { greetingOf, createSky, addGreeting, addPile, removeGreeting, removePile, hasPiledIn } from '@/helpers/gm/greetings.js'
import { returnPath } from '@/helpers/loginReturn.js'

const KEY = generateSecretKey()
const PUBKEY = getPublicKey(KEY)

function logInWithKey() {
  const session = useSessionStore()
  session.isLoggedIn = true
  session.loginType = LOGIN_TYPE.PRIVATE_KEY
  session.privateKey = bytesToHex(KEY)
  session.publicKey = PUBKEY
}

afterEach(() => {
  const session = useSessionStore()
  session.isLoggedIn = false
  session.loginType = null
  session.privateKey = null
  session.publicKey = null
})

describe('templates', () => {
  it('makes a gm or gn note the sky recognises', () => {
    expect(greetingTemplate('gm', 100)).toEqual({ kind: 1, created_at: 100, tags: [], content: 'gm ☀️' })
    expect(greetingTemplate('gn', 100).content).toBe('gn 🌙')
    expect(greetingOf({ ...greetingTemplate('gm'), id: 'x' })).toBe('gm')
    expect(greetingOf({ ...greetingTemplate('gn'), id: 'x' })).toBe('gn')
  })

  it('makes a reaction pointing at the greeting', () => {
    const greeting = { id: 'a'.repeat(64), pubkey: 'b'.repeat(64), kind: 1 }
    expect(pileTemplate(greeting, 'gn', 100)).toEqual({
      kind: 7,
      created_at: 100,
      tags: [['e', 'a'.repeat(64)], ['p', 'b'.repeat(64)], ['k', '1']],
      content: '🌙'
    })
  })
})

describe('signing', () => {
  it('needs a login', async () => {
    expect(signingProblem()).toBe('not-logged-in')
    await expect(sign(greetingTemplate('gm'))).rejects.toThrow('not-logged-in')
  })

  it('signs with a stored private key', async () => {
    logInWithKey()
    expect(signingProblem()).toBe(null)
    const event = await sign(greetingTemplate('gm'))
    expect(event.pubkey).toBe(PUBKEY)
    expect(verifyEvent(event)).toBe(true)
  })

  it('needs the extension for an extension login', () => {
    const session = useSessionStore()
    session.isLoggedIn = true
    session.loginType = LOGIN_TYPE.BROWSER
    session.publicKey = PUBKEY
    expect(signingProblem()).toBe('no-extension')
  })
})

describe('publishRelays', () => {
  it('always includes the default relays', () => {
    expect(publishRelays()).toEqual(expect.arrayContaining(PUBLISH_RELAYS))
  })
})

describe('taking things back', () => {
  it('removes a greeting that could not be published', () => {
    const sky = createSky()
    const event = { id: 'c'.repeat(64), pubkey: PUBKEY, kind: 1, created_at: 100, tags: [], content: 'gm' }
    const { greeting, person } = addGreeting(sky, event)
    removeGreeting(sky, greeting)
    expect(person.greetings).toEqual([])
    expect(sky.byId.has(event.id)).toBe(false)
  })

  it('removes a pile-in so it can be tried again', () => {
    const sky = createSky()
    const { greeting } = addGreeting(sky, { id: 'd'.repeat(64), pubkey: 'e'.repeat(64), kind: 1, created_at: 100, tags: [], content: 'gm' })
    const pile = { t: 200, pubkey: PUBKEY, zap: false, sats: 0 }
    addPile(greeting, pile)
    expect(hasPiledIn(greeting, PUBKEY)).toBe(true)
    removePile(greeting, pile)
    expect(hasPiledIn(greeting, PUBKEY)).toBe(false)
    expect(greeting.piles).toEqual([])
  })
})

describe('returnPath', () => {
  it('allows plain paths on this site', () => {
    expect(returnPath({ next: '/gm' })).toBe('/gm')
  })

  it('refuses anything else', () => {
    expect(returnPath({})).toBe(null)
    expect(returnPath({ next: '//evil.example' })).toBe(null)
    expect(returnPath({ next: 'https://evil.example' })).toBe(null)
    expect(returnPath({ next: '/gm?x=1' })).toBe(null)
    expect(returnPath({ next: ['/gm'] })).toBe(null)
  })
})

describe('publishRelays with the relay store fallback', () => {
  it('reads relay ids from a list or from an object keyed by id', async () => {
    const { default: sessionRelayService } = await import('@/helpers/sessionRelayService.js')
    const saved = sessionRelayService.relayIds

    sessionRelayService.relayIds = { someId: { url: 'wss://a.example' } }
    expect(() => publishRelays()).not.toThrow()

    sessionRelayService.relayIds = ['someId']
    expect(() => publishRelays()).not.toThrow()

    sessionRelayService.relayIds = saved
  })
})
