import { describe, it, expect, vi, afterEach } from 'vitest'
import analytics from '@/helpers/analytics'
import paymentTargetHelper from '@/helpers/paymentTargetHelper'

function route(path, name) {
  return { path, name, matched: [{}] }
}

const START = { path: '/', name: undefined, matched: [] }

describe('analytics.track', () => {
  afterEach(() => {
    delete window.umami
  })

  it('passes the event to Umami', () => {
    window.umami = { track: vi.fn() }
    analytics.track('profile-qr', { a: 1 })
    expect(window.umami.track).toHaveBeenCalledWith('profile-qr', { a: 1 })
  })

  it('does nothing without Umami, like when an ad blocker stopped it', () => {
    expect(() => analytics.track('profile-qr')).not.toThrow()
  })

  it('never throws when Umami does', () => {
    window.umami = { track: () => { throw new Error('nope') } }
    expect(() => analytics.track('profile-qr')).not.toThrow()
  })
})

describe('analytics.navigationEvent', () => {
  it('ignores landing on a page directly', () => {
    expect(analytics.navigationEvent(route('/create/welcome'), START)).toBeNull()
    expect(analytics.navigationEvent(route('/npub1abc', 'id'), START)).toBeNull()
  })

  it('counts steps through the create flow', () => {
    expect(analytics.navigationEvent(route('/create/welcome'), route('/'))).toEqual({ name: 'create-step', data: { step: 'welcome' } })
    expect(analytics.navigationEvent(route('/create/info'), route('/create/welcome'))).toEqual({ name: 'create-step', data: { step: 'info' } })
  })

  it('counts opening the edit pages once, not moving between them', () => {
    expect(analytics.navigationEvent(route('/edit/profile'), route('/npub1abc', 'id'))).toEqual({ name: 'edit-open', data: { page: 'profile' } })
    expect(analytics.navigationEvent(route('/edit/relays'), route('/edit/profile'))).toBeNull()
  })

  it('counts profiles opened from the home page and the directory', () => {
    expect(analytics.navigationEvent(route('/npub1abc', 'id'), route('/'))).toEqual({ name: 'profile-open', data: { from: 'home' } })
    expect(analytics.navigationEvent(route('/npub1abc', 'id'), route('/directory'))).toEqual({ name: 'profile-open', data: { from: 'directory' } })
    expect(analytics.navigationEvent(route('/npub1abc', 'id'), route('/about'))).toBeNull()
  })

  it('ignores staying on the same page', () => {
    expect(analytics.navigationEvent(route('/create/info'), route('/create/info'))).toBeNull()
  })

  it('never puts the profile in the event', () => {
    const event = analytics.navigationEvent(route('/npub1abc', 'id'), route('/'))
    expect(JSON.stringify(event)).not.toContain('npub1abc')
  })
})

describe('analytics.searchType', () => {
  it('says what kind of search it was, not what was typed', () => {
    expect(analytics.searchType('npub1abc')).toBe('npub')
    expect(analytics.searchType('gbks@nosta.me')).toBe('nostr-address')
    expect(analytics.searchType('a'.repeat(64))).toBe('hex')
    expect(analytics.searchType('hello')).toBe('other')
  })
})

describe('paymentTargetHelper.knownType', () => {
  it('only passes on types we know, so typed text never reaches the dashboard', () => {
    expect(paymentTargetHelper.knownType('bitcoin')).toBe('bitcoin')
    expect(paymentTargetHelper.knownType('btc')).toBe('bitcoin')
    expect(paymentTargetHelper.knownType('my secret wallet')).toBeNull()
  })
})
